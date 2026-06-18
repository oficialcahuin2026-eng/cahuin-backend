import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { matchService, mensajeService, panoramaService } from '../services/api';
import CahuinModal from '../components/CahuinModal';
import {
  BottomSheetHandle,
  EmptyState,
  GradientButton,
  ScreenScaffold,
  SegmentedControl,
} from '../components/CahuinUI';

const categoryImages = {
  'Música': require('../assets/categorias/musica.jpg'),
  'Deporte': require('../assets/categorias/deporte.jpg'),
  'Cultura': require('../assets/categorias/cultura.jpg'),
  'Comedia': require('../assets/categorias/comedia.jpg'),
  'Feria': require('../assets/categorias/ferias.jpg'),
  'Gastronomía': require('../assets/categorias/gastronomia.jpg'),
};

const CATEGORY_TABS = [
  { id: 'Todos', label: 'Todos', icon: null },
  { id: 'Música', label: 'Música', icon: 'musical-notes-outline' },
  { id: 'Cultura', label: 'Cultura', icon: 'color-palette-outline' },
  { id: 'Deporte', label: 'Deporte', icon: 'football-outline' },
  { id: 'Comedia', label: 'Comedia', icon: 'happy-outline' },
  { id: 'Feria', label: 'Feria', icon: 'storefront-outline' },
  { id: 'Gastronomía', label: 'Gastronomía', icon: 'restaurant-outline' },
];

import { FONTS, SHADOWS, SPACING } from '../utils/theme';

const emptyPanoramas = require('../assets/illustrations/empty-panoramas.png');

const REGIONES_CHILE = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble',
  'Bío Bío', 'Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
];

const fallbackEventImages = [
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=900',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=900',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=900',
];

const CATEGORIAS_OFICIALES = ['Todos', 'Música', 'Cultura', 'Deporte', 'Comedia', 'Feria', 'Gastronomía'];
const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

const soloVigentes = (items = []) => {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  return items.filter((item) => !item.fecha || new Date(item.fecha) >= inicio);
};

