import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { matchService, userService } from '../services/api';
import { getCategoriaExplorar } from '../data/explorarCategorias';
import { FONTS, SHADOWS, SPACING } from '../utils/theme';
import { GradientButton, ScreenScaffold, SoftIcon } from '../components/CahuinUI';
import CahuinModal from '../components/CahuinModal';

const fotoFallback = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85';

const formatDistancia = (distancia) => {
  if (!distancia) return '';
  return typeof distancia === 'number' ? `${distancia} km` : distancia;
};

export default function CategoriaExplorarScreen({ navigation, route }) {
  const { usuario, actualizarUsuario } = useAuth();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const categoria = useMemo(() => getCategoriaExplorar(route?.params?.categoriaId), [route?.params?.categoriaId]);
  const [perfiles, setPerfiles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [accionandoId, setAccionandoId] = useState(null);
  const [modalInfo, setModalInfo] = useState(null);

  const categoriasUnidas = usuario?.categoriasExplorar || [];
  const unido = categoriasUnidas.includes(categoria.id);
  const avisar = (title, message, extra = {}) => setModalInfo({ title, message, ...extra });

  const cargarPerfiles = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const data = await userService.descubrir({ categoria: categoria.id });
      setPerfiles(data?.perfiles || []);
    } catch (error) {
      avisar('No pudimos cargar', error.message || 'Revisa tu conexión e intenta de nuevo.', {
        emoji: '🧭',
        accent: categoria.color,
      });
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [categoria.id]);

  useFocusEffect(useCallback(() => {
    cargarPerfiles();
  }, [cargarPerfiles]));

  useEffect(() => {
    if (unido) cargarPerfiles(true);
  }, [unido, cargarPerfiles]);

  const unirse = async () => {
    const nuevas = Array.from(new Set([...categoriasUnidas, categoria.id]));
    setAccionandoId('join');
    try {
      const res = await userService.actualizar({ categoriasExplorar: nuevas });
      actualizarUsuario({ ...(res.usuario || {}), categoriasExplorar: nuevas });
    } catch (error) {
      avisar('No se pudo unir', error.message || 'Intenta de nuevo.', {
        emoji: '✨',
        accent: categoria.color,
      });
    } finally {
      setAccionandoId(null);
    }
  };

  const salir = async () => {
    avisar(`Salir de ${categoria.title}`, 'Dejarás de aparecer como parte de esta comunidad, pero podrás volver cuando quieras.', {
      emoji: '✨',
      accent: categoria.color,
      actions: [
        { label: 'Cancelar', variant: 'secondary', color: categoria.color, onPress: () => setModalInfo(null) },
        {
          label: 'Salir',
          color: categoria.color,
          onPress: async () => {
            setModalInfo(null);
            const nuevas = categoriasUnidas.filter((id) => id !== categoria.id);
            setAccionandoId('leave');
            try {
              const res = await userService.actualizar({ categoriasExplorar: nuevas });
              actualizarUsuario({ ...(res.usuario || {}), categoriasExplorar: nuevas });
            } catch (error) {
              avisar('No se pudo salir', error.message || 'Intenta de nuevo.', {
                emoji: '✨',
                accent: categoria.color,
              });
            } finally {
              setAccionandoId(null);
            }
          },
        },
      ],
    });
  };

  const retirarPerfil = (id) => setPerfiles((actuales) => actuales.filter((p) => p._id !== id));

  const darLike = async (perfil) => {
    setAccionandoId(perfil._id);
    try {
      const data = await matchService.darLike(perfil._id);
      retirarPerfil(perfil._id);
      if (data?.match) {
        avisar('Encontramos el cahuín', `Tú y ${perfil.nombre} hicieron match en ${categoria.title}.`, {
          emoji: '💕',
          accent: categoria.color,
          actions: [{ label: 'Ir al chat', onPress: () => { setModalInfo(null); navigation.navigate('Chat'); } }],
        });
      }
      if (data?.usuario) actualizarUsuario(data.usuario);
    } catch (error) {
      avisar('No se pudo dar like', error.message || 'Intenta de nuevo.', {
        emoji: '❤️',
        accent: categoria.color,
      });
    } finally {
      setAccionandoId(null);
    }
  };
  const pasar = async (perfil) => {
    setAccionandoId(perfil._id);
    try {
      const data = await matchService.pasar(perfil._id);
      retirarPerfil(perfil._id);
      if (data?.usuario) actualizarUsuario(data.usuario);
    } catch (error) {
      avisar('No se pudo pasar', error.message || 'Intenta de nuevo.', { emoji: '↩️', accent: categoria.color });
    } finally {
      setAccionandoId(null);
    }
  };

  return (
    <ScreenScaffold
      COLORS={COLORS}
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargarPerfiles(true); }} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={unido ? salir : unirse} style={styles.membershipButton} disabled={accionandoId === 'join' || accionandoId === 'leave'}>
          {accionandoId === 'join' || accionandoId === 'leave' ? (
            <ActivityIndicator color={unido ? COLORS.textMuted : '#FFF'} />
          ) : (
            <>
              <Ionicons name={unido ? 'checkmark-circle' : 'add-circle'} size={19} color={unido ? categoria.color : '#FFF'} />
              <Text style={[styles.membershipText, { color: unido ? COLORS.textPrimary : '#FFF' }]}>{unido ? 'Unido' : 'Unirme'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <LinearGradient colors={[categoria.bg, COLORS.tarjeta]} style={[styles.hero, { borderColor: COLORS.border }]}>
        <SoftIcon name={categoria.icon} bg="#FFF" color={categoria.color} size={76} rounded={38} iconSize={34} />
        <View style={{ flex: 1 }}>
          <Text style={styles.heroEyebrow}>Comunidad Cahuín</Text>
          <Text style={styles.heroTitle}>{categoria.title}</Text>
          <Text style={styles.heroText}>{categoria.subtitle}</Text>
        </View>
      </LinearGradient>

      <View style={styles.filterCard}>
        <Ionicons name="navigate" size={20} color={categoria.color} />
        <Text style={styles.filterText}>
          Mostrando perfiles de tu región dentro de {usuario?.distanciaMax || 50} km, con intención parecida a la tuya.
        </Text>
      </View>

      {!unido ? (
        <View style={styles.emptyCard}>
          <SoftIcon name={categoria.icon} bg={categoria.bg} color={categoria.color} size={70} rounded={35} iconSize={32} />
          <Text style={[styles.emptyTitle, { marginTop: 12 }]}>Primero entra al cahuín</Text>
          <Text style={styles.emptyText}>Así sabemos que quieres aparecer en esta comunidad y te mostramos gente con el mismo mood.</Text>
          <GradientButton icon="add" onPress={unirse} disabled={accionandoId === 'join'}>
            Unirme ahora
          </GradientButton>
        </View>
      ) : cargando ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={categoria.color} />
          <Text style={styles.loadingText}>Buscando perfiles compatibles...</Text>
        </View>
      ) : perfiles.length === 0 ? (
        <View style={styles.emptyCard}>
          <SoftIcon name="sparkles" bg={COLORS.softRed} color={COLORS.primario} size={70} rounded={35} iconSize={32} />
          <Text style={styles.emptyTitle}>No hay perfiles por ahora</Text>
          <Text style={styles.emptyText}>Prueba ampliar tu distancia en Preferencias o unirte a otra comunidad.</Text>
          <TouchableOpacity style={[styles.secondaryButton, { borderColor: categoria.color }]} onPress={() => navigation.navigate('Preferencias')}>
            <Text style={[styles.secondaryButtonText, { color: categoria.color }]}>Editar preferencias</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {perfiles.map((perfil) => (
            <TouchableOpacity
              key={perfil._id}
              activeOpacity={0.92}
              onPress={() => navigation.navigate('OtroPerfil', { userId: perfil._id, hideActions: true })}
              style={[styles.profileCard, { borderColor: COLORS.border, backgroundColor: COLORS.tarjeta }]}
            >
              <Image source={{ uri: perfil.foto || perfil.fotos?.[0] || fotoFallback }} style={styles.profileImage} />
              <View style={styles.profileBody}>
                <View style={styles.profileTop}>
                  <Text style={styles.profileName} numberOfLines={1}>{perfil.nombre}, {perfil.edad || 18}</Text>
                  {perfil.verificado ? <Ionicons name="checkmark-circle" size={19} color="#2F80ED" /> : null}
                </View>
                <View style={styles.profileLocationRow}>
                  <Ionicons name="location" size={14} color={categoria.color} />
                  <Text style={styles.location} numberOfLines={1}>
                    {perfil.ciudad || 'Por definir'} {formatDistancia(perfil.distanciaKm) ? `· ${formatDistancia(perfil.distanciaKm)}` : ''}
                  </Text>
                </View>
                <Text style={styles.bio} numberOfLines={3}>{perfil.descripcion || `Perfil listo para ${categoria.short.toLowerCase()}.`}</Text>
                <View style={styles.chips}>
                  {[perfil.queBuscas, ...(perfil.intereses || [])].filter(Boolean).slice(0, 3).map((chip) => (
                    <View key={`${perfil._id}-${chip}`} style={[styles.chip, { backgroundColor: categoria.bg }]}>
                      <Text style={[styles.chipText, { color: categoria.color }]} numberOfLines={1}>{chip}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity disabled={accionandoId === perfil._id} onPress={() => pasar(perfil)} style={[styles.actionButton, { borderColor: COLORS.border }]}>
                  <Ionicons name="close" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity disabled={accionandoId === perfil._id} onPress={() => darLike(perfil)} style={[styles.actionButton, styles.likeButton]}>
                  {accionandoId === perfil._id ? <ActivityIndicator color="#FFF" /> : <Ionicons name="heart" size={23} color="#FFF" />}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <CahuinModal
        visible={!!modalInfo}
        title={modalInfo?.title}
        message={modalInfo?.message}
        emoji={modalInfo?.emoji}
        actions={modalInfo?.actions || []}
        accent={modalInfo?.accent}
        tone={modalInfo?.tone}
        details={modalInfo?.details}
        onClose={() => setModalInfo(null)}
      />
    </ScreenScaffold>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING[4] },
  roundButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', ...SHADOWS.light },
  membershipButton: { minWidth: 112, height: 46, borderRadius: 23, backgroundColor: COLORS.navy, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, ...SHADOWS.light },
  membershipText: { fontWeight: '900', fontSize: 14 },
  hero: { minHeight: 170, borderRadius: 28, borderWidth: 1, padding: SPACING[5], flexDirection: 'row', alignItems: 'center', gap: SPACING[4], ...SHADOWS.light },
  heroEyebrow: { color: COLORS.textMuted, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
  heroTitle: { color: COLORS.textPrimary, fontSize: 32, lineHeight: 36, fontWeight: '900', fontFamily: FONTS.display },
  heroText: { color: COLORS.textMuted, fontSize: 15, lineHeight: 22, marginTop: 6 },
  filterCard: { marginTop: SPACING[4], borderRadius: 20, backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[4], flexDirection: 'row', alignItems: 'center', gap: SPACING[3] },
  filterText: { flex: 1, color: COLORS.textMuted, fontSize: 13, lineHeight: 19 },
  loadingWrap: { alignItems: 'center', paddingVertical: 70 },
  loadingText: { color: COLORS.textMuted, marginTop: 14, fontWeight: '700' },
  emptyCard: { backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, borderRadius: 28, padding: SPACING[5], marginTop: SPACING[5], alignItems: 'center', ...SHADOWS.light },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 24, lineHeight: 30, fontWeight: '900', textAlign: 'center', fontFamily: FONTS.display },
  emptyText: { color: COLORS.textMuted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8, marginBottom: SPACING[5] },
  secondaryButton: { minHeight: 52, borderRadius: 26, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING[5] },
  secondaryButtonText: { fontSize: 16, fontWeight: '900' },
  list: { marginTop: SPACING[5], gap: SPACING[4] },
  profileCard: { borderRadius: 28, borderWidth: 1, overflow: 'hidden', ...SHADOWS.light },
  profileImage: { width: '100%', height: 250, backgroundColor: COLORS.softRed },
  profileBody: { padding: SPACING[4] },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName: { color: COLORS.textPrimary, fontSize: 28, lineHeight: 34, fontWeight: '900', fontFamily: FONTS.display, flex: 1 },
  profileLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  location: { color: COLORS.textMuted, fontSize: 14, flex: 1 },
  bio: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 22, marginTop: SPACING[3] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SPACING[3] },
  chip: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, maxWidth: '100%' },
  chipText: { fontSize: 12, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: SPACING[3], paddingHorizontal: SPACING[4], paddingBottom: SPACING[4] },
  actionButton: { flex: 1, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.fondo },
  likeButton: { borderWidth: 0, backgroundColor: COLORS.primario },
});

