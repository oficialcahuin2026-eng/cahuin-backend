const mongoose = require('mongoose');
const Panorama = require('../models/Panorama'); 
require('dotenv').config(); 

// 🌟 FIX 1: Importamos tu conexión real de la app (la que sabemos que funciona perfecto)
const conectarDB = require('../config/db'); 

const eventosOficiales = [
  // 🌟 ARICA Y PARINACOTA (Junio)
  { region: 'Arica y Parinacota', lugar: 'Antay Hotel & Spa, Arica', titulo: 'Luis Jara - "Más que Suerte"', descripcion: 'Concierto pop/romántico.', fecha: new Date('2026-06-05T20:00:00Z'), categoria: 'Música', emoji: '🎤' },
  { region: 'Arica y Parinacota', lugar: 'Maestranza Brasil #117, Arica', titulo: 'Tren Turístico Arica – Central', descripcion: 'Experiencia cultural y musical en tren histórico.', fecha: new Date('2026-06-06T10:00:00Z'), categoria: 'Cultura', emoji: '🚂' },
  { region: 'Arica y Parinacota', lugar: 'Chapiquiña, Putre', titulo: 'Festival de la Papa Chiquiza', descripcion: 'Festival andino con música y tradiciones locales.', fecha: new Date('2026-06-06T12:00:00Z'), categoria: 'Feria', emoji: '🥔' },
  { region: 'Arica y Parinacota', lugar: 'Centro Cultural Junta de Adelanto, Arica', titulo: 'Festival Suena Norte 2026', descripcion: 'Festival regional de música.', fecha: new Date('2026-06-13T19:00:00Z'), categoria: 'Música', emoji: '🏜️' },
  { region: 'Arica y Parinacota', lugar: 'Hotel del Valle, Arica', titulo: 'La Sociedad - "El Regreso"', descripcion: 'Pop romántico chileno.', fecha: new Date('2026-06-25T21:00:00Z'), categoria: 'Música', emoji: '🎸' },
  { region: 'Arica y Parinacota', lugar: 'Arica', titulo: 'Pastor Rocha', descripcion: 'Stand up comedy nacional.', fecha: new Date('2026-06-25T22:00:00Z'), categoria: 'Comedia', emoji: '😂' },
  // 🌟 ARICA Y PARINACOTA (Julio)
  { region: 'Arica y Parinacota', lugar: 'Terraza Mestiza, Arica', titulo: 'Luis Hachen en Arica', descripcion: 'Show del comediante Luis Hachen en formato club.', fecha: new Date('2026-07-04T20:00:00Z'), categoria: 'Comedia', emoji: '😂', imagen: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=900' },
  { region: 'Arica y Parinacota', lugar: 'Complejo Valle Nuevo, Arica', titulo: 'San Marcos de Arica Fem vs Cobreloa Fem', descripcion: 'Fecha del Campeonato de Ascenso Femenino.', fecha: new Date('2026-07-05T12:00:00Z'), categoria: 'Deporte', emoji: '⚽', imagen: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=900' },
  { region: 'Arica y Parinacota', lugar: 'Hotel Antay Arica', titulo: 'Brain Damage – Pink Floyd Tour 2026', descripcion: 'Tributo internacional a Pink Floyd.', fecha: new Date('2026-07-10T20:00:00Z'), categoria: 'Música', emoji: '🎸', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900' },
  { region: 'Arica y Parinacota', lugar: 'Morro de Arica / Playa La Lisera', titulo: 'Panamericano de Parapente', descripcion: 'Competencia internacional de parapente de precisión.', fecha: new Date('2026-07-10T10:00:00Z'), categoria: 'Deporte', emoji: '🪂', imagen: 'https://images.unsplash.com/photo-1506544777-64cfbe1142df?q=80&w=900' },
  { region: 'Arica y Parinacota', lugar: 'Teatro Municipal de Arica', titulo: 'Claudio Michaux presenta Isabel', descripcion: 'Stand up comedy nacional.', fecha: new Date('2026-07-11T20:00:00Z'), categoria: 'Comedia', emoji: '😂', imagen: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=900' },
  { region: 'Arica y Parinacota', lugar: 'Hotel Antay de Arica', titulo: 'Los Jaivas - 45 años', descripcion: 'Concierto de la gira aniversario Alturas de Macchu Picchu.', fecha: new Date('2026-07-11T20:00:00Z'), categoria: 'Música', emoji: '🎹', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900' },
  { region: 'Arica y Parinacota', lugar: 'Teatro Municipal de Arica', titulo: 'Concierto FOJI Arica y Parinacota', descripcion: 'Concierto de la Orquesta Sinfónica Juvenil Regional.', fecha: new Date('2026-07-12T18:00:00Z'), categoria: 'Cultura', emoji: '🎻', imagen: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=900' },
  { region: 'Arica y Parinacota', lugar: 'Complejo Valle Nuevo, Arica', titulo: 'SM Arica Fem vs Dep. Antofagasta Fem', descripcion: 'Fecha del Campeonato de Ascenso Femenino.', fecha: new Date('2026-07-12T12:00:00Z'), categoria: 'Deporte', emoji: '⚽', imagen: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=900' },
  { region: 'Arica y Parinacota', lugar: 'Club Nizza Arica', titulo: 'Iberia Unlimited', descripcion: 'Fiesta nocturna y aniversario de Casa Iberia.', fecha: new Date('2026-07-15T22:00:00Z'), categoria: 'Feria', emoji: '🥳', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900' },
  { region: 'Arica y Parinacota', lugar: 'Teatro Municipal de Arica', titulo: 'Chofi y Tapia - Por Amor o la Fuerza', descripcion: 'Show de stand up comedy en formato dúo.', fecha: new Date('2026-07-25T20:00:00Z'), categoria: 'Comedia', emoji: '😂', imagen: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=900' },
  { region: 'Arica y Parinacota', lugar: 'Complejo Valle Nuevo, Arica', titulo: 'SM Arica Fem vs Deportes Copiapó Fem', descripcion: 'Fecha del Campeonato de Ascenso Femenino.', fecha: new Date('2026-07-25T12:00:00Z'), categoria: 'Deporte', emoji: '⚽', imagen: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=900' },
  { region: 'Arica y Parinacota', lugar: 'Estadio Carlos Dittborn, Arica', titulo: 'San Marcos de Arica vs Magallanes', descripcion: 'Partido del Campeonato de Ascenso.', fecha: new Date('2026-07-28T20:15:00Z'), categoria: 'Deporte', emoji: '⚽', imagen: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=900' },

  // 🌟 TARAPACÁ (Junio)
  { region: 'Tarapacá', lugar: 'Hotel Gavina, Iquique', titulo: 'Luis Jara', descripcion: 'Concierto pop/romántico.', fecha: new Date('2026-06-06T20:30:00Z'), categoria: 'Música', emoji: '🎤' },
  { region: 'Tarapacá', lugar: 'Curupucho Bar & Grill, Iquique', titulo: 'KeChevere', descripcion: 'Show de rock/pop local.', fecha: new Date('2026-06-06T22:00:00Z'), categoria: 'Música', emoji: '🎸' },
  { region: 'Tarapacá', lugar: 'Club Casa Negra, Iquique', titulo: 'ChysteMC', descripcion: 'Rap y hip hop chileno.', fecha: new Date('2026-06-20T21:00:00Z'), categoria: 'Música', emoji: '🧢' },
  { region: 'Tarapacá', lugar: 'Hotel OX, Iquique', titulo: 'La Sociedad', descripcion: 'Pop romántico chileno.', fecha: new Date('2026-06-26T21:00:00Z'), categoria: 'Música', emoji: '🎸' },
  // 🌟 TARAPACÁ (Julio)
  { region: 'Tarapacá', lugar: 'Estadio Tierra de Campeones, Iquique', titulo: 'Deportes Iquique vs. Coquimbo Unido', descripcion: 'Cierre de la fase de grupos del tradicional torneo copero.', fecha: new Date('2026-07-04T12:00:00Z'), categoria: 'Deporte', emoji: '⚽', imagen: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Hotel Bellavista, Iquique', titulo: 'Plim Plim y Luli Pampín', descripcion: 'Espectáculo de teatro musical interactivo infantil.', fecha: new Date('2026-07-05T12:00:00Z'), categoria: 'Cultura', emoji: '🎪', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Pub Restobar Club Unión, Iquique', titulo: 'Fiesta Retro 80 90 2000', descripcion: 'Música bailable y pop nostálgico.', fecha: new Date('2026-07-06T22:00:00Z'), categoria: 'Música', emoji: '🪩', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Jardín del Jolgorio, Iquique', titulo: 'Stand-Up: Mauro González', descripcion: 'Rutina de humor observacional sobre la vida cotidiana.', fecha: new Date('2026-07-08T20:00:00Z'), categoria: 'Comedia', emoji: '😂', imagen: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Hotel Gavina, Iquique', titulo: 'Obra Teatral: Divorciados 2.0', descripcion: 'Representación cómica teatral sobre ruptura amorosa.', fecha: new Date('2026-07-10T20:00:00Z'), categoria: 'Comedia', emoji: '🎭', imagen: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Santuario de La Tirana, Pozo Almonte', titulo: 'Fiesta de la Virgen del Carmen', descripcion: 'Megavento religioso-cultural con miles de devotos.', fecha: new Date('2026-07-10T10:00:00Z'), categoria: 'Feria', emoji: '🎊', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Centro de Convenciones ZOFRI, Iquique', titulo: 'Candlelight: Vivaldi', descripcion: 'Concierto inmersivo de cuerdas iluminado por velas.', fecha: new Date('2026-07-11T19:00:00Z'), categoria: 'Música', emoji: '🎻', imagen: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Centro de Convenciones ZOFRI, Iquique', titulo: 'Candlelight: Adele & Coldplay', descripcion: 'Adaptación sinfónica inmersiva del pop británico.', fecha: new Date('2026-07-11T21:00:00Z'), categoria: 'Música', emoji: '🎻', imagen: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Santuario de La Tirana, Pozo Almonte', titulo: 'Misa de los Niños', descripcion: 'Rito litúrgico dedicado a la niñez de la región.', fecha: new Date('2026-07-12T10:00:00Z'), categoria: 'Cultura', emoji: '🕊️', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Santuario de La Tirana, Pozo Almonte', titulo: 'Jornada de los Mundos Andinos', descripcion: 'Reconocimiento de las matrices aymaras y licanantay.', fecha: new Date('2026-07-13T10:00:00Z'), categoria: 'Cultura', emoji: '🌄', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Discoteca Casa Negra, Iquique', titulo: 'Ithan NY en "The Terminal"', descripcion: 'Música urbana juvenil.', fecha: new Date('2026-07-13T23:00:00Z'), categoria: 'Música', emoji: '🎤', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Santuario de La Tirana, Pozo Almonte', titulo: 'Homenaje cívico-militar', descripcion: 'Homenaje a la Virgen junto a las Fuerzas Armadas.', fecha: new Date('2026-07-14T10:00:00Z'), categoria: 'Cultura', emoji: '🎺', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Santuario de La Tirana, Pozo Almonte', titulo: 'Solemne Víspera', descripcion: 'Trance colectivo de medianoche con bronces.', fecha: new Date('2026-07-15T23:30:00Z'), categoria: 'Cultura', emoji: '🎆', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Calles de La Tirana, Pozo Almonte', titulo: 'Eucaristía Central y Procesión', descripcion: 'Recorrido de la imagen sagrada.', fecha: new Date('2026-07-16T10:00:00Z'), categoria: 'Feria', emoji: '🙏', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Hotel Gavina, Iquique', titulo: 'Ella Baila Sola', descripcion: 'Concierto pop romántico.', fecha: new Date('2026-07-19T20:00:00Z'), categoria: 'Música', emoji: '🎤', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Santuario de La Tirana, Pozo Almonte', titulo: 'Clausura de La Tirana', descripcion: 'Despedida protocolar de los promeseros.', fecha: new Date('2026-07-20T10:00:00Z'), categoria: 'Cultura', emoji: '👋', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Mamiña, Macaya y Camiña', titulo: 'Santiago Apóstol', descripcion: 'Rogativas agrícolas y reencuentro comunitario.', fecha: new Date('2026-07-25T10:00:00Z'), categoria: 'Feria', emoji: '🌾', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900' },
  { region: 'Tarapacá', lugar: 'Estadio Tierra de Campeones, Iquique', titulo: 'Deportes Iquique vs. Deportes Temuco', descripcion: 'Jornada 17 de la temporada regular.', fecha: new Date('2026-07-26T12:00:00Z'), categoria: 'Deporte', emoji: '⚽', imagen: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=900' },

  // 🌟 ANTOFAGASTA (Junio)
  { region: 'Antofagasta', lugar: 'Enjoy Antofagasta', titulo: 'Los Jaivas', descripcion: '45 años Alturas de Macchu Picchu.', fecha: new Date('2026-06-05T21:00:00Z'), categoria: 'Música', emoji: '🏔️' },
  { region: 'Antofagasta', lugar: 'Teatro Municipal de Antofagasta', titulo: 'Manuel García', descripcion: 'Cantautor folk/rock chileno.', fecha: new Date('2026-06-06T20:00:00Z'), categoria: 'Música', emoji: '🎸' },
  { region: 'Antofagasta', lugar: 'Antofagasta', titulo: 'Pame Leiva', descripcion: 'Stand up comedy nacional.', fecha: new Date('2026-06-13T21:00:00Z'), categoria: 'Comedia', emoji: '😂' },
  { region: 'Antofagasta', lugar: 'Teatro Municipal de Antofagasta', titulo: 'La Sociedad', descripcion: 'Pop romántico chileno.', fecha: new Date('2026-06-27T21:00:00Z'), categoria: 'Música', emoji: '🎸' },
  // 🌟 ANTOFAGASTA (Julio)
  { region: 'Antofagasta', lugar: 'Plaza Cívica, San Pedro de Atacama', titulo: 'Vitrina Astronómica', descripcion: 'Día Nacional del Astroturismo con charlas y muestras.', fecha: new Date('2026-07-02T18:00:00Z'), categoria: 'Cultura', emoji: '🔭', imagen: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Teatro Municipal, Calama', titulo: 'Asskha Sumathra', descripcion: 'Espectáculo rupturista de transformismo y humor.', fecha: new Date('2026-07-03T20:00:00Z'), categoria: 'Comedia', emoji: '🎭', imagen: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Onix Bar, Antofagasta', titulo: 'Tributo a Jesse & Joy', descripcion: 'Espectáculo de balada pop y sesión de karaoke.', fecha: new Date('2026-07-03T22:00:00Z'), categoria: 'Música', emoji: '🎤', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'D\'La Barra Teatro Bar, Antofagasta', titulo: 'Freddie Mercury Chile', descripcion: 'Homenaje de alta fidelidad escénica a Queen.', fecha: new Date('2026-07-03T23:00:00Z'), categoria: 'Música', emoji: '👑', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Enjoy Antofagasta', titulo: 'Fabrizio Copano', descripcion: 'Aclamado espectáculo de stand-up comedy.', fecha: new Date('2026-07-04T21:00:00Z'), categoria: 'Comedia', emoji: '😂', imagen: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Espacio K (Sector Huáscar), Antofagasta', titulo: 'FANDANCE K - LA NUEVA ERA (+25)', descripcion: 'Fiesta inmersiva dedicada al K-Pop 90s y 00s.', fecha: new Date('2026-07-04T22:00:00Z'), categoria: 'Música', emoji: '🪩', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Termas de Puritama y Valle de la Luna', titulo: 'Tour Invernal Atacama (Masai Travel)', descripcion: 'Aguas termales y apreciación geológica.', fecha: new Date('2026-07-10T08:00:00Z'), categoria: 'Cultura', emoji: '🏜️', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Teatro Municipal, Calama', titulo: 'Divorciados 2.0', descripcion: 'Obra teatral sobre las rupturas de pareja contemporáneas.', fecha: new Date('2026-07-11T20:00:00Z'), categoria: 'Comedia', emoji: '🎭', imagen: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Sede San Pedro de Atacama', titulo: 'Festival de la Lana 2026', descripcion: 'Cierre de postulaciones para el certamen textil.', fecha: new Date('2026-07-13T18:00:00Z'), categoria: 'Feria', emoji: '🧶', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Teatro Municipal, Antofagasta', titulo: 'Paloma Salas - Tirando Pa\' Rriba', descripcion: 'Comedia y observación social del humor femenino.', fecha: new Date('2026-07-17T20:00:00Z'), categoria: 'Comedia', emoji: '😂', imagen: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Enjoy Antofagasta', titulo: 'Expo Mundo Tacones 2026 (Día 1)', descripcion: 'Desfiles de alta costura y diseño de calzado.', fecha: new Date('2026-07-18T12:00:00Z'), categoria: 'Feria', emoji: '👠', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Enjoy Antofagasta', titulo: 'Expo Mundo Tacones 2026 (Día 2)', descripcion: 'Clausura de la feria de moda y calzado.', fecha: new Date('2026-07-19T12:00:00Z'), categoria: 'Feria', emoji: '👠', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Estadio de Antofagasta', titulo: 'Deportes Antofagasta vs. Rangers', descripcion: 'Partido oficial de Primera B.', fecha: new Date('2026-07-19T22:00:00Z'), categoria: 'Deporte', emoji: '⚽', imagen: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Teatro Municipal, Antofagasta', titulo: 'Ella Baila Sola - 30 Aniversario', descripcion: 'Gira conmemorativa de la icónica banda pop vocal española.', fecha: new Date('2026-07-22T20:00:00Z'), categoria: 'Música', emoji: '🎤', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Mall Plaza, Antofagasta', titulo: 'Entrega de Kit: Corrida Kilómetro 0', descripcion: 'Operativo para la entrega oficial de kits de competencia.', fecha: new Date('2026-07-25T10:00:00Z'), categoria: 'Deporte', emoji: '🎽', imagen: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Pueblos de Toconce, Río Grande, Caspana', titulo: 'Fiesta de Santiago Apóstol', descripcion: 'Celebración religiosa y regreso de las comunidades andinas.', fecha: new Date('2026-07-26T10:00:00Z'), categoria: 'Cultura', emoji: '🏔️', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Enjoy Antofagasta', titulo: 'Los Vásquez - Amores de Invierno (Día 1)', descripcion: 'Pop cebolla chileno, entradas agotadas.', fecha: new Date('2026-07-30T21:00:00Z'), categoria: 'Música', emoji: '🎸', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900' },
  { region: 'Antofagasta', lugar: 'Enjoy Antofagasta', titulo: 'Los Vásquez - Amores de Invierno (Día 2)', descripcion: 'Segunda noche de la residencia ininterrumpida del dúo musical.', fecha: new Date('2026-07-31T21:00:00Z'), categoria: 'Música', emoji: '🎸', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900' },


  // 🌟 ATACAMA (Junio)
  { region: 'Atacama', lugar: 'Teatro Municipal, Copiapó', titulo: 'Inti-Illimani', descripcion: 'Música latinoamericana y folclore.', fecha: new Date('2026-06-06T19:30:00Z'), categoria: 'Música', emoji: '🪈' },
  { region: 'Atacama', lugar: 'Antay Casino Hotel, Copiapó', titulo: 'Manuel García', descripcion: 'Cantautor (nueva canción/folk).', fecha: new Date('2026-06-07T20:00:00Z'), categoria: 'Música', emoji: '🎸' },
  { region: 'Atacama', lugar: 'Teatro Municipal, Copiapó', titulo: 'Orquesta Sinfónica: "De Aranjuez a la Euforia"', descripcion: 'Música sinfónica.', fecha: new Date('2026-06-12T19:00:00Z'), categoria: 'Cultura', emoji: '🎻' },
  { region: 'Atacama', lugar: 'Teatro Municipal, Copiapó', titulo: 'Los Jaivas', descripcion: 'Rock progresivo y folclore.', fecha: new Date('2026-06-14T20:00:00Z'), categoria: 'Música', emoji: '🏔️' },
  { region: 'Atacama', lugar: 'Teatro Municipal, Copiapó', titulo: 'Orquesta Sinfónica: "Beatles Sinfónico"', descripcion: 'Tributo sinfónico a The Beatles.', fecha: new Date('2026-06-25T19:00:00Z'), categoria: 'Cultura', emoji: '🎻' },
  // 🌟 ATACAMA (Julio)
  { region: 'Atacama', lugar: 'Estadio El Cobre, El Salvador', titulo: 'Cobresal vs. Cobreloa', descripcion: 'Duelo fundamental por la fase de grupos de la Copa Chile.', fecha: new Date('2026-07-05T12:00:00Z'), categoria: 'Deporte', emoji: '⚽', imagen: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=900' },
  { region: 'Atacama', lugar: 'Hotel Antay, Copiapó', titulo: 'La Sociedad', descripcion: 'Presentación en vivo del clásico dúo chileno.', fecha: new Date('2026-07-09T20:00:00Z'), categoria: 'Música', emoji: '🎸', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900' },
  { region: 'Atacama', lugar: 'Copiapó', titulo: 'Jornadas Regionales SOCHED 2026', descripcion: 'Encuentro científico de la Sociedad Chilena de Endocrinología.', fecha: new Date('2026-07-10T10:00:00Z'), categoria: 'Cultura', emoji: '🔬', imagen: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=900' },
  { region: 'Atacama', lugar: 'Kaya Social Club, Copiapó', titulo: 'Groove 11 de Julio - Campolo (+22)', descripcion: 'Fiesta de club nocturno orientada estrictamente al público adulto.', fecha: new Date('2026-07-11T23:00:00Z'), categoria: 'Música', emoji: '🪩', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900' },
  { region: 'Atacama', lugar: 'Estadio Luis Valenzuela Hermosilla', titulo: 'Deportes Copiapó vs. Deportes Puerto Montt', descripcion: 'Encuentro válido por la división de la Liga de Ascenso chilena.', fecha: new Date('2026-07-19T12:00:00Z'), categoria: 'Deporte', emoji: '⚽', imagen: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=900' },
  { region: 'Atacama', lugar: 'Hotel Antay, Copiapó', titulo: 'Ella Baila Sola - Tour 30 Aniversario', descripcion: 'Concierto inmersivo de pop europeo de los noventa.', fecha: new Date('2026-07-23T20:00:00Z'), categoria: 'Música', emoji: '🎤', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900' },
  { region: 'Atacama', lugar: 'Amma Club, Copiapó', titulo: 'Bersuit Vergarabat', descripcion: 'Espectáculo en vivo de una de las agrupaciones insignes del rock argentino.', fecha: new Date('2026-07-26T21:00:00Z'), categoria: 'Música', emoji: '🎸', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900' },

  // 🌟 COQUIMBO
  { region: 'Coquimbo', lugar: 'Colegio Alemán, La Serena', titulo: 'Edith Fischer - Tesoro Vivo', descripcion: 'Recital de piano clásico.', fecha: new Date('2026-06-05T19:00:00Z'), emoji: '🎹' },
  { region: 'Coquimbo', lugar: 'Teatro Centenario, La Serena', titulo: 'Manuel García', descripcion: 'Cantautor (nueva canción/folk).', fecha: new Date('2026-06-05T20:00:00Z'), emoji: '🎸' },
  { region: 'Coquimbo', lugar: 'Teatro Municipal, Ovalle', titulo: 'Ballet Folklórico Rain', descripcion: 'Folclore chileno (15° aniversario).', fecha: new Date('2026-06-06T19:00:00Z'), emoji: '💃' },
  { region: 'Coquimbo', lugar: 'Enjoy Coquimbo', titulo: 'Asskha Sumathra "Iconika"', descripcion: 'Tributo pop internacional.', fecha: new Date('2026-06-06T21:00:00Z'), emoji: '🎭' },
  { region: 'Coquimbo', lugar: 'Teatro Centenario, La Serena', titulo: 'Fonk Machine', descripcion: 'Festival de rock alternativo y funk.', fecha: new Date('2026-06-06T21:30:00Z'), emoji: '🕺' },
  { region: 'Coquimbo', lugar: 'Teatro Centenario, La Serena', titulo: 'Joana Amendoeira', descripcion: 'Concierto de fado portugués.', fecha: new Date('2026-06-12T20:00:00Z'), emoji: '🎤' },
  { region: 'Coquimbo', lugar: 'Teatro Centenario, La Serena', titulo: 'Miguel Ramos', descripcion: 'Concierto de tango argentino.', fecha: new Date('2026-06-12T22:00:00Z'), emoji: '💃' },
  { region: 'Coquimbo', lugar: 'Ópera Teatro Club, Coquimbo', titulo: 'SynthWave', descripcion: 'Electrónica / fiesta de sintetizadores.', fecha: new Date('2026-06-13T23:00:00Z'), emoji: '🎛️' },
  { region: 'Coquimbo', lugar: 'Teatro Centenario, La Serena', titulo: 'Felipe Flores', descripcion: 'Folclore cristiano.', fecha: new Date('2026-06-18T19:00:00Z'), emoji: '🎸' },
  { region: 'Coquimbo', lugar: 'Teatro Centenario, La Serena', titulo: 'Julio Bustamante', descripcion: 'Folclore/LGBT+ (cantautor).', fecha: new Date('2026-06-18T21:00:00Z'), emoji: '🏳️‍🌈' },
  { region: 'Coquimbo', lugar: 'Colegio Alemán, La Serena', titulo: 'Capriccioso', descripcion: 'Recital de Violín & Piano.', fecha: new Date('2026-06-19T19:00:00Z'), emoji: '🎻' },
  { region: 'Coquimbo', lugar: 'Teatro Centenario, La Serena', titulo: 'José Seves & Equipaje', descripcion: 'Homenaje a P. Manns.', fecha: new Date('2026-06-19T20:00:00Z'), emoji: '🎸' },
  { region: 'Coquimbo', lugar: 'Teatro Municipal, Ovalle', titulo: 'Veredicto', descripcion: 'Obra teatral contemporánea.', fecha: new Date('2026-06-19T21:00:00Z'), emoji: '🎭' },
  { region: 'Coquimbo', lugar: '12 Lunas Restobar, La Serena', titulo: 'Catalina y Las Bordonas de Oro', descripcion: 'Concierto de boleros.', fecha: new Date('2026-06-20T22:00:00Z'), emoji: '🍷' },
  { region: 'Coquimbo', lugar: 'Teatro Centenario, La Serena', titulo: 'Kramer', descripcion: 'Banda de hardcore/metal nacional.', fecha: new Date('2026-06-25T21:00:00Z'), emoji: '🤘' },
  { region: 'Coquimbo', lugar: 'Teatro Municipal, Ovalle', titulo: 'Cultura con Orgullo', descripcion: 'Festival de diversidad y música local.', fecha: new Date('2026-06-25T19:00:00Z'), emoji: '🌈' },
  { region: 'Coquimbo', lugar: 'Teatro Centenario, La Serena', titulo: 'Leo Rey', descripcion: 'Salsa y cumbia.', fecha: new Date('2026-06-26T22:00:00Z'), emoji: '🕺' },

  // 🌟 VALPARAÍSO
  { region: 'Valparaíso', lugar: 'CENTEX, Plaza Sotomayor, Valparaíso', titulo: 'Festival Sobreimpresiones 2026', descripcion: 'Feria de arte gráfico con espectáculos y música en vivo.', fecha: new Date('2026-06-06T12:00:00Z'), emoji: '🎨' },
  { region: 'Valparaíso', lugar: 'Trotamundos, Valparaíso', titulo: 'Inti-Illimani Histórico', descripcion: 'Concierto de nueva canción chilena.', fecha: new Date('2026-06-06T21:00:00Z'), emoji: '🪈' },
  { region: 'Valparaíso', lugar: 'Terra Viva, Olmué', titulo: 'Sonora Barón', descripcion: 'Cumbia chilena.', fecha: new Date('2026-06-06T22:00:00Z'), emoji: '🎺' },
  { region: 'Valparaíso', lugar: 'Eastman Beach, Limache', titulo: 'Luis Slimming', descripcion: 'Stand up comedy nacional.', fecha: new Date('2026-06-11T21:00:00Z'), emoji: '😂' },
  { region: 'Valparaíso', lugar: 'Teatro Municipal, Viña del Mar', titulo: 'Candlelight: Tributo a Coldplay', descripcion: 'Tributo sinfónico.', fecha: new Date('2026-06-12T19:00:00Z'), emoji: '🕯️' },
  { region: 'Valparaíso', lugar: 'Teatro Municipal, Viña del Mar', titulo: 'Candlelight: Tributo a Hans Zimmer', descripcion: 'Tributo sinfónico.', fecha: new Date('2026-06-12T21:30:00Z'), emoji: '🕯️' },
  { region: 'Valparaíso', lugar: 'Terra Viva, Olmué', titulo: 'Eternal "The Doors Tributo"', descripcion: 'Tributo a The Doors.', fecha: new Date('2026-06-12T22:00:00Z'), emoji: '🚪' },
  { region: 'Valparaíso', lugar: 'Enjoy Viña del Mar', titulo: 'Asskha Sumathra "Iconika"', descripcion: 'Show de comedia.', fecha: new Date('2026-06-13T20:30:00Z'), emoji: '🎭' },
  { region: 'Valparaíso', lugar: 'Terra Viva, Olmué', titulo: 'Clásicos de Siempre (Ángeles Negros)', descripcion: 'Tributo a Los Ángeles Negros.', fecha: new Date('2026-06-13T22:00:00Z'), emoji: '🎤' },
  { region: 'Valparaíso', lugar: 'Stoney Bar, Quintero', titulo: 'Luis Slimming', descripcion: 'Stand up comedy nacional.', fecha: new Date('2026-06-18T21:00:00Z'), emoji: '😂' },
  { region: 'Valparaíso', lugar: 'Terra Viva, Olmué', titulo: 'Sexual Democracia', descripcion: 'Rock y humor chileno.', fecha: new Date('2026-06-19T21:00:00Z'), emoji: '🤘' },
  { region: 'Valparaíso', lugar: 'Trotamundos, Valparaíso', titulo: 'Masquemusica', descripcion: 'Soul, pop y música urbana.', fecha: new Date('2026-06-19T22:00:00Z'), emoji: '🎵' },
  { region: 'Valparaíso', lugar: 'Pimentón Rojo, Quilpué', titulo: 'Luis Slimming', descripcion: 'Stand up comedy nacional.', fecha: new Date('2026-06-25T21:00:00Z'), emoji: '😂' },
  { region: 'Valparaíso', lugar: 'Enjoy Viña del Mar', titulo: 'Rock Festival (Tributos)', descripcion: 'Noche de tributos a clásicos del rock.', fecha: new Date('2026-06-27T21:00:00Z'), emoji: '🎸' },
  { region: 'Valparaíso', lugar: 'Terra Viva, Olmué', titulo: 'Los Vikings 5', descripcion: 'Cumbia chilena.', fecha: new Date('2026-06-27T22:30:00Z'), emoji: '💃' },
  { region: 'Valparaíso', lugar: 'Teatro Mauri, Valparaíso', titulo: 'Princesa Alba', descripcion: 'Concierto pop urbano chileno.', fecha: new Date('2026-06-27T21:00:00Z'), emoji: '👑' },

  // 🌟 METROPOLITANA
  { region: 'Metropolitana', lugar: 'Teatro Caupolicán, Santiago', titulo: 'Macha y El Bloque Depresivo', descripcion: 'Bolero, vals y música latinoamericana.', fecha: new Date('2026-06-01T21:00:00Z'), emoji: '🍷' },
  { region: 'Metropolitana', lugar: 'Club Subterráneo, Santiago', titulo: 'Oliver Tree', descripcion: 'Pop alternativo e indie internacional.', fecha: new Date('2026-06-02T21:00:00Z'), emoji: '🛴' },
  { region: 'Metropolitana', lugar: 'Movistar Arena, Santiago', titulo: 'Ricardo Montaner', descripcion: 'Balada romántica internacional.', fecha: new Date('2026-06-04T21:00:00Z'), emoji: '💖' },
  { region: 'Metropolitana', lugar: 'Sala RBX, Santiago', titulo: 'Tygers of Pan Tang', descripcion: 'Heavy metal británico.', fecha: new Date('2026-06-04T20:00:00Z'), emoji: '🤘' },
  { region: 'Metropolitana', lugar: 'Teatro Nescafé de las Artes, Santiago', titulo: 'Angelo Pierattini', descripcion: 'Rock chileno / Humor.', fecha: new Date('2026-06-04T20:30:00Z'), emoji: '🎸' },
  { region: 'Metropolitana', lugar: 'GAM Sala A1, Santiago', titulo: 'Pedropiedra', descripcion: 'Pop y rock chileno.', fecha: new Date('2026-06-04T21:00:00Z'), emoji: '🎹' },
  { region: 'Metropolitana', lugar: 'Teatro Ictus, Santiago', titulo: 'Ruzzi', descripcion: 'Pop alternativo mexicano.', fecha: new Date('2026-06-04T21:00:00Z'), emoji: '🎸' },
  { region: 'Metropolitana', lugar: 'Movistar Arena, Santiago', titulo: 'Ricardo Arjona', descripcion: 'Pop latino y balada internacional.', fecha: new Date('2026-06-05T21:00:00Z'), emoji: '🎤' },
  { region: 'Metropolitana', lugar: 'Movistar Arena, Santiago', titulo: 'Jeanette y Franco Simone', descripcion: 'Balada romántica internacional.', fecha: new Date('2026-06-06T21:00:00Z'), emoji: '🎤' },
  { region: 'Metropolitana', lugar: 'Espacio Riesco, Santiago', titulo: 'Amelie Lens', descripcion: 'Electrónica y techno internacional.', fecha: new Date('2026-06-06T23:00:00Z'), emoji: '🎛️' },
  { region: 'Metropolitana', lugar: 'Teatro Caupolicán, Santiago', titulo: 'Verrückt Festival 360°', descripcion: 'Techno y hard dance.', fecha: new Date('2026-06-06T22:00:00Z'), emoji: '🎧' },
  { region: 'Metropolitana', lugar: 'Teatro Municipal, Santiago', titulo: 'Los Tres', descripcion: 'Rock chileno.', fecha: new Date('2026-06-07T20:00:00Z'), emoji: '🎸' },
  { region: 'Metropolitana', lugar: 'Movistar Arena, Santiago', titulo: 'Pulp', descripcion: 'Britpop y rock alternativo.', fecha: new Date('2026-06-08T21:00:00Z'), emoji: '🇬🇧' },
  { region: 'Metropolitana', lugar: 'GAM Sala A1, Santiago', titulo: 'Javiera Electra', descripcion: 'Pop alternativo chileno.', fecha: new Date('2026-06-11T20:00:00Z'), emoji: '🎤' },
  { region: 'Metropolitana', lugar: 'Teatro Caupolicán, Santiago', titulo: 'Rhapsody', descripcion: 'Metal sinfónico internacional.', fecha: new Date('2026-06-11T21:00:00Z'), emoji: '⚔️' },
  { region: 'Metropolitana', lugar: 'Teatro Caupolicán, Santiago', titulo: 'Dios Salve a la Reina', descripcion: 'Tributo a Queen.', fecha: new Date('2026-06-13T21:00:00Z'), emoji: '👑' },
  { region: 'Metropolitana', lugar: 'Teatro Caupolicán, Santiago', titulo: 'Marlon Breeze', descripcion: 'Electrónica y música urbana.', fecha: new Date('2026-06-13T23:00:00Z'), emoji: '🎧' },
  { region: 'Metropolitana', lugar: 'Club Chocolate, Santiago', titulo: 'Shame', descripcion: 'Post-punk británico.', fecha: new Date('2026-06-15T21:00:00Z'), emoji: '🎸' },
  { region: 'Metropolitana', lugar: 'GAM Sala A1, Santiago', titulo: 'Masquemusica', descripcion: 'Soul, pop y música urbana.', fecha: new Date('2026-06-18T20:00:00Z'), emoji: '🎵' },
  { region: 'Metropolitana', lugar: 'Teatro La Cúpula, Santiago', titulo: 'Tronic', descripcion: 'Pop punk chileno.', fecha: new Date('2026-06-20T20:00:00Z'), emoji: '🎸' },
  { region: 'Metropolitana', lugar: 'Teatro Caupolicán, Santiago', titulo: 'GEGEN X CACHORROS', descripcion: 'Fiesta y electrónica.', fecha: new Date('2026-06-20T23:00:00Z'), emoji: '🐾' },
  { region: 'Metropolitana', lugar: 'Teatro Caupolicán, Santiago', titulo: 'La Nueva Ola', descripcion: 'Festival de música de los años 60 y 70.', fecha: new Date('2026-06-21T19:00:00Z'), emoji: '📻' },
  { region: 'Metropolitana', lugar: 'Teatro Camilo Henríquez, Santiago', titulo: 'Eduardo Gatti', descripcion: 'Canción de autor chilena.', fecha: new Date('2026-06-24T20:00:00Z'), emoji: '🎸' },
  { region: 'Metropolitana', lugar: 'GAM Sala A1, Santiago', titulo: 'Matías Ávila', descripcion: 'Pop alternativo chileno.', fecha: new Date('2026-06-25T20:00:00Z'), emoji: '🎤' },
  { region: 'Metropolitana', lugar: 'Movistar Arena, Santiago', titulo: 'Los Vásquez, Santa Feria, Noche de Brujas', descripcion: 'Festival de música tropical y cumbia.', fecha: new Date('2026-06-26T19:00:00Z'), emoji: '🍻' },
  { region: 'Metropolitana', lugar: 'Teatro Caupolicán, Santiago', titulo: 'Michael Jackson Sinfónico', descripcion: 'Tributo sinfónico a Michael Jackson.', fecha: new Date('2026-06-26T21:00:00Z'), emoji: '🕴️' },
  { region: 'Metropolitana', lugar: 'Teatro Caupolicán, Santiago', titulo: 'Pride Santiago 2026', descripcion: 'Fiesta y celebración LGBTQIA+.', fecha: new Date('2026-06-27T23:00:00Z'), emoji: '🏳️‍🌈' },
  { region: 'Metropolitana', lugar: 'Teatro Caupolicán, Santiago', titulo: 'Gladiadoras del Kpop', descripcion: 'Festival de K-pop.', fecha: new Date('2026-06-27T16:00:00Z'), emoji: '✨' },
  { region: 'Metropolitana', lugar: 'Teatro Caupolicán, Santiago', titulo: 'Bely y Beto', descripcion: 'Show infantil.', fecha: new Date('2026-06-29T15:00:00Z'), emoji: '🎈' },
  { region: 'Metropolitana', lugar: 'Teatro Caupolicán, Santiago', titulo: 'Flow - Naruto The Rock', descripcion: 'Rock japonés y openings de anime.', fecha: new Date('2026-06-30T21:00:00Z'), emoji: '🍥' },

  // 🌟 O’HIGGINS
  { region: 'O’Higgins', lugar: 'Gran Arena Monticello, Mostazal', titulo: 'The Shouts', descripcion: 'Banda tributo a The Beatles.', fecha: new Date('2026-06-05T21:00:00Z'), emoji: '🎸' },
  { region: 'O’Higgins', lugar: 'San Fernando', titulo: 'JP López', descripcion: 'Stand up comedy nacional.', fecha: new Date('2026-06-10T21:00:00Z'), emoji: '😂' },
  { region: 'O’Higgins', lugar: 'Gran Arena Monticello, Mostazal', titulo: 'Ana Torroja', descripcion: 'Cantante pop española.', fecha: new Date('2026-06-13T21:00:00Z'), emoji: '🇪🇸' },
  { region: 'O’Higgins', lugar: 'Gran Arena Monticello, Mostazal', titulo: 'New Sensations Tributo a INXS', descripcion: 'Tributo al grupo INXS.', fecha: new Date('2026-06-19T21:00:00Z'), emoji: '🎸' },
  { region: 'O’Higgins', lugar: 'Gran Arena Monticello, Mostazal', titulo: 'Yuri', descripcion: 'Cantante pop mexicana.', fecha: new Date('2026-06-26T21:00:00Z'), emoji: '🎤' },
  { region: 'O’Higgins', lugar: 'Gran Arena Monticello, Mostazal', titulo: 'Zumbale Primo', descripcion: 'Banda de cumbia/chicha chilena.', fecha: new Date('2026-06-27T21:30:00Z'), emoji: '🤠' },

  // 🌟 MAULE
  { region: 'Maule', lugar: 'Sanguchería Bar, Talca', titulo: 'La Brigada Orquesta', descripcion: 'Orquesta tropical de covers latinos.', fecha: new Date('2026-06-06T22:00:00Z'), emoji: '🎺' },
  { region: 'Maule', lugar: 'Talca', titulo: 'Jimmy Águila', descripcion: 'Stand up comedy nacional.', fecha: new Date('2026-06-06T21:00:00Z'), emoji: '😂' },
  { region: 'Maule', lugar: 'Teatro Municipal, Linares', titulo: 'Inti-Illimani', descripcion: 'Conjunto folclórico latinoamericano.', fecha: new Date('2026-06-11T20:00:00Z'), emoji: '🪈' },
  { region: 'Maule', lugar: 'Casino Talca', titulo: 'Luis Jara', descripcion: 'Concierto pop/romántico.', fecha: new Date('2026-06-19T21:00:00Z'), emoji: '🎤' },
  { region: 'Maule', lugar: 'Casino Curicó', titulo: 'Luis Jara', descripcion: 'Concierto pop/romántico.', fecha: new Date('2026-06-20T21:00:00Z'), emoji: '🎤' },
  { region: 'Maule', lugar: 'Sanguchería Bar, Talca', titulo: 'Catalina y Las Bordonas de Oro', descripcion: 'Concierto de boleros.', fecha: new Date('2026-06-26T21:00:00Z'), emoji: '🍷' },

  // 🌟 ÑUBLE
  { region: 'Ñuble', lugar: 'Casino MDS, Chillán', titulo: 'La Sociedad', descripcion: 'Pop romántico chileno.', fecha: new Date('2026-06-05T21:00:00Z'), emoji: '🎸' },
  { region: 'Ñuble', lugar: 'Teatro Municipal, Chillán', titulo: 'Zúmbale Primo Íntimo', descripcion: 'Cumbia chilena.', fecha: new Date('2026-06-06T21:00:00Z'), emoji: '🤠' },
  { region: 'Ñuble', lugar: 'Teatro Municipal, Chillán', titulo: 'Los Jaivas', descripcion: 'Rock progresivo y folclore latinoamericano.', fecha: new Date('2026-06-12T20:00:00Z'), emoji: '🏔️' },
  { region: 'Ñuble', lugar: 'Magnolia Bar, Chillán', titulo: 'Masquemusica', descripcion: 'Soul, pop y música urbana.', fecha: new Date('2026-06-13T22:00:00Z'), emoji: '🎵' },

  // 🌟 BÍO BÍO
  { region: 'Bío Bío', lugar: 'Templo Crápula, Concepción', titulo: 'Masquemusica', descripcion: 'Soul, pop y música urbana.', fecha: new Date('2026-06-12T22:00:00Z'), emoji: '🎵' },
  { region: 'Bío Bío', lugar: 'Teatro Universidad de Concepción', titulo: 'God Save The Queen', descripcion: 'Banda tributo a Queen.', fecha: new Date('2026-06-15T20:00:00Z'), emoji: '👑' },

  // 🌟 ARAUCANÍA
  { region: 'Araucanía', lugar: 'Mamas & Tapas, Pucón', titulo: 'Paz Quintana', descripcion: 'Cantautora y pop alternativo.', fecha: new Date('2026-06-04T22:00:00Z'), emoji: '🎸' },
  { region: 'Araucanía', lugar: 'La Perrera, Temuco', titulo: 'Los Continentales', descripcion: 'Tributo a Macha y El Bloque Depresivo.', fecha: new Date('2026-06-05T22:00:00Z'), emoji: '🍷' },
  { region: 'Araucanía', lugar: 'Alto Portales, Temuco', titulo: 'Onda Fiesta Radio Edelweiss', descripcion: 'Fiesta musical.', fecha: new Date('2026-06-06T23:00:00Z'), emoji: '🕺' },
  { region: 'Araucanía', lugar: 'London Club, Temuco', titulo: 'La Cabina', descripcion: 'Música en vivo y fiesta.', fecha: new Date('2026-06-06T23:30:00Z'), emoji: '🎧' },
  { region: 'Araucanía', lugar: 'Casa Birra, Temuco', titulo: 'Catalina y Las Bordonas de Oro', descripcion: 'Boleros y música latinoamericana.', fecha: new Date('2026-06-10T21:30:00Z'), emoji: '🍷' },
  { region: 'Araucanía', lugar: 'La Perrera, Temuco', titulo: 'El Baúl de Silvio + Novena Estación', descripcion: 'Tributo a Silvio Rodríguez.', fecha: new Date('2026-06-12T22:00:00Z'), emoji: '🎸' },
  { region: 'Araucanía', lugar: 'Centro Cultural Galo Sepúlveda, Temuco', titulo: 'CualMarcelo', descripcion: 'Show musical y humorístico.', fecha: new Date('2026-06-19T20:00:00Z'), emoji: '🎭' },
  { region: 'Araucanía', lugar: 'Boca de Lobos, Temuco', titulo: 'Tributo a Soda Stereo', descripcion: 'Tributo a Soda Stereo.', fecha: new Date('2026-06-20T22:30:00Z'), emoji: '🎸' },

  // 🌟 LOS RÍOS
  { region: 'Los Ríos', lugar: 'Espacio en Construcción, Valdivia', titulo: 'Kuina', descripcion: 'Banda local de rock alternativo.', fecha: new Date('2026-06-13T22:00:00Z'), emoji: '🤘' },
  { region: 'Los Ríos', lugar: 'La Bota Cervecera, Valdivia', titulo: 'Pank', descripcion: 'Banda local de punk/rock.', fecha: new Date('2026-06-26T22:00:00Z'), emoji: '🤘' },

  // 🌟 LOS LAGOS
  { region: 'Los Lagos', lugar: 'Los 3 Platos Restaurant, Puerto Montt', titulo: 'Música en Vivo', descripcion: 'Música en vivo y gastronomía.', fecha: new Date('2026-06-04T21:00:00Z'), emoji: '🍽️' },
  { region: 'Los Lagos', lugar: 'Matureo Bar, Osorno', titulo: 'Música en Vivo', descripcion: 'Música en vivo.', fecha: new Date('2026-06-05T22:00:00Z'), emoji: '🍻' },
  { region: 'Los Lagos', lugar: 'Bar Garden, Puerto Montt', titulo: 'Masquemusica', descripcion: 'Soul, pop y música urbana.', fecha: new Date('2026-06-11T21:00:00Z'), emoji: '🎵' },
  { region: 'Los Lagos', lugar: 'Teatro Diego Rivera, Puerto Montt', titulo: 'Ana Tijoux', descripcion: 'Cantautora de hip-hop/rap chilena.', fecha: new Date('2026-06-12T20:00:00Z'), emoji: '🎤' },
  { region: 'Los Lagos', lugar: 'Teatro Diego Rivera, Puerto Montt', titulo: 'Luis Jara', descripcion: 'Concierto pop/romántico.', fecha: new Date('2026-06-14T20:00:00Z'), emoji: '🎤' },
  { region: 'Los Lagos', lugar: 'Teatro del Lago, Frutillar', titulo: 'Los Jaivas', descripcion: '45 años Alturas de Macchu Picchu.', fecha: new Date('2026-06-27T19:00:00Z'), emoji: '🏔️' },
  { region: 'Los Lagos', lugar: 'Teatro del Lago, Frutillar', titulo: 'Los Jaivas', descripcion: '45 años Alturas de Macchu Picchu.', fecha: new Date('2026-06-28T19:00:00Z'), emoji: '🏔️' },

  // 🌟 MAGALLANES
  { region: 'Magallanes', lugar: 'Punta Arenas', titulo: 'Chapuzón del Estrecho', descripcion: 'Evento tradicional y cultural (no musical).', fecha: new Date('2026-06-27T12:00:00Z'), emoji: '🥶' }
];

const sincronizarEventos = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    
    // 🌟 FIX 2: Usamos el mismo motor de conexión de tu index.js
    await conectarDB();
    
    console.log('🗑️  Borrando cartelera antigua...');
    await Panorama.deleteMany({ $or: [{ esOficial: true }, { categoria: 'Oficial' }, { categoria: 'Evento Oficial' }] });

    console.log('🌱 Sembrando los nuevos eventos...');
    const eventosMapeados = eventosOficiales.map(evento => ({
      ...evento,
      categoria: 'Evento Oficial',
      esOficial: true,
      activo: true,
      maxPersonas: 9999,
      participantes: [] 
    }));

    await Panorama.insertMany(eventosMapeados);
    console.log(`🎉 ¡Éxito! Cartelera nacional inyectada correctamente. (${eventosMapeados.length} eventos listos)`);

    process.exit();
  } catch (error) {
    console.error('❌ Error al sembrar los eventos:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  sincronizarEventos();
}

module.exports = eventosOficiales;
