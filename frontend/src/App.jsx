import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './App.css';

const isLocal = window.location.hostname === 'localhost';
let api = ''

if (window.location.hostname === 'localhost') {
	api = 'http://localhost:3000'
} else {
	api = 'https://tiktok-battles-backend.onrender.com'
}

function parseTikTokURL(url) {
	const regex = /https?:\/\/(?:www\.)?tiktok\.com\/@([^/]+)\/video\/(\d+)/;
	const match = url.match(regex);
	if (match) {
		const user = match[1];
		const videoID = match[2];
		return { url: `https://www.tiktok.com/@${user}/video/${videoID}`, videoID };
	} else {
		return null;
	}
}

function URLForm({ onSubmit }) {
	const [url, setUrl] = useState('');

	const handleChange = (event) => {
		setUrl(event.target.value);
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		let parsedURL = parseTikTokURL(url);
		// let parsedURL = 'testing, uncomment in urlform'
		console.log(parsedURL);
		if (parsedURL) {
			onSubmit(parsedURL);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<input
				type="text"
				id="url"
				name="url"
				value={url}
				onChange={handleChange}
				placeholder="Paste TikTok URL here" 
			/>
			<button type="submit">Add Video</button>
		</form>
	);
}

function Test(){
	return (
		<div
		style={{
		width: '300px',
		height: '300px',
		backgroundColor: 'blue'
		}}
		></div>
	)
}

function TikTokEmbed({ url, videoID }) {
	return (
		<blockquote className="tiktok-embed" cite={url} data-video-id={videoID} style={{height: '560px'}}>
		 <section></section>
		</blockquote>
		// <Test/>
	);
}

function resetVideos() {
	const videos = document.getElementById('videos')
	videos.innerHTML = ''
	const existingScript = document.getElementById('tiktokScript');
	if (existingScript) {
		existingScript.remove();
	}
}

function loadTheVideos() {
	const body = document.body;
	const script = newTikTokScript();
	body.appendChild(script);
}

function newTikTokScript() {
	const script = document.createElement("script");
	script.src = "https://www.tiktok.com/embed.js";
	script.async = true;
	script.id = "tiktokScript";
	return script;
}

function App() {
	let [amountNeeded, setAmount] = useState(0)
	let [showTiktoks, setShow] = useState(false)
	let [currentGame, setGame] = useState(0)

	useEffect(() => {
		async function fetchData() {
			const response = await fetch(api+'/get-amount', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				}
			});

			const data = await response.json();
			setAmount(data.amount)
		}

		fetchData()
	}, [])

	function createEmbed(parsedUrls) {
		setShow(true)
		resetVideos()

		for(let i = 0; i < parsedUrls.length; i++) {
			const div = document.createElement('div');
			const parentDiv = document.getElementById('videos')
			parentDiv.appendChild(div)
			// console.log(parsedURL)
			ReactDOM.render(<TikTokEmbed url={parsedUrls[i].url} videoID={parsedUrls[i].videoID} />, div);
			div.className = 'content'
		}

		loadTheVideos();
	}

	async function loadVoting() {
		// Make the first API request to get a random URL
		const response1 = await fetch(api+'/get-random', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			}
		});

		const response2 = await fetch(api+'/get-random', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			}
		});

		const data1 = await response1.json();
		const parsedURL1 = parseTikTokURL(data1.url);

		const data2 = await response2.json();
		const parsedURL2 = parseTikTokURL(data2.url);

		createEmbed([parsedURL1, parsedURL2]);

		const button1 = document.createElement('button')
		button1.textContent = 'Vote'
		document.getElementById('buttons').appendChild(button1)

		const button2 = document.createElement('button')
		button2.textContent = 'Vote'
		document.getElementById('buttons').appendChild(button2)

		button1.addEventListener('click', async function() {
			resetVideos()
			setShow(false)
			button1.parentNode.removeChild(button1);
			button2.parentNode.removeChild(button2);

			const response = await fetch('/add-vote', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
				body: JSON.stringify({
					'game-id': currentGame,
					'round_winner_url': parsedURL1.url,
					'round_loser_url': parsedURL2.url
				}),
			});
			const responseData = await response.json();

			if (responseData.winner) {
				setShow(true)
				setAmount(responseData.amountNeeded)

				createEmbed( [parseTikTokURL(responseData.winner)] )

				const button = document.createElement('button')
				button.textContent = 'Back'
				document.getElementById('buttons').appendChild(button)

				button.addEventListener('click', function() {
					resetVideos()

					setShow(false)
					button.parentNode.removeChild(button);
				});

				loadTheVideos();
			} 
		});

		button2.addEventListener('click', async function() {
			resetVideos()
			setShow(false)
			button1.parentNode.removeChild(button1);
			button2.parentNode.removeChild(button2);

			const response = await fetch(api+'/add-vote', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
				body: JSON.stringify({
					'game-id': currentGame,
					'round_winner_url': parsedURL2.url,
					'round_loser_url': parsedURL1.url
				}),
			});
			const responseData = await response.json();

			if (responseData.winner) {
				setShow(true)
				setAmount(responseData.amountNeeded)

				createEmbed( [parseTikTokURL(responseData.winner)] )

				const button = document.createElement('button')
				button.textContent = 'Back'
				document.getElementById('buttons').appendChild(button)

				button.addEventListener('click', function() {
					resetVideos()

					setShow(false)
					button.parentNode.removeChild(button);
				});

				loadTheVideos();
			} 
		});

	}

	const handleSubmit = async (parsedURL) => {
		createEmbed( [parsedURL] )

		const button = document.createElement('button')
		button.textContent = 'Back'
		document.getElementById('buttons').appendChild(button)

		button.addEventListener('click', function() {
			resetVideos()

			setShow(false)
			button.parentNode.removeChild(button);
		});

		loadTheVideos();

		const response = await fetch(api+'/add-video', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
				body: JSON.stringify({
					'url': parsedURL.url
				}),
		});

		const responseData = await response.json();
		setAmount(responseData.amountNeeded)
		setGame(responseData.currentGameId)
	};

	return (
		<>
			{!showTiktoks && amountNeeded > 0 ? (
				<div id='submit'>
				<h1>TikTok Battle</h1>
				<p>Are you interested in seeing how your favorite TikTok's compare with others? Place in your 
				videos and vote!</p>
				<URLForm onSubmit={handleSubmit} />
				<p>{amountNeeded} more for voting to start!</p>
				</div>

			) : !showTiktoks && amountNeeded <= 0 ? (
				<div>
				<p>Too many videos. Time to start voting!</p>
				<button onClick={loadVoting}>Vote</button>
				</div>
			) : null}

			<div id='videos'></div>
			<div id='buttons'></div>
		</>
	);
}

export default App;










