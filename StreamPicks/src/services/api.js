// API Configuration and Services
// Sign up for free API keys at:
// - TMDB: https://www.themoviedb.org/settings/api
// - JustWatch data is available through TMDB's watch providers

// ============================================
// CONFIGURATION - Add your API key here
// ============================================
const TMDB_API_KEY = 'YOUR_TMDB_API_KEY_HERE'; // Get free key at themoviedb.org
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Image sizes
export const IMAGE_SIZES = {
  poster: {
    small: '/w185',
    medium: '/w342',
    large: '/w500',
    original: '/original',
  },
  backdrop: {
    small: '/w300',
    medium: '/w780',
    large: '/w1280',
    original: '/original',
  },
};

// Your streaming service provider IDs (from TMDB/JustWatch)
// These are US region codes - adjust for your country
const PROVIDER_IDS = {
  netflix: 8,
  disney_plus: 337,
  hulu: 15,
  hbo: 384,        // Max (HBO Max)
  prime: 9,        // Amazon Prime Video
  apple_tv: 350,   // Apple TV+
  paramount_plus: 531,
  mgm_plus: 636,
};

// Minimum IMDB rating filter
const MIN_RATING = 5.0;

// ============================================
// API HELPER FUNCTIONS
// ============================================

const fetchTMDB = async (endpoint, params = {}) => {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', TMDB_API_KEY);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('TMDB fetch error:', error);
    throw error;
  }
};

// Get poster URL
export const getPosterUrl = (path, size = 'medium') => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}${IMAGE_SIZES.poster[size]}${path}`;
};

// Get backdrop URL
export const getBackdropUrl = (path, size = 'medium') => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}${IMAGE_SIZES.backdrop[size]}${path}`;
};

// ============================================
// CONTENT FETCHING
// ============================================

// Get movies/shows available on your streaming services
export const getContentByProvider = async (providerId, type = 'movie', page = 1) => {
  const endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';

  const data = await fetchTMDB(endpoint, {
    with_watch_providers: providerId,
    watch_region: 'US',
    'vote_average.gte': MIN_RATING,
    sort_by: 'vote_average.desc',
    'vote_count.gte': 100, // Ensure enough votes for reliable rating
    page,
  });

  return data.results.map(item => transformContent(item, type));
};

// Get trending content
export const getTrending = async (timeWindow = 'week') => {
  const data = await fetchTMDB(`/trending/all/${timeWindow}`);

  return data.results
    .filter(item => item.vote_average >= MIN_RATING)
    .map(item => transformContent(item, item.media_type));
};

// Get top rated movies
export const getTopRatedMovies = async (page = 1) => {
  const data = await fetchTMDB('/movie/top_rated', { page });

  return data.results
    .filter(item => item.vote_average >= MIN_RATING)
    .map(item => transformContent(item, 'movie'));
};

// Get top rated TV shows
export const getTopRatedTVShows = async (page = 1) => {
  const data = await fetchTMDB('/tv/top_rated', { page });

  return data.results
    .filter(item => item.vote_average >= MIN_RATING)
    .map(item => transformContent(item, 'tv'));
};

// Search for content
export const searchContent = async (query, page = 1) => {
  const data = await fetchTMDB('/search/multi', { query, page });

  return data.results
    .filter(item =>
      (item.media_type === 'movie' || item.media_type === 'tv') &&
      item.vote_average >= MIN_RATING
    )
    .map(item => transformContent(item, item.media_type));
};

// Get content details with streaming providers
export const getContentDetails = async (id, type = 'movie') => {
  const endpoint = type === 'movie' ? `/movie/${id}` : `/tv/${id}`;

  // Fetch details and watch providers in parallel
  const [details, credits, providers] = await Promise.all([
    fetchTMDB(endpoint),
    fetchTMDB(`${endpoint}/credits`),
    fetchTMDB(`${endpoint}/watch/providers`),
  ]);

  return transformDetailedContent(details, credits, providers, type);
};

