import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Switch,
  Linking,
  Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/api';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';
import CahuinModal from '../components/CahuinModal';
import ProfilePrompts from '../components/ProfilePrompts';
import MovieSelectorModal from '../components/MovieSelectorModal';
import TvSeriesSelectorModal from '../components/TvSeriesSelectorModal';
import SpotifySelectorModal from '../components/SpotifySelectorModal';
import AppleMusicSelectorModal from '../components/AppleMusicSelectorModal';
import GenericSelectorModal from '../components/GenericSelectorModal';
import HobbiesSelectorModal from '../components/HobbiesSelectorModal';
import JuegosSelectorModal from '../components/JuegosSelectorModal';

export default function EditarPerfilScreen({ navigation }) {
  const { usuario, actualizarUsuario } = useAuth();
  const { COLORS, isDarkMode } = useTheme();
  const styles = getStyles(COLORS, isDarkMode);

  const [activeTab, setActiveTab] = useState('editar');

  const [fotosGaleria, setFotosGaleria] = useState(usuario?.fotos?.length > 0 ? usuario.fotos : (usuario?.foto ? [usuario.foto] : []));
  const [guardando, setGuardando] = useState(false);
  const [modalInfo, setModalInfo] = useState(null);

  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [descripcion, setDescripcion] = useState(usuario?.descripcion || '');
  const [ciudad, setCiudad] = useState(usuario?.ciudad || '');
  
  const [prompts, setPrompts] = useState(usuario?.prompts || []);
  const [peliculasFavoritas, setPeliculasFavoritas] = useState(usuario?.peliculasFavoritas || []);
  const [seriesFavoritas, setSeriesFavoritas] = useState(usuario?.seriesFavoritas || []);
  const [juegosFavoritos, setJuegosFavoritos] = useState(usuario?.juegosFavoritos || []);
  const [hobbies, setHobbies] = useState(usuario?.hobbies || []);
  const [artistasSpotify, setArtistasSpotify] = useState(usuario?.artistasSpotify || []);
  const [cancion, setCancion] = useState(usuario?.cancion || null);
  
  // Audio Rompehielos
  const [audioRompehielos, setAudioRompehielos] = useState(usuario?.audioRompehielos || null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [soundToPlay, setSoundToPlay] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Basic info
  const [queBuscas, setQueBuscas] = useState(usuario?.queBuscas || '');
  const [pronombres, setPronombres] = useState(usuario?.pronombres || '');
  
  // Identidad
  const [genero, setGenero] = useState(usuario?.genero !== 'Por definir' ? usuario?.genero : '');
  const [orientacionSexual, setOrientacionSexual] = useState(usuario?.orientacionSexual !== 'Por definir' ? usuario?.orientacionSexual : '');
  const [mostrarGenero, setMostrarGenero] = useState(usuario?.mostrarGenero !== false);
  const [mostrarOrientacion, setMostrarOrientacion] = useState(usuario?.mostrarOrientacion !== false);

  const [altura, setAltura] = useState(usuario?.altura || '');
  const [idiomas, setIdiomas] = useState(usuario?.idiomas ? usuario.idiomas.join(', ') : ''); // Text edit para idiomas
  const [centroEstudios, setCentroEstudios] = useState(usuario?.centroEstudios || '');
  const [trabajo, setTrabajo] = useState(usuario?.trabajo || '');
  const [zodiaco, setZodiaco] = useState(usuario?.zodiaco || '');
  const [nivelEscolaridad, setNivelEscolaridad] = useState(usuario?.nivelEscolaridad || '');
  const [planesHijos, setPlanesHijos] = useState(usuario?.mapaValores?.planesHijos || '');
  const [personalidad, setPersonalidad] = useState(usuario?.personalidad || '');
  const [estiloComunicacion, setEstiloComunicacion] = useState(usuario?.estiloComunicacion || '');
  const [recibirAmor, setRecibirAmor] = useState(usuario?.recibirAmor || '');
  
  // Lifestyle (Habitos)
  const [mascotas, setMascotas] = useState(usuario?.habitos?.mascotas || '');
  const [beber, setBeber] = useState(usuario?.habitos?.beber || '');
  const [fumar, setFumar] = useState(usuario?.habitos?.fumar || '');
  const [ejercicio, setEjercicio] = useState(usuario?.habitos?.ejercicio || '');
  const [alimentacion, setAlimentacion] = useState(usuario?.habitos?.alimentacion || '');
  const [redesSociales, setRedesSociales] = useState(usuario?.habitos?.redesSociales || '');
  const [habitosSueno, setHabitosSueno] = useState(usuario?.habitos?.habitosSueno || '');
  const [carrete, setCarrete] = useState(usuario?.habitos?.carrete || '');
  const [vacaciones, setVacaciones] = useState(usuario?.habitos?.vacaciones || '');
  const [transporte, setTransporte] = useState(usuario?.habitos?.transporte || '');

  const [mostrarEdad, setMostrarEdad] = useState(usuario?.mostrarEdad !== false);
  const [mostrarDistancia, setMostrarDistancia] = useState(usuario?.mostrarDistancia !== false);

  const [modalMovies, setModalMovies] = useState(false);
  const [modalSeries, setModalSeries] = useState(false);
  const [modalJuegos, setModalJuegos] = useState(false);
  const [modalHobbies, setModalHobbies] = useState(false);
  const [modalSpotify, setModalSpotify] = useState(false);
  const [modalAppleMusic, setModalAppleMusic] = useState(false);

  const [selectorConfig, setSelectorConfig] = useState(null); 
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');

  const openTextEdit = (field, value) => {
    setEditingField(field);
    setTempValue(value);
  };

  const saveTextEdit = () => {
    if (editingField === 'centroEstudios') setCentroEstudios(tempValue);
    if (editingField === 'trabajo') setTrabajo(tempValue);
    if (editingField === 'ciudad') setCiudad(tempValue);
    if (editingField === 'altura') setAltura(tempValue);
    if (editingField === 'idiomas') setIdiomas(tempValue);
    setEditingField(null);
  };

  const openSelector = (title, options, selectedValue, onSave) => {
    setSelectorConfig({ visible: true, title, options, selectedValue, onSave });
  };

  const OPTIONS = {
    genero: ['Mujer', 'Hombre', 'Más allá del binario', 'Mujer trans', 'Hombre trans', 'Prefiero no decirlo'],
    orientacionSexual: ['Heterosexual', 'Gay', 'Lesbiana', 'Bisexual', 'Asexual', 'Demisexual', 'Pansexual', 'Queer', 'Me lo estoy cuestionando'],
    metaRelacion: ['Algo serio, pa pololear', 'Pasarlo bien y ver qué onda', 'Un rato nomás, sin atados', 'Conocer gente y apañar', 'Ni idea, fluyendo'],
    pronombres: ['Él', 'Ella', 'Elle'],
    zodiaco: [
      { label: 'Aries', icon: '♈' }, { label: 'Tauro', icon: '♉' }, { label: 'Géminis', icon: '♊' }, { label: 'Cáncer', icon: '♋' }, 
      { label: 'Leo', icon: '♌' }, { label: 'Virgo', icon: '♍' }, { label: 'Libra', icon: '♎' }, { label: 'Escorpio', icon: '♏' }, 
      { label: 'Sagitario', icon: '♐' }, { label: 'Capricornio', icon: '♑' }, { label: 'Acuario', icon: '♒' }, { label: 'Piscis', icon: '♓' }
    ],
    educacion: ['Licenciatura', 'En la U', 'Titulado/a', 'Posgrado', 'Instituto / CFT', 'Todavía en el colegio'],
    hijos: ['Quiero crías a futuro', 'Cero ganas de ser papá/mamá', 'Ya tengo y quiero más', 'Ya tengo y no más', 'No estoy seguro/a'],
    personalidad: [
      { label: 'INTJ', icon: '🧠' }, { label: 'INTP', icon: '🔬' }, { label: 'ENTJ', icon: '🎯' }, { label: 'ENTP', icon: '💡' },
      { label: 'INFJ', icon: '🔮' }, { label: 'INFP', icon: '✨' }, { label: 'ENFJ', icon: '🌟' }, { label: 'ENFP', icon: '🌈' },
      { label: 'ISTJ', icon: '📋' }, { label: 'ISFJ', icon: '🛡️' }, { label: 'ESTJ', icon: '⚖️' }, { label: 'ESFJ', icon: '🤝' },
      { label: 'ISTP', icon: '🛠️' }, { label: 'ISFP', icon: '🎨' }, { label: 'ESTP', icon: '⚡' }, { label: 'ESFP', icon: '🎉' }
    ],
    comunicacion: ['Por WhatsApp', 'Llamada (si hay confianza)', 'Videollamada', 'Frente a frente, obvio', 'Cero mensajes, me aburro'],
    amor: ['Apapachos (Tiempo de calidad)', 'Palabras bonitas', 'Mucho contacto físico', 'Que me ayuden (Actos de servicio)', 'Regalitos'],
    mascotas: ['Team Perro', 'Team Gato', 'Reptiles locos', 'Aves', 'Peces', 'No tengo pero apañan', 'Alergia a los bichos', 'Paso de mascotas'],
    beber: ['No tomo, soy sanito/a', 'Su copete social nomás', 'Bueno/a pal copete'],
    fumar: ['Fumo en los carretes', 'Fumo harto', 'Cero humo', 'Tratando de dejarlo'],
    ejercicio: ['Modo bestia (Todos los días)', 'Su trote piola (Frecuente)', 'Cuando me acuerdo', 'El control de la tele cuenta?'],
    alimentacion: ['Vegano', 'Vegetariano', 'Pescetariano', 'Carnívoro a morir', 'Como de todo (Omnívoro)', 'Mañoso/a pa comer'],
    redes: ['Modo Influencer', 'Subo historias de vez en cuando', 'Modo fantasma', 'Cero redes'],
    sueno: ['Arriba con los gallos', 'Búho nocturno', 'Duermo cuando puedo'],
    carrete: ['Modo bestia, hasta que salga el sol', 'Su previa piola y pa la casa', 'Prefiero carrete en casa (Junta)', 'No carreteo, cero onda'],
    vacaciones: ['Mochileando a la vida', 'All inclusive, puro relax', 'Cabañita en el sur con lluvia', 'Playa, sol y arena'],
    transporte: ['Team Metro/Micro apañando', 'En mi autito pa todos lados', 'Bicicleta, cuidando el planeta', 'A puro Uber/DiDi'],
  };

  const fotoPrincipal = fotosGaleria[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=800';

  const agregarFotoGaleria = async (index) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return setModalInfo({ title: 'Permiso', message: 'Falta permiso para fotos.', emoji: '📷' });

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
      base64: true
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const b64 = result.assets[0].base64;
      setModalInfo({ title: 'Subiendo...', message: 'Subiendo tu foto...', emoji: '⏳' });
      try {
        const respuesta = await userService.subirFotoBase64(b64);
        if (respuesta.fotoUrl) {
          const nuevasFotos = [...fotosGaleria];
          nuevasFotos[index] = respuesta.fotoUrl;
          setFotosGaleria(nuevasFotos.filter(Boolean));
          setModalInfo(null);
        }
      } catch (err) {
        setModalInfo({ title: 'Error', message: 'No se pudo subir la foto.', emoji: '😥' });
      }
    }
  };

  const startRecordingAudio = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording);
        setIsRecording(true);
        Vibration.vibrate(50);
      }
    } catch (err) { console.log(err); }
  };

  const stopRecordingAudio = async () => {
    if (!recording) return;
    setRecording(null);
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setAudioRompehielos(uri);
    Vibration.vibrate(50);
  };

  const playProfileAudio = async () => {
    if (!audioRompehielos) return;
    try {
      if (soundToPlay) await soundToPlay.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri: audioRompehielos });
      setSoundToPlay(sound);
      setIsPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) setIsPlaying(false);
      });
    } catch (e) { console.log(e); }
  };

  const stopProfileAudio = async () => {
    if (soundToPlay) {
      await soundToPlay.stopAsync();
      setIsPlaying(false);
    }
  };

  const eliminarFotoGaleria = (index) => {
    const nuevasFotos = [...fotosGaleria];
    nuevasFotos.splice(index, 1);
    setFotosGaleria(nuevasFotos);
  };

  const guardarDetalles = async () => {
    setGuardando(true);
    try {
      const payloadIdiomas = idiomas ? idiomas.split(',').map(s => s.trim()) : [];
      
      const response = await userService.actualizar({
        fotos: fotosGaleria,
        foto: fotosGaleria[0] || '',
        descripcion,
        ciudad,
        prompts,
        peliculasFavoritas,
        seriesFavoritas,
        juegosFavoritos,
        hobbies,
        artistasSpotify,
        centroEstudios,
        trabajo,
        zodiaco,
        nivelEscolaridad,
        personalidad,
        estiloComunicacion,
        recibirAmor,
        queBuscas,
        pronombres,
        genero,
        orientacionSexual,
        mostrarGenero,
        mostrarOrientacion,
        altura,
        idiomas: payloadIdiomas,
        habitos: {
          mascotas, beber, fumar, ejercicio, alimentacion, redesSociales, habitosSueno, carrete, vacaciones, transporte
        },
        mapaValores: {
          planesHijos
        },
        mostrarEdad,
        mostrarDistancia,
        cancion,
        audioRompehielos,
      });
      if (response.usuario) {
        actualizarUsuario(response.usuario);
        setModalInfo({ title: '¡Guardado!', message: 'Tu perfil fue actualizado con éxito', emoji: '✅', tone: 'success' });
      }
    } catch (error) {
      setModalInfo({ title: 'Error', message: 'No se pudieron guardar los cambios', emoji: '😞' });
    } finally {
      setGuardando(false);
    }
  };

  const renderGridRow = (startIndex) => {
    return (
      <View style={styles.gridRow}>
        {[0, 1, 2].map((offset) => {
          const idx = startIndex + offset;
          const url = fotosGaleria[idx];
          return (
            <View key={idx} style={styles.gridItem}>
              {url ? (
                <View style={{ flex: 1 }}>
                  <Image source={{ uri: url }} style={styles.gridImage} />
                  <TouchableOpacity style={styles.removePhotoBtn} onPress={() => eliminarFotoGaleria(idx)}>
                    <Ionicons name="close" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addPhotoBtn} onPress={() => agregarFotoGaleria(idx)}>
                  <Ionicons name="add" size={30} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderPill = (icon, text) => {
    if (!text) return null;
    
    // Si el texto es un objeto (de las selecciones de personalidad o zodiaco)
    let display = typeof text === 'object' ? `${text.icon} ${text.label}` : text;
    
    return (
      <View style={styles.pill}>
        <Ionicons name={icon} size={14} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
        <Text style={styles.pillText}>{display}</Text>
      </View>
    );
  };

  const renderInteresCard = (title, iconName, selectedItems, onPress) => {
    const hasItems = selectedItems && selectedItems.length > 0;
    
    return (
      <TouchableOpacity style={styles.interesCard} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.interesEditIcon}>
          <Ionicons name="pencil" size={12} color={COLORS.textPrimary} />
        </View>
        
        <View style={styles.interesContent}>
          {hasItems ? (
            <View style={styles.interesPostersContainer}>
              {selectedItems.slice(0, 3).map((item, index) => {
                // Hobbies usaba 'icon' o emojis, pero series/juegos/pelis usan 'poster' o 'foto'
                const imageUrl = item.poster || item.foto;
                
                if (imageUrl) {
                  return (
                    <Image 
                      key={item.id || index} 
                      source={{ uri: imageUrl }} 
                      style={[
                        styles.interesMiniPoster, 
                        { 
                          zIndex: 3 - index,
                          transform: [
                            { translateX: index * -15 },
                            { rotate: index === 0 ? '-5deg' : index === 1 ? '5deg' : '0deg' }
                          ] 
                        }
                      ]} 
                    />
                  );
                } else {
                  return (
                    <View 
                      key={item.id || index} 
                      style={[
                        styles.interesMiniPosterText, 
                        { 
                          zIndex: 3 - index,
                          transform: [{ translateX: index * -15 }] 
                        }
                      ]}
                    >
                      <Text style={{fontSize: 24}}>{item.icon || '📌'}</Text>
                    </View>
                  );
                }
              })}
            </View>
          ) : (
            <View style={[styles.interesIconWrap, { backgroundColor: 'transparent' }]}>
              <Ionicons name={iconName} size={36} color={COLORS.primario} style={{opacity: 0.5}} />
            </View>
          )}
        </View>

        <View style={styles.interesTextContainer}>
          <Text style={styles.interesCardTitle}>{title}</Text>
          {hasItems ? (
            <Text style={styles.interesCardSubtitle} numberOfLines={1}>
              {selectedItems[0].titulo || selectedItems[0].nombre || selectedItems[0].label || 'Varios'}
              {selectedItems.length > 1 ? `, +${selectedItems.length - 1}` : ''}
            </Text>
          ) : (
            <Text style={styles.interesCardSubtitle}>Agregar</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderListGroupRow = (iconName, label, value, onPress, isLast = false) => {
    let displayValue = value;
    if (typeof value === 'object') {
      displayValue = `${value.icon} ${value.label}`;
    }

    return (
      <TouchableOpacity style={[styles.listGroupRow, !isLast && { borderBottomWidth: 1, borderBottomColor: COLORS.border }]} onPress={onPress}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name={iconName} size={20} color={COLORS.textMuted} style={{ marginRight: 12 }} />
          <Text style={styles.listGroupLabel}>{label}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.listGroupValue, !displayValue && { color: COLORS.textMuted }]}>{displayValue || 'Vacío'}</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 8 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── HEADER TABS ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.primario} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'editar' && styles.tabButtonActive]} onPress={() => setActiveTab('editar')}>
          <Text style={[styles.tabText, activeTab === 'editar' && styles.tabTextActive]}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'vistaprevia' && styles.tabButtonActive]} onPress={() => setActiveTab('vistaprevia')}>
          <Text style={[styles.tabText, activeTab === 'vistaprevia' && styles.tabTextActive]}>Vista previa</Text>
        </TouchableOpacity>
      </View>

      {/* ── VISTA PREVIA ── */}
      {activeTab === 'vistaprevia' ? (
        <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.publicCard}>
            <Image source={{ uri: fotoPrincipal }} style={styles.publicImage} />
            <View style={styles.publicOverlay}>
              <Text style={styles.publicName}>{usuario?.nombre}, {mostrarEdad ? (usuario?.edad || 18) : ''}</Text>
              <View style={styles.publicLocationRow}>
                <Ionicons name="location" size={15} color="#FFF" />
                <Text style={styles.publicLocation}>{ciudad || 'Tu ciudad'} {mostrarDistancia ? '· a 2 km' : ''}</Text>
              </View>
            </View>
          </View>
          <View style={styles.previewContent}>
            
            <View style={styles.pillsContainer}>
              {hobbies.map(h => renderPill(h.icon, h.nombre))}
              {mostrarGenero && renderPill("person", genero)}
              {mostrarOrientacion && renderPill("heart", orientacionSexual)}
              {renderPill("school", centroEstudios)}
              {renderPill("briefcase", trabajo)}
              {renderPill("book", nivelEscolaridad)}
              {renderPill("moon", zodiaco)}
              {renderPill("people", planesHijos)}
              {renderPill("finger-print", personalidad)}
              {renderPill("chatbubbles", estiloComunicacion)}
              {renderPill("heart", recibirAmor)}
              {renderPill("paw", mascotas)}
              {renderPill("wine", beber)}
              {renderPill("flame", fumar)}
              {renderPill("barbell", ejercicio)}
              {renderPill("restaurant", alimentacion)}
              {renderPill("phone-portrait", redesSociales)}
              {renderPill("bed", habitosSueno)}
              {renderPill("musical-notes", carrete)}
              {renderPill("airplane", vacaciones)}
              {renderPill("bus", transporte)}
              {queBuscas ? (
                renderPill("eye", queBuscas)
              ) : null}
              {renderPill("person", pronombres)}
              {renderPill("resize", altura ? `${altura} cm` : '')}
              {renderPill("language", idiomas)}
            </View>

            {descripcion ? <Text style={styles.publicBio}>{descripcion}</Text> : null}
            
            {cancion && cancion.nombre && (
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>Mi himno musical</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={{ uri: cancion.foto }} style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12 }} />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textPrimary }}>{cancion.nombre}</Text>
                </View>
              </View>
            )}

            {prompts.map((p, idx) => (
              <View key={idx} style={styles.previewPrompt}>
                <Text style={styles.previewPromptQ}>{p.pregunta}</Text>
                <Text style={styles.previewPromptA}>{p.respuesta}</Text>
              </View>
            ))}

            {peliculasFavoritas.length > 0 && (
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>Películas que me gustan</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {peliculasFavoritas.map(m => (
                    <Image key={m.id} source={{ uri: m.poster }} style={styles.previewMoviePoster} />
                  ))}
                </ScrollView>
              </View>
            )}

            {seriesFavoritas.length > 0 && (
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>Series que me gustan</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {seriesFavoritas.map(m => (
                    <Image key={m.id} source={{ uri: m.poster }} style={styles.previewMoviePoster} />
                  ))}
                </ScrollView>
              </View>
            )}

            {juegosFavoritos.length > 0 && (
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>Juegos que me gustan</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {juegosFavoritos.map(m => (
                    <Image key={m.id} source={{ uri: m.poster }} style={styles.previewMoviePoster} />
                  ))}
                </ScrollView>
              </View>
            )}

            {artistasSpotify.length > 0 && (
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>Artistas favoritos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {artistasSpotify.map(a => (
                    <View key={a.id} style={{ alignItems: 'center' }}>
                      <Image source={{ uri: a.foto }} style={styles.previewArtistImage} />
                      <Text style={styles.previewArtistName}>{a.nombre}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        /* ── EDITAR ── */
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
          
          <View style={styles.photoGrid}>
            {renderGridRow(0)}
            {renderGridRow(3)}
            <Text style={styles.photoHint}>Mantén presionado para ordenar tus fotos.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acerca de mí</Text>
            <View style={styles.bioContainer}>
              <TextInput
                style={styles.bioInput}
                placeholder="No dejes esto en blanco..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                maxLength={500}
                value={descripcion}
                onChangeText={setDescripcion}
              />
              <Text style={styles.bioCount}>{500 - descripcion.length}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metas de tu relación</Text>
            <View style={styles.listGroup}>
              {renderListGroupRow('eye', 'Busco', queBuscas, () => openSelector('Busco', OPTIONS.metaRelacion, queBuscas, setQueBuscas), true)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pronombres</Text>
            <View style={styles.listGroup}>
              {renderListGroupRow('chatbubble-ellipses', 'Agregar pronombres', pronombres, () => openSelector('Pronombres', OPTIONS.pronombres, pronombres, setPronombres), true)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identidad</Text>
            <View style={styles.listGroup}>
              {renderListGroupRow('person', 'Mi género', genero, () => openSelector('Mi género', OPTIONS.genero, genero, setGenero))}
              {renderListGroupRow('heart', 'Mi orientación sexual', orientacionSexual, () => openSelector('Mi orientación sexual', OPTIONS.orientacionSexual, orientacionSexual, setOrientacionSexual), true)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Altura</Text>
            <View style={styles.listGroup}>
              {renderListGroupRow('resize', 'Altura en cm', altura ? `${altura} cm` : '', () => openTextEdit('altura', altura), true)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Idiomas que hablo</Text>
            <View style={styles.listGroup}>
              {renderListGroupRow('language', 'Agregar idiomas', idiomas, () => openTextEdit('idiomas', idiomas), true)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Más sobre mí</Text>
            <View style={styles.listGroup}>
              {renderListGroupRow('moon', 'Zodiaco', zodiaco, () => openSelector('Zodiaco', OPTIONS.zodiaco, zodiaco, setZodiaco))}
              {renderListGroupRow('school', 'Educación', nivelEscolaridad, () => openSelector('Educación', OPTIONS.educacion, nivelEscolaridad, setNivelEscolaridad))}
              {renderListGroupRow('people', 'Planes familiares', planesHijos, () => openSelector('Planes familiares', OPTIONS.hijos, planesHijos, setPlanesHijos))}
              {renderListGroupRow('finger-print', 'Tipo de personalidad', personalidad, () => openSelector('Tipo de personalidad', OPTIONS.personalidad, personalidad, setPersonalidad))}
              
              <TouchableOpacity onPress={() => Linking.openURL('https://www.16personalities.com/es')} style={styles.linkRow}>
                <Ionicons name="link-outline" size={14} color={COLORS.primario} />
                <Text style={[styles.linkText, { color: COLORS.primario }]}>¿No sabes cuál eres? Haz el test oficial aquí.</Text>
              </TouchableOpacity>

              {renderListGroupRow('chatbubbles', 'Estilo de comunicación', estiloComunicacion, () => openSelector('Estilo de comunicación', OPTIONS.comunicacion, estiloComunicacion, setEstiloComunicacion))}
              {renderListGroupRow('heart', 'Estilo de amor', recibirAmor, () => openSelector('Estilo de amor', OPTIONS.amor, recibirAmor, setRecibirAmor), true)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estilo de vida</Text>
            <View style={styles.listGroup}>
              {renderListGroupRow('paw', 'Mascotas', mascotas, () => openSelector('Mascotas', OPTIONS.mascotas, mascotas, setMascotas))}
              {renderListGroupRow('wine', 'Beber', beber, () => openSelector('Beber', OPTIONS.beber, beber, setBeber))}
              {renderListGroupRow('flame', 'Fumar', fumar, () => openSelector('Fumar', OPTIONS.fumar, fumar, setFumar))}
              {renderListGroupRow('barbell', 'Ejercicio', ejercicio, () => openSelector('Ejercicio', OPTIONS.ejercicio, ejercicio, setEjercicio))}
              {renderListGroupRow('restaurant', 'Alimentación', alimentacion, () => openSelector('Alimentación', OPTIONS.alimentacion, alimentacion, setAlimentacion))}
              {renderListGroupRow('phone-portrait', 'Redes sociales', redesSociales, () => openSelector('Redes sociales', OPTIONS.redes, redesSociales, setRedesSociales))}
              {renderListGroupRow('bed', 'Hábitos de sueño', habitosSueno, () => openSelector('Hábitos de sueño', OPTIONS.sueno, habitosSueno, setHabitosSueno))}
              {renderListGroupRow('musical-notes', 'El Carrete', carrete, () => openSelector('El Carrete', OPTIONS.carrete, carrete, setCarrete))}
              {renderListGroupRow('airplane', 'Vacaciones', vacaciones, () => openSelector('Vacaciones ideales', OPTIONS.vacaciones, vacaciones, setVacaciones))}
              {renderListGroupRow('bus', 'Transporte', transporte, () => openSelector('Para moverse', OPTIONS.transporte, transporte, setTransporte), true)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles Laborales y Ubicación</Text>
            <View style={styles.listGroup}>
              {renderListGroupRow('business', 'Centro de estudios', centroEstudios, () => openTextEdit('centroEstudios', centroEstudios))}
              {renderListGroupRow('briefcase', 'Puesto de trabajo', trabajo, () => openTextEdit('trabajo', trabajo))}
              {renderListGroupRow('location', 'Vivo en', ciudad, () => openTextEdit('ciudad', ciudad), true)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mis Preguntas</Text>
            <ProfilePrompts prompts={prompts} onChange={setPrompts} COLORS={COLORS} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mi Audio Rompehielos 🎤</Text>
            <View style={{ backgroundColor: COLORS.tarjeta, padding: 15, borderRadius: 15, ...SHADOWS.sm }}>
              <Text style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 15 }}>Graba un saludo de 10 segundos para que te escuchen antes de dar like.</Text>
              
              {audioRompehielos ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 10, borderRadius: 10 }}>
                  <TouchableOpacity onPress={isPlaying ? stopProfileAudio : playProfileAudio} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={isPlaying ? "pause" : "play"} size={20} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={{ color: '#3B82F6', fontWeight: 'bold', marginLeft: 10, flex: 1 }}>Audio guardado</Text>
                  <TouchableOpacity onPress={() => setAudioRompehielos(null)}>
                    <Ionicons name="trash" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  onPressIn={startRecordingAudio}
                  onPressOut={stopRecordingAudio}
                  style={{ backgroundColor: isRecording ? '#EF4444' : COLORS.primario, padding: 15, borderRadius: 25, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                >
                  <Ionicons name="mic" size={20} color="#FFF" />
                  <Text style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 8 }}>{isRecording ? 'Grabando... Suelta para terminar' : 'Mantén presionado para grabar'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── INTERESES GRID ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Intereses</Text>
            <View style={styles.interesesGrid}>
              {renderInteresCard('Hobbies', 'flash', hobbies, () => setModalHobbies(true))}
              {renderInteresCard('Películas', 'film', peliculasFavoritas, () => setModalMovies(true))}
              {renderInteresCard('Shows', 'tv', seriesFavoritas, () => setModalSeries(true))}
              {renderInteresCard('Juegos', 'game-controller', juegosFavoritos, () => setModalJuegos(true))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mi canción</Text>
            <TouchableOpacity style={styles.rowItem} onPress={() => setModalAppleMusic(true)}>
              {cancion && cancion.nombre ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Image source={{ uri: cancion.foto }} style={{ width: 32, height: 32, borderRadius: 8, marginRight: 10 }} />
                  <Text style={[styles.rowLabel, { flex: 1 }]} numberOfLines={1}>{cancion.nombre}</Text>
                </View>
              ) : (
                <Text style={styles.rowLabel}>Elegir mi canción</Text>
              )}
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mis artistas favoritos</Text>
            <TouchableOpacity style={styles.rowItem} onPress={() => setModalSpotify(true)}>
              <Text style={[styles.rowLabel, artistasSpotify.length > 0 && { color: COLORS.primario }]}>
                {artistasSpotify.length > 0 ? `${artistasSpotify.length} seleccionados` : 'Agregar artistas a mi perfil'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Controla tu perfil</Text>
            <View style={styles.rowItemSwitch}>
              <Text style={styles.rowLabel}>No mostrar mi edad</Text>
              <Switch value={!mostrarEdad} onValueChange={(val) => setMostrarEdad(!val)} trackColor={{ true: COLORS.primario }} />
            </View>
            <View style={styles.rowItemSwitch}>
              <Text style={styles.rowLabel}>No mostrar mi distancia</Text>
              <Switch value={!mostrarDistancia} onValueChange={(val) => setMostrarDistancia(!val)} trackColor={{ true: COLORS.primario }} />
            </View>
            <View style={styles.rowItemSwitch}>
              <Text style={styles.rowLabel}>Mostrar mi género</Text>
              <Switch value={mostrarGenero} onValueChange={setMostrarGenero} trackColor={{ true: COLORS.primario }} />
            </View>
            <View style={styles.rowItemSwitch}>
              <Text style={styles.rowLabel}>Mostrar mi orientación sexual</Text>
              <Switch value={mostrarOrientacion} onValueChange={setMostrarOrientacion} trackColor={{ true: COLORS.primario }} />
            </View>
          </View>
        </ScrollView>
      )}

      {/* ── BOTON GUARDAR ── */}
      {activeTab === 'editar' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={[styles.btnSave, guardando && { opacity: 0.7 }]} onPress={guardarDetalles} disabled={guardando}>
            {guardando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnSaveText}>Guardar Perfil</Text>}
          </TouchableOpacity>
        </View>
      )}

      <MovieSelectorModal visible={modalMovies} onClose={() => setModalMovies(false)} selectedMovies={peliculasFavoritas} onSave={setPeliculasFavoritas} COLORS={COLORS} />
      <TvSeriesSelectorModal visible={modalSeries} onClose={() => setModalSeries(false)} selectedSeries={seriesFavoritas} onSave={setSeriesFavoritas} COLORS={COLORS} />
      <JuegosSelectorModal visible={modalJuegos} onClose={() => setModalJuegos(false)} selectedJuegos={juegosFavoritos} onSave={setJuegosFavoritos} COLORS={COLORS} />
      <HobbiesSelectorModal visible={modalHobbies} onClose={() => setModalHobbies(false)} selectedHobbies={hobbies} onSave={setHobbies} COLORS={COLORS} />
      <SpotifySelectorModal visible={modalSpotify} onClose={() => setModalSpotify(false)} selectedArtists={artistasSpotify} onSave={setArtistasSpotify} COLORS={COLORS} />
      <AppleMusicSelectorModal visible={modalAppleMusic} onClose={() => setModalAppleMusic(false)} onSave={setCancion} COLORS={COLORS} />
      
      {selectorConfig && (
        <GenericSelectorModal
          visible={selectorConfig.visible}
          title={selectorConfig.title}
          options={selectorConfig.options}
          selectedValue={selectorConfig.selectedValue}
          onSave={selectorConfig.onSave}
          onClose={() => setSelectorConfig(null)}
          COLORS={COLORS}
        />
      )}

      {/* Modal genérico para edición de texto simple */}
      <Modal visible={!!editingField} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={styles.textEditCard}>
            <Text style={styles.textEditTitle}>
              {editingField === 'centroEstudios' ? 'Centro de estudios' : 
               editingField === 'trabajo' ? 'Puesto de trabajo' : 
               editingField === 'altura' ? 'Tu altura (cm)' :
               editingField === 'idiomas' ? 'Idiomas (ej. Español, Inglés)' : 'Ciudad'}
            </Text>
            <TextInput
              style={styles.textEditInput}
              value={tempValue}
              onChangeText={setTempValue}
              autoFocus
              keyboardType={editingField === 'altura' ? 'numeric' : 'default'}
              placeholder="Escribe aquí..."
              placeholderTextColor={COLORS.textMuted}
            />
            <View style={styles.textEditActions}>
              <TouchableOpacity onPress={() => setEditingField(null)} style={{ padding: 12 }}><Text style={{ color: COLORS.textMuted, fontSize: 16 }}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveTextEdit} style={{ padding: 12 }}><Text style={{ color: COLORS.primario, fontSize: 16, fontWeight: '800' }}>Aceptar</Text></TouchableOpacity>
            </View>
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
        onClose={() => setModalInfo(null)}
      />
    </SafeAreaView>
  );
}

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBackBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: COLORS.primario,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
  },
  photoGrid: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    height: 140,
  },
  gridItem: {
    flex: 1,
    backgroundColor: COLORS.tarjeta,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  addPhotoBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoBtn: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primario,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  photoHint: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginLeft: 4,
  },
  listGroup: {
    backgroundColor: COLORS.tarjeta,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  listGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  listGroupLabel: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  listGroupValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  bioContainer: {
    backgroundColor: COLORS.tarjeta,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bioInput: {
    color: COLORS.textPrimary,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bioCount: {
    textAlign: 'right',
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.tarjeta,
    padding: 16,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowItemSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.tarjeta,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  interesesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interesCard: {
    width: '48%',
    backgroundColor: COLORS.fondo, // O puedes usar un color más claro si es dark mode
    borderRadius: RADIUS.xl,
    padding: 16,
    height: 140,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  interesEditIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.tarjeta,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  interesContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  interesPostersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingLeft: 20, // offset for negative translate
  },
  interesMiniPoster: {
    width: 45,
    height: 65,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.fondo,
    backgroundColor: COLORS.tarjeta,
  },
  interesMiniPosterText: {
    width: 45,
    height: 65,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.fondo,
    backgroundColor: COLORS.tarjeta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interesIconWrap: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interesTextContainer: {
    alignItems: 'center',
    width: '100%',
  },
  interesCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  interesCardSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bg,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  btnSave: {
    backgroundColor: COLORS.primario,
    padding: 16,
    borderRadius: 28,
    alignItems: 'center',
    ...SHADOWS.dark,
  },
  btnSaveText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  textEditCard: {
    backgroundColor: COLORS.tarjeta,
    borderRadius: RADIUS.lg,
    padding: 20,
    ...SHADOWS.medium,
  },
  textEditTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  textEditInput: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primario,
    fontSize: 18,
    color: COLORS.textPrimary,
    paddingVertical: 8,
    marginBottom: 20,
  },
  textEditActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  // Preview Styles
  previewScroll: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  publicCard: {
    height: 500,
    backgroundColor: COLORS.fondo,
    position: 'relative',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  publicImage: {
    width: '100%',
    height: '100%',
  },
  publicOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingTop: 100,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  publicName: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
  },
  publicLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  publicLocation: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  previewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tarjeta,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  publicBio: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: 24,
  },
  previewPrompt: {
    backgroundColor: COLORS.tarjeta,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  previewPromptQ: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    opacity: 0.7,
    marginBottom: 4,
  },
  previewPromptA: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    fontFamily: FONTS.display,
  },
  previewSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  previewMoviePoster: {
    width: 100,
    height: 150,
    borderRadius: 8,
  },
  previewArtistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  previewArtistName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  }
});
