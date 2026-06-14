import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppNavigator from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { matchService, panoramaService, paymentService, socialService, userService } from '../services/api';
import { PLANES_CAHUIN } from '../config/economia';
import CahuinLogo from '../components/CahuinLogo';

const DEVICE_KEY = '@cahuin_web_device';
const PERFIL_DEMO = {
  nombre: 'Valeria',
  edad: 24,
  ciudad: 'Santiago',
  foto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200',
  bio: 'Amante de los gatos y el sushi',
  tags: ['La artista', 'Diseñadora', 'UAndes'],
};

export default function WebShell() {
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(DEVICE_KEY).then((saved) => {
      setDevice(saved);
      setLoading(false);
    });
  }, []);

  const chooseDevice = async (nextDevice) => {
    await AsyncStorage.setItem(DEVICE_KEY, nextDevice);
    setDevice(nextDevice);
  };

  return (
    <>
      {Platform.OS === 'web' && (
        <style type="text/css">{`
          @font-face {
            font-family: 'Ionicons';
            src: url('https://unpkg.com/ionicons@4.5.2/dist/fonts/ionicons.ttf') format('truetype');
          }
          @font-face {
            font-family: 'MaterialCommunityIcons';
            src: url('https://cdn.jsdelivr.net/npm/@mdi/font@5.9.55/fonts/materialdesignicons-webfont.ttf') format('truetype');
          }
        `}</style>
      )}
      {loading ? <FullLoader /> : (!device ? <DeviceChooser onChoose={chooseDevice} /> : (device === 'mobile' ? <MobileWebApp onChangeDevice={() => setDevice(null)} /> : <DesktopWebApp onChangeDevice={() => setDevice(null)} />))}
    </>
  );
}

function FullLoader() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#F0444F" />
    </View>
  );
}

function DeviceChooser({ onChoose }) {
  const { COLORS, isDarkMode } = useTheme();

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient
          colors={isDarkMode ? ['#05070D', '#120B12', '#080A12'] : ['#FFF3F3', '#FFF1E6', '#F4F2FF']}
          style={styles.choiceRoot}
        >
          <View style={styles.choiceWrap}>
            <View style={styles.choiceBrand}>
              <CahuinLogo style={styles.choiceLogo} size={36} />
              <Text style={[styles.choiceTitle, { color: COLORS.textPrimary }]}>¿Desde dónde te conectas?</Text>
              <Text style={[styles.choiceCopy, { color: COLORS.textMuted }]}>
                Usa la experiencia tipo app en móvil o entra a la versión nativa para PC con más espacio para radar, panoramas, chat y perfil.
              </Text>
            </View>

            <View style={styles.choiceGrid}>
              <DeviceCard
                icon="phone-portrait"
                title="Móvil"
                subtitle="Misma sensación de la app, optimizada para navegador del teléfono."
                bullets={['Radar por swipe', 'Tabs inferiores', 'Ubicación y notificaciones']}
                onPress={() => onChoose('mobile')}
                colors={COLORS}
                isDarkMode={isDarkMode}
              />
              <DeviceCard
                icon="desktop"
                title="PC"
                subtitle="Interfaz amplia para usar Cahuín cómodo desde notebook o escritorio."
                bullets={['Dashboard lateral', 'Paneles simultáneos', 'Mercado Pago web']}
                onPress={() => onChoose('desktop')}
                highlighted
                colors={COLORS}
                isDarkMode={isDarkMode}
              />
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
  );
}