// Get where to watch (streaming availability)
export const getWatchProviders = async (id, type = 'movie') => {
  const endpoint = type === 'movie'
    ? `/movie/${id}/watch/providers`
    : `/tv/${id}/watch/providers`;

  const data = await fetchTMDB(endpoint);

  // Get US providers (change 'US' to your country code)
  const usProviders = data.results?.US;

  if (!usProviders) return { flatrate: [], rent: [], buy: [] };

  return {
    flatrate: usProviders.flatrate || [], // Subscription streaming
    rent: usProviders.rent || [],
    buy: usProviders.buy || [],
    link: usProviders.link, // JustWatch link
  };
};

// Get content from all your subscribed services
export const getContentFromMyServices = async (type = 'movie', page = 1) => {
  const providerIds = Object.values(PROVIDER_IDS).join('|');
  const endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';

  const data = await fetchTMDB(endpoint, {
    with_watch_providers: providerIds,
    watch_region: 'US',
    'vote_average.gte': MIN_RATING,
    sort_by: 'popularity.desc',
    'vote_count.gte': 50,
    page,
  });

  // For each item, we need to check which of YOUR services has it
  const resultsWithProviders = await Promise.all(
    data.results.map(async (item) => {
      const providers = await getWatchProviders(item.id, type);
      const myProviders = findMyProviders(providers.flatrate || []);
      return {
        ...transformContent(item, type),
        availableOn: myProviders,
      };
    })
  );

  return resultsWithProviders.filter(item => item.availableOn.length > 0);
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Find which of your services have this content
const findMyProviders = (providers) => {
  const myProviderIds = Object.values(PROVIDER_IDS);
  return providers
    .filter(p => myProviderIds.includes(p.provider_id))
    .map(p => ({
      id: getServiceIdFromProviderId(p.provider_id),
      name: p.provider_name,
      logo: `${TMDB_IMAGE_BASE}/w92${p.logo_path}`,
    }));
};

// Map TMDB provider ID back to our service ID
const getServiceIdFromProviderId = (providerId) => {
  const entry = Object.entries(PROVIDER_IDS).find(([_, id]) => id === providerId);
  return entry ? entry[0] : null;
};

// Transform TMDB response to our app format
const transformContent = (item, type) => {
  const isMovie = type === 'movie';

  return {
    id: item.id,
    title: isMovie ? item.title : item.name,
    type: isMovie ? 'movie' : 'tv_show',
    imdbRating: item.vote_average,
    audienceScore: Math.round(item.vote_average * 10),
    year: new Date(isMovie ? item.release_date : item.first_air_date).getFullYear() || null,
    posterUrl: getPosterUrl(item.poster_path),
    backdropUrl: getBackdropUrl(item.backdrop_path),
    synopsis: item.overview,
    genreIds: item.genre_ids || [],
    popularity: item.popularity,
  };
};

// Transform detailed content response
const transformDetailedContent = (details, credits, providers, type) => {
  const isMovie = type === 'movie';
  const usProviders = providers.results?.US;

  return {
    id: details.id,
    title: isMovie ? details.title : details.name,
    type: isMovie ? 'movie' : 'tv_show',
    imdbRating: details.vote_average,
    audienceScore: Math.round(details.vote_average * 10),
    year: new Date(isMovie ? details.release_date : details.first_air_date).getFullYear(),
    posterUrl: getPosterUrl(details.poster_path, 'large'),
    backdropUrl: getBackdropUrl(details.backdrop_path, 'large'),
    synopsis: details.overview,
    runtime: isMovie
      ? `${details.runtime} min`
      : `${details.episode_run_time?.[0] || 45} min/episode`,
    seasons: details.number_of_seasons,
    genres: details.genres?.map(g => g.name) || [],
    cast: credits.cast?.slice(0, 10).map(c => c.name) || [],
    director: isMovie
      ? credits.crew?.find(c => c.job === 'Director')?.name
      : details.created_by?.[0]?.name,
    streamingProviders: findMyProviders(usProviders?.flatrate || []),
    watchLink: usProviders?.link,
    tagline: details.tagline,
    status: details.status,
    budget: details.budget,
    revenue: details.revenue,
  };
};

// ============================================
// GENRE HELPERS
// ============================================

// TMDB Genre IDs (for reference)
export const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  // TV specific
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

export const getGenreName = (genreId) => GENRE_MAP[genreId] || 'Unknown';

// ============================================
// EXPORT PROVIDER IDS FOR REFERENCE
// ============================================
export { PROVIDER_IDS };
