# NyxRepost

NyxRepost is a focused TikTok repost analytics dashboard. Enter a username, fetch the available repost data, and inspect the returned videos with thumbnails, creator context, engagement stats, trends, tags, and an in-app video preview.

![NyxRepost dashboard](docs/nyxrepost-dashboard.png)

## What It Does

- Fetches repost data for a TikTok username through the local Node proxy.
- Shows a two-column repost history designed for fast scanning.
- Displays thumbnails, captions, creators, dates, durations, and engagement metrics.
- Lets you filter by text, creator, tag, media type, date range, and engagement.
- Opens videos in a single embedded preview so only one player loads at a time.
- Summarizes yearly trends, monthly activity, top tags, top authors, and scan details.

## Quick Start

Install dependencies:

```bash
npm run setup
```

Start the app:

```bash
npm run dev
```

Open the Vite app:

```text
http://localhost:5173
```

The API proxy runs on:

```text
http://localhost:3001
```

## Project Structure

```text
client/    React and Vite frontend
server/    Express API proxy and thumbnail endpoint
docs/      Project screenshots and documentation assets
```

## Useful Commands

```bash
npm run dev      # run client and server together
npm run build    # build the frontend
```

From the client folder:

```bash
npm run lint
```

## Data Notes

NyxRepost displays the data returned by the upstream repost API. Some TikTok data is not perfectly reliable from public endpoints, so returned videos should be treated as repost candidates when the API response looks inconsistent.

The app keeps this transparent by exposing scan details, raw JSON, and the exact media records used to build the dashboard.

## Tech Stack

- React
- Vite
- Tailwind CSS
- Express
- TikTok embed player
