import React from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Asegúrate de tener instalado expo-vector-icons

// USANDO LA PALETA DE COLORES OFICIAL DE CAHUÍN 🌶️
const CAHUIN_RED = '#D32F2F';
const CAHUIN_PINK = '#FF80AB';
const TEXT_COLOR = '#212121';

// DATOS DE PRUEBA (MOCK DATA) PARA EL DISEÑO
const userPhotos = [
  { id: '1', url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=300&auto=format&fit=crop' }, // Foto 1 ( thumbnails)
  { id: '2', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop' }, // Foto 2
  { id: '3', url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=300&auto=format&fit=crop' }, // Foto 3
  // ... agrega más fotos si quieres
];

const ProfileGallery = () => {

  // RENDERIZADO DE CADA FOTO PEQUEÑA (THUMBNAIL)
  const renderPhotoItem = ({ item }) => (
    <TouchableOpacity style={styles.photoContainer}>
      <Image source={{ uri: item.url }} style={styles.thumbnailPhoto} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* SECCIÓN DEL TÍTULO DE LA GALERÍA */}
      <View style={styles.header}>
        <Text style={styles.title}>Galería de Fotos</Text>
        
        {/* BOTÓN "+" PARA AGREGAR FOTOS (Como en el diseño) */}
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* LISTA HORIZONTAL DESLIZABLE */}
      <FlatList
        data={userPhotos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id}
        horizontal={true} // Hacemos que la lista sea horizontal
        showsHorizontalScrollIndicator={false} // Ocultamos la barra de scroll
        contentContainerStyle={styles.galleryList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    letterSpacing: 0.5,
  },
  addButton: {
    backgroundColor: CAHUIN_RED, // Usando el rojo ají 🌶️
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  galleryList: {
    paddingVertical: 5,
  },
  photoContainer: {
    marginRight: 12, // Espaciado entre fotos
    borderRadius: 12,
    overflow: 'hidden', // Para que la imagen respete los bordes redondeados
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  thumbnailPhoto: {
    width: 80, // Medida perfecta para que entren varias en pantalla
    height: 80,
    resizeMode: 'cover',
  },
});

export default ProfileGallery;