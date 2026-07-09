import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/api';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../utils/theme';

export default function TrendingScreen({ navigation }) {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const [trending, setTrending] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [scope, setScope] = useState('region');

  useEffect(() => {
    const fetchTrending = async () => {
      setCargando(true);
      try {
        const data = await userService.getTrending({ scope });
        setTrending(data.trending || []);
      } catch (error) { console.log(error); } finally { setCargando(false); }
    };
    fetchTrending();
  }, [scope]);

  const renderItem = ({ item, index }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OtroPerfil', { usuario: item })}>
      <Text style={styles.rank}>#{index + 1}</Text>
      <Image source={{ uri: item.foto || 'https://via.placeholder.com/100' }} style={styles.foto} />
      <View style={styles.info}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.nombre}>{item.nombre}, {item.edad}</Text>
          {index < 3 && <MaterialCommunityIcons name="crown" size={20} color="#FFD700" style={{ marginLeft: 5 }} />}
        </View>
        <Text style={styles.ciudad}>{item.ciudad}</Text>
        {item.arquetipoCahuinero && <Text style={styles.arquetipo}>{item.arquetipoCahuinero}</Text>}
      </View>
      <View style={styles.likesCaja}>
        <Ionicons name="heart" size={16} color={COLORS.primario} />
        <Text style={styles.likesTexto}>{item.likesRecibidos}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={26} color={COLORS.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitulo}>Top Cahuines 🔥</Text>
        <View style={{ width: 26 }} />
      </View>
      <Text style={styles.subtitulo}>Los perfiles más cotizados esta semana.</Text>

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, scope === 'region' && styles.tabActive]} onPress={() => setScope('region')}>
          <Text style={[styles.tabText, scope === 'region' && styles.tabTextActive]}>Tu Región</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, scope === 'nacional' && styles.tabActive]} onPress={() => setScope('nacional')}>
          <Text style={[styles.tabText, scope === 'nacional' && styles.tabTextActive]}>Todo Chile</Text>
        </TouchableOpacity>
      </View>

      {cargando ? <ActivityIndicator size="large" color={COLORS.primario} style={{ marginTop: 50 }} /> : (
        <FlatList data={trending} keyExtractor={item => item._id} renderItem={renderItem} contentContainerStyle={styles.lista} />
      )}
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: COLORS.border },
  headerTitulo: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, fontFamily: FONTS.display },
  subtitulo: { padding: 20, color: COLORS.textMuted, fontSize: 15, textAlign: 'center' },
  lista: { paddingHorizontal: 20, paddingBottom: 50 },
  card: { flexDirection: 'row', backgroundColor: COLORS.tarjeta, padding: 15, borderRadius: RADIUS.lg, marginBottom: 15, alignItems: 'center', ...SHADOWS.sm, borderWidth: 1, borderColor: COLORS.border },
  rank: { fontSize: 20, fontWeight: 'bold', color: COLORS.primario, marginRight: 15, width: 35 },
  foto: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  info: { flex: 1 },
  nombre: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  ciudad: { fontSize: 13, color: COLORS.textMuted },
  arquetipo: { fontSize: 12, color: COLORS.primario, marginTop: 2, fontWeight: 'bold' },
  likesCaja: { alignItems: 'center', backgroundColor: 'rgba(229, 57, 53, 0.1)', padding: 10, borderRadius: 10 },
  likesTexto: { color: COLORS.primario, fontWeight: 'bold', fontSize: 14, marginTop: 2 },
  tabsContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 16 },
  tabActive: { backgroundColor: COLORS.primario },
  tabText: { color: COLORS.textMuted, fontWeight: 'bold' },
  tabTextActive: { color: '#FFF' }
});