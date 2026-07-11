import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/api';
import { BottomSheetHandle, ScreenHeader, SoftIcon } from '../components/CahuinUI';
import CahuinModal from '../components/CahuinModal';
import { FONTS, SPACING, SHADOWS } from '../utils/theme';

const REGIONES_CHILE = {
  'Arica y Parinacota': ['Arica', 'Putre', 'Camarones', 'General Lagos'],
  Tarapacá: ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Pica', 'Huara'],
  Antofagasta: ['Antofagasta', 'Calama', 'Tocopilla', 'San Pedro de Atacama', 'Mejillones'],
  Atacama: ['Copiapó', 'Vallenar', 'Caldera', 'Chañaral', 'Huasco'],
  Coquimbo: ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel', 'Vicuña'],
  Valparaíso: ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'San Antonio'],
  Metropolitana: ['Santiago Centro', 'Providencia', 'Maipú', 'Puente Alto', 'La Florida', 'Ñuñoa'],
  "O'Higgins": ['Rancagua', 'San Fernando', 'Pichilemu', 'Santa Cruz', 'Machalí'],
  Maule: ['Talca', 'Curicó', 'Linares', 'Cauquenes', 'Constitución'],
  Ñuble: ['Chillán', 'San Carlos', 'Bulnes', 'Quirihue', 'Coihueco'],
  'Bío Bío': ['Concepción', 'Talcahuano', 'Los Ángeles', 'San Pedro de la Paz', 'Coronel'],
  Araucanía: ['Temuco', 'Villarrica', 'Pucón', 'Angol', 'Victoria', 'Padre Las Casas'],
  'Los Ríos': ['Valdivia', 'La Unión', 'Panguipulli', 'Río Bueno', 'Futrono'],
  'Los Lagos': ['Puerto Montt', 'Osorno', 'Castro', 'Puerto Varas', 'Ancud'],
  Aysén: ['Coyhaique', 'Puerto Aysén', 'Chile Chico', 'Cochrane'],
  Magallanes: ['Punta Arenas', 'Puerto Natales', 'Porvenir', 'Cabo de Hornos'],
};

const INSTAGRAM_URL = 'https://www.instagram.com/cahuinapp?igsh=NjZyaGxoYTRhdDUw';
const TIKTOK_URL = 'https://www.tiktok.com/@cahuinapp?_r=1&_t=ZS-978PynTyi4G';

