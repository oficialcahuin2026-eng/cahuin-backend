import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';

export const premiumShadow = {
  shadowColor: '#101828',
  shadowOffset: { width: 0, height: 18 },
  shadowOpacity: 0.10,
  shadowRadius: 30,
  elevation: 8,
};

export function ScreenScaffold({ COLORS, children, scroll = true, contentContainerStyle, style, refreshControl }) {
  const Wrapper = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: COLORS.bg }, style]}>
      <Wrapper
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        contentContainerStyle={scroll ? [styles.scrollContent, contentContainerStyle] : undefined}
        style={!scroll ? { flex: 1 } : undefined}
      >
        {children}
      </Wrapper>
    </SafeAreaView>
  );
}

export function ScreenHeader({ title, accent, right, centered = false }) {
  const { COLORS } = useTheme();
  const titleColor = accent || COLORS.textPrimary;

  return (
    <View style={[styles.header, centered && styles.headerCentered]}>
      <Text style={[centered ? styles.headerTitleCentered : styles.headerTitle, { color: titleColor }]}>
        {title}
      </Text>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

export function SoftCard({ children, style, COLORS }) {
  return (
    <View style={[styles.card, { backgroundColor: COLORS.tarjeta, borderColor: COLORS.border }, premiumShadow, style]}>
      {children}
    </View>
  );
}

export function SoftIcon({ name, emoji, color = '#F0444F', bg = '#FFF0F1', size = 54, iconSize = 24, rounded = 18 }) {
  return (
    <View style={[styles.softIcon, { width: size, height: size, borderRadius: rounded, backgroundColor: bg }]}>
      {emoji ? (
        <Text style={{ fontSize: iconSize }}>{emoji}</Text>
      ) : (
        <Ionicons name={name} size={iconSize} color={color} />
      )}
    </View>
  );
}

export function GradientButton({ children, icon, colors = ['#F0444F', '#FF715F'], style, textStyle, onPress, disabled }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={disabled} style={[styles.gradientButtonWrap, style]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.gradientButton}>
        {icon ? <Ionicons name={icon} size={20} color="#FFF" style={{ marginRight: 8 }} /> : null}
        <Text style={[styles.gradientButtonText, textStyle]}>{children}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function SegmentedControl({ options, value, onChange, COLORS }) {
  return (
    <View style={[styles.segmented, { backgroundColor: COLORS.tarjeta, borderColor: COLORS.border }, premiumShadow]}>
      {options.map((item) => {
        const active = item.value === value;
        return (
          <TouchableOpacity key={item.value} style={styles.segment} onPress={() => onChange(item.value)} activeOpacity={0.9}>
            {active ? (
              <LinearGradient colors={item.dark ? ['#111827', '#233044'] : ['#F0444F', '#FF655B']} style={StyleSheet.absoluteFillObject} />
            ) : null}
            <View style={styles.segmentContent}>
              {item.icon ? <Ionicons name={item.icon} size={18} color={active ? '#FFF' : COLORS.textMuted} /> : null}
              <Text style={[styles.segmentText, { color: active ? '#FFF' : COLORS.textMuted }]}>{item.label}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function EmptyState({ image, title, subtitle, COLORS, action, tip, imageStyle, highlight }) {
  return (
    <View style={styles.emptyWrap}>
      {image ? <Image source={image} style={[styles.emptyImage, imageStyle]} resizeMode="contain" /> : null}
      <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>
        {title}
        {highlight ? <Text style={{ color: COLORS.primario }}>{highlight}</Text> : null}
      </Text>
      {subtitle ? <Text style={[styles.emptySubtitle, { color: COLORS.textMuted }]}>{subtitle}</Text> : null}
      {tip ? (
        <SoftCard COLORS={COLORS} style={styles.tipCard}>
          <SoftIcon emoji={tip.emoji || '🔥'} size={58} rounded={29} bg={tip.bg || COLORS.softRed} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipTitle, { color: COLORS.textPrimary }]}>{tip.title}</Text>
            <Text style={[styles.tipText, { color: COLORS.textMuted }]}>{tip.text}</Text>
          </View>
        </SoftCard>
      ) : null}
      {action}
    </View>
  );
}

export function BottomSheetHandle() {
  return <View style={styles.sheetHandle} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING[5], paddingTop: SPACING[4], paddingBottom: 172 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING[5] },
  headerCentered: { justifyContent: 'center' },
  headerTitle: {
    color: '#101828',
    fontFamily: FONTS.display,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 0,
  },
  headerTitleCentered: {
    color: '#101828',
    fontFamily: FONTS.display,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0,
  },
  headerRight: { marginLeft: SPACING[3] },
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING[4],
  },
  softIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(16, 24, 40, 0.06)',
  },
  gradientButtonWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    ...SHADOWS.light,
  },
  gradientButton: {
    minHeight: 56,
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  gradientButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '900',
    fontFamily: FONTS.display,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 26,
    borderWidth: 1,
    padding: 6,
    overflow: 'hidden',
    marginBottom: SPACING[6],
  },
  segment: {
    flex: 1,
    minHeight: 58,
    borderRadius: 20,
    overflow: 'hidden',
  },
  segmentContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: FONTS.display,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING[4],
  },
  emptyImage: {
    width: '88%',
    aspectRatio: 1,
    marginBottom: SPACING[2],
  },
  emptyTitle: {
    fontSize: 30,
    lineHeight: 38,
    textAlign: 'center',
    fontWeight: '900',
    fontFamily: FONTS.display,
    letterSpacing: 0,
  },
  emptySubtitle: {
    marginTop: SPACING[3],
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
    maxWidth: 340,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[4],
    width: '100%',
    marginTop: SPACING[7],
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
    fontFamily: FONTS.display,
  },
  tipText: {
    fontSize: 15,
    lineHeight: 22,
  },
  sheetHandle: {
    width: 62,
    height: 7,
    borderRadius: 99,
    backgroundColor: '#D0D5DD',
    alignSelf: 'center',
    marginBottom: 26,
  },
});
