import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

import { HomeScreen, DetailScreen, ListScreen, SearchScreen } from '../screens';
import { COLORS, FONTS, SPACING } from '../styles/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab icon component
const TabIcon = ({ focused, icon, label }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  </View>
);

// Home stack navigator
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: COLORS.background },
    }}
  >
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="Detail" component={DetailScreen} />
    <Stack.Screen name="List" component={ListScreen} />
  </Stack.Navigator>
);

// Search stack navigator
const SearchStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: COLORS.background },
    }}
  >
    <Stack.Screen name="SearchMain" component={SearchScreen} />
    <Stack.Screen name="Detail" component={DetailScreen} />
  </Stack.Navigator>
);

// Main tab navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: COLORS.accent,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeStack}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} icon="🏠" label="Home" />
        ),
      }}
    />
    <Tab.Screen
      name="Search"
      component={SearchStack}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} icon="🔍" label="Search" />
        ),
      }}
    />
  </Tab.Navigator>
);

// Main app navigator
const AppNavigator = () => {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: COLORS.accent,
          background: COLORS.background,
          card: COLORS.cardBackground,
          text: COLORS.textPrimary,
          border: COLORS.border,
          notification: COLORS.accent,
        },
      }}
    >
      <TabNavigator />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.cardBackground,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  tabLabelFocused: {
    color: COLORS.accent,
    fontWeight: '600',
  },
});

export default AppNavigator;
