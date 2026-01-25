# API Setup Guide

This guide explains how to connect StreamPicks to real streaming data using TMDB (The Movie Database).

## Step 1: Get a Free TMDB API Key

1. Go to [themoviedb.org](https://www.themoviedb.org/)
2. Click **Join TMDB** (top right) and create a free account
3. Verify your email
4. Go to **Settings** → **API** (https://www.themoviedb.org/settings/api)
5. Click **Create** → **Developer**
6. Fill out the form:
   - **Type of Use**: Personal
   - **Application Name**: StreamPicks
   - **Application URL**: http://localhost
   - **Application Summary**: Personal streaming recommendation app
7. Accept the terms and click **Submit**
8. Copy your **API Key (v3 auth)**

## Step 2: Add Your API Key

Open `src/services/api.js` and replace:

```javascript
const TMDB_API_KEY = 'YOUR_TMDB_API_KEY_HERE';
```

With your actual key:

```javascript
const TMDB_API_KEY = 'abc123your_actual_key_here';
```

## Step 3: Switch to Live Data

In `src/screens/index.js`, change:

```javascript
export { default as HomeScreen } from './HomeScreen';
```

To:

```javascript
export { default as HomeScreen } from './HomeScreenWithAPI';
```

## Step 4: Install Dependencies (if needed)

The app uses the built-in `fetch` API, so no additional packages are required.

## How It Works

### Data Source
TMDB provides comprehensive movie/TV data including:
- Titles, descriptions, ratings
- Cast and crew
- Posters and backdrops
- **Watch providers** (via JustWatch partnership)

### Watch Providers
TMDB includes streaming availability data from JustWatch. When you call the API, it tells you which services have each title:

```javascript
// Example response for a movie's watch providers
{
  "flatrate": [  // Subscription streaming
    { "provider_id": 8, "provider_name": "Netflix" },
    { "provider_id": 337, "provider_name": "Disney Plus" }
  ],
  "rent": [...],  // Rental options
  "buy": [...]    // Purchase options
}
```

### Your Services Mapping

The API maps your subscriptions to TMDB provider IDs:

| Service | Provider ID |
|---------|-------------|
| Netflix | 8 |
| Disney+ | 337 |
| Hulu | 15 |
| Max (HBO) | 384 |
| Prime Video | 9 |
| Apple TV+ | 350 |
| Paramount+ | 531 |
| MGM+ | 636 |

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/discover/movie` | Find movies on your services |
| `/discover/tv` | Find TV shows on your services |
| `/trending/all/week` | Get trending content |
| `/movie/{id}` | Movie details |
| `/tv/{id}` | TV show details |
| `/movie/{id}/watch/providers` | Where to stream a movie |
| `/search/multi` | Search movies and TV |

## Rate Limits

TMDB has generous rate limits:
- **Free tier**: ~40 requests per 10 seconds
- More than enough for personal use

## Region Support

The app defaults to US streaming data. To change your region, modify `watch_region` in `api.js`:

```javascript
// Change 'US' to your country code
watch_region: 'US',  // US, GB, CA, AU, etc.
```

## Security Note

For production apps, you should:
1. Store the API key in environment variables
2. Use a backend proxy to hide the key
3. Never commit the key to git

For personal use, having it in the code is fine.

## Troubleshooting

### "Network request failed"
- Check your internet connection
- Verify the API key is correct
- TMDB might be temporarily down

### "No results"
- The content might not be available in your region
- Try changing `watch_region` to your country code

### "Missing streaming providers"
- Not all content has streaming data
- Availability changes frequently
- Some newer titles may not have provider info yet

## Alternative: Use Environment Variables

Create a `.env` file in the project root:

```
TMDB_API_KEY=your_key_here
```

Then install `react-native-dotenv` and update api.js:

```javascript
import { TMDB_API_KEY } from '@env';
```

## Useful Links

- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [Watch Provider List](https://developers.themoviedb.org/3/watch-providers/get-available-regions)
- [TMDB API Support](https://www.themoviedb.org/talk/category/5047958519c29526b50017d6)
