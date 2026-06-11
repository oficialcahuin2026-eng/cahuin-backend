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
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/api';
import { BottomSheetHandle, ScreenHeader, ScreenScaffold, SoftCard, SoftIcon } from '../components/CahuinUI';
import CahuinModal from '../components/CahuinModal';
import { FONTS, SPACING } from '../utils/theme';

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

export default function AjustesScreen({ navigation }) {
  const { usuario, actualizarUsuario, logout } = useAuth();
  const { isDarkMode, toggleTheme, COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const [modalViaje, setModalViaje] = useState(false);
  const [guardandoViaje, setGuardandoViaje] = useState(false);
  const [stepViaje, setStepViaje] = useState(1);
  const [regionSeleccionada, setRegionSeleccionada] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [modalInfo, setModalInfo] = useState(null);

  const avisar = (title, message, extra = {}) => setModalInfo({ title, message, ...extra });

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

  const abrirLegales = () => Linking.openURL('https://docs.google.com/document/d/e/2PACX-1vSFQabcCjiYmKv-KMq4qfRtG8YYxdLRdaDuhm9EPQaMWlXmrOSvtCH3fyCPxC2W_c4Wao9TiM3QGGp1/pub');

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
      Alert.alert('Listo', ciudad === '' ? 'Volviste a casa.' : `Ahora el radar te mostrará gente de ${ciudad}.`);
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
    <ScreenScaffold COLORS={COLORS}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={30} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <ScreenHeader title="Ajustes" centered />
        <View style={{ width: 54 }} />
      </View>

      <SettingsSection COLORS={COLORS} title="VISIBILIDAD Y UBICACIÓN" icon="eye" color="#8B5CF6">
        <SettingsRow
          COLORS={COLORS}
          icon="airplane"
          iconColor="#8B5CF6"
          bg={COLORS.softPurple}
          title="Modo Viajero"
          subtitle={usuario?.viaje?.ciudadDestino ? `Viajando a: ${usuario.viaje.ciudadDestino}` : 'Teletranspórtate a otra ciudad'}
          onPress={() => { setStepViaje(1); setModalViaje(true); }}
        />
        <Divider COLORS={COLORS} />
        <SettingsRow
          COLORS={COLORS}
          icon="pause"
          iconColor="#F59E0B"
          bg={COLORS.softAmber}
          title="Pausar mi cuenta"
          subtitle="Oculta tu perfil del radar"
          control={<Switch value={usuario?.cuentaPausada || false} onValueChange={togglePausaCuenta} trackColor={{ true: '#F59E0B', false: '#D0D5DD' }} thumbColor="#FFF" />}
        />
      </SettingsSection>

      <SettingsSection COLORS={COLORS} title="BIENESTAR Y APARIENCIA" icon="leaf" color="#34A853">
        <SettingsRow
          COLORS={COLORS}
          icon={isDarkMode ? 'moon' : 'sunny'}
          iconColor="#8B5CF6"
          bg={COLORS.softPurple}
          title="Modo Oscuro"
          control={<Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ true: COLORS.primario, false: '#D0D5DD' }} thumbColor="#FFF" />}
        />
        <Divider COLORS={COLORS} />
        <SettingsRow
          COLORS={COLORS}
          icon="leaf"
          iconColor="#34A853"
          bg={COLORS.softGreen}
          title='Modo "Recuperándome" 🌱'
          subtitle="Limita tu app a 10 perfiles diarios"
          control={<Switch value={usuario?.modoRecuperacion || false} onValueChange={toggleModoRecuperacion} trackColor={{ true: '#34A853', false: '#D0D5DD' }} thumbColor="#FFF" />}
        />
      </SettingsSection>

      <SettingsSection COLORS={COLORS} title="ACTIVIDAD Y PREMIUM" icon="analytics" color="#8B5CF6">
        <SettingsRow
          COLORS={COLORS}
          icon="analytics"
          iconColor="#8B5CF6"
          bg={COLORS.softPurple}
          title="Analytics de perfil"
          subtitle={`${analytics?.vistasSemana || 0} vistas esta semana · foto top ${analytics?.segundosFotoTop || 0}s`}
          onPress={() => navigation.navigate('Premium')}
        />
        <Divider COLORS={COLORS} />
        <SettingsRow
          COLORS={COLORS}
          icon="flame"
          iconColor="#F0444F"
          bg={COLORS.softRed}
          title="Racha diaria de swipes"
          subtitle={`${usuario?.rachaSwipesDias || 0} días · ${usuario?.boostGratisDisponibles || 0} boosts gratis`}
          control={(
            <TouchableOpacity style={styles.miniPill} onPress={salvarRachaSwipes}>
              <Text style={styles.miniPillText}>Salvar 1</Text>
            </TouchableOpacity>
          )}
        />
      </SettingsSection>

      <SettingsSection COLORS={COLORS} title="LEGAL Y SOPORTE" icon="shield-checkmark" color="#8B5CF6">
        <SettingsRow COLORS={COLORS} icon="document-text" iconColor="#8B5CF6" bg={COLORS.softPurple} title="Términos y Condiciones" onPress={abrirLegales} />
        <Divider COLORS={COLORS} />
        <SettingsRow COLORS={COLORS} icon="lock-closed" iconColor="#8B5CF6" bg={COLORS.softPurple} title="Políticas de Privacidad" onPress={abrirLegales} />
      </SettingsSection>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={24} color={COLORS.textPrimary} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={eliminarCuenta}>
        <Ionicons name="trash-outline" size={24} color={COLORS.primario} />
        <Text style={styles.deleteText}>Eliminar Cuenta</Text>
      </TouchableOpacity>

      <Modal visible={modalViaje} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={styles.modalCard}>
            <BottomSheetHandle />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleLeft}>
                <SoftIcon name="airplane" color="#8B5CF6" bg={COLORS.softPurple} size={54} rounded={18} />
                <View>
                  <Text style={styles.modalTitle}>Modo Viajero</Text>
                  <Text style={styles.modalSub}>{stepViaje === 1 ? '¿A qué región viajas?' : `¿A qué ciudad de ${regionSeleccionada} vas?`}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalViaje(false)}>
                <Ionicons name="close" size={26} color={COLORS.textPrimary} />
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
                      <Ionicons name="chevron-forward" size={20} color={COLORS.gris} />
                    </TouchableOpacity>
                  ))
                ) : (
                  <>
                    <TouchableOpacity style={styles.backRegion} onPress={() => setStepViaje(1)}>
                      <Ionicons name="arrow-back" size={20} color={COLORS.primario} />
                      <Text style={styles.backRegionText}>Volver a regiones</Text>
                    </TouchableOpacity>
                    {REGIONES_CHILE[regionSeleccionada]?.map((ciudad) => (
                      <TouchableOpacity key={ciudad} style={styles.regionButton} onPress={() => guardarViaje(ciudad)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
    </ScreenScaffold>
  );
}

function SettingsSection({ COLORS, title, icon, color, children }) {
  return (
    <SoftCard COLORS={COLORS} style={{ marginBottom: SPACING[5], padding: SPACING[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING[3] }}>
        <SoftIcon name={icon} color={color} bg={color === '#34A853' ? COLORS.softGreen : COLORS.softPurple} size={44} rounded={22} iconSize={22} />
        <Text style={{ color, fontSize: 16, fontWeight: '900', letterSpacing: 0.2 }}>{title}</Text>
      </View>
      {children}
    </SoftCard>
  );
}

function SettingsRow({ COLORS, icon, iconColor, bg, title, subtitle, control, onPress }) {
  const Content = onPress ? TouchableOpacity : View;
  return (
    <Content style={rowStyles.row} onPress={onPress} activeOpacity={0.86}>
      <View style={rowStyles.left}>
        <SoftIcon name={icon} color={iconColor} bg={bg} size={58} rounded={16} iconSize={28} />
        <View style={{ flex: 1 }}>
          <Text style={[rowStyles.title, { color: COLORS.textPrimary }]}>{title}</Text>
          {subtitle ? <Text style={[rowStyles.subtitle, { color: COLORS.textMuted }]}>{subtitle}</Text> : null}
        </View>
      </View>
      {control || <Ionicons name="chevron-forward" size={24} color={COLORS.gris} />}
    </Content>
  );
}

function Divider({ COLORS }) {
  return <View style={{ height: 1, backgroundColor: COLORS.border, marginLeft: 72, marginVertical: 12 }} />;
}

const rowStyles = StyleSheet.create({
  row: { minHeight: 82, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { fontSize: 20, fontWeight: '900' },
  subtitle: { fontSize: 15, lineHeight: 21, marginTop: 3 },
});

const getStyles = (COLORS) => StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING[4] },
  backButton: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  logoutButton: { minHeight: 66, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.tarjeta, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: SPACING[4] },
  logoutText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900' },
  deleteButton: { minHeight: 72, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.primario, backgroundColor: COLORS.softRed, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: SPACING[8] },
  deleteText: { color: COLORS.primario, fontSize: 18, fontWeight: '900' },
  miniPill: { minHeight: 38, borderRadius: 19, backgroundColor: COLORS.softRed, borderWidth: 1, borderColor: COLORS.primario, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  miniPillText: { color: COLORS.primario, fontSize: 12, fontWeight: '900' },
  modalFondo: { flex: 1, backgroundColor: 'rgba(17,24,39,0.58)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 34, borderTopRightRadius: 34, padding: 24, height: '86%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING[4] },
  modalTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '900', fontFamily: FONTS.display },
  modalSub: { color: COLORS.textMuted, fontSize: 15, marginTop: 3 },
  closeButton: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  regionButton: { minHeight: 62, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING[4], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING[3] },
  regionText: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' },
  backRegion: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING[3] },
  backRegionText: { color: COLORS.primario, fontWeight: '900' },
  turnOffTravel: { marginTop: 18, alignItems: 'center', padding: 16, backgroundColor: COLORS.softRed, borderRadius: 18 },
  turnOffTravelText: { color: COLORS.primario, fontWeight: '900' },
});

