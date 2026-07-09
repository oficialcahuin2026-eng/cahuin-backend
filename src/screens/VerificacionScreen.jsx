import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { userService } from '../services/api';

const POSES = [
  { id: 'nariz', label: 'Toca tu nariz con un dedo 👃' },
  { id: 'paz', label: 'Haz el símbolo de la paz ✌️' },
  { id: 'cabeza', label: 'Pon una mano en tu cabeza 🤦' },
  { id: 'lengua', label: 'Saca la lengua 👅' },
];

export default function VerificacionScreen({ navigation }) {
  const { COLORS } = useTheme();
  const { usuario, actualizarUsuario } = useAuth();
  const styles = getStyles(COLORS);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [poseActiva, setPoseActiva] = useState(null);
  const [fotoCapturada, setFotoCapturada] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const [verificacionExitosa, setVerificacionExitosa] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    // Seleccionar pose aleatoria
    const randomPose = POSES[Math.floor(Math.random() * POSES.length)];
    setPoseActiva(randomPose);
  }, []);

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator color={COLORS.primario} size="large" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Necesitamos acceso a tu cámara para verificar tu identidad y darte el check azul.</Text>
        <TouchableOpacity style={styles.btnPermiso} onPress={requestPermission}>
          <Text style={styles.btnPermisoText}>Permitir Cámara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tomarFoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: false,
      });
      setFotoCapturada(photo.uri);
    }
  };

  const procesarVerificacion = async () => {
    setVerificando(true);
    
    // Simulamos un delay de "procesamiento de IA"
    setTimeout(async () => {
      try {
        // En un entorno real, subiríamos la foto. Aquí simulamos la aprobación directa.
        const res = await userService.actualizar({ verificado: true });
        if (res.usuario) {
          actualizarUsuario(res.usuario);
        }
        setVerificando(false);
        setVerificacionExitosa(true);
      } catch (error) {
        setVerificando(false);
        alert('Hubo un error al verificar.');
      }
    }, 2000);
  };

  if (verificacionExitosa) {
    return (
      <View style={styles.container}>
        <Ionicons name="shield-checkmark" size={100} color="#3B82F6" />
        <Text style={styles.tituloExito}>¡Perfil Verificado!</Text>
        <Text style={styles.subtituloExito}>Ya tienes el codiciado check azul. Tu perfil ahora destaca como 100% real.</Text>
        <TouchableOpacity style={styles.btnFinalizar} onPress={() => navigation.goBack()}>
          <Text style={styles.btnFinalizarText}>Volver a mi perfil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verificación</Text>
        <View style={{ width: 28 }} />
      </View>

      {!fotoCapturada ? (
        <>
          <View style={styles.instruccionBox}>
            <Text style={styles.instruccionTitulo}>Gana tu Check Azul</Text>
            <Text style={styles.instruccionDesc}>Toma una selfie clara y asegúrate de:</Text>
            <View style={styles.poseDestacada}>
              <Text style={styles.poseText}>{poseActiva?.label}</Text>
            </View>
          </View>

          <View style={styles.cameraContainer}>
            <CameraView 
              ref={cameraRef} 
              style={styles.camera} 
              facing="front" 
            />
            {/* Overlay para encuadre */}
            <View style={styles.overlayFrame} />
          </View>

          <View style={styles.footerCamera}>
            <TouchableOpacity style={styles.btnCapturar} onPress={tomarFoto}>
              <View style={styles.btnCapturarInner} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.tituloPreview}>¿Te ves bien?</Text>
          
          <View style={styles.cameraContainer}>
            <Image source={{ uri: fotoCapturada }} style={styles.camera} />
          </View>

          <View style={styles.actionsPreview}>
            <TouchableOpacity style={styles.btnRetomar} onPress={() => setFotoCapturada(null)} disabled={verificando}>
              <Ionicons name="refresh" size={24} color="#666" />
              <Text style={styles.btnRetomarText}>Retomar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.btnEnviar} onPress={procesarVerificacion} disabled={verificando}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.btnEnviarGrad}>
                {verificando ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.btnEnviarText}>Verificar</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  header: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 10 },
  backBtn: { padding: 5, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, fontFamily: FONTS.display },
  
  infoText: { color: COLORS.textPrimary, fontSize: 16, textAlign: 'center', paddingHorizontal: 40, marginBottom: 20 },
  btnPermiso: { backgroundColor: COLORS.primario, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 },
  btnPermisoText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  instruccionBox: { position: 'absolute', top: 100, left: 20, right: 20, backgroundColor: COLORS.tarjeta, padding: 20, borderRadius: 20, ...SHADOWS.md, zIndex: 10 },
  instruccionTitulo: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 5 },
  instruccionDesc: { fontSize: 14, color: COLORS.textMuted, marginBottom: 15 },
  poseDestacada: { backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#3B82F6', alignItems: 'center' },
  poseText: { fontSize: 16, fontWeight: '800', color: '#3B82F6' },

  cameraContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  camera: { width: '100%', height: '100%' },
  overlayFrame: { position: 'absolute', width: 250, height: 350, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 150, borderStyle: 'dashed' },

  footerCamera: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
  btnCapturar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', padding: 5 },
  btnCapturarInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF' },

  tituloPreview: { position: 'absolute', top: 120, fontSize: 28, fontWeight: '900', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4, zIndex: 10 },
  
  actionsPreview: { position: 'absolute', bottom: 40, flexDirection: 'row', width: '100%', justifyContent: 'space-evenly', paddingHorizontal: 20 },
  btnRetomar: { backgroundColor: '#FFF', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 30, flexDirection: 'row', alignItems: 'center', ...SHADOWS.md },
  btnRetomarText: { color: '#666', fontWeight: '800', fontSize: 16, marginLeft: 8 },
  btnEnviar: { ...SHADOWS.md },
  btnEnviarGrad: { paddingVertical: 15, paddingHorizontal: 25, borderRadius: 30, flexDirection: 'row', alignItems: 'center' },
  btnEnviarText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

  tituloExito: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, marginTop: 20, fontFamily: FONTS.display },
  subtituloExito: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40, marginTop: 10, lineHeight: 24 },
  btnFinalizar: { backgroundColor: '#3B82F6', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, marginTop: 40 },
  btnFinalizarText: { color: '#FFF', fontSize: 18, fontWeight: '800' }
});
