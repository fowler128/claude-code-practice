# StreamPicks

A mobile streaming suggestion app styled like Rotten Tomatoes. Get curated content recommendations from all your streaming services in one place.

## Features

- **Multi-Service Support**: Browse content from Netflix, Disney+, Hulu, HBO Max, Prime Video, Apple TV+, Paramount+, and MGM+
- **Quality Filter**: Only shows content rated 5.0+ on IMDB - no wasting time on low-quality content
- **Rotten Tomatoes-Style UI**: Clean, familiar rating display with IMDB scores and audience percentages
- **Smart Filtering**: Filter by streaming service, content type (Movies/TV Shows), and genre
- **Search**: Find content across all your services with powerful search and filters
- **Detailed Info**: Full details including cast, synopsis, ratings, and where to watch

## Your Streaming Services

This app is configured with the following subscriptions:
- Netflix
- Disney+
- Hulu
- HBO Max (Max)
- Prime Video
- Apple TV+
- Paramount+
- MGM+

## Rating System

Content is filtered and displayed based on IMDB ratings:
- **Certified Fresh** (8.0+): Green badge - Excellent quality
- **Fresh** (7.0-7.9): Light green - Good quality
- **Decent** (6.0-6.9): Yellow - Watchable
- **Mixed** (5.0-5.9): Orange - Proceed with caution

Content below 5.0 IMDB rating is automatically filtered out.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or Expo Go app on your phone)

### Installation

```bash
cd StreamPicks
npm install
```

### Running the App

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Project Structure

```
StreamPicks/
├── App.js                 # App entry point
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ContentCard.js # Movie/show cards
│   │   ├── RatingBadge.js # Rating display components
│   │   ├── SectionHeader.js
│   │   └── ServiceBadge.js
│   ├── data/
│   │   ├── mockData.js    # Sample content data
│   │   └── streamingServices.js
│   ├── navigation/
│   │   └── AppNavigator.js
│   ├── screens/
│   │   ├── HomeScreen.js  # Main browsing screen
│   │   ├── DetailScreen.js # Content details
│   │   ├── ListScreen.js  # Full list view
│   │   └── SearchScreen.js
│   └── styles/
│       └── theme.js       # Colors, fonts, spacing
└── package.json
```

## Tech Stack

- React Native with Expo
- React Navigation (Native Stack + Bottom Tabs)
- Custom theming inspired by Rotten Tomatoes

## Future Enhancements

- Real API integration (TMDB, JustWatch)
- User profiles and watchlists
- Personalized recommendations
- Deep linking to streaming apps
- Push notifications for new releases
- Social features (share, ratings)

## License

MIT
