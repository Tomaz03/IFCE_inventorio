import React from 'react';
import { View, useWindowDimensions, StyleSheet, ScrollView } from 'react-native';

const ResponsiveContainer = ({ children, style }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <View style={styles.outerContainer}>
      <View style={[
        styles.innerContainer,
        isDesktop && styles.desktopContainer,
        style
      ]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
  },
  desktopContainer: {
    maxWidth: 480, // Mobile-like format on desktop
    marginVertical: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
});

export default ResponsiveContainer;
