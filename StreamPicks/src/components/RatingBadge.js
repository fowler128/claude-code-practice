import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, BORDER_RADIUS, getRatingColor, getFreshnessLabel } from '../styles/theme';

// Rotten Tomatoes-style rating badge
const RatingBadge = ({ rating, size = 'medium', showLabel = false }) => {
  const ratingColor = getRatingColor(rating);
  const freshnessLabel = getFreshnessLabel(rating);

  const sizeStyles = {
    small: {
      container: { width: 36, height: 36 },
      text: { fontSize: FONTS.sizes.sm },
      label: { fontSize: FONTS.sizes.xs },
    },
    medium: {
      container: { width: 48, height: 48 },
      text: { fontSize: FONTS.sizes.lg },
      label: { fontSize: FONTS.sizes.sm },
    },
    large: {
      container: { width: 64, height: 64 },
      text: { fontSize: FONTS.sizes.xxl },
      label: { fontSize: FONTS.sizes.md },
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          currentSize.container,
          { borderColor: ratingColor },
        ]}
      >
        <Text style={[styles.rating, currentSize.text, { color: ratingColor }]}>
          {rating.toFixed(1)}
        </Text>
      </View>
      {showLabel && (
        <Text style={[styles.label, currentSize.label, { color: ratingColor }]}>
          {freshnessLabel}
        </Text>
      )}
    </View>
  );
};

// Tomato/Splat icon style badge (Rotten Tomatoes classic)
export const TomatoMeter = ({ score, isFresh = true }) => {
  const icon = isFresh ? '🍅' : '🟢';
  const color = isFresh ? COLORS.fresh : COLORS.rotten;

  return (
    <View style={styles.tomatoContainer}>
      <Text style={styles.tomatoIcon}>{score >= 60 ? '🍅' : '💚'}</Text>
      <Text style={[styles.tomatoScore, { color }]}>{score}%</Text>
    </View>
  );
};

// Audience score badge (popcorn style)
export const AudienceScore = ({ score }) => {
  return (
    <View style={styles.audienceContainer}>
      <Text style={styles.popcornIcon}>🍿</Text>
      <Text style={styles.audienceScore}>{score}%</Text>
    </View>
  );
};

// Combined rating display (IMDB + Audience)
export const CombinedRating = ({ imdbRating, audienceScore }) => {
  return (
    <View style={styles.combinedContainer}>
      <View style={styles.ratingSection}>
        <Text style={styles.ratingIcon}>⭐</Text>
        <Text style={[styles.imdbRating, { color: getRatingColor(imdbRating) }]}>
          {imdbRating.toFixed(1)}
        </Text>
        <Text style={styles.ratingSource}>IMDB</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.ratingSection}>
        <Text style={styles.ratingIcon}>🍿</Text>
        <Text style={styles.audienceRating}>{audienceScore}%</Text>
        <Text style={styles.ratingSource}>Audience</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  rating: {
    fontWeight: 'bold',
  },
  label: {
    marginTop: 4,
    fontWeight: '600',
  },
  tomatoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tomatoIcon: {
    fontSize: 18,
  },
  tomatoScore: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
  audienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popcornIcon: {
    fontSize: 18,
  },
  audienceScore: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.popcorn,
  },
  combinedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 8,
    gap: 12,
  },
  ratingSection: {
    alignItems: 'center',
  },
  ratingIcon: {
    fontSize: 16,
  },
  imdbRating: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  },
  audienceRating: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.popcorn,
  },
  ratingSource: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
});

export default RatingBadge;
