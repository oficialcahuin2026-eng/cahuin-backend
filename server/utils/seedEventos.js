const mongoose = require('mongoose');
const Panorama = require('../models/Panorama'); 
require('dotenv').config(); 

// 🌟 FIX 1: Importamos tu conexión real de la app (la que sabemos que funciona perfecto)
const conectarDB = require('../config/db'); 

const eventosOficiales = [
  // 🌟 ARICA Y PARINACOTA
  { region: 'Arica y Parinacota', lugar: 'Antay Hotel & Spa, Arica', titulo: 'Luis Jara - "Más que Suerte"', descripcion: 'Concierto pop/romántico.', fecha: new Date('2026-06-05T20:00:00Z'), emoji: '🎤' },
  { region: 'Arica y Parinacota', lugar: 'Maestranza Brasil #117, Arica', titulo: 'Tren Turístico Arica – Central', descripcion: 'Experiencia cultural y musical en tren histórico.', fecha: new Date('2026-06-06T10:00:00Z'), emoji: '🚂' },
  { region: 'Arica y Parinacota', lugar: 'Chapiquiña, Putre', titulo: 'Festival de la Papa Chiquiza', descripcion: 'Festival andino con música y tradiciones locales.', fecha: new Date('2026-06-06T12:00:00Z'), emoji: '🥔' },
  { region: 'Arica y Parinacota', lugar: 'Centro Cultural Junta de Adelanto, Arica', titulo: 'Festival Suena Norte 2026', descripcion: 'Festival regional de música.', fecha: new Date('2026-06-13T19:00:00Z'), emoji: '🏜️' },
  { region: 'Arica y Parinacota', lugar: 'Hotel del Valle, Arica', titulo: 'La Sociedad - "El Regreso"', descripcion: 'Pop romántico chileno.', fecha: new Date('2026-06-25T21:00:00Z'), emoji: '🎸' },
  { region: 'Arica y Parinacota', lugar: 'Arica', titulo: 'Pastor Rocha', descripcion: 'Stand up comedy nacional.', fecha: new Date('2026-06-25T22:00:00Z'), emoji: '😂' },

  // 🌟 TARAPACÁ
  { region: 'Tarapacá', lugar: 'Hotel Gavina, Iquique', titulo: 'Luis Jara', descripcion: 'Concierto pop/romántico.', fecha: new Date('2026-06-06T20:30:00Z'), emoji: '🎤' },
  { region: 'Tarapacá', lugar: 'Curupucho Bar & Grill, Iquique', titulo: 'KeChevere', descripcion: 'Show de rock/pop local.', fecha: new Date('2026-06-06T22:00:00Z'), emoji: '🎸' },
  { region: 'Tarapacá', lugar: 'Club Casa Negra, Iquique', titulo: 'ChysteMC', descripcion: 'Rap y hip hop chileno.', fecha: new Date('2026-06-20T21:00:00Z'), emoji: '🧢' },
  { region: 'Tarapacá', lugar: 'Hotel OX, Iquique', titulo: 'La Sociedad', descripcion: 'Pop romántico chileno.', fecha: new Date('2026-06-26T21:00:00Z'), emoji: '🎸' },

  // 🌟 ANTOFAGASTA
  { region: 'Antofagasta', lugar: 'Enjoy Antofagasta', titulo: 'Los Jaivas', descripcion: '45 años Alturas de Macchu Picchu.', fecha: new Date('2026-06-05T21:00:00Z'), emoji: '🏔️' },
  { region: 'Antofagasta', lugar: 'Teatro Municipal de Antofagasta', titulo: 'Manuel García', descripcion: 'Cantautor folk/rock chileno.', fecha: new Date('2026-06-06T20:00:00Z'), emoji: '🎸' },
  { region: 'Antofagasta', lugar: 'Antofagasta', titulo: 'Pame Leiva', descripcion: 'Stand up comedy nacional.', fecha: new Date('2026-06-13T21:00:00Z'), emoji: '😂' },
  { region: 'Antofagasta', lugar: 'Teatro Municipal de Antofagasta', titulo: 'La Sociedad', descripcion: 'Pop romántico chileno.', fecha: new Date('2026-06-27T21:00:00Z'), emoji: '🎸' },

  // 🌟 ATACAMA
  { region: 'Atacama', lugar: 'Teatro Municipal, Copiapó', titulo: 'Inti-Illimani', descripcion: 'Música latinoamericana y folclore.', fecha: new Date('2026-06-06T19:30:00Z'), emoji: '🪈' },
  { region: 'Atacama', lugar: 'Antay Casino Hotel, Copiapó', titulo: 'Manuel García', descripcion: 'Cantautor (nueva canción/folk).', fecha: new Date('2026-06-07T20:00:00Z'), emoji: '🎸' },
  { region: 'Atacama', lugar: 'Teatro Municipal, Copiapó', titulo: 'Orquesta Sinfónica: "De Aranjuez a la Euforia"', descripcion: 'Música sinfónica.', fecha: new Date('2026-06-12T19:00:00Z'), emoji: '🎻' },
  { region: 'Atacama', lugar: 'Teatro Municipal, Copiapó', titulo: 'Los Jaivas', descripcion: 'Rock progresivo y folclore.', fecha: new Date('2026-06-14T20:00:00Z'), emoji: '🏔️' },
  { region: 'Atacama', lugar: 'Teatro Municipal, Copiapó', titulo: 'Orquesta Sinfónica: "Beatles Sinfónico"', descripcion: 'Tributo sinfónico a The Beatles.', fecha: new Date('2026-06-25T19:00:00Z'), emoji: '🎻' },

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
