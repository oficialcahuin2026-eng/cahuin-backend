import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOWS } from '../utils/theme';

const CIUDADES_COORDS = [
  { nombre: 'Arica', latitude: -18.4783, longitude: -70.3126 },
  { nombre: 'Antofagasta', latitude: -23.6509, longitude: -70.3975 },
  { nombre: 'La Serena', latitude: -29.9027, longitude: -71.2520 },
  { nombre: 'Santiago', latitude: -33.4489, longitude: -70.6693 },
  { nombre: 'Curicó', latitude: -34.9856, longitude: -71.2394 },
  { nombre: 'Concepción', latitude: -36.8201, longitude: -73.0444 },
  { nombre: 'Temuco', latitude: -38.7359, longitude: -72.5904 },
  { nombre: 'Punta Arenas', latitude: -53.1638, longitude: -70.9171 }
];

export default function MapaConexionesScreen({ navigation }) {
  const { COLORS } = useTheme();
  const [lineasDeLuz, setLineasDeLuz] = useState([]);
  const [contadorMatches, setContadorMatches] = useState(148);

  useEffect(() => {
    // Simulador dinámico Socket.io: Encender líneas de luz de amor cada 3 segundos
    const interval = setInterval(() => {
      const origen = CIUDADES_COORDS[Math.floor(Math.random() * CIUDADES_COORDS.length)];
      let destino = CIUDADES_COORDS[Math.floor(Math.random() * CIUDADES_COORDS.length)];
      
      while (origen.nombre === destino.nombre) {
        destino = CIUDADES_COORDS[Math.floor(Math.random() * CIUDADES_COORDS.length)];
      }

      const nuevaLinea = {
        id: Date.now().toString(),
        coords: [
          { latitude: origen.latitude, longitude: origen.longitude },
          { latitude: destino.latitude, longitude: destino.longitude }
        ]
      };

      setLineasDeLuz(prev => [...prev.slice(-4), nuevaLinea]); // Mantener solo las últimas 5 en pantalla
      setContadorMatches(c => c + 1);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={26} color="white" /></TouchableOpacity>
        <Text style={styles.titulo}>Radar de Amor Chile 🇨🇱</Text>
        <View style={{ width: 26 }} />
      </View>

      <MapView
        style={styles.mapa}
        initialRegion={{ latitude: -36.8201, longitude: -71.2520, latitudeDelta: 25, longitudeDelta: 10 }}
        customMapStyle={DARK_MAP_STYLE}
      >
        {CIUDADES_COORDS.map((c, i) => (
          <Marker key={i} coordinate={{ latitude: c.latitude, longitude: c.longitude }}>
            <View style={styles.puntoCiudad} />
          </Marker>
        ))}

        {lineasDeLuz.map((linea) => (
          <Polyline key={linea.id} coordinates={linea.coords} strokeColor="#E53935" strokeWidth={3} lineDashPattern={[5, 5]} />
        ))}
      </MapView>

      <View style={[styles.contadorBox, SHADOWS.medium]}>
        <Text style={styles.contadorTxt}>🔥 {contadorMatches} matches ocurriendo al tiro</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#121212' },
  titulo: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  mapa: { flex: 1 },
  puntoCiudad: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' },
  contadorBox: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: '#121212', padding: 15, borderRadius: RADIUS.lg, alignItems: 'center', borderWith: 1, borderColor: '#222' },
  contadorTxt: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

const DARK_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];