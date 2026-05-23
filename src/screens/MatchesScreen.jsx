import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { Ionicons } from '@expo/vector-icons';

export default function MatchesScreen() {
  const [perfiles, setPerfiles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [swipes, setSwipes] = useState(0);
  const [termino, setTermino] = useState(false);
  const swiperRef = useRef(null);
  
  const isPremium = false; 
  const LIMITE_GRATIS = 5;
  
  // Definimos la ciudad del usuario actual para el filtro
  const miCiudad = "Temuco"; 

  // LLAMADA A LA BASE DE DATOS REAL
  useEffect(() => {
    const cargarCahuineros = async () => {
      try {
        // ⚠️ RECUERDA: Cambia esta IP por la tuya exacta si cambia
        const respuesta = await fetch(`http://192.168.1.13:5000/api/users?ciudad=${miCiudad}`);
        const data = await respuesta.json();
        
        if (respuesta.ok) {
          setPerfiles(data);
        } else {
          Alert.alert("Error", "No se pudieron cargar los perfiles");
        }
      } catch (error) {
        console.log("❌ Error trayendo usuarios de la BD:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarCahuineros();
  }, []);

  const manejarDeslizamiento = (index) => {
    if (!perfiles[index]) return;

    const nuevosSwipes = swipes + 1;
    setSwipes(nuevosSwipes);

    if (!isPremium && nuevosSwipes >= LIMITE_GRATIS) {
      Alert.alert(
        "¡Límite alcanzado! 🛑",
        "Ya gastaste tus pases gratuitos. Hazte Premium para seguir viendo cahuines.",
        [{ text: "Quizás más tarde", style: "cancel" }]
      );
    }
  };

  // Pantalla de carga mientras lee MongoDB
  if (cargando) {
    return (
      <View style={styles.finContainer}>
        <ActivityIndicator size="large" color="#FF5864" />
        <Text style={{ marginTop: 10, color: '#888' }}>Buscando cahuineros cerca...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!termino && perfiles.length > 0 ? (
        <View style={styles.swiperContainer}>
          <Swiper
            ref={swiperRef}
            cards={perfiles}
            renderCard={(card) => {
              if (!card) return <View style={styles.card} />;
              return (
                <View style={styles.card}>
                  {/* Si no tiene foto subida, muestra una silueta por defecto */}
                  <Image 
                    source={{ uri: card.foto || 'https://via.placeholder.com/400x400.png?text=Sin+Foto' }} 
                    style={styles.foto} 
                  />
                  <View style={styles.infoContainer}>
                    <Text style={styles.nombre}>{card.nombre}</Text>
                    <Text style={styles.ciudad}><Ionicons name="location" size={16} /> {card.ciudad}</Text>
                  </View>
                </View>
              );
            }}
            onSwipedLeft={(index) => manejarDeslizamiento(index)}
            onSwipedRight={(index) => manejarDeslizamiento(index)}
            onSwipedAll={() => setTermino(true)}
            cardIndex={0}
            backgroundColor={'transparent'}
            stackSize={3}
            disableLeftSwipe={!isPremium && swipes >= LIMITE_GRATIS}
            disableRightSwipe={!isPremium && swipes >= LIMITE_GRATIS}
          />
        </View>
      ) : (
        <View style={styles.finContainer}>
          <Text style={styles.finTexto}>¡No hay más personas en {miCiudad} por hoy!</Text>
        </View>
      )}

      {/* BOTONES DE ACCIÓN */}
      {!termino && perfiles.length > 0 && (
        <View style={styles.botonesContainer}>
          <TouchableOpacity style={[styles.boton, styles.botonPasar]} onPress={() => swiperRef.current.swipeLeft()}>
            <Ionicons name="close" size={32} color="#FF5864" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.boton, styles.botonLike]} onPress={() => swiperRef.current.swipeRight()}>
            <Ionicons name="heart" size={32} color="#4CCC93" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  swiperContainer: { flex: 1, marginTop: -30 },
  card: { flex: 0.75, borderRadius: 15, backgroundColor: '#fff', elevation: 5, overflow: 'hidden' },
  foto: { width: '100%', height: '100%' },
  infoContainer: { position: 'absolute', bottom: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  nombre: { fontSize: 26, color: 'white', fontWeight: 'bold' },
  ciudad: { fontSize: 16, color: '#ddd', marginTop: 2 },
  finContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  finTexto: { fontSize: 18, fontWeight: 'bold', color: '#555', textAlign: 'center', paddingHorizontal: 20 },
  botonesContainer: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingBottom: 30, position: 'absolute', bottom: 0, width: '100%' },
  boton: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 4 }
});