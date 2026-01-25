import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  SafeAreaView,
  StatusBar,
  RefreshControl,
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
import {
  getFilteredContent,
  getTopRated,
  getRecentlyAdded,
  getContentByType,
  getContentByService,
  CONTENT_TYPES,
  MIN_IMDB_RATING,
} from '../data/mockData';
import { USER_SUBSCRIPTIONS } from '../data/streamingServices';

const CATEGORIES = ['All', 'Movies', 'TV Shows'];

const HomeScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Get filtered content (already filters by MIN_IMDB_RATING >= 5.0)
  const filteredContent = useMemo(() => {
    let content = getFilteredContent();

    // Filter by category
    if (selectedCategory === 1) {
      content = content.filter(item => item.type === CONTENT_TYPES.MOVIE);
    } else if (selectedCategory === 2) {
      content = content.filter(item => item.type === CONTENT_TYPES.TV_SHOW);
    }

    // Filter by selected services
    if (selectedServices.length > 0) {
      content = content.filter(item => selectedServices.includes(item.streamingService));
    }

    return content;
  }, [selectedCategory, selectedServices]);

  // Get featured content (top 5 rated)
  const featuredContent = useMemo(() => {
    return getTopRated(5);
  }, []);

  // Get content sections
  const topRated = useMemo(() => getTopRated(10), []);
  const recentlyAdded = useMemo(() => getRecentlyAdded(10), []);

  // Toggle service filter
  const toggleService = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Navigate to detail
  const goToDetail = (item) => {
    navigation?.navigate('Detail', { item });
  };

  // Navigate to see all
  const goToSeeAll = (title, data) => {
    navigation?.navigate('List', { title, data });
  };

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
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
      >
        {/* Rating filter notice */}
        <View style={styles.filterNotice}>
          <Text style={styles.filterIcon}>⭐</Text>
          <Text style={styles.filterText}>
            Showing only titles rated {MIN_IMDB_RATING}+ on IMDB
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

        {/* Featured carousel */}
        <SectionHeader
          title="Featured"
          subtitle="Top picks across your services"
          showSeeAll={false}
        />
        <FlatList
          data={featuredContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `featured-${item.id}`}
          renderItem={({ item }) => (
            <FeatureCard item={item} onPress={() => goToDetail(item)} />
          )}
          contentContainerStyle={styles.carouselContainer}
          snapToInterval={360}
          decelerationRate="fast"
        />

        {/* Top Rated section */}
        <SectionHeader
          title="Top Rated"
          subtitle="Highest IMDB ratings"
          onSeeAll={() => goToSeeAll('Top Rated', topRated)}
        />
        <FlatList
          data={topRated.slice(0, 6)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `top-${item.id}`}
          renderItem={({ item }) => (
            <MiniCard item={item} onPress={() => goToDetail(item)} width={120} />
          )}
          contentContainerStyle={styles.horizontalList}
        />

        {/* Recently Added section */}
        <SectionHeader
          title="Recently Added"
          subtitle="New to streaming"
          onSeeAll={() => goToSeeAll('Recently Added', recentlyAdded)}
        />
        <FlatList
          data={recentlyAdded.slice(0, 6)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `recent-${item.id}`}
          renderItem={({ item }) => (
            <MiniCard item={item} onPress={() => goToDetail(item)} width={120} />
          )}
          contentContainerStyle={styles.horizontalList}
        />

        {/* Browse All section */}
        <SectionHeader
          title="Browse All"
          subtitle={`${filteredContent.length} titles available`}
          showSeeAll={false}
        />
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

export default HomeScreen;
