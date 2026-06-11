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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { matchService, mensajeService, panoramaService } from '../services/api';
import CahuinModal from '../components/CahuinModal';
import CahuinTextField from '../components/CahuinTextField';
import {
  BottomSheetHandle,
  EmptyState,
  GradientButton,
  ScreenScaffold,
  SegmentedControl,
  SoftCard,
  SoftIcon,
} from '../components/CahuinUI';
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

const soloVigentes = (items = []) => {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  return items.filter((item) => !item.fecha || new Date(item.fecha) >= inicio);
};

export default function PanoramasScreen() {
  const { COLORS } = useTheme();
  const { usuario } = useAuth();
  const styles = getStyles(COLORS);

  const [tabActiva, setTabActiva] = useState('eventos');
  const [panoramas, setPanoramas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [misMatchesReales, setMisMatchesReales] = useState([]);
  const [regionOficial, setRegionOficial] = useState(usuario?.region || 'Metropolitana');
  const [modalExplorador, setModalExplorador] = useState(false);
  const [modalCrear, setModalCrear] = useState(false);
  const [nuevoPano, setNuevoPano] = useState({ titulo: '', descripcion: '', lugar: '', fecha: new Date() });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
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

  const handleCrearPanorama = async () => {
    if (!nuevoPano.titulo || !nuevoPano.lugar) {
      avisar('Ey', 'Ponle un titulo y un lugar.', '📍', { accent: COLORS.primario });
      return;
    }

    try {
      setCargando(true);
      await panoramaService.crear({
        ...nuevoPano,
        descripcion: nuevoPano.descripcion || nuevoPano.titulo,
        region: usuario?.viaje?.ciudadDestino || usuario?.region || 'Metropolitana',
        maxPersonas: 10,
        categoria: 'Comunidad',
        emoji: '📍',
      });
      setModalCrear(false);
      setNuevoPano({ titulo: '', descripcion: '', lugar: '', fecha: new Date() });
      avisar('Listo', 'Panorama publicado en la comunidad.', '📍', { accent: COLORS.primario });
      cargarTodo();
    } catch {
      avisar('Error', 'No pudimos publicarlo. Verifica tu conexión.', '🌶️', { tone: 'danger' });
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

  const onChangeFecha = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setNuevoPano({ ...nuevoPano, fecha: selectedDate });
  };

  const onChangeHora = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const nuevaFecha = new Date(nuevoPano.fecha);
      nuevaFecha.setHours(selectedTime.getHours());
      nuevaFecha.setMinutes(selectedTime.getMinutes());
      setNuevoPano({ ...nuevoPano, fecha: nuevaFecha });
    }
  };

  const panoramasOficiales = panoramas.filter((p) => p.esOficial);
  const panoramasComunidad = panoramas.filter((p) => !p.esOficial);
  const listaActual = tabActiva === 'eventos' ? panoramasOficiales : panoramasComunidad;

  const renderOfficialCard = (item, index, featured = false) => {
    const imageUri = item.imagen || fallbackEventImages[index % fallbackEventImages.length];

    if (!featured) {
      return (
        <TouchableOpacity key={item._id || index} activeOpacity={0.9} onPress={() => setEventoActivo(item)}>
          <SoftCard COLORS={COLORS} style={styles.eventRow}>
            <Image source={{ uri: imageUri }} style={styles.eventThumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.eventTitle} numberOfLines={1}>{item.titulo}</Text>
              <Text style={styles.eventDesc} numberOfLines={1}>{item.descripcion}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="location" size={15} color={COLORS.primario} />
                <Text style={styles.eventMeta} numberOfLines={1}>{item.lugar} · {fechaCorta(item.fecha)}</Text>
              </View>
            </View>
            <View style={styles.chevronCircle}><Ionicons name="chevron-forward" size={22} color={COLORS.primario} /></View>
          </SoftCard>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity key={item._id || index} activeOpacity={0.92} onPress={() => setEventoActivo(item)}>
        <SoftCard COLORS={COLORS} style={styles.featuredCard}>
          <View style={styles.featuredTop}>
            <Image source={{ uri: imageUri }} style={styles.featuredImage} />
            <View style={{ flex: 1 }}>
              <Text style={styles.featuredTitle}>{item.titulo}</Text>
              <Text style={styles.featuredDesc}>{item.descripcion}</Text>
              <TouchableOpacity onPress={() => abrirMapa(item.lugar, regionOficial)}>
                <View style={styles.metaRow}>
                  <Ionicons name="location" size={16} color={COLORS.primario} />
                  <Text style={styles.featuredMeta}>{item.lugar} · {fechaCorta(item.fecha)}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inviteBox}>
            <SoftIcon name="people" size={56} rounded={28} bg={COLORS.softRed} color={COLORS.primario} />
            <View style={{ flex: 1 }}>
              <Text style={styles.inviteTitle}>Invitar amigos</Text>
              <Text style={styles.inviteText}>Comparte este evento con tus cahuines.</Text>
            </View>
            <GradientButton icon="send" style={styles.inviteButton} onPress={() => abrirInvitaciones(item)}>
              Invitar
            </GradientButton>
          </View>
        </SoftCard>
      </TouchableOpacity>
    );
  };

  const renderCommunityCard = (item, index) => (
    <SoftCard key={item._id || index} COLORS={COLORS} style={styles.communityCard}>
      <SoftIcon name="location" size={58} rounded={20} bg={COLORS.softAmber} color={COLORS.primario} />
      <View style={{ flex: 1 }}>
        <Text style={styles.eventTitle}>{item.titulo}</Text>
        <Text style={styles.eventDesc}>{item.descripcion}</Text>
        <TouchableOpacity onPress={() => abrirMapa(item.lugar, usuario?.viaje?.ciudadDestino || usuario?.region)}>
          <View style={styles.metaRow}>
            <Ionicons name="location" size={15} color={COLORS.primario} />
            <Text style={styles.eventMeta}>{item.lugar} · {fechaCorta(item.fecha)}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.groupHint}>
          <Ionicons name="people" size={14} color={COLORS.primario} />
          <Text style={styles.groupHintText}>{item.participantes?.length || 0} anotados · el creador ve la lista</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.joinButton} onPress={() => handleUnirse(item._id)}>
        <Text style={styles.joinButtonText}>Me anoto</Text>
      </TouchableOpacity>
    </SoftCard>
  );

  return (
    <ScreenScaffold COLORS={COLORS}>
      <SegmentedControl
        COLORS={COLORS}
        value={tabActiva}
        onChange={setTabActiva}
        options={[
          { value: 'eventos', label: 'Eventos Oficiales', icon: 'ticket' },
          { value: 'comunidad', label: 'Comunidad', icon: 'people', dark: true },
        ]}
      />

      {tabActiva === 'eventos' ? (
        <View style={styles.sectionHeader}>
          <View style={styles.regionTitleRow}>
            <Ionicons name="location" size={28} color={COLORS.primario} />
            <Text style={styles.sectionTitle} numberOfLines={1} adjustsFontSizeToFit>{regionOficial}</Text>
          </View>
          <TouchableOpacity style={styles.darkPill} onPress={() => setModalExplorador(true)}>
            <Ionicons name="map" size={18} color="#FFF" />
            <Text style={styles.darkPillText}>Ver más regiones</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Panoramas Locales</Text>
          <TouchableOpacity style={styles.darkPill} onPress={() => setModalCrear(true)}>
            <Ionicons name="add" size={22} color="#FFF" />
            <Text style={styles.darkPillText}>Crear Panorama</Text>
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
            <GradientButton icon="add" style={{ width: '100%', marginTop: 28 }} onPress={() => setModalCrear(true)}>
              Crear Panorama
            </GradientButton>
          ) : null}
        />
      ) : (
        <>
          {tabActiva === 'eventos'
            ? listaActual.map((item, index) => renderOfficialCard(item, index, index === 0))
            : listaActual.map(renderCommunityCard)}
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
                <Ionicons name="close" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location" size={22} color={COLORS.primario} />
              <Text style={styles.detailText}>{eventoActivo?.lugar}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={22} color={COLORS.primario} />
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
                <Text style={styles.modalTitulo}>Invitar a un Cahuín</Text>
                <Text style={styles.modalSubSmall}>{eventoParaInvitar?.titulo}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setEventoParaInvitar(null)}>
                <Ionicons name="close" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {misMatchesReales.length === 0 ? (
              <View style={styles.emptyInvite}>
                <Text style={styles.emptyInviteTitle}>Aun no hay chats para invitar.</Text>
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
          <View style={[styles.modalCard, { maxHeight: '82%' }]}>
            <BottomSheetHandle />
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleLeft}>
                <Ionicons name="map" size={30} color={COLORS.navy} />
                <Text style={styles.modalTitulo}>Explorar Chile</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalExplorador(false)}>
                <Ionicons name="close" size={28} color={COLORS.textPrimary} />
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
                    <Text style={[styles.regionButtonText, active && { fontWeight: '900' }]}>{reg}</Text>
                    {active ? <View style={styles.regionCheck}><Ionicons name="checkmark" size={18} color="#FFF" /></View> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={modalCrear} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={styles.modalCard}>
            <BottomSheetHandle />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTituloGrande}>Armar un Panorama</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalCrear(false)}>
                <Ionicons name="close" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputLabelRow}>
              <SoftIcon name="sparkles" color="#8B5CF6" bg={COLORS.softPurple} size={42} rounded={12} iconSize={22} />
              <Text style={styles.label}>¿Qué van a hacer?</Text>
            </View>
            <CahuinTextField icon="sparkles-outline" placeholder="Ej: Juntarse a tomar unas chelas" value={nuevoPano.titulo} onChangeText={(t) => setNuevoPano({ ...nuevoPano, titulo: t })} />

            <View style={styles.inputLabelRow}>
              <SoftIcon name="location" color="#72B84A" bg={COLORS.softGreen} size={42} rounded={12} iconSize={22} />
              <Text style={styles.label}>¿Dónde es?</Text>
            </View>
            <CahuinTextField icon="location-outline" placeholder="Ej: Bar X, Centro" value={nuevoPano.lugar} onChangeText={(l) => setNuevoPano({ ...nuevoPano, lugar: l })} />

            <View style={styles.dateRow}>
              <TouchableOpacity style={styles.dateBox} onPress={() => setShowDatePicker(true)}>
                <SoftIcon name="calendar" color="#FF6B45" bg={COLORS.softRed} size={42} rounded={12} iconSize={22} />
                <View>
                  <Text style={styles.dateLabel}>Fecha</Text>
                  <Text style={styles.dateValue}>{nuevoPano.fecha.toLocaleDateString()}</Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateBox} onPress={() => setShowTimePicker(true)}>
                <SoftIcon name="time" color="#4F6FEA" bg="#EEF2FF" size={42} rounded={12} iconSize={22} />
                <View>
                  <Text style={styles.dateLabel}>Hora</Text>
                  <Text style={styles.dateValue}>{nuevoPano.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </View>

            {showDatePicker ? <DateTimePicker value={nuevoPano.fecha} mode="date" display="default" minimumDate={new Date()} onChange={onChangeFecha} /> : null}
            {showTimePicker ? <DateTimePicker value={nuevoPano.fecha} mode="time" display="default" onChange={onChangeHora} /> : null}

            <GradientButton icon="sparkles" style={{ marginTop: 26 }} onPress={handleCrearPanorama}>
              Publicar Panorama
            </GradientButton>
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

const getStyles = (COLORS) => StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[5],
    gap: SPACING[3],
    flexWrap: 'wrap',
  },
  regionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 160 },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    fontFamily: FONTS.display,
    letterSpacing: 0,
    flexShrink: 1,
  },
  darkPill: {
    backgroundColor: '#182033',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...SHADOWS.light,
  },
  darkPillText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  featuredCard: { marginBottom: SPACING[4], padding: SPACING[4] },
  featuredTop: { flexDirection: 'row', gap: SPACING[4] },
  featuredImage: { width: 138, height: 138, borderRadius: 22, backgroundColor: COLORS.softRed },
  featuredTitle: { color: COLORS.textPrimary, fontSize: 23, lineHeight: 28, fontWeight: '900', fontFamily: FONTS.display },
  featuredDesc: { color: COLORS.textMuted, fontSize: 16, lineHeight: 22, marginTop: 8 },
  featuredMeta: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', flex: 1 },
  inviteBox: {
    marginTop: SPACING[4],
    padding: SPACING[4],
    borderRadius: 22,
    backgroundColor: COLORS.softRed,
    borderWidth: 1,
    borderColor: 'rgba(240,68,79,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  inviteTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900' },
  inviteText: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20, marginTop: 3 },
  inviteButton: { width: 108, borderRadius: 20 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING[4], marginBottom: SPACING[3], padding: SPACING[3] },
  eventThumb: { width: 82, height: 82, borderRadius: 18, backgroundColor: COLORS.softRed },
  eventTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '900', fontFamily: FONTS.display },
  eventDesc: { color: COLORS.textMuted, fontSize: 15, marginTop: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9, flexShrink: 1 },
  eventMeta: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700', flex: 1 },
  groupHint: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  groupHintText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  chevronCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(240,68,79,0.18)' },
  communityCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING[3], marginBottom: SPACING[3] },
  joinButton: { borderRadius: 99, borderWidth: 1, borderColor: COLORS.primario, paddingHorizontal: 14, paddingVertical: 10 },
  joinButtonText: { color: COLORS.primario, fontWeight: '900', fontSize: 13 },
  modalFondo: { flex: 1, backgroundColor: 'rgba(17,24,39,0.58)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 34, borderTopRightRadius: 34, padding: 24, maxHeight: '88%' },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalTitulo: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '900', fontFamily: FONTS.display },
  modalTituloGrande: { color: COLORS.textPrimary, fontSize: 30, fontWeight: '900', fontFamily: FONTS.display, flex: 1 },
  closeButton: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  modalSub: { color: COLORS.textMuted, fontSize: 16, lineHeight: 23, marginBottom: SPACING[5] },
  modalSubSmall: { color: COLORS.textMuted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING[3] },
  detailText: { color: COLORS.textPrimary, flex: 1, fontSize: 16, lineHeight: 22, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: SPACING[3], marginTop: SPACING[5] },
  secondaryAction: { flex: 1, minHeight: 56, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: COLORS.fondo },
  secondaryActionText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '900' },
  primaryAction: { flex: 1 },
  emptyInvite: { borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[5], backgroundColor: COLORS.fondo },
  emptyInviteTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900', marginBottom: 6 },
  emptyInviteText: { color: COLORS.textMuted, fontSize: 15, lineHeight: 22 },
  matchInviteRow: { minHeight: 72, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[3], marginBottom: SPACING[3], flexDirection: 'row', alignItems: 'center', gap: SPACING[3], backgroundColor: COLORS.fondo },
  matchAvatar: { width: 48, height: 48, borderRadius: 18, backgroundColor: COLORS.softRed },
  matchName: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '900' },
  matchHint: { color: COLORS.textMuted, fontSize: 13, marginTop: 3 },
  regionButton: { minHeight: 64, borderRadius: 17, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING[4], alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING[3] },
  regionButtonActive: { backgroundColor: COLORS.softRed, borderColor: COLORS.primario },
  regionButtonText: { color: COLORS.textPrimary, fontSize: 18 },
  regionCheck: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: SPACING[4], marginBottom: SPACING[2] },
  label: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '900' },
  input: { minHeight: 64, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING[4], color: COLORS.textPrimary, fontSize: 16, backgroundColor: COLORS.tarjeta },
  dateRow: { flexDirection: 'row', gap: SPACING[3], marginTop: SPACING[5] },
  dateBox: { flex: 1, minHeight: 76, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[3], flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateLabel: { color: COLORS.textMuted, fontSize: 14 },
  dateValue: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '900', marginTop: 2 },
});


