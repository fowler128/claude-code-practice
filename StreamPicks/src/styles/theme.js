// Rotten Tomatoes-inspired theme
// Dark mode with signature rating colors

export const COLORS = {
  // Primary colors (Rotten Tomatoes inspired)
  fresh: '#FA320A',        // Fresh tomato red
  certified: '#F93208',    // Certified Fresh
  rotten: '#6AC238',       // Rotten green (we'll use for lower scores)
  popcorn: '#FFD700',      // Audience score gold

  // Rating colors
  excellent: '#21C51B',    // 8.0+ IMDB
  good: '#6AC238',         // 7.0-7.9
  decent: '#FFD700',       // 6.0-6.9
  okay: '#FFA500',         // 5.0-5.9

  // UI Colors
  background: '#1a1a2e',
  cardBackground: '#16213e',
  cardBackgroundLight: '#1f2b47',
  surface: '#0f0f23',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',

  // Accents
  accent: '#FA320A',
  accentLight: '#FF6B4A',
  border: '#2a2a4a',

  // Status
  success: '#21C51B',
  warning: '#FFD700',
  error: '#FA320A',
};

export const FONTS = {
  regular: 'System',
  bold: 'System',
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    title: 32,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  button: {
    shadowColor: '#FA320A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
};

// Get rating color based on IMDB score
export const getRatingColor = (rating) => {
  if (rating >= 8.0) return COLORS.excellent;
  if (rating >= 7.0) return COLORS.good;
  if (rating >= 6.0) return COLORS.decent;
  return COLORS.okay;
};

// Get freshness label (Rotten Tomatoes style)
export const getFreshnessLabel = (rating) => {
  if (rating >= 8.0) return 'Certified Fresh';
  if (rating >= 7.0) return 'Fresh';
  if (rating >= 6.0) return 'Decent';
  return 'Mixed';
};
