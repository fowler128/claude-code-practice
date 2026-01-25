import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, BORDER_RADIUS, SPACING } from '../styles/theme';
import { getServiceById } from '../data/streamingServices';

// Streaming service badge component
const ServiceBadge = ({ serviceId, size = 'small', onPress }) => {
  const service = getServiceById(serviceId);

  if (!service) return null;

  const sizeStyles = {
    small: {
      container: { paddingHorizontal: 8, paddingVertical: 4 },
      text: { fontSize: FONTS.sizes.xs },
    },
    medium: {
      container: { paddingHorizontal: 12, paddingVertical: 6 },
      text: { fontSize: FONTS.sizes.sm },
    },
    large: {
      container: { paddingHorizontal: 16, paddingVertical: 8 },
      text: { fontSize: FONTS.sizes.md },
    },
  };

  const currentSize = sizeStyles[size];

  const BadgeContent = () => (
    <View
      style={[
        styles.container,
        currentSize.container,
        { backgroundColor: service.color + '20', borderColor: service.color },
      ]}
    >
      <Text style={[styles.text, currentSize.text, { color: service.color }]}>
        {service.name}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <BadgeContent />
      </TouchableOpacity>
    );
  }

  return <BadgeContent />;
};

// Service icon (compact version)
export const ServiceIcon = ({ serviceId, size = 32 }) => {
  const service = getServiceById(serviceId);

  if (!service) return null;

  return (
    <View
      style={[
        styles.iconContainer,
        {
          width: size,
          height: size,
          backgroundColor: service.color,
        },
      ]}
    >
      <Text
        style={[
          styles.iconText,
          { fontSize: size * 0.35 },
        ]}
      >
        {service.logo}
      </Text>
    </View>
  );
};

// Service filter chip (for filtering content)
export const ServiceFilterChip = ({ service, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chipContainer,
        isSelected && { backgroundColor: service.color + '30' },
        { borderColor: isSelected ? service.color : COLORS.border },
      ]}
    >
      <View
        style={[
          styles.chipDot,
          { backgroundColor: service.color },
        ]}
      />
      <Text
        style={[
          styles.chipText,
          { color: isSelected ? service.color : COLORS.textSecondary },
        ]}
      >
        {service.name}
      </Text>
    </TouchableOpacity>
  );
};

// Horizontal list of service badges
export const ServiceBadgeList = ({ serviceIds, size = 'small' }) => {
  return (
    <View style={styles.badgeList}>
      {serviceIds.map((id) => (
        <ServiceBadge key={id} serviceId={id} size={size} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
  },
  iconContainer: {
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  chipText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
  },
  badgeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
});

export default ServiceBadge;
