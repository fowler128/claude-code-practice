import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { COLORS, FONTS, BORDER_RADIUS, SPACING, SHADOWS, getRatingColor } from '../styles/theme';
import RatingBadge from './RatingBadge';
import ServiceBadge, { ServiceIcon } from './ServiceBadge';
import { CONTENT_TYPES } from '../data/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 3) / 2;

// Standard vertical content card
const ContentCard = ({ item, onPress, style }) => {
  const isMovie = item.type === CONTENT_TYPES.MOVIE;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Poster */}
      <View style={styles.posterContainer}>
        <Image
          source={{ uri: item.posterUrl }}
          style={styles.poster}
          resizeMode="cover"
        />
        {/* Rating overlay */}
        <View style={styles.ratingOverlay}>
          <View style={styles.ratingBadgeSmall}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={[styles.ratingText, { color: getRatingColor(item.imdbRating) }]}>
              {item.imdbRating.toFixed(1)}
            </Text>
          </View>
        </View>
        {/* Service badge overlay */}
        <View style={styles.serviceOverlay}>
          <ServiceIcon serviceId={item.streamingService} size={24} />
        </View>
      </View>

      {/* Content info */}
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.year}>{item.year}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.type}>{isMovie ? 'Movie' : 'TV'}</Text>
        </View>
        <View style={styles.genreRow}>
          {item.genres.slice(0, 2).map((genre, index) => (
            <Text key={index} style={styles.genre}>
              {genre}
              {index < Math.min(item.genres.length - 1, 1) ? ' • ' : ''}
            </Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Horizontal feature card (for carousel)
export const FeatureCard = ({ item, onPress }) => {
  const isMovie = item.type === CONTENT_TYPES.MOVIE;

  return (
    <TouchableOpacity
      style={styles.featureCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.backdropUrl }}
        style={styles.featureBackdrop}
        resizeMode="cover"
      />
      <View style={styles.featureGradient} />
      <View style={styles.featureContent}>
        <View style={styles.featureTop}>
          <ServiceBadge serviceId={item.streamingService} size="medium" />
        </View>
        <View style={styles.featureBottom}>
          <Text style={styles.featureTitle}>{item.title}</Text>
          <View style={styles.featureMeta}>
            <View style={styles.featureRating}>
              <Text style={styles.starIcon}>⭐</Text>
              <Text style={[styles.featureRatingText, { color: getRatingColor(item.imdbRating) }]}>
                {item.imdbRating.toFixed(1)}
              </Text>
            </View>
            <Text style={styles.featureYear}>{item.year}</Text>
            <Text style={styles.featureType}>{isMovie ? 'Movie' : 'TV Series'}</Text>
          </View>
          <Text style={styles.featureSynopsis} numberOfLines={2}>
            {item.synopsis}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Compact horizontal list card
export const HorizontalCard = ({ item, onPress }) => {
  const isMovie = item.type === CONTENT_TYPES.MOVIE;

  return (
    <TouchableOpacity
      style={styles.horizontalCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.posterUrl }}
        style={styles.horizontalPoster}
        resizeMode="cover"
      />
      <View style={styles.horizontalContent}>
        <View style={styles.horizontalHeader}>
          <Text style={styles.horizontalTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <ServiceIcon serviceId={item.streamingService} size={20} />
        </View>
        <View style={styles.horizontalMeta}>
          <Text style={styles.year}>{item.year}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.type}>{isMovie ? 'Movie' : 'TV'}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.runtime}>{item.runtime}</Text>
        </View>
        <View style={styles.horizontalRatings}>
          <View style={styles.ratingBadgeSmall}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={[styles.ratingText, { color: getRatingColor(item.imdbRating) }]}>
              {item.imdbRating.toFixed(1)}
            </Text>
          </View>
          <View style={styles.audienceBadge}>
            <Text style={styles.popcornIcon}>🍿</Text>
            <Text style={styles.audienceText}>{item.audienceScore}%</Text>
          </View>
        </View>
        <View style={styles.horizontalGenres}>
          {item.genres.slice(0, 3).map((genre, index) => (
            <View key={index} style={styles.genreTag}>
              <Text style={styles.genreTagText}>{genre}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Minimal card for grid with just poster and title
export const MiniCard = ({ item, onPress, width = 100 }) => {
  return (
    <TouchableOpacity
      style={[styles.miniCard, { width }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.miniPosterContainer, { width, height: width * 1.5 }]}>
        <Image
          source={{ uri: item.posterUrl }}
          style={styles.miniPoster}
          resizeMode="cover"
        />
        <View style={styles.miniRating}>
          <Text style={[styles.miniRatingText, { color: getRatingColor(item.imdbRating) }]}>
            {item.imdbRating.toFixed(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.miniTitle} numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Standard card styles
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  posterContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.5,
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
  },
  ratingOverlay: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
  },
  serviceOverlay: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  ratingBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface + 'E6',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  starIcon: {
    fontSize: 12,
  },
  ratingText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  year: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  dot: {
    color: COLORS.textMuted,
    marginHorizontal: SPACING.xs,
  },
  type: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genre: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
  },

  // Feature card styles
  featureCard: {
    width: SCREEN_WIDTH - SPACING.lg * 2,
    height: 220,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginHorizontal: SPACING.sm,
    ...SHADOWS.card,
  },
  featureBackdrop: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: COLORS.surface,
  },
  featureGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
  },
  featureContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  featureTop: {
    alignItems: 'flex-start',
  },
  featureBottom: {
    marginTop: 'auto',
  },
  featureTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featureMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  featureRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureRatingText: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
  featureYear: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  featureType: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  featureSynopsis: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    lineHeight: 18,
  },

  // Horizontal card styles
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  horizontalPoster: {
    width: 100,
    height: 150,
    backgroundColor: COLORS.surface,
  },
  horizontalContent: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  horizontalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  horizontalTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    flex: 1,
    marginRight: SPACING.sm,
  },
  horizontalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  runtime: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  horizontalRatings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  audienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popcornIcon: {
    fontSize: 12,
  },
  audienceText: {
    color: COLORS.popcorn,
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
  },
  horizontalGenres: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  genreTag: {
    backgroundColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  genreTagText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },

  // Mini card styles
  miniCard: {
    marginRight: SPACING.md,
  },
  miniPosterContainer: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
  },
  miniPoster: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
  },
  miniRating: {
    position: 'absolute',
    bottom: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: COLORS.surface + 'E6',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  miniRatingText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: 'bold',
  },
  miniTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
});

export default ContentCard;
