import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING } from '../styles/theme';

const SectionHeader = ({ title, subtitle, onSeeAll, showSeeAll = true }) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {showSeeAll && onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAll}>See All →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Divider with optional label
export const SectionDivider = ({ label }) => {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      {label && (
        <>
          <Text style={styles.dividerLabel}>{label}</Text>
          <View style={styles.dividerLine} />
        </>
      )}
    </View>
  );
};

// Category tabs
export const CategoryTabs = ({ categories, selectedIndex, onSelect }) => {
  return (
    <View style={styles.tabsContainer}>
      {categories.map((category, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onSelect(index)}
          style={[
            styles.tab,
            selectedIndex === index && styles.tabSelected,
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              selectedIndex === index && styles.tabTextSelected,
            ]}
          >
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
  seeAll: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
    marginHorizontal: SPACING.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.full,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
  },
  tabTextSelected: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});

export default SectionHeader;
