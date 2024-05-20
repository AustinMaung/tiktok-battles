# TikTok Battle

TikTok Battle is a platform where users can upload and compare their favorite TikTok videos. The game revolves around continuous voting on pairs of videos presented to users. Instead of a simple leaderboard, the PageRank algorithm determines the most liked videos among all users. While the project offers an engaging experience, several challenges and areas for improvement have been identified.

## Features

- Comparison of TikTok videos through continuous voting.
- Utilization of the PageRank algorithm to determine the most popular videos.
- Integration of TikTok HTML embed API for video display.
- Backend powered by SQLite and Express.

## Known Issues

1. **TikTok HTML Embed API**: Difficulty in modifying the appearance of embedded TikTok videos using CSS.
2. **Dynamic Video Loading**: Limited capability to dynamically load different videos due to constraints of the TikTok API.
3. **UI Update**: Planned update for the user interface to enhance user experience.
4. **Improved Pair Selection**: Current implementation selects pairs randomly; future iterations could use PageRank for better pairing.
5. **Cold Start Loading**: The website, deployed on Render, experiences a delay in loading the backend. This may cause the voting screen to display even when there are no videos available. The site updates correctly once the backend and SQLite database are fully loaded.
## How to Play

1. Upload your favorite TikTok videos.
2. Engage in continuous voting by comparing pairs of videos.
3. Contribute to determining the most popular videos using the PageRank algorithm.

## Technologies Used

- React
- SQLite
- Express
- TikTok API

## Demo

[Link to live demo](https://tiktok-battle.onrender.com/)