export default function AjustesScreen({ navigation }) {
  const { usuario, actualizarUsuario, logout } = useAuth();
  const { isDarkMode, toggleTheme, COLORS } = useTheme();
  const styles = getStyles(COLORS, isDarkMode);

  const [modalViaje, setModalViaje] = useState(false);
  const [guardandoViaje, setGuardandoViaje] = useState(false);
  const [stepViaje, setStepViaje] = useState(1);
  const [regionSeleccionada, setRegionSeleccionada] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [modalInfo, setModalInfo] = useState(null);

  const avisar = (title, message, extra = {}) => setModalInfo({ title, message, ...extra });

  const abrirRedSocial = async (url) => {
    try {
      await Linking.openURL(url);
    } catch {
      avisar('Redes Cahuín', 'No pudimos abrir la red social. Intenta de nuevo en un momento.', {
        emoji: '✨',
        tone: 'danger',
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      const cargarAnalytics = async () => {
        try {
          const data = await userService.getAnalyticsPerfil();
          setAnalytics(data.analytics || null);
        } catch (error) {
          setAnalytics(null);
        }
      };
      cargarAnalytics();
    }, [])
  );

  const URL_TERMINOS = 'https://docs.google.com/document/d/e/2PACX-1vSFQabcCjiYmKv-KMq4qfRtG8YYxdLRdaDuhm9EPQaMWlXmrOSvtCH3fyCPxC2W_c4Wao9TiM3QGGp1/pub';
  const URL_PRIVACIDAD = 'https://docs.google.com/document/d/e/2PACX-1vQ7Giqj7fQCXdZZzoRzJGyJ5Mnm6u08QjBF0s75aXasShi8HIKYUGvou284w6e-HA1FAd9nQzf_Jh56/pub';
  const URL_SEGURIDAD = 'https://docs.google.com/document/d/e/2PACX-1vT5rQjbC-H5ScVkXZuDLNCvYiS9r0hSPZRueBGNLlIgx6g9iMGtbonLn_z7wuuYs4w19uCSPHch8-ty/pub';
  const URL_ELIMINACION = 'https://docs.google.com/document/d/e/2PACX-1vRtQDGTp0WaWHdkE6_XJ2LWGs86HfGaFWtHxvkXxxHTE02m05lE8cCZB9qOyX1fWUzXun30y-Kp2Hna/pub';

  const abrirDocumento = (url) => Linking.openURL(url);

  const toggleModoRecuperacion = async () => {
    const nuevoEstado = !usuario?.modoRecuperacion;
    try {
      const res = await userService.actualizar({ modoRecuperacion: nuevoEstado, swipesHoy: 0 });
      actualizarUsuario(res.usuario);
      if (nuevoEstado) avisar('Modo Recuperándome', 'Límite de 10 perfiles diarios activado.', { emoji: '🌱', accent: '#34A853' });
    } catch {
      avisar('Error', 'No se pudo cambiar.', { emoji: '🌶️', tone: 'danger' });
    }
  };

  const togglePausaCuenta = async () => {
    const accion = usuario?.cuentaPausada ? 'Reactivar' : 'Pausar';
    avisar(`${accion} cuenta`, '¿Seguro que quieres hacer esto?', {
      emoji: usuario?.cuentaPausada ? '▶️' : '⏸️',
      accent: usuario?.cuentaPausada ? '#34A853' : '#F59E0B',
      actions: [
        { label: 'Cancelar', variant: 'secondary', color: '#F59E0B', onPress: () => setModalInfo(null) },
        {
          label: accion,
          color: usuario?.cuentaPausada ? '#34A853' : '#F59E0B',
          onPress: async () => {
            setModalInfo(null);
            try {
              const res = await userService.togglePausaCuenta();
              actualizarUsuario(res.usuario);
            } catch {
              avisar('Error', 'Falló la conexión.', { emoji: '🌶️', tone: 'danger' });
            }
          },
        },
      ],
    });
  };

  const salvarRachaSwipes = async () => {
    try {
      const data = await userService.continuarRachaSwipes();
      if (data.usuario) actualizarUsuario(data.usuario);
      avisar('Racha salvada', data.message || 'Haz un swipe hoy para mantenerla.', { emoji: '🔥', accent: COLORS.primario });
    } catch (error) {
      avisar('Racha', error.message || 'No pudimos salvar la racha.', { emoji: '🔥', tone: 'danger' });
    }
  };

  const guardarViaje = async (ciudad) => {
    setGuardandoViaje(true);
    try {
      const datosViaje = ciudad === ''
        ? { ciudadDestino: '', fechaInicio: null, fechaFin: null }
        : { ciudadDestino: ciudad, fechaInicio: new Date(), fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) };

      const res = await userService.actualizar({ viaje: datosViaje });
      actualizarUsuario(res.usuario);
      setModalViaje(false);
      setStepViaje(1);
      avisar('Listo', ciudad === '' ? 'Volviste a casa.' : `Ahora el radar te mostrará gente de ${ciudad}.`, { emoji: '✈️', accent: COLORS.primario });
    } catch {
      avisar('Error', 'No pudimos procesar el viaje.', { emoji: '🧭', tone: 'danger' });
    } finally {
      setGuardandoViaje(false);
    }
  };

  const eliminarCuenta = () => {
    avisar('Eliminar cuenta', 'Esta acción borrará tus matches, mensajes y fotos para siempre. ¿Estás seguro?', {
      emoji: '🗑️',
      tone: 'danger',
      actions: [
        { label: 'Cancelar', variant: 'secondary', color: COLORS.primario, onPress: () => setModalInfo(null) },
        {
          label: 'Eliminar',
          color: '#F0444F',
          onPress: () => {
            setModalInfo(null);
            avisar('Cahuín', 'Para eliminar tu cuenta, escribe a soporte@cahuin.cl desde tu correo registrado.', {
              emoji: '📩',
              accent: COLORS.primario,
            });
          },
        },
      ],
    });
  };

  return (
    <View style={styles.safe}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajustes</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Cahuín Oficial - Glass Premium Card */}
          <View style={styles.socialCardWrap}>
            <LinearGradient colors={isDarkMode ? ['rgba(240,68,79,0.15)', 'rgba(139,92,246,0.1)'] : ['#FFF0F1', '#F4ECFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.socialCard}>
              <View style={styles.socialHeader}>
                <View style={styles.socialIconWrap}>
                  <Ionicons name="sparkles" size={24} color={COLORS.primario} />
                </View>
                <View style={styles.socialCopy}>
                  <Text style={styles.socialTitle}>Cahuín oficial</Text>
                  <Text style={styles.socialSubtitle}>Novedades, eventos y comunidad.</Text>
                </View>
              </View>
              <View style={styles.socialActions}>
                <TouchableOpacity activeOpacity={0.88} style={[styles.socialButton, styles.instagramButton]} onPress={() => abrirRedSocial(INSTAGRAM_URL)}>
                  <Ionicons name="logo-instagram" size={20} color="#FFF" />
                  <Text style={styles.socialButtonText}>Instagram</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.88} style={[styles.socialButton, styles.tiktokButton]} onPress={() => abrirRedSocial(TIKTOK_URL)}>
                  <Ionicons name="musical-notes" size={20} color={isDarkMode ? '#FFF' : '#000'} />
                  <Text style={[styles.socialButtonText, { color: isDarkMode ? '#FFF' : '#000' }]}>TikTok</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          <SettingsSection title="VISIBILIDAD Y UBICACIÓN" COLORS={COLORS} isDarkMode={isDarkMode}>
            <SettingsRow
              COLORS={COLORS} isDarkMode={isDarkMode}
              icon="airplane"
              iconColor="#8B5CF6"
              bg={isDarkMode ? "rgba(139,92,246,0.15)" : "#F4ECFF"}
              title="Modo Viajero"
              subtitle={usuario?.viaje?.ciudadDestino ? `Viajando a: ${usuario.viaje.ciudadDestino}` : 'Teletranspórtate a otra ciudad'}
              onPress={() => {
                const plan = usuario?.premiumPlan || 'free';
                const isAFondo = plan === 'a_fondo' || plan === 'gold' || plan === 'platinum';
                if (!isAFondo) {
                  avisar('Modo Viajero', 'Teletranspórtate a cualquier ciudad. Exclusivo del plan Cahuín A Fondo.', {
                    emoji: '✈️',
                    tone: 'premium',
                    actions: [
                      { label: 'Ver Planes', color: COLORS.primario, onPress: () => { setModalInfo(null); navigation.navigate('Premium'); } }
                    ]
                  });
                  return;
                }
                setStepViaje(1); setModalViaje(true); 
              }}
            />
            <SettingsRow
              COLORS={COLORS} isDarkMode={isDarkMode}
              icon="pause"
              iconColor="#F59E0B"
              bg={isDarkMode ? "rgba(245,158,11,0.15)" : "#FEF3C7"}
              title="Pausar mi cuenta"
              subtitle="Oculta tu perfil del radar"
              control={<Switch value={usuario?.cuentaPausada || false} onValueChange={togglePausaCuenta} trackColor={{ true: '#F59E0B', false: COLORS.border }} thumbColor="#FFF" />}
              isLast
            />
          </SettingsSection>

          <SettingsSection title="BIENESTAR Y APARIENCIA" COLORS={COLORS} isDarkMode={isDarkMode}>
            <SettingsRow
              COLORS={COLORS} isDarkMode={isDarkMode}
              icon={isDarkMode ? 'moon' : 'sunny'}
              iconColor="#38BDF8"
              bg={isDarkMode ? "rgba(56,189,248,0.15)" : "#E0F2FE"}
              title="Modo Oscuro"
              control={<Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ true: COLORS.primario, false: COLORS.border }} thumbColor="#FFF" />}
            />
            <SettingsRow
              COLORS={COLORS} isDarkMode={isDarkMode}
              icon="leaf"
              iconColor="#34A853"
              bg={isDarkMode ? "rgba(52,168,83,0.15)" : "#DCFCE7"}
              title='Modo "Recuperándome"'
              subtitle="Limita tu app a 10 perfiles diarios"
              control={<Switch value={usuario?.modoRecuperacion || false} onValueChange={toggleModoRecuperacion} trackColor={{ true: '#34A853', false: COLORS.border }} thumbColor="#FFF" />}
              isLast
            />
          </SettingsSection>

          <SettingsSection title="ACTIVIDAD Y PREMIUM" COLORS={COLORS} isDarkMode={isDarkMode}>
            <SettingsRow
              COLORS={COLORS} isDarkMode={isDarkMode}
              icon="analytics"
              iconColor="#F472B6"
              bg={isDarkMode ? "rgba(244,114,182,0.15)" : "#FCE7F3"}
              title="Analytics de perfil"
              subtitle={`${analytics?.vistasSemana || 0} vistas esta semana · foto top ${analytics?.segundosFotoTop || 0}s`}
              onPress={() => navigation.navigate('Premium')}
            />
            <SettingsRow
              COLORS={COLORS} isDarkMode={isDarkMode}
              icon="flame"
              iconColor="#F0444F"
              bg={isDarkMode ? "rgba(240,68,79,0.15)" : "#FFE4E6"}
              title="Racha diaria de swipes"
              subtitle={`${usuario?.rachaSwipesDias || 0} días · ${usuario?.boostGratisDisponibles || 0} boosts gratis`}
              control={(
                <TouchableOpacity style={styles.miniPill} onPress={salvarRachaSwipes}>
                  <Text style={styles.miniPillText}>Salvar 1</Text>
                </TouchableOpacity>
              )}
              isLast
            />
          </SettingsSection>

          <SettingsSection title="LEGAL Y SEGURIDAD" COLORS={COLORS} isDarkMode={isDarkMode}>
            <SettingsRow COLORS={COLORS} isDarkMode={isDarkMode} icon="document-text" iconColor="#9CA3AF" bg={isDarkMode ? "rgba(156,163,175,0.15)" : "#F3F4F6"} title="Términos y Condiciones" onPress={() => abrirDocumento(URL_TERMINOS)} />
            <SettingsRow COLORS={COLORS} isDarkMode={isDarkMode} icon="lock-closed" iconColor="#9CA3AF" bg={isDarkMode ? "rgba(156,163,175,0.15)" : "#F3F4F6"} title="Política de Privacidad" onPress={() => abrirDocumento(URL_PRIVACIDAD)} />
            <SettingsRow COLORS={COLORS} isDarkMode={isDarkMode} icon="shield-checkmark" iconColor="#9CA3AF" bg={isDarkMode ? "rgba(156,163,175,0.15)" : "#F3F4F6"} title="Estándares de Seguridad Infantil" onPress={() => abrirDocumento(URL_SEGURIDAD)} />
            <SettingsRow COLORS={COLORS} isDarkMode={isDarkMode} icon="trash-bin" iconColor="#9CA3AF" bg={isDarkMode ? "rgba(156,163,175,0.15)" : "#F3F4F6"} title="Eliminación de cuenta y datos" onPress={() => abrirDocumento(URL_ELIMINACION)} isLast />
          </SettingsSection>

          <View style={styles.dangerZone}>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.textPrimary} />
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={eliminarCuenta}>
              <Ionicons name="trash-outline" size={20} color="#FF5252" />
              <Text style={styles.deleteText}>Eliminar Cuenta</Text>
            </TouchableOpacity>
          </View>
          
        </ScrollView>

        <Modal visible={modalViaje} animationType="slide" transparent>
          <View style={styles.modalFondo}>
            <View style={styles.modalCard}>
              <BottomSheetHandle />
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleLeft}>
                  <View style={[styles.socialIconWrap, { backgroundColor: isDarkMode ? 'rgba(139,92,246,0.15)' : '#F4ECFF' }]}>
                    <Ionicons name="airplane" size={24} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Modo Viajero</Text>
                    <Text style={styles.modalSub}>{stepViaje === 1 ? '¿A qué región viajas?' : `¿A qué ciudad de ${regionSeleccionada} vas?`}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalViaje(false)}>
                  <Ionicons name="close" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              {guardandoViaje ? (
                <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 50 }} />
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {stepViaje === 1 ? (
                    Object.keys(REGIONES_CHILE).map((reg) => (
                      <TouchableOpacity key={reg} style={styles.regionButton} onPress={() => { setRegionSeleccionada(reg); setStepViaje(2); }}>
                        <Text style={styles.regionText}>{reg}</Text>
                        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <>
                      <TouchableOpacity style={styles.backRegion} onPress={() => setStepViaje(1)}>
                        <Ionicons name="arrow-back" size={18} color={COLORS.primario} />
                        <Text style={styles.backRegionText}>Volver a regiones</Text>
                      </TouchableOpacity>
                      {REGIONES_CHILE[regionSeleccionada]?.map((ciudad) => (
                        <TouchableOpacity key={ciudad} style={styles.regionButton} onPress={() => guardarViaje(ciudad)}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Ionicons name="location" size={18} color={COLORS.primario} />
                            <Text style={styles.regionText}>{ciudad}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </ScrollView>
              )}

              {usuario?.viaje?.ciudadDestino && !guardandoViaje && stepViaje === 1 ? (
                <TouchableOpacity style={styles.turnOffTravel} onPress={() => guardarViaje('')}>
                  <Text style={styles.turnOffTravelText}>Apagar Modo Viajero</Text>
                </TouchableOpacity>
              ) : null}
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
      </SafeAreaView>
    </View>
  );
}

// ── Componentes Internos ──

function SettingsSection({ title, children, COLORS, isDarkMode }) {
  const rowStyles = getRowStyles(COLORS, isDarkMode);
  return (
    <View style={rowStyles.sectionWrap}>
      <Text style={rowStyles.sectionTitle}>{title}</Text>
      <View style={rowStyles.sectionCard}>
        {children}
      </View>
    </View>
  );
}

function SettingsRow({ icon, iconColor, bg, title, subtitle, control, onPress, isLast, COLORS, isDarkMode }) {
  const rowStyles = getRowStyles(COLORS, isDarkMode);
  const Content = onPress ? TouchableOpacity : View;
  return (
    <Content style={[rowStyles.row, !isLast && rowStyles.borderBottom]} onPress={onPress} activeOpacity={0.86}>
      <View style={rowStyles.left}>
        <View style={[rowStyles.iconWrap, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rowStyles.title}>{title}</Text>
          {subtitle ? <Text style={rowStyles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {control || <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />}
    </Content>
  );
}

const getRowStyles = (COLORS, isDarkMode) => StyleSheet.create({
  sectionWrap: { marginBottom: 28 },
  sectionTitle: { color: COLORS.textMuted, fontSize: 13, fontWeight: '800', letterSpacing: 0.8, marginLeft: 16, marginBottom: 8 },
  sectionCard: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : COLORS.tarjeta, borderRadius: 20, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : COLORS.border, overflow: 'hidden', ...(isDarkMode ? {} : SHADOWS.light) },
  row: { minHeight: 74, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.border },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
});

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '900', fontFamily: FONTS.display },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 60 },
  
  // ── Tarjeta Social ──
  socialCardWrap: { borderRadius: 24, overflow: 'hidden', marginBottom: 30, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : COLORS.border, ...(isDarkMode ? {} : SHADOWS.light) },
  socialCard: { padding: 20 },
  socialHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  socialIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(240,68,79,0.2)', alignItems: 'center', justifyContent: 'center' },
  socialCopy: { flex: 1 },
  socialTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '900', fontFamily: FONTS.display },
  socialSubtitle: { color: COLORS.textMuted, fontSize: 14, marginTop: 2 },
  socialActions: { flexDirection: 'row', gap: 10 },
  socialButton: { flex: 1, height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  instagramButton: { backgroundColor: '#E1306C' },
  tiktokButton: { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.4)' : '#F3F4F6', borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : COLORS.border },
  socialButtonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  
  // ── Botones Peligro ──
  dangerZone: { marginTop: 10, gap: 12 },
  logoutButton: { height: 56, borderRadius: 18, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.tarjeta, borderWidth: isDarkMode ? 0 : 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...(isDarkMode ? {} : SHADOWS.light) },
  logoutText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  deleteButton: { height: 56, borderRadius: 18, backgroundColor: 'rgba(255,82,82,0.1)', borderWidth: 1, borderColor: 'rgba(255,82,82,0.2)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  deleteText: { color: '#FF5252', fontSize: 16, fontWeight: '800' },
  
  // ── Extra components ──
  miniPill: { height: 32, borderRadius: 16, backgroundColor: 'rgba(240,68,79,0.15)', borderWidth: 1, borderColor: 'rgba(240,68,79,0.3)', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  miniPillText: { color: COLORS.primario, fontSize: 12, fontWeight: '800' },
  
  // ── Modales ──
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', fontFamily: FONTS.display },
  modalSub: { color: COLORS.textMuted, fontSize: 14, marginTop: 2 },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : COLORS.fondo },
  regionButton: { height: 60, borderRadius: 16, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : COLORS.fondo, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  regionText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  backRegion: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingLeft: 6 },
  backRegionText: { color: COLORS.primario, fontWeight: '800' },
  turnOffTravel: { marginTop: 18, alignItems: 'center', padding: 16, backgroundColor: 'rgba(240,68,79,0.15)', borderRadius: 16 },
  turnOffTravelText: { color: COLORS.primario, fontWeight: '800' },
});
