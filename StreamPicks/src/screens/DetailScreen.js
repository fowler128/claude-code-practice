import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, getRatingColor, getFreshnessLabel } from '../styles/theme';
import { CombinedRating, ServiceBadge } from '../components';
import { CONTENT_TYPES } from '../data/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DetailScreen = ({ route, navigation }) => {
  const { item } = route.params;
  const isMovie = item.type === CONTENT_TYPES.MOVIE;
  const ratingColor = getRatingColor(item.imdbRating);
  const freshnessLabel = getFreshnessLabel(item.imdbRating);

  const goBack = () => {
    navigation?.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero backdrop */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: item.backdropUrl }}
            style={styles.backdrop}
            resizeMode="cover"
          />
          <View style={styles.heroGradient} />

          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          {/* Hero content */}
          <View style={styles.heroContent}>
            <ServiceBadge serviceId={item.streamingService} size="large" />
          </View>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Title section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.year}>{item.year}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.type}>{isMovie ? 'Movie' : 'TV Series'}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.runtime}>{item.runtime}</Text>
            </View>
            {!isMovie && item.seasons && (
              <Text style={styles.seasons}>{item.seasons} Season{item.seasons > 1 ? 's' : ''}</Text>
            )}
          </View>

          {/* Ratings section - Rotten Tomatoes style */}
          <View style={styles.ratingsSection}>
            <View style={styles.ratingsCard}>
              <Text style={styles.ratingsTitle}>Ratings</Text>

              <View style={styles.ratingsRow}>
                {/* IMDB Rating */}
                <View style={styles.ratingBlock}>
                  <View style={[styles.ratingCircle, { borderColor: ratingColor }]}>
                    <Text style={[styles.ratingValue, { color: ratingColor }]}>
                      {item.imdbRating.toFixed(1)}
                    </Text>
                  </View>
                  <Text style={styles.ratingLabel}>IMDB</Text>
                  <Text style={[styles.freshnessLabel, { color: ratingColor }]}>
                    {freshnessLabel}
                  </Text>
                </View>

                {/* Divider */}
                <View style={styles.ratingDivider} />

                {/* Audience Score */}
                <View style={styles.ratingBlock}>
                  <View style={styles.audienceCircle}>
                    <Text style={styles.popcornEmoji}>🍿</Text>
                    <Text style={styles.audienceValue}>{item.audienceScore}%</Text>
                  </View>
                  <Text style={styles.ratingLabel}>Audience</Text>
                  <Text style={styles.audienceSubLabel}>Score</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Watch Now button */}
          <TouchableOpacity style={styles.watchButton} activeOpacity={0.8}>
            <Text style={styles.watchButtonText}>Watch Now</Text>
            <Text style={styles.watchButtonSub}>Open in streaming app</Text>
          </TouchableOpacity>

          {/* Synopsis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Synopsis</Text>
            <Text style={styles.synopsis}>{item.synopsis}</Text>
          </View>

          {/* Genres */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Genres</Text>
            <View style={styles.genresContainer}>
              {item.genres.map((genre, index) => (
                <View key={index} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Cast */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cast</Text>
            <View style={styles.castContainer}>
              {item.cast.map((actor, index) => (
                <View key={index} style={styles.castItem}>
                  <View style={styles.castAvatar}>
                    <Text style={styles.castInitial}>{actor[0]}</Text>
                  </View>
                  <Text style={styles.castName}>{actor}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Director/Creator */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{isMovie ? 'Director' : 'Creator'}</Text>
            <Text style={styles.director}>{item.director}</Text>
          </View>

          {/* Streaming info */}
          <View style={styles.streamingSection}>
            <Text style={styles.sectionTitle}>Available On</Text>
            <View style={styles.streamingCard}>
              <ServiceBadge serviceId={item.streamingService} size="large" />
              <View style={styles.streamingInfo}>
                <Text style={styles.streamingIncluded}>Included with subscription</Text>
                <Text style={styles.streamingNote}>Part of your {item.streamingService} plan</Text>
              </View>
            </View>
          </View>

          {/* Quality badges */}
          <View style={styles.qualitySection}>
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>4K</Text>
            </View>
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>HDR</Text>
            </View>
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>5.1</Text>
            </View>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: 280,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: COLORS.background,
    opacity: 0.9,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: SPACING.lg,
    backgroundColor: COLORS.surface + 'CC',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  heroContent: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
  },
  content: {
    padding: SPACING.lg,
    marginTop: -40,
  },
  titleSection: {
    marginBottom: SPACING.xl,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.title,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  year: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  dot: {
    color: COLORS.textMuted,
    marginHorizontal: SPACING.sm,
  },
  type: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  runtime: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  seasons: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
  ratingsSection: {
    marginBottom: SPACING.xl,
  },
  ratingsCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  ratingsTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  ratingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  ratingBlock: {
    alignItems: 'center',
  },
  ratingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  ratingValue: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
  },
  ratingLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.sm,
  },
  freshnessLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  ratingDivider: {
    width: 1,
    height: 80,
    backgroundColor: COLORS.border,
  },
  audienceCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popcornEmoji: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  audienceValue: {
    color: COLORS.popcorn,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  },
  audienceSubLabel: {
    color: COLORS.popcorn,
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xs,
  },
  watchButton: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  watchButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
  },
  watchButtonSub: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    opacity: 0.8,
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  synopsis: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    lineHeight: 24,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  genreTag: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  genreText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  castContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  castItem: {
    alignItems: 'center',
    width: 80,
  },
  castAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  castInitial: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
  },
  castName: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
  },
  director: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  streamingSection: {
    marginBottom: SPACING.xl,
  },
  streamingCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  streamingInfo: {
    flex: 1,
  },
  streamingIncluded: {
    color: COLORS.excellent,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  streamingNote: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
  qualitySection: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  qualityBadge: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qualityText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 50,
  },
});

export default DetailScreen;
