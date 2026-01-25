import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../styles/theme';
import { HorizontalCard, ServiceFilterChip } from '../components';
import { searchContent, getFilteredContent, GENRES } from '../data/mockData';
import { USER_SUBSCRIPTIONS } from '../data/streamingServices';

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);

  // Search results
  const results = useMemo(() => {
    let content = query.length > 0 ? searchContent(query) : getFilteredContent();

    // Filter by services
    if (selectedServices.length > 0) {
      content = content.filter(item => selectedServices.includes(item.streamingService));
    }

    // Filter by genre
    if (selectedGenre) {
      content = content.filter(item => item.genres.includes(selectedGenre));
    }

    return content;
  }, [query, selectedServices, selectedGenre]);

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

  const genreList = Object.values(GENRES);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      {/* Search input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search movies, shows, actors..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
            <Text style={styles.clearText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Service filters */}
      <FlatList
        data={USER_SUBSCRIPTIONS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ServiceFilterChip
            service={item}
            isSelected={selectedServices.includes(item.id)}
            onPress={() => toggleService(item.id)}
          />
        )}
        contentContainerStyle={styles.filtersContainer}
        style={styles.filtersScroll}
      />

      {/* Genre filters */}
      <FlatList
        data={genreList}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.genreChip,
              selectedGenre === item && styles.genreChipActive,
            ]}
            onPress={() => setSelectedGenre(selectedGenre === item ? null : item)}
          >
            <Text
              style={[
                styles.genreChipText,
                selectedGenre === item && styles.genreChipTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.genreContainer}
        style={styles.genreScroll}
      />

      {/* Results count */}
      <Text style={styles.resultsCount}>
        {results.length} result{results.length !== 1 ? 's' : ''}
        {query.length > 0 && ` for "${query}"`}
      </Text>

      {/* Results list */}
      <FlatList
        data={results}
        keyExtractor={(item) => `search-${item.id}`}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <HorizontalCard item={item} onPress={() => goToDetail(item)} />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />
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
    paddingVertical: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.title,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  clearButton: {
    padding: SPACING.md,
  },
  clearText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xxl,
  },
  filtersScroll: {
    maxHeight: 50,
  },
  filtersContainer: {
    paddingHorizontal: SPACING.lg,
  },
  genreScroll: {
    maxHeight: 50,
    marginBottom: SPACING.md,
  },
  genreContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  genreChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  genreChipActive: {
    backgroundColor: COLORS.accent + '30',
    borderColor: COLORS.accent,
  },
  genreChipText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  genreChipTextActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  resultsCount: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xl,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.md,
  },
});

export default SearchScreen;