export default function PanoramasScreen({ navigation }) {
  const { COLORS, isDarkMode } = useTheme();
  const { usuario } = useAuth();
  const styles = getStyles(COLORS, isDarkMode);

  const [tabActiva, setTabActiva] = useState('eventos');
  const [categoriaOficial, setCategoriaOficial] = useState('Todos');
  const [panoramas, setPanoramas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [misMatchesReales, setMisMatchesReales] = useState([]);
  const [regionOficial, setRegionOficial] = useState(usuario?.region || 'Metropolitana');
  const [modalExplorador, setModalExplorador] = useState(false);
  const [eventoActivo, setEventoActivo] = useState(null);
  const [eventoParaInvitar, setEventoParaInvitar] = useState(null);
  const [enviandoInvitacion, setEnviandoInvitacion] = useState(false);
  const [modalInfo, setModalInfo] = useState(null);

  const avisar = (title, message, emoji = '🌶️', extra = {}) => setModalInfo({ title, message, emoji, ...extra });

  useEffect(() => {
    cargarTodo();
  }, [usuario?.viaje?.ciudadDestino, regionOficial]);

  const cargarTodo = async () => {
    try {
      setCargando(true);
      const regionLocal = usuario?.viaje?.ciudadDestino || usuario?.ciudad || usuario?.region || 'Metropolitana';
      const resComunidad = await panoramaService.listar({ region: regionLocal });
      const resOficiales = await panoramaService.listar({ region: regionOficial });
      const resMatches = await matchService.getMisMatches();

      setPanoramas([
        ...soloVigentes(resComunidad.panoramas || []).filter((p) => !p.esOficial),
        ...soloVigentes(resOficiales.panoramas || []).filter((p) => p.esOficial),
      ]);
      setMisMatchesReales(resMatches.matches || []);
    } catch (error) {
      console.log(error);
    } finally {
      setCargando(false);
    }
  };

  const handleUnirse = async (id) => {
    try {
      const data = await panoramaService.unirse(id);
      const participantes = data.panorama?.participantes || [];
      const nombres = participantes.map((p) => p?.nombre).filter(Boolean).slice(0, 4).join(', ');
      avisar(
        'Te anotaste',
        nombres
          ? `El creador ya puede ver que te sumaste. Grupo actual: ${nombres}.`
          : data.message || 'El creador ya puede ver que te sumaste.',
        '🙌',
        { accent: COLORS.primario }
      );
      cargarTodo();
    } catch (error) {
      avisar('Oops', error.message || 'No se pudo.', '🌶️', { tone: 'danger' });
    }
  };

  const abrirMapa = (direccion, ciudadFiltro) => {
    const ubicacionFinal = `${direccion}, ${ciudadFiltro}, Chile`;
    const url = Platform.OS === 'ios'
      ? `http://maps.apple.com/?q=${encodeURIComponent(ubicacionFinal)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacionFinal)}`;
    Linking.openURL(url).catch(() => avisar('Error', 'No pudimos abrir el mapa.', '🗺️', { tone: 'danger' }));
  };

  const fechaCorta = (fecha) => new Date(fecha).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  const abrirInvitaciones = (evento) => {
    setEventoActivo(null);
    setEventoParaInvitar(evento);
  };

  const enviarInvitacion = async (match) => {
    if (!eventoParaInvitar || enviandoInvitacion) return;
    setEnviandoInvitacion(true);

    const textoInvitacion = `Te invito a este panorama: ${eventoParaInvitar.titulo} en ${eventoParaInvitar.lugar}, el ${fechaCorta(eventoParaInvitar.fecha)}. ¿Lo vemos?`;

    try {
      await mensajeService.enviar(match.roomId, textoInvitacion);
      avisar('Invitación enviada', `Le mandaste este panorama a ${match.usuario?.nombre || 'tu match'}.`, '💌', { accent: COLORS.primario });
      setEventoParaInvitar(null);
    } catch (error) {
      avisar('Oops', error.message || 'No pudimos enviar la invitación.', '🌶️', { tone: 'danger' });
    } finally {
      setEnviandoInvitacion(false);
    }
  };

  const panoramasOficiales = panoramas.filter((p) => p.esOficial && (categoriaOficial === 'Todos' || p.categoria === categoriaOficial));
  const panoramasComunidad = panoramas.filter((p) => !p.esOficial && (categoriaOficial === 'Todos' || p.categoria === categoriaOficial));
  const listaActual = tabActiva === 'eventos' ? panoramasOficiales : panoramasComunidad;

  const renderOfficialCard = (item, index) => {
    const defaultImg = { uri: item.imagen || fallbackEventImages[index % fallbackEventImages.length] };
    const imageSource = categoryImages[item.categoria] || defaultImg;
    
    const d = new Date(item.fecha);
    const dia = d.getDate();
    const mes = MESES[d.getMonth()];
    const horaStr = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
    const esSabado = d.getDay() === 6;
    const diaCorto = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()];

    return (
      <TouchableOpacity key={item._id || index} activeOpacity={0.92} onPress={() => setEventoActivo(item)} style={styles.modernCard}>
        <View style={styles.modernImageContainer}>
          <Image source={imageSource} style={styles.modernImage} />
          <View style={styles.dateBadgeAbsolute}>
            <Text style={styles.dateBadgeDay}>{dia}</Text>
            <Text style={styles.dateBadgeMonth}>{mes}</Text>
          </View>
        </View>
        <View style={styles.modernContent}>
          <View style={styles.categoryBadgeRow}>
            <View style={styles.categoryBadgePill}>
              <Text style={styles.categoryBadgeText}>{item.emoji || '✨'} {item.categoria || 'Oficial'}</Text>
            </View>
            <TouchableOpacity style={styles.bookmarkBtn} onPress={() => {}}>
              <Ionicons name="bookmark-outline" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modernTitle} numberOfLines={2}>{item.titulo}</Text>
          
          <View style={styles.modernMetaBlock}>
            <View style={styles.modernMetaRow}>
              <Ionicons name="location" size={12} color={COLORS.primario} />
              <Text style={styles.modernMetaText} numberOfLines={1}>{item.lugar}</Text>
            </View>
            <Text style={styles.modernDateText}>{diaCorto}, {dia} de {d.toLocaleDateString('es-CL', { month: 'long' })} • {horaStr} hrs</Text>
          </View>
        </View>
        <View style={styles.modernChevron}>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderCommunityCard = (item, index) => (
    <View key={item._id || index} style={styles.communityCard}>
      <View style={styles.communityIconBox}>
        <Ionicons name="map" size={28} color="#FF6B45" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.communityTitle}>{item.titulo}</Text>
        <Text style={styles.communityDesc} numberOfLines={1}>{item.descripcion}</Text>
        <TouchableOpacity style={styles.communityMetaRow} onPress={() => abrirMapa(item.lugar, usuario?.viaje?.ciudadDestino || usuario?.region)}>
          <Ionicons name="location" size={14} color="#FF6B45" />
          <Text style={styles.communityMetaText} numberOfLines={1}>{item.lugar} · {fechaCorta(item.fecha)}</Text>
        </TouchableOpacity>
        <View style={styles.groupHint}>
          <Ionicons name="people" size={14} color="#FF6B45" />
          <Text style={styles.groupHintText}>{item.participantes?.length || 0} anotados · el creador ve la lista</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.joinButton} onPress={() => handleUnirse(item._id)}>
        <Text style={styles.joinButtonText}>Me anoto</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenScaffold COLORS={COLORS}>
      <SegmentedControl
        COLORS={{ ...COLORS, tarjeta: isDarkMode ? 'rgba(255,255,255,0.08)' : COLORS.inputBg }}
        value={tabActiva}
        onChange={setTabActiva}
        options={[
          { value: 'eventos', label: 'Eventos Oficiales', icon: 'ticket' },
          { value: 'comunidad', label: 'Comunidad', icon: 'people', dark: isDarkMode },
        ]}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContainer}>
        {CATEGORY_TABS.map((tab) => {
          const active = categoriaOficial === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.categoryPill, active && styles.categoryPillActive, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
              onPress={() => setCategoriaOficial(tab.id)}
            >
              {tab.icon && (
                <Ionicons name={tab.icon} size={16} color={active ? COLORS.textPrimary : COLORS.textMuted} />
              )}
              <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {tabActiva === 'eventos' ? (
        <View style={styles.modernHeader}>
          <Text style={styles.modernHeaderTitle}>Eventos Oficiales</Text>
          <Text style={styles.modernHeaderSub}>Descubre panoramas verificados por Cahuín. <Text style={{color: COLORS.primario}}>💖</Text></Text>
          
          <TouchableOpacity style={styles.modernRegionSelector} onPress={() => setModalExplorador(true)}>
            <Ionicons name="location" size={20} color={COLORS.primario} />
            <Text style={styles.modernRegionText} numberOfLines={1}>{regionOficial}</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.modernUpcomingRow}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primario} />
            <Text style={styles.modernUpcomingTitle}>Próximos eventos</Text>
            <TouchableOpacity style={{marginLeft: 'auto'}}>
              <Text style={styles.modernUpcomingLink}>Ver calendario &gt;</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Panoramas Locales</Text>
          <TouchableOpacity style={styles.darkPillActive} onPress={() => navigation.navigate('CrearPanorama')}>
            <Ionicons name="add" size={20} color={isDarkMode ? '#FFF' : '#FFF'} />
            <Text style={styles.darkPillTextActive}>Crear Panorama</Text>
          </TouchableOpacity>
        </View>
      )}

      {cargando ? (
        <ActivityIndicator size="large" color={COLORS.primario} style={{ marginTop: 80 }} />
      ) : listaActual.length === 0 ? (
        <EmptyState
          COLORS={COLORS}
          image={emptyPanoramas}
          title={tabActiva === 'eventos' ? 'No hay eventos todavía' : 'No hay panoramas todavía'}
          subtitle={tabActiva === 'eventos'
            ? 'Prueba otra región o vuelve más tarde para descubrir carteleras nuevas.'
            : 'Los mejores panoramas nacen de la comunidad. Inventa uno tú y ayuda a otros a descubrirlo.'}
          action={tabActiva === 'comunidad' ? (
            <GradientButton icon="add" style={{ width: '100%', marginTop: 28 }} onPress={() => navigation.navigate('CrearPanorama')}>
              Crear Panorama
            </GradientButton>
          ) : null}
        />
      ) : (
        <>
          {tabActiva === 'eventos' ? (
            <View style={{ paddingBottom: 20 }}>
              {listaActual.map((item, index) => renderOfficialCard(item, index))}
              
              <View style={styles.specialInviteBox}>
                <View style={styles.specialInviteHeader}>
                  <Ionicons name="sparkles" size={16} color={COLORS.primario} />
                  <Text style={styles.specialInviteLabel}>INVITACIÓN ESPECIAL</Text>
                </View>
                <View style={styles.specialInviteBody}>
                  <View style={styles.specialInviteIconRing}>
                    <Ionicons name="heart" size={32} color={COLORS.primario} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.specialInviteTitle}>Invita a tu match <Ionicons name="heart-outline" size={18} color={COLORS.textPrimary}/></Text>
                    <Text style={styles.specialInviteDesc}>Elige un evento y conviértanlo en su próximo recuerdo.</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.specialInviteBtn} onPress={() => {}}>
                  <Text style={styles.specialInviteBtnText}>Invitar a un evento &gt;</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            listaActual.map(renderCommunityCard)
          )}
        </>
      )}

      <Modal visible={!!eventoActivo} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={styles.modalCard}>
            <BottomSheetHandle />
            <View style={styles.modalTitleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTituloGrande}>{eventoActivo?.titulo}</Text>
                <Text style={styles.modalSubSmall}>{eventoActivo?.descripcion}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setEventoActivo(null)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color={COLORS.primario} />
              <Text style={styles.detailText}>{eventoActivo?.lugar}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={20} color={COLORS.primario} />
              <Text style={styles.detailText}>{eventoActivo ? fechaCorta(eventoActivo.fecha) : ''}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => abrirMapa(eventoActivo?.lugar, regionOficial)}>
                <Ionicons name="map" size={20} color={COLORS.textPrimary} />
                <Text style={styles.secondaryActionText}>Abrir mapa</Text>
              </TouchableOpacity>
              <GradientButton icon="send" style={styles.primaryAction} onPress={() => abrirInvitaciones(eventoActivo)}>
                Invitar
              </GradientButton>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!eventoParaInvitar} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={[styles.modalCard, { maxHeight: '76%' }]}>
            <BottomSheetHandle />
            <View style={styles.modalTitleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTituloGrande}>Invitar a un Cahuín</Text>
                <Text style={styles.modalSubSmall}>{eventoParaInvitar?.titulo}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setEventoParaInvitar(null)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {misMatchesReales.length === 0 ? (
              <View style={styles.emptyInvite}>
                <Text style={styles.emptyInviteTitle}>Aún no hay chats para invitar.</Text>
                <Text style={styles.emptyInviteText}>Cuando tengas matches, aparecerán aquí para mandarles panoramas directo al chat.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {misMatchesReales.map((match) => (
                  <TouchableOpacity
                    key={match.roomId}
                    style={styles.matchInviteRow}
                    activeOpacity={0.88}
                    disabled={enviandoInvitacion}
                    onPress={() => enviarInvitacion(match)}
                  >
                    <Image source={{ uri: match.usuario?.foto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200' }} style={styles.matchAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.matchName}>{match.usuario?.nombre || 'Match'}</Text>
                      <Text style={styles.matchHint}>Enviar invitación al chat</Text>
                    </View>
                    <Ionicons name="send" size={20} color={COLORS.primario} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={modalExplorador} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <BottomSheetHandle />
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleLeft}>
                <Ionicons name="map" size={28} color="#8B5CF6" />
                <Text style={styles.modalTituloGrande}>Explorar Chile</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalExplorador(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Revisa la cartelera oficial de cualquier parte del país para planear un pique e invitar a tus matches.</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {REGIONES_CHILE.map((reg) => {
                const active = regionOficial === reg;
                return (
                  <TouchableOpacity
                    key={reg}
                    style={[styles.regionButton, active && styles.regionButtonActive]}
                    onPress={() => { setRegionOficial(reg); setModalExplorador(false); }}
                  >
                    <Text style={[styles.regionButtonText, active && { fontWeight: '900', color: isDarkMode ? '#FFF' : COLORS.primario }]}>{reg}</Text>
                    {active ? <View style={styles.regionCheck}><Ionicons name="checkmark" size={16} color="#FFF" /></View> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

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

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[5],
    gap: SPACING[3],
    flexWrap: 'wrap',
  },
  regionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 160 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', fontFamily: FONTS.display, letterSpacing: 0.5, flexShrink: 1 },
  darkPill: {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : COLORS.tarjeta,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : COLORS.border,
    ...(isDarkMode ? {} : SHADOWS.light)
  },
  darkPillText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 13 },
  darkPillActive: {
    backgroundColor: 'rgba(240,68,79,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(240,68,79,0.3)',
    ...(isDarkMode ? {} : SHADOWS.light)
  },
  darkPillTextActive: { color: COLORS.primario, fontWeight: '900', fontSize: 13 },
  
  // Modern Redesign Styles
  modernHeader: { marginBottom: 20 },
  modernHeaderTitle: { color: COLORS.textPrimary, fontSize: 32, fontWeight: '900', fontFamily: FONTS.display, letterSpacing: -0.5 },
  modernHeaderSub: { color: COLORS.textMuted, fontSize: 15, marginTop: 4, marginBottom: 20 },
  modernRegionSelector: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : COLORS.inputBg, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, alignSelf: 'flex-start', marginBottom: 20, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : COLORS.border },
  modernRegionText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  categoriesScroll: { marginBottom: 24, paddingBottom: 4 },
  categoriesContainer: { gap: 10, paddingRight: 20 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : COLORS.border, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : COLORS.tarjeta },
  categoryPillActive: { backgroundColor: 'rgba(240,68,79,0.15)', borderColor: 'rgba(240,68,79,0.4)' },
  categoryPillText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '700' },
  categoryPillTextActive: { color: COLORS.primario, fontWeight: '900' },
  modernUpcomingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  modernUpcomingTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  modernUpcomingLink: { color: COLORS.primario, fontSize: 14, fontWeight: '700' },
  
  modernCard: { flexDirection: 'row', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : COLORS.tarjeta, borderRadius: 24, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : COLORS.border, marginBottom: 16, padding: 12, gap: 14, ...(isDarkMode ? {} : SHADOWS.light) },
  modernImageContainer: { width: 110, height: 130, borderRadius: 16, overflow: 'hidden', backgroundColor: COLORS.inputBg },
  modernImage: { width: '100%', height: '100%' },
  dateBadgeAbsolute: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 8, alignItems: 'center', backdropFilter: 'blur(10px)' },
  dateBadgeDay: { color: '#FFF', fontSize: 18, fontWeight: '900', lineHeight: 20 },
  dateBadgeMonth: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  modernContent: { flex: 1, justifyContent: 'center' },
  categoryBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  categoryBadgePill: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : COLORS.inputBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { color: COLORS.textPrimary, fontSize: 11, fontWeight: '800' },
  bookmarkBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  modernTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900', fontFamily: FONTS.display, lineHeight: 22, marginBottom: 12 },
  modernMetaBlock: { gap: 4 },
  modernMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modernMetaText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  modernDateText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  modernChevron: { alignSelf: 'center', paddingRight: 4 },

  specialInviteBox: { marginTop: 10, padding: 20, borderRadius: 24, backgroundColor: isDarkMode ? 'rgba(240,68,79,0.05)' : COLORS.tarjeta, borderWidth: 1, borderColor: 'rgba(240,68,79,0.3)', ...(isDarkMode ? { shadowColor: COLORS.primario, shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } } : SHADOWS.medium) },
  specialInviteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  specialInviteLabel: { color: COLORS.primario, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  specialInviteBody: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  specialInviteIconRing: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(240,68,79,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(240,68,79,0.2)' },
  specialInviteTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', fontFamily: FONTS.display, marginBottom: 4 },
  specialInviteDesc: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20 },
  specialInviteBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.primario, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  specialInviteBtnText: { color: COLORS.primario, fontSize: 15, fontWeight: '900' },

  // Cards
  featuredCard: { marginBottom: 16, padding: 16, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : COLORS.tarjeta, borderRadius: 24, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : COLORS.border, ...(isDarkMode ? {} : SHADOWS.light) },
  featuredTop: { flexDirection: 'row', gap: 16 },
  featuredImage: { width: 120, height: 120, borderRadius: 20, backgroundColor: COLORS.softRed },
  featuredTitle: { color: COLORS.textPrimary, fontSize: 20, lineHeight: 26, fontWeight: '900', fontFamily: FONTS.display },
  featuredDesc: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  metaBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, padding: 6, paddingHorizontal: 10, backgroundColor: 'rgba(240,68,79,0.1)', borderRadius: 12, alignSelf: 'flex-start' },
  featuredMeta: { color: COLORS.primario, fontSize: 13, fontWeight: '800', flexShrink: 1 },
  
  inviteBox: { marginTop: 16, padding: 14, borderRadius: 18, backgroundColor: 'rgba(240,68,79,0.08)', borderWidth: 1, borderColor: 'rgba(240,68,79,0.15)', flexDirection: 'row', alignItems: 'center', gap: 14 },
  inviteIconWrap: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(240,68,79,0.15)', alignItems: 'center', justifyContent: 'center' },
  inviteTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '900' },
  inviteText: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  inviteButtonSmall: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primario, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  inviteButtonSmallText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12, padding: 12, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : COLORS.tarjeta, borderRadius: 20, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.border, ...(isDarkMode ? {} : SHADOWS.light) },
  eventThumb: { width: 72, height: 72, borderRadius: 16, backgroundColor: COLORS.softRed },
  eventTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900', fontFamily: FONTS.display },
  eventDesc: { color: COLORS.textMuted, fontSize: 14, marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, flexShrink: 1 },
  eventMeta: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', flex: 1 },
  chevronCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : COLORS.inputBg },
  
  communityCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12, padding: 16, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : COLORS.tarjeta, borderRadius: 22, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.border, ...(isDarkMode ? {} : SHADOWS.light) },
  communityIconBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,107,69,0.1)', alignItems: 'center', justifyContent: 'center' },
  communityTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900', fontFamily: FONTS.display },
  communityDesc: { color: COLORS.textMuted, fontSize: 14, marginTop: 3 },
  communityMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  communityMetaText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  groupHint: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  groupHintText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800' },
  joinButton: { borderRadius: 16, borderWidth: 1, borderColor: '#FF6B45', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(255,107,69,0.1)' },
  joinButtonText: { color: '#FF6B45', fontWeight: '900', fontSize: 13 },
  
  // Modals
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '88%' },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalTituloGrande: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '900', fontFamily: FONTS.display, flex: 1 },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : COLORS.fondo },
  modalSub: { color: COLORS.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 24 },
  modalSubSmall: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  detailText: { color: COLORS.textPrimary, flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  
  actionRow: { flexDirection: 'row', gap: 14, marginTop: 24 },
  secondaryAction: { flex: 1, minHeight: 52, borderRadius: 18, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : COLORS.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : COLORS.inputBg },
  secondaryActionText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800' },
  primaryAction: { flex: 1, borderRadius: 18 },
  
  emptyInvite: { borderRadius: 20, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : COLORS.border, padding: 20, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : COLORS.inputBg },
  emptyInviteTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '900', marginBottom: 6 },
  emptyInviteText: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20 },
  
  matchInviteRow: { minHeight: 70, borderRadius: 20, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.border, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : COLORS.fondo },
  matchAvatar: { width: 46, height: 46, borderRadius: 18, backgroundColor: COLORS.softRed },
  matchName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900' },
  matchHint: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  
  regionButton: { height: 62, borderRadius: 18, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : COLORS.fondo, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  regionButtonActive: { backgroundColor: 'rgba(240,68,79,0.15)', borderWidth: 1, borderColor: 'rgba(240,68,79,0.3)' },
  regionButtonText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  regionCheck: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primario, alignItems: 'center', justifyContent: 'center' },
});
