const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors');
const PageRank = require('pagerank.js')
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use(cors({
	origin: ['http://localhost:5173', 'https://tiktok-battle.onrender.com']
}));

const db = new sqlite3.Database('tiktok-battle.db');

db.serialize(() => {
  // Create videos table
  db.run(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY,
      url TEXT,
      votes INTEGER DEFAULT 0
    )
  `);

  // Create history table
  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      winner TEXT
    )
  `);
});

// Routes
app.get('/', (req, res) => {
	res.send('Hello, World!');
});

let VIDEOSNEED = 10
let VOTESNEEDED = 20

function findVideosAmount(callback) {
	// SQL command to count the number of entries in the 'videos' table
	const sql = 'SELECT COUNT(*) AS count FROM videos';

	// Execute the SQL query
	db.get(sql, function(err, row) {
		if (err) {
			console.error('Error counting videos:', err.message);
			callback(err, null);
		} else {
			// Extract the count from the result row
			const count = row.count;
			callback(null, count);
		}
	});
}

app.get('/get-amount', (req, res) => {
	findVideosAmount(function(err, count) {
		if (err) {
			res.status(500).json({ error: 'Failed to get video count from database.' });
		} else {
			const amountNeeded = VIDEOSNEED - count;
			res.status(200).json({ amount: amountNeeded });
		}
	});
})

app.post('/add-video', (req, res) => {
	const { url } = req.body;

	// Check if the URL is provided
	if (!url) {
		return res.status(400).json({ error: 'URL is required' });
	}

	// Check if the URL already exists in the database
	db.get('SELECT * FROM videos WHERE url = ?', [url], (err, row) => {
		if (err) {
			console.error('Database error:', err.message);
			return res.status(500).json({ error: 'Database error' });
		}

		if (!row) {
			// If the URL doesn't exist, insert it into the database
			const sql = 'INSERT INTO videos (url) VALUES (?)';

			db.run(sql, [url], function(err) {
				if (err) {
					console.error('Error inserting data into database:', err.message);
					return res.status(500).json({ error: 'Failed to insert data into database.' });
				}
			});
		}

		findVideosAmount(function(err, count) {
			if (err) {
				return res.status(500).json({ error: 'Failed to get video count from database.' });
			}

			// Calculate the amount needed (assuming 10 is the target)
			const amountNeeded = VIDEOSNEED - count;

			// Retrieve the latest winner's id from the history table
			db.get('SELECT id FROM history ORDER BY id DESC LIMIT 1', (err, row) => {
				if (err) {
					console.error('Database error:', err.message);
					return res.status(500).json({ error: 'Database error' });
				}

				// If no previous winner found, set id to 1
				const currentGameId = row ? row.id + 1 : 1;

				// Return the amount needed and the id of the current game
				return res.status(201).json({ amountNeeded: amountNeeded, currentGameId: currentGameId });
			});
		});
	});
});



app.post('/add-vote', (req, res) => {
	const { gameID, round_winner_url, round_loser_url } = req.body;
	
	PageRank.link(round_winner_url, round_loser_url)

	db.get('SELECT SUM(votes) AS totalVotes FROM videos', (err, row) => {
		if (err) {
			return res.status(500).json({ error: 'Database error' });
		}

		const totalVotes = row.totalVotes || 0;

		if (totalVotes >= VOTESNEEDED) {
			// Check if gameID exists in history
			db.get('SELECT winner FROM history WHERE id = ?', [gameID], (err, row) => {
				if (err) {
					return res.status(500).json({ error: 'Database error' });
				}

				if (row) {
					// If gameID exists in history, return the corresponding winner
					return res.status(200).json({ winner: row.winner, amountNeeded: VIDEOSNEED });
				} else {
					// If gameID doesn't exist in history, select winner from videos
					
					let highestRank = 0;
					let highestRankNode = null;
					function trackHighestRank(node, rank) {
						console.log(node, ' has ', rank)
						if (rank > highestRank) {
							highestRank = rank;
							highestRankNode = node;
						}
					}
					PageRank.rank(0.85, 0.000001, trackHighestRank);
					let winnerUrl = highestRankNode

					console.log(winnerUrl)

					// Store winner in history table
					db.run('INSERT INTO history (winner) VALUES (?)', [winnerUrl], function(err) {
						if (err) {
							return res.status(500).json({ error: 'Database error' });
						}
						
						// Delete all entries from videos table
						db.run('DELETE FROM videos', function(err) {
							if (err) {
								return res.status(500).json({ error: 'Database error' });
							}
							PageRank.reset()

							return res.status(200).json({ winner: winnerUrl, amountNeeded: VIDEOSNEED });
						});
					});
				}
			});
		} else {
			// Increment votes for the provided URL
			db.run('UPDATE videos SET votes = votes + 1 WHERE url = ?', [round_winner_url], function(err) {
				if (err) {
					return res.status(500).json({ error: 'Database error' });
				}
				res.json({ message: 'Rating incremented successfully' });
			});
		}
	});
});

let lastRandom = null;
app.get('/get-random', (req, res) => {
	// SQL query to select a random entry that is not the same as the last random entry
	let query;
	if (lastRandom === null) {
		query = `SELECT url FROM videos ORDER BY RANDOM() LIMIT 1;`;
	} else {
		query = `SELECT url FROM videos WHERE url != ? ORDER BY RANDOM() LIMIT 1;`;
	}

	// Execute the query
	db.get(query, [lastRandom], (err, row) => {
		if (err) {
			console.error(err.message);
			res.status(500).send('Internal Server Error');
			return;
		}

		if (row) {
			lastRandom = row.url;
			res.json({ url: row.url });
		} else {
			res.status(404).json({ error: 'No entries found' });
		}
	});
});


// Start server
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

// Close the database connection when the server shuts down
app.on('close', () => {
	db.close((err) => {
		if (err) {
			console.error('Error closing database:', err.message);
		} else {
			console.log('Disconnected from the SQLite database.');
		}
	});
});


