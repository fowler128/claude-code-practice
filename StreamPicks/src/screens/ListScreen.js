import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../styles/theme';
import { HorizontalCard, CategoryTabs } from '../components';
import { CONTENT_TYPES } from '../data/mockData';

const SORT_OPTIONS = ['Rating', 'Year', 'A-Z'];

const ListScreen = ({ route, navigation }) => {
  const { title, data } = route.params;
  const [sortIndex, setSortIndex] = useState(0);
  const [filterType, setFilterType] = useState('all'); // all, movie, tv

  const goBack = () => {
    navigation?.goBack();
  };

  const goToDetail = (item) => {
    navigation?.navigate('Detail', { item });
  };

  // Sort and filter data
  const displayData = useMemo(() => {
    let result = [...data];

    // Filter by type
    if (filterType === 'movie') {
      result = result.filter(item => item.type === CONTENT_TYPES.MOVIE);
    } else if (filterType === 'tv') {
      result = result.filter(item => item.type === CONTENT_TYPES.TV_SHOW);
    }

    // Sort
    switch (sortIndex) {
      case 0: // Rating
        result.sort((a, b) => b.imdbRating - a.imdbRating);
        break;
      case 1: // Year
        result.sort((a, b) => b.year - a.year);
        break;
      case 2: // A-Z
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [data, sortIndex, filterType]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Sort tabs */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <CategoryTabs
          categories={SORT_OPTIONS}
          selectedIndex={sortIndex}
          onSelect={setSortIndex}
        />
      </View>

      {/* Type filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'movie' && styles.filterButtonActive]}
          onPress={() => setFilterType('movie')}
        >
          <Text style={[styles.filterText, filterType === 'movie' && styles.filterTextActive]}>
            Movies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'tv' && styles.filterButtonActive]}
          onPress={() => setFilterType('tv')}
        >
          <Text style={[styles.filterText, filterType === 'tv' && styles.filterTextActive]}>
            TV Shows
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results count */}
      <Text style={styles.resultsCount}>{displayData.length} results</Text>

      {/* Content list */}
      <FlatList
        data={displayData}
        keyExtractor={(item) => `list-${item.id}`}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <HorizontalCard item={item} onPress={() => goToDetail(item)} />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No content found</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
  },
  backText: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  sortContainer: {
    paddingTop: SPACING.md,
  },
  sortLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.accent + '30',
    borderColor: COLORS.accent,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  filterTextActive: {
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
    paddingBottom: SPACING.xxxl,
  },
  cardWrapper: {
    marginBottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.lg,
  },
});

export default ListScreen;