function DeviceCard({ icon, title, subtitle, bullets, highlighted, onPress, colors, isDarkMode }) {
  const bg = highlighted
    ? (isDarkMode ? 'rgba(255,209,102,0.08)' : 'rgba(245,158,11,0.05)')
    : (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)');
  const border = highlighted
    ? (isDarkMode ? 'rgba(255,209,102,0.4)' : 'rgba(245,158,11,0.3)')
    : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)');
  const iconColor = highlighted ? (isDarkMode ? '#FFD166' : '#F59E0B') : colors.primario;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.deviceCard, { backgroundColor: bg, borderColor: border }]}>
      <View style={[styles.deviceIcon, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>
      <Text style={[styles.deviceTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.deviceSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      {bullets.map((bullet) => (
        <View key={bullet} style={styles.bulletRow}>
          <Ionicons name="checkmark-circle" size={16} color={iconColor} />
          <Text style={[styles.bulletText, { color: colors.textPrimary }]}>{bullet}</Text>
        </View>
      ))}
      <View style={[styles.deviceButton, highlighted && styles.deviceButtonHot]}>
        <Text style={styles.deviceButtonText}>Entrar en {title}</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFF" />
      </View>
    </TouchableOpacity>
  );
}

function MobileWebApp({ onChangeDevice }) {
  return (
    <View style={styles.mobileRoot}>
      <TouchableOpacity onPress={onChangeDevice} style={styles.switchFloating}>
        <Ionicons name="swap-horizontal" size={16} color="#FFF" />
        <Text style={styles.switchFloatingText}>Cambiar</Text>
      </TouchableOpacity>
      <AppNavigator />
    </View>
  );
}

function DesktopWebApp({ onChangeDevice }) {
  const { usuario, cargando } = useAuth();
  const { COLORS, isDarkMode, toggleTheme } = useTheme();
  const { width } = useWindowDimensions();
  const [active, setActive] = useState('radar');
  const [profileIndex, setProfileIndex] = useState(0);
  const [profiles, setProfiles] = useState([PERFIL_DEMO]);
  const [matches, setMatches] = useState([]);
  const [panoramas, setPanoramas] = useState([]);
  const [cahuinDia, setCahuinDia] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState({ location: 'pendiente', notifications: 'pendiente' });
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [toast, setToast] = useState('');

  const compact = width < 980;
  const profile = profiles[profileIndex] || PERFIL_DEMO;

  useEffect(() => {
    if (!usuario) return;
    cargarDatos();
  }, [usuario?._id]);

  const cargarDatos = async () => {
    const [descubrir, matchesRes, panoramasRes, cahuinRes] = await Promise.allSettled([
      userService.descubrir({}),
      matchService.getMisMatches(),
      panoramaService.listar({ region: usuario?.region, ciudad: usuario?.ciudad }),
      socialService.getCahuinDia(),
    ]);

    if (descubrir.status === 'fulfilled') setProfiles(descubrir.value.perfiles || descubrir.value.usuarios || [PERFIL_DEMO]);
    if (matchesRes.status === 'fulfilled') setMatches(matchesRes.value.matches || []);
    if (panoramasRes.status === 'fulfilled') setPanoramas(panoramasRes.value.panoramas || []);
    if (cahuinRes.status === 'fulfilled') setCahuinDia(cahuinRes.value);
  };

  const pedirUbicacion = () => {
    if (Platform.OS !== 'web' || !navigator?.geolocation) {
      setPermissionStatus((prev) => ({ ...prev, location: 'no disponible' }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setPermissionStatus((prev) => ({ ...prev, location: 'activa' }));
        setToast('Ubicación activada para el radar.');
      },
      () => setPermissionStatus((prev) => ({ ...prev, location: 'rechazada' })),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const pedirNotificaciones = async () => {
    if (Platform.OS !== 'web' || !('Notification' in window)) {
      setPermissionStatus((prev) => ({ ...prev, notifications: 'no disponible' }));
      return;
    }
    const status = await Notification.requestPermission();
    setPermissionStatus((prev) => ({ ...prev, notifications: status === 'granted' ? 'activas' : 'rechazadas' }));
    if (status === 'granted') setToast('Notificaciones activadas.');
  };

  const comprarPlan = async (plan) => {
    setPaymentLoading(plan.id);
    try {
      const res = await paymentService.crearMercadoPagoPreference(plan.id);
      if (res.checkoutUrl && Platform.OS === 'web') {
        window.location.href = res.checkoutUrl;
      } else {
        setToast(res.message || 'Mercado Pago esta listo para configurarse.');
      }
    } catch (error) {
      setToast(error.message || 'No pudimos iniciar Mercado Pago.');
    } finally {
      setPaymentLoading(null);
    }
  };

  const navItems = useMemo(() => ([
    ['radar', 'Radar', 'flame'],
    ['explorar', 'Explorar', 'compass'],
    ['panoramas', 'Panoramas', 'planet'],
    ['chat', 'Chat', 'chatbubbles'],
    ['perfil', 'Perfil', 'person'],
    ['premium', 'Planes', 'sparkles'],
    ['ajustes', 'Ajustes', 'settings'],
  ]), []);

  if (cargando) return <FullLoader />;

  if (!usuario) {
    return (
      <View style={[styles.desktopRoot, { backgroundColor: COLORS.bg }]}>
        <View style={styles.desktopLoginHero}>
          <CahuinLogo label="Cahuín Web" style={styles.desktopLogo} size={30} />
          <Text style={[styles.desktopLoginTitle, { color: COLORS.textPrimary }]}>Tu misma cuenta, ahora también en PC.</Text>
          <Text style={[styles.desktopLoginCopy, { color: COLORS.textMuted }]}>
            Inicia sesión y el plan comprado en app o web se mantiene sincronizado desde el backend.
          </Text>
          <TouchableOpacity onPress={onChangeDevice} style={[styles.desktopGhostButton, { borderColor: COLORS.border }]}>
            <Ionicons name="swap-horizontal" size={18} color={COLORS.textPrimary} />
            <Text style={[styles.desktopGhostText, { color: COLORS.textPrimary }]}>Cambiar dispositivo</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.desktopLoginPanel, { borderColor: COLORS.border }]}>
          <AppNavigator />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.desktopRoot, { backgroundColor: COLORS.fondo }]}>
      {!compact && (
        <View style={[styles.sidebar, { backgroundColor: COLORS.tarjeta, borderColor: COLORS.border }]}>
          <CahuinLogo style={styles.sidebarLogo} size={27} color={COLORS.textPrimary} />
          <Text style={[styles.sidebarUser, { color: COLORS.textMuted }]}>{usuario.nombre || 'Cahuinero'} · {usuario.premiumPlan || 'Gratis'}</Text>
          <View style={styles.navStack}>
            {navItems.map(([key, label, icon]) => (
              <TouchableOpacity key={key} onPress={() => setActive(key)} style={[styles.navItem, active === key && { backgroundColor: COLORS.primario }]}>
                <Ionicons name={active === key ? icon : `${icon}-outline`} size={20} color={active === key ? '#FFF' : COLORS.textMuted} />
                <Text style={[styles.navText, { color: active === key ? '#FFF' : COLORS.textPrimary }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sidebarActions}>
            <PermissionButton icon="location" label="Ubicación" status={permissionStatus.location} onPress={pedirUbicacion} />
            <PermissionButton icon="notifications" label="Notificaciones" status={permissionStatus.notifications} onPress={pedirNotificaciones} />
            <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
              <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={18} color="#FFF" />
              <Text style={styles.themeButtonText}>{isDarkMode ? 'Modo claro' : 'Modo oscuro'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onChangeDevice} style={styles.changeLink}>
              <Text style={[styles.changeText, { color: COLORS.textMuted }]}>Cambiar a móvil</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.desktopMain} contentContainerStyle={styles.desktopContent}>
        {compact && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topTabs}>
            {navItems.map(([key, label, icon]) => (
              <TouchableOpacity key={key} onPress={() => setActive(key)} style={[styles.topTab, active === key && { backgroundColor: COLORS.primario }]}>
                <Ionicons name={icon} size={18} color={active === key ? '#FFF' : COLORS.textMuted} />
                <Text style={[styles.topTabText, { color: active === key ? '#FFF' : COLORS.textPrimary }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {active === 'radar' && <RadarDesktop profile={profile} COLORS={COLORS} onNext={() => setProfileIndex((profileIndex + 1) % profiles.length)} />}
        {active === 'explorar' && <ExplorarDesktop COLORS={COLORS} cahuinDia={cahuinDia} />}
        {active === 'panoramas' && <PanoramasDesktop COLORS={COLORS} panoramas={panoramas} />}
        {active === 'chat' && <ChatDesktop COLORS={COLORS} matches={matches} />}
        {active === 'perfil' && <PerfilDesktop COLORS={COLORS} usuario={usuario} />}
        {active === 'premium' && <PremiumDesktop COLORS={COLORS} comprarPlan={comprarPlan} loading={paymentLoading} />}
        {active === 'ajustes' && (
          <AjustesDesktop
            COLORS={COLORS}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            pedirUbicacion={pedirUbicacion}
            pedirNotificaciones={pedirNotificaciones}
            permissionStatus={permissionStatus}
          />
        )}
      </ScrollView>

      {!!toast && (
        <TouchableOpacity onPress={() => setToast('')} style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Panel({ children, style, COLORS }) {
  return <View style={[styles.panel, { backgroundColor: COLORS.tarjeta, borderColor: COLORS.border }, style]}>{children}</View>;
}

function SectionTitle({ title, subtitle, COLORS }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={[styles.pageTitle, { color: COLORS.textPrimary }]}>{title}</Text>
      <Text style={[styles.pageSubtitle, { color: COLORS.textMuted }]}>{subtitle}</Text>
    </View>
  );
}

function RadarDesktop({ profile, COLORS, onNext }) {
  return (
    <View>
      <SectionTitle title="Radar" subtitle="Descubre perfiles con toda la info visible en pantalla grande." COLORS={COLORS} />
      <View style={styles.radarGrid}>
        <Panel COLORS={COLORS} style={styles.profilePanel}>
          <Image source={{ uri: profile.foto || profile.fotos?.[0] }} style={styles.desktopProfileImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.86)']} style={styles.profileOverlay}>
            <Text style={styles.desktopProfileName}>{profile.nombre}, {profile.edad || 24}</Text>
            <Text style={styles.desktopProfileBio}>{profile.biografia || profile.bio || 'Buena vibra, panoramas y conversación real.'}</Text>
            <View style={styles.tagRow}>
              {(profile.tags || [profile.ciudad || 'Santiago', profile.profesion || 'Diseñadora', profile.universidad || 'UAndes']).map((tag) => <Chip key={tag} label={tag} />)}
            </View>
          </LinearGradient>
        </Panel>
        <View style={styles.radarSide}>
          <Panel COLORS={COLORS}>
            <Text style={[styles.panelTitle, { color: COLORS.textPrimary }]}>Radar IA</Text>
            <Text style={[styles.bodyText, { color: COLORS.textMuted }]}>El radar detectó una buena vibra general y varias pistas compatibles.</Text>
            <View style={styles.compatCircle}><Text style={styles.compatText}>75%</Text></View>
          </Panel>
          <View style={styles.actionRow}>
            <ActionButton icon="refresh" color="#F59E0B" />
            <ActionButton icon="close" color="#F0444F" onPress={onNext} />
            <ActionButton icon="star" color="#3B82F6" />
            <ActionButton icon="heart" color="#F0444F" onPress={onNext} large />
            <ActionButton icon="flash" color="#8B5CF6" />
          </View>
          <Panel COLORS={COLORS}>
            <Text style={[styles.panelTitle, { color: COLORS.textPrimary }]}>Preferencias</Text>
            <Text style={[styles.bodyText, { color: COLORS.textMuted }]}>Distancia máxima 100 km · edad 18 - 60 · mostrar personas fuera de rango si faltan perfiles.</Text>
          </Panel>
        </View>
      </View>
    </View>
  );
}

function ExplorarDesktop({ COLORS, cahuinDia }) {
  const cards = [
    ['Historias culturales', 'Sube momentos de tu región por 24 horas.', 'camera', '#F0444F'],
    ['Cahuín del Día', cahuinDia?.pregunta || 'Mandar reels cuenta como lenguaje del amor.', 'flame', '#F59E0B'],
    ['Botella digital', 'Lanza un cahuín sin match y espera respuesta.', 'water', '#38BDF8'],
    ['Top Cahuines', 'Perfiles populares de tu zona.', 'trophy', '#FFD166'],
  ];
  return (
    <View>
      <SectionTitle title="Explorar" subtitle="Personas, juegos sociales, comunidades y tendencias." COLORS={COLORS} />
      <View style={styles.cardGrid}>
        {cards.map(([title, subtitle, icon, color]) => (
          <Panel key={title} COLORS={COLORS}>
            <Ionicons name={icon} size={30} color={color} />
            <Text style={[styles.panelTitle, { color: COLORS.textPrimary }]}>{title}</Text>
            <Text style={[styles.bodyText, { color: COLORS.textMuted }]}>{subtitle}</Text>
          </Panel>
        ))}
      </View>
      <Panel COLORS={COLORS}>
        <Text style={[styles.panelTitle, { color: COLORS.textPrimary }]}>Comunidades</Text>
        <View style={styles.tagRow}>
          {['Pololeo serio', 'Salgamos hoy', 'Solo cahuín', 'Amistad', 'Citas tranquilas'].map((tag) => <Chip key={tag} label={tag} hot />)}
        </View>
      </Panel>
    </View>
  );
}

function PanoramasDesktop({ COLORS, panoramas }) {
  return (
    <View>
      <SectionTitle title="Panoramas" subtitle="Eventos oficiales, comunidad y swipe de panoramas por región." COLORS={COLORS} />
      <View style={styles.twoCols}>
        <Panel COLORS={COLORS}>
          <Text style={[styles.panelTitle, { color: COLORS.textPrimary }]}>Armar un panorama</Text>
          <TextInput placeholder="Ej: Juntarse a tomar unas chelas" placeholderTextColor={COLORS.textMuted} style={[styles.input, { color: COLORS.textPrimary, borderColor: COLORS.border }]} />
          <TextInput placeholder="Ej: Bar X, Centro" placeholderTextColor={COLORS.textMuted} style={[styles.input, { color: COLORS.textPrimary, borderColor: COLORS.border }]} />
          <View style={styles.tagRow}>{['Tragos', 'Música', 'Buena onda', 'Carrete', 'Aire libre'].map((tag) => <Chip key={tag} label={tag} />)}</View>
          <PrimaryButton label="Publicar panorama" icon="send" />
        </Panel>
        <Panel COLORS={COLORS}>
          <Text style={[styles.panelTitle, { color: COLORS.textPrimary }]}>Eventos cerca</Text>
          {(panoramas.length ? panoramas : [
            { titulo: 'CualMarcelo', descripcion: 'Show musical y humorístico.', lugar: 'Centro Cultural Galo Sepúlveda' },
            { titulo: 'Tributo a Soda Stereo', descripcion: 'Música en vivo.', lugar: 'Boca de Lobos, Temuco' },
          ]).slice(0, 4).map((item) => (
            <View key={item._id || item.titulo} style={[styles.listItem, { borderColor: COLORS.border }]}>
              <Text style={[styles.listTitle, { color: COLORS.textPrimary }]}>{item.titulo || item.nombre}</Text>
              <Text style={[styles.bodyText, { color: COLORS.textMuted }]}>{item.descripcion || item.lugar}</Text>
            </View>
          ))}
        </Panel>
      </View>
    </View>
  );
}

function ChatDesktop({ COLORS, matches }) {
  return (
    <View>
      <SectionTitle title="Tus conversaciones" subtitle="Rompe el hielo y mantén activos tus matches." COLORS={COLORS} />
      <Panel COLORS={COLORS}>
        {(matches.length ? matches : [
          { roomId: 'v', usuario: { nombre: 'Valeria', foto: PERFIL_DEMO.foto }, ultimoMensaje: 'Toca para romper el hielo' },
          { roomId: 's', usuario: { nombre: 'Sofía', foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=900' }, ultimoMensaje: 'Sin actividad reciente' },
        ]).map((match) => (
          <View key={match.roomId} style={[styles.chatRow, { borderColor: COLORS.border }]}>
            <Image source={{ uri: match.usuario?.foto || PERFIL_DEMO.foto }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.listTitle, { color: COLORS.textPrimary }]}>{match.usuario?.nombre || 'Match'}</Text>
              <Text style={[styles.bodyText, { color: COLORS.textMuted }]}>{match.ultimoMensaje || 'Sin actividad reciente'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.textMuted} />
          </View>
        ))}
      </Panel>
    </View>
  );
}

function PerfilDesktop({ COLORS, usuario }) {
  return (
    <View>
      <SectionTitle title="Perfil" subtitle="Tu cuenta, gustos, fotos, tests y verificación." COLORS={COLORS} />
      <View style={styles.twoCols}>
        <Panel COLORS={COLORS}>
          <Image source={{ uri: usuario.foto || usuario.fotoUrl || 'https://i.imgur.com/2nCt3Sbl.png' }} style={styles.profileAvatar} />
          <Text style={[styles.profileName, { color: COLORS.textPrimary }]}>{usuario.nombre || 'Cahuín'}, {usuario.edad || 23}</Text>
          <Text style={[styles.bodyText, { color: COLORS.textMuted }]}>{usuario.ciudad || 'Temuco'} · Perfil 70%</Text>
          <PrimaryButton label="Editar información" icon="create" />
          <PrimaryButton label="Verificar con selfie" icon="shield-checkmark" ghost />
        </Panel>
        <Panel COLORS={COLORS}>
          <Text style={[styles.panelTitle, { color: COLORS.textPrimary }]}>Detalles que suman</Text>
          <View style={styles.tagRow}>{['Pololeo serio', 'Cero alcohol', 'Arte / Museos', 'Fotografía', 'Cocinar', 'Bienestar'].map((tag) => <Chip key={tag} label={tag} hot />)}</View>
          <Text style={[styles.panelTitle, { color: COLORS.textPrimary }]}>Tests de personalidad</Text>
          <View style={styles.tagRow}>{['Apego', 'Cahuinero', 'Valores'].map((tag) => <Chip key={tag} label={tag} />)}</View>
        </Panel>
      </View>
    </View>
  );
}

function PremiumDesktop({ COLORS, comprarPlan, loading }) {
  return (
    <View>
      <SectionTitle title="Planes Cahuín" subtitle="Mismo beneficio para app, móvil web y PC. Pago web por Mercado Pago." COLORS={COLORS} />
      <View style={styles.twoCols}>
        {PLANES_CAHUIN.map((plan) => (
          <Panel key={plan.id} COLORS={COLORS} style={plan.destacado && styles.planHot}>
            <Text style={[styles.planName, { color: plan.destacado ? '#F59E0B' : COLORS.textPrimary }]}>{plan.nombre}</Text>
            <Text style={[styles.planPrice, { color: COLORS.textPrimary }]}>{plan.precioReferencial.replace('CLP', '$').replace('/mes', '')}</Text>
            {plan.beneficios.slice(0, 6).map((beneficio) => (
              <View key={beneficio} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color={plan.destacado ? '#F59E0B' : '#F0444F'} />
                <Text style={[styles.benefitText, { color: COLORS.textPrimary }]}>{beneficio}</Text>
              </View>
            ))}
            <PrimaryButton label={loading === plan.id ? 'Abriendo Mercado Pago...' : `Elegir ${plan.nombre.replace('Cahuín ', '')}`} icon="card" onPress={() => comprarPlan(plan)} disabled={!!loading} amber={plan.destacado} />
          </Panel>
        ))}
      </View>
    </View>
  );
}

function AjustesDesktop({ COLORS, isDarkMode, toggleTheme, pedirUbicacion, pedirNotificaciones, permissionStatus }) {
  return (
    <View>
      <SectionTitle title="Ajustes" subtitle="Visibilidad, ubicación, bienestar, apariencia y seguridad." COLORS={COLORS} />
      <View style={styles.cardGrid}>
        <SettingCard COLORS={COLORS} icon="airplane" title="Modo viajero" subtitle="Cambia ciudad dentro de Chile" />
        <SettingCard COLORS={COLORS} icon="pause" title="Pausar mi cuenta" subtitle="Oculta tu perfil del radar" />
        <SettingCard COLORS={COLORS} icon={isDarkMode ? 'moon' : 'sunny'} title="Modo claro/oscuro" subtitle={isDarkMode ? 'Oscuro activo' : 'Claro activo'} onPress={toggleTheme} />
        <SettingCard COLORS={COLORS} icon="location" title="Permitir ubicación" subtitle={permissionStatus.location} onPress={pedirUbicacion} />
        <SettingCard COLORS={COLORS} icon="notifications" title="Permitir notificaciones" subtitle={permissionStatus.notifications} onPress={pedirNotificaciones} />
        <SettingCard COLORS={COLORS} icon="document-text" title="Legal y seguridad" subtitle="Términos, privacidad y eliminación de cuenta" />
      </View>
    </View>
  );
}

function SettingCard({ COLORS, icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.85 : 1}>
      <Panel COLORS={COLORS}>
        <Ionicons name={icon} size={26} color="#F0444F" />
        <Text style={[styles.panelTitle, { color: COLORS.textPrimary }]}>{title}</Text>
        <Text style={[styles.bodyText, { color: COLORS.textMuted }]}>{subtitle}</Text>
      </Panel>
    </TouchableOpacity>
  );
}

function PermissionButton({ icon, label, status, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.permissionButton}>
      <Ionicons name={`${icon}-outline`} size={18} color="#FFF" />
      <Text style={styles.permissionText}>{label}</Text>
      <Text style={styles.permissionStatus}>{status}</Text>
    </TouchableOpacity>
  );
}

function PrimaryButton({ label, icon, onPress, ghost, amber, disabled }) {
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.primaryButton, ghost && styles.primaryGhost, amber && styles.primaryAmber]}>
      <Ionicons name={icon} size={18} color="#FFF" />
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionButton({ icon, color, large, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.actionButton, large && styles.actionButtonLarge, { borderColor: color }]}>
      <Ionicons name={icon} size={large ? 34 : 25} color={color} />
    </TouchableOpacity>
  );
}

function Chip({ label, hot }) {
  return (
    <View style={[styles.chip, hot && styles.chipHot]}>
      <Text style={[styles.chipText, hot && styles.chipTextHot]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#05070D' },
  choiceRoot: { flex: 1, minHeight: '100vh', justifyContent: 'center', padding: 32 },
  choiceWrap: { width: '100%', maxWidth: 1120, alignSelf: 'center' },
  choiceBrand: { maxWidth: 760, marginBottom: 28 },
  choiceLogo: { marginBottom: 18 },
  choiceTitle: { color: '#FFF', fontSize: 56, lineHeight: 62, fontWeight: '900' },
  choiceCopy: { color: '#B7BBC8', fontSize: 20, lineHeight: 30, marginTop: 14 },
  choiceGrid: { flexDirection: 'row', gap: 18, flexWrap: 'wrap' },
  deviceCard: { flex: 1, minWidth: 280, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: 24 },
  deviceCardHot: { borderColor: 'rgba(255,209,102,0.65)', backgroundColor: 'rgba(255,209,102,0.08)' },
  deviceIcon: { width: 56, height: 56, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  deviceTitle: { color: '#FFF', fontSize: 30, fontWeight: '900' },
  deviceSubtitle: { color: '#B7BBC8', fontSize: 16, lineHeight: 23, marginVertical: 14 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 5 },
  bulletText: { color: '#E8EAF0', fontSize: 15, fontWeight: '700' },
  deviceButton: { marginTop: 22, height: 48, borderRadius: 8, backgroundColor: '#F0444F', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  deviceButtonHot: { backgroundColor: '#F59E0B' },
  deviceButtonText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  mobileRoot: { flex: 1, minHeight: '100vh', backgroundColor: '#000' },
  switchFloating: { position: 'absolute', right: 18, top: 18, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 8, paddingHorizontal: 12, height: 34, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  switchFloatingText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  desktopRoot: { flex: 1, minHeight: '100vh', flexDirection: 'row' },
  desktopLoginHero: { flex: 1, padding: 54, justifyContent: 'center' },
  desktopLogo: { marginBottom: 22 },
  desktopLoginTitle: { color: '#FFF', fontSize: 52, lineHeight: 58, fontWeight: '900', maxWidth: 640 },
  desktopLoginCopy: { color: '#B7BBC8', fontSize: 19, lineHeight: 29, marginTop: 16, maxWidth: 600 },
  desktopGhostButton: { marginTop: 26, width: 210, height: 46, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  desktopGhostText: { color: '#FFF', fontWeight: '800' },
  desktopLoginPanel: { width: 460, maxWidth: '42%', borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  sidebar: { width: 270, borderRightWidth: 1, padding: 22 },
  sidebarLogo: {},
  sidebarUser: { fontSize: 14, fontWeight: '700', marginTop: 6 },
  navStack: { gap: 8, marginTop: 28 },
  navItem: { height: 48, borderRadius: 8, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  navText: { fontSize: 16, fontWeight: '900' },
  sidebarActions: { marginTop: 'auto', gap: 10 },
  permissionButton: { backgroundColor: '#1F2430', borderRadius: 8, padding: 12, gap: 4 },
  permissionText: { color: '#FFF', fontWeight: '900' },
  permissionStatus: { color: '#A7ADBA', fontSize: 12, fontWeight: '700' },
  themeButton: { backgroundColor: '#F0444F', height: 44, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  themeButtonText: { color: '#FFF', fontWeight: '900' },
  changeLink: { alignItems: 'center', paddingVertical: 8 },
  changeText: { fontWeight: '800' },
  desktopMain: { flex: 1 },
  desktopContent: { padding: 28, paddingBottom: 60, gap: 18 },
  topTabs: { marginBottom: 18 },
  topTab: { height: 42, borderRadius: 8, paddingHorizontal: 14, marginRight: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  topTabText: { fontWeight: '900' },
  sectionHead: { marginBottom: 18 },
  pageTitle: { fontSize: 42, lineHeight: 48, fontWeight: '900' },
  pageSubtitle: { fontSize: 17, lineHeight: 24, marginTop: 6, fontWeight: '600' },
  radarGrid: { flexDirection: 'row', gap: 18, flexWrap: 'wrap' },
  panel: { borderWidth: 1, borderRadius: 8, padding: 18, gap: 12 },
  profilePanel: { flex: 1.1, minWidth: 360, minHeight: 640, padding: 0, overflow: 'hidden' },
  desktopProfileImage: { width: '100%', height: '100%', position: 'absolute' },
  profileOverlay: { flex: 1, justifyContent: 'flex-end', padding: 28 },
  desktopProfileName: { color: '#FFF', fontSize: 52, fontWeight: '900' },
  desktopProfileBio: { color: '#FFF', fontSize: 20, marginTop: 8, fontWeight: '700' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { borderRadius: 8, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  chipHot: { backgroundColor: 'rgba(240,68,79,0.16)', borderColor: 'rgba(240,68,79,0.35)' },
  chipText: { color: '#FFF', fontWeight: '900' },
  chipTextHot: { color: '#FF7A85' },
  radarSide: { flex: 0.9, minWidth: 320, gap: 16 },
  panelTitle: { fontSize: 24, fontWeight: '900' },
  bodyText: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  compatCircle: { width: 82, height: 82, borderRadius: 41, borderWidth: 7, borderColor: '#A855F7', alignItems: 'center', justifyContent: 'center' },
  compatText: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  actionButton: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  actionButtonLarge: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#F0444F', borderColor: '#F0444F' },
  cardGrid: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  twoCols: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  input: { height: 54, borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, fontSize: 16, fontWeight: '700' },
  primaryButton: { minHeight: 48, borderRadius: 8, paddingHorizontal: 18, backgroundColor: '#F0444F', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  primaryGhost: { backgroundColor: '#29303D' },
  primaryAmber: { backgroundColor: '#F59E0B' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  listItem: { borderTopWidth: 1, paddingVertical: 12 },
  listTitle: { fontSize: 18, fontWeight: '900' },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, paddingVertical: 14 },
  avatar: { width: 58, height: 58, borderRadius: 8 },
  profileAvatar: { width: 132, height: 132, borderRadius: 66, alignSelf: 'center' },
  profileName: { fontSize: 34, fontWeight: '900', textAlign: 'center' },
  planHot: { borderColor: '#F59E0B' },
  planName: { fontSize: 32, fontWeight: '900' },
  planPrice: { fontSize: 46, fontWeight: '900' },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { fontSize: 16, fontWeight: '800', flex: 1 },
  toast: { position: 'absolute', bottom: 22, alignSelf: 'center', backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 12 },
  toastText: { color: '#111827', fontWeight: '900' },
});
