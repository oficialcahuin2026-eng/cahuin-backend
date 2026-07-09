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
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

export function Divider({ COLORS, style }) {
  return (
    <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: COLORS?.border || '#374151', width: '100%' }, style]} />
  );
}

export function SoftIcon({ name, color = '#F0444F', bg = '#FFF0F1', size = 54, iconSize = 24, rounded = 18 }) {
  return (
    <View style={[styles.softIcon, { width: size, height: size, borderRadius: rounded, backgroundColor: bg }]}>
      <Ionicons name={name || 'star'} size={iconSize} color={color} />
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
          <SoftIcon name={tip.icon || 'flame'} color={tip.iconColor || COLORS.primario} size={58} rounded={29} bg={tip.bg || COLORS.softRed} />
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

// ─────────────────────────────────────────────
// 🆕 NEW COMPONENTS FOR REDESIGN
// ─────────────────────────────────────────────

/**
 * CahuinLogo — Brand logo with optional text for headers
 */
export function CahuinLogo({ size = 28, showText = true, COLORS }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2, backgroundColor: COLORS?.primario || '#F0444F' }} />
      {showText && (
        <Text style={{
          fontSize: size,
          fontWeight: '900',
          fontFamily: FONTS.display,
          color: COLORS?.textPrimary || '#101828',
          letterSpacing: -0.5,
        }}>
          Cahuín
        </Text>
      )}
    </View>
  );
}

/**
 * CahuinesCounter — Pill with fire icon + count + optional "+" button
 */
export function CahuinesCounter({ cantidad = 0, onPress, COLORS, showPlus = true }) {
  return (
    <TouchableOpacity
      style={[styles.cahuinesCounter, { backgroundColor: COLORS?.surfaceCard || '#1E1E22', borderColor: COLORS?.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="flash" size={16} color={COLORS?.primario || '#F0444F'} />
      <Text style={[styles.cahuinesCounterText, { color: COLORS?.textPrimary }]}>
        {cantidad >= 1000 ? `${(cantidad / 1000).toFixed(1)}K` : cantidad}
      </Text>
      {showPlus && (
        <View style={[styles.cahuinesCounterPlus, { backgroundColor: COLORS?.primario || '#F0444F' }]}>
          <Ionicons name="add" size={14} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * InterestChip — Tag with icon + text, no borders
 */
export function InterestChip({ icon, text, COLORS, small = false }) {
  const chipSize = small ? styles.chipSmall : styles.chip;
  const textSize = small ? styles.chipTextSmall : styles.chipTextBase;
  return (
    <View style={[chipSize, { backgroundColor: COLORS?.surfaceCard || 'rgba(150,150,150,0.1)' }]}>
      {icon && <Ionicons name={icon} size={small ? 14 : 16} color={COLORS?.primario || COLORS?.textMuted} />}
      <Text style={[textSize, { color: COLORS?.textPrimary }]}>{text}</Text>
    </View>
  );
}

/**
 * CompatCircle — Circular compatibility percentage indicator
 */
export function CompatCircle({ porcentaje = 0, size = 48, COLORS, showLabel = true }) {
  const color = porcentaje >= 80 ? COLORS?.compatHigh : porcentaje >= 50 ? COLORS?.compatMedium : COLORS?.compatLow;
  const strokeWidth = size > 40 ? 4 : 3;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (porcentaje / 100) * circumference;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      {/* Background circle */}
      <View style={{
        position: 'absolute',
        width: size - strokeWidth,
        height: size - strokeWidth,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: COLORS?.border || '#374151',
      }} />
      {/* Progress arc (simplified as a colored border with clip) */}
      <View style={{
        position: 'absolute',
        width: size - strokeWidth,
        height: size - strokeWidth,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: color,
        borderTopColor: porcentaje < 25 ? (COLORS?.border || '#374151') : color,
        borderRightColor: porcentaje < 50 ? (COLORS?.border || '#374151') : color,
        borderBottomColor: porcentaje < 75 ? (COLORS?.border || '#374151') : color,
        transform: [{ rotate: '-90deg' }],
      }} />
      {showLabel && (
        <Text style={{
          fontSize: size > 40 ? 14 : 11,
          fontWeight: '800',
          color: color,
          fontFamily: FONTS.display,
        }}>
          {porcentaje}%
        </Text>
      )}
    </View>
  );
}

/**
 * FilterPills — Horizontal filter pills (Todos, Nuevos, Activos) without borders
 */
export function FilterPills({ options, value, onChange, COLORS }) {
  return (
    <View style={styles.filterPillsRow}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.filterPill,
              {
                backgroundColor: active ? COLORS?.textPrimary : 'transparent',
              },
            ]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.filterPillText,
              { color: active ? COLORS?.bg : COLORS?.textMuted },
            ]}>
              {opt.label}
            </Text>
            {opt.dot && (
              <View style={[styles.filterDot, { backgroundColor: opt.dot }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * SectionTitle — Section header with optional subtitle + action link
 */
export function SectionTitle({ title, subtitle, icon, actionText, onAction, COLORS }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {icon && <Text style={{ fontSize: 18 }}>{icon}</Text>}
          <Text style={[styles.sectionTitleText, { color: COLORS?.textPrimary }]}>{title}</Text>
        </View>
        {subtitle && (
          <Text style={[styles.sectionSubtitleText, { color: COLORS?.textMuted }]}>{subtitle}</Text>
        )}
      </View>
      {actionText && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={[styles.sectionAction, { color: COLORS?.primario }]}>{actionText} &gt;</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * OnlineDot — Green/amber/grey status indicator dot
 */
export function OnlineDot({ status = 'offline', size = 14 }) {
  const color = status === 'online' ? '#22C55E'
    : status === 'recent' ? '#F59E0B'
    : '#6B7280';
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      borderWidth: 2.5,
      borderColor: '#0A0A0A',
    }} />
  );
}

/**
 * ExpandableSection — Collapsible card with chevron, no borders
 */
export function ExpandableSection({ title, icon, children, COLORS, defaultOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <TouchableOpacity
      style={[styles.expandable, { backgroundColor: COLORS?.surfaceCard || COLORS?.tarjeta }]}
      onPress={() => setOpen(!open)}
      activeOpacity={0.85}
    >
      <View style={styles.expandableHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {icon && <Ionicons name={icon} size={20} color={COLORS?.textPrimary} />}
          <Text style={[styles.expandableTitle, { color: COLORS?.textPrimary }]}>{title}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS?.textMuted} />
      </View>
      {open && <View style={styles.expandableBody}>{children}</View>}
    </TouchableOpacity>
  );
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
    paddingVertical: SPACING[4],
  },
  softIcon: {
    alignItems: 'center',
    justifyContent: 'center',
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

  // ── New component styles ──

  cahuinesCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    gap: 6,
  },
  cahuinesCounterText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONTS.display,
  },
  cahuinesCounterPlus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    gap: 6,
  },
  chipSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    gap: 4,
  },
  chipTextBase: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSmall: {
    fontSize: 11,
    fontWeight: '600',
  },

  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING[4],
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    gap: 6,
  },
  filterPillText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONTS.display,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING[3],
    marginTop: SPACING[5],
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: FONTS.display,
  },
  sectionSubtitleText: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },

  expandable: {
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
    marginBottom: SPACING[3],
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandableTitle: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: FONTS.display,
  },
  expandableBody: {
    marginTop: SPACING[3],
  },
});

