import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const logo = require('../assets/cahuin-logo.png');

export default function CahuinLogo({
  label = 'Cahuín',
  size = 38,
  color = '#FFFFFF',
  style,
  textStyle,
}) {
  const markSize = Math.round(size * 1.15);

  return (
    <View style={[styles.row, style]}>
      <Image source={logo} style={{ width: markSize, height: markSize }} resizeMode="contain" />
      <Text style={[styles.label, { color, fontSize: size }, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontWeight: '900',
    letterSpacing: 0,
  },
});
