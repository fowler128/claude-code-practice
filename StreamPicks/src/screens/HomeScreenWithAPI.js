// Example: HomeScreen using real TMDB API
// Replace HomeScreen.js with this once you have your API key

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../styles/theme';
import {
  ContentCard,
  FeatureCard,
  MiniCard,
  SectionHeader,
  CategoryTabs,
  ServiceFilterChip,
} from '../components';
import { useStreamingContent, useTrending, useTopRated } from '../hooks/useStreamingContent';
import { USER_SUBSCRIPTIONS } from '../data/streamingServices';

const CATEGORIES = ['All', 'Movies', 'TV Shows'];

const HomeScreenWithAPI = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);

  // Determine content type based on category
  const contentType = selectedCategory === 1 ? 'movie' : selectedCategory === 2 ? 'tv' : 'movie';

  // Fetch data using hooks
  const { data: trending, loading: trendingLoading } = useTrending('week');
  const { data: topRated, loading: topRatedLoading } = useTopRated(contentType);
  const {
    data: streamingContent,
    loading: contentLoading,
    refresh,
    loadMore,
    hasMore,
  } = useStreamingContent(contentType);

  // Filter by selected services
  const filteredContent = selectedServices.length > 0
    ? streamingContent.filter(item =>
        item.availableOn?.some(provider => selectedServices.includes(provider.id))
      )
    : streamingContent;

  const toggleService = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const goToDetail = (item) => {
    navigation?.navigate('Detail', { item });
  };

  const isLoading = trendingLoading || topRatedLoading || contentLoading;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Stream<Text style={styles.logoAccent}>Picks</Text></Text>
        <Text style={styles.tagline}>Quality streaming, curated for you</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={contentLoading && streamingContent.length > 0}
            onRefresh={refresh}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* Rating filter notice */}
        <View style={styles.filterNotice}>
          <Text style={styles.filterIcon}>⭐</Text>
          <Text style={styles.filterText}>
            Showing only titles rated 5.0+ on IMDB
          </Text>
        </View>

        {/* Category tabs */}
        <CategoryTabs
          categories={CATEGORIES}
          selectedIndex={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Service filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.servicesScroll}
          contentContainerStyle={styles.servicesContainer}
        >
          {USER_SUBSCRIPTIONS.map((service) => (
            <ServiceFilterChip
              key={service.id}
              service={service}
              isSelected={selectedServices.includes(service.id)}
              onPress={() => toggleService(service.id)}
            />
          ))}
        </ScrollView>

        {/* Trending section */}
        <SectionHeader
          title="Trending Now"
          subtitle="Popular this week"
          showSeeAll={false}
        />
        {trendingLoading ? (
          <ActivityIndicator color={COLORS.accent} style={styles.loader} />
        ) : (
          <FlatList
            data={trending.slice(0, 5)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => `trending-${item.id}`}
            renderItem={({ item }) => (
              <FeatureCard item={item} onPress={() => goToDetail(item)} />
            )}
            contentContainerStyle={styles.carouselContainer}
            snapToInterval={360}
            decelerationRate="fast"
          />
        )}

        {/* Top Rated section */}
        <SectionHeader
          title="Top Rated"
          subtitle="Highest rated content"
          onSeeAll={() => navigation?.navigate('List', { title: 'Top Rated', data: topRated })}
        />
        {topRatedLoading ? (
          <ActivityIndicator color={COLORS.accent} style={styles.loader} />
        ) : (
          <FlatList
            data={topRated.slice(0, 10)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => `top-${item.id}`}
            renderItem={({ item }) => (
              <MiniCard item={item} onPress={() => goToDetail(item)} width={120} />
            )}
            contentContainerStyle={styles.horizontalList}
          />
        )}

        {/* Available on Your Services */}
        <SectionHeader
          title="On Your Services"
          subtitle={`${filteredContent.length} titles available`}
          showSeeAll={false}
        />
        {contentLoading && streamingContent.length === 0 ? (
          <ActivityIndicator color={COLORS.accent} style={styles.loader} />
        ) : (
          <View style={styles.gridContainer}>
            {filteredContent.slice(0, 10).map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                onPress={() => goToDetail(item)}
                style={styles.gridCard}
              />
            ))}
          </View>
        )}

        {/* Load more button */}
        {hasMore && filteredContent.length > 0 && (
          <View style={styles.loadMoreContainer}>
            {contentLoading ? (
              <ActivityIndicator color={COLORS.accent} />
            ) : (
              <Text style={styles.loadMoreText} onPress={loadMore}>
                Load More
              </Text>
            )}
          </View>
        )}

        {/* Your services summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Your Streaming Services</Text>
          <Text style={styles.summaryText}>
            {USER_SUBSCRIPTIONS.length} services connected
          </Text>
          <View style={styles.summaryServices}>
            {USER_SUBSCRIPTIONS.map((service) => (
              <View
                key={service.id}
                style={[styles.summaryBadge, { backgroundColor: service.color + '30' }]}
              >
                <Text style={[styles.summaryBadgeText, { color: service.color }]}>
                  {service.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

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
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  logo: {
    fontSize: FONTS.sizes.title,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  logoAccent: {
    color: COLORS.accent,
  },
  tagline: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  filterNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.excellent,
  },
  filterIcon: {
    fontSize: 14,
    marginRight: SPACING.sm,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  servicesScroll: {
    marginBottom: SPACING.md,
  },
  servicesContainer: {
    paddingHorizontal: SPACING.lg,
  },
  carouselContainer: {
    paddingHorizontal: SPACING.md,
  },
  horizontalList: {
    paddingHorizontal: SPACING.lg,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
  },
  gridCard: {
    marginBottom: SPACING.lg,
  },
  loader: {
    padding: SPACING.xl,
  },
  loadMoreContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadMoreText: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: SPACING.lg,
  },
  summaryTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  summaryText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.md,
  },
  summaryServices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  summaryBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.sm,
  },
  summaryBadgeText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  },
});

export default HomeScreenWithAPI;
