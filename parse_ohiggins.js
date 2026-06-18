const fs = require('fs');
const lines = `1 de julio	Invierno Vivo (Parque de Nieve)	Medialuna Monumental, Rancagua	Feria	Última jornada del masivo parque invernal municipal con toboganes y atracciones.
1 de julio	Teatro: "El Misterioso Nacimiento de un Tue Tue"	Teatro Regional Lucho Gatica, Rancagua	Cultura	Obra teatral familiar de la Cía. Teatro Impronta, parte de la cartelera comunal invernal.
1 al 3 de julio	Exposición de Arte: «Censurarte»	Espacio Cultural La Merced, Rancagua	Cultura	Muestra artística gratuita de creadores regionales y contingencia social.
1 al 4 de julio	Exposición: «El Trebolar Recién Regado»	Teatro Lucho Gatica (Hall), Rancagua	Cultura	Exhibición pictórica de obras realizadas por pacientes de Teletón O'Higgins.
1 al 7 de julio	Exposición Fotográfica: «TAR»	Casa de la Cultura, Rancagua	Cultura	Muestra visual del destacado fotógrafo Gabriel Palacios con acceso liberado.
Todo julio	Muestra Permanente Batalla de Rancagua	Espacio Cultural La Merced, Rancagua	Cultura	Recorridos guiados sobre los 150 mil años de ocupación aborigen y la historia local republicana.
2 de julio	Flama Battles «Héroes» Sangre y Gloria	Teatro Regional Lucho Gatica, Rancagua	Música	Competencia y exhibición de batallas de rap (freestyle) para la juventud urbana.
3 de julio	O'Higgins F.C. vs Colo-Colo	Estadio El Teniente, Rancagua	Deporte	Partido oficial correspondiente a la fase de grupos del prestigioso torneo Copa Chile.
3 de julio	Campeonato "Bailando Chile"	Teatro Regional Lucho Gatica, Rancagua	Cultura	Certamen nacional competitivo enfocado en ritmos latinos y danza coreográfica.
3 de julio	Gon Trujillo & Lady Garfia	Gran Arena Monticello, Mostazal	Cultura	Montaje de artes integradas y performance teatral en el principal coliseo de la región.
3 de julio	Tributo a Jesse & Joy	Onix Bar, Rancagua	Música	Show musical en vivo rindiendo homenaje al dúo pop mexicano en el circuito nocturno local.
3 de julio	Idílico #8: Noches de comedia irrepetible	La Cantina, Rancagua	Comedia	Espacio emergente de stand-up comedy fomentando a nuevos talentos del humor.
3 de julio	“Tres fracasos y un mazo de Tarot”	Peluquería Francesa, Circuito O'Higgins	Comedia	Formato innovador que entrelaza la rutina humorística con lecturas esotéricas en vivo.
3 de julio	Curso: Gestión Cultural Aplicada	Universidad de O'Higgins (UOH)	Cultura	Primera sesión del programa académico para formulación de proyectos artísticos (Fondos Concursables).
4 de julio	Kevin Johansen + Liniers + The Nada	Gran Arena Monticello, Mostazal	Música	Experiencia audiovisual que fusiona la música de autor con ilustración en vivo a gran escala.
4 de julio	Lanzamiento Beats & Vibes	Ex Casona Bistró, Santa Cruz	Música	Evento exclusivo de inmersión en música electrónica (Afro/Tech House) en el corazón vitivinícola.
4 de julio	C-FUNK HOUSEPARTY	Los Piures Club Social, Pichilemu	Música	Gran fiesta costera de funk y ritmos negros liderada por el icónico músico nacional.
4 de julio	Fiesta Generación 80s	Alejos Ruta 66, Rancagua	Música	El evento bailable de nostalgia más exitoso del país, reviviendo la estética y sonidos de la década.
4 de julio	Play and Party Vol. 2	Play And Coffee, Rancagua	Feria	Actividad recreativa diurna que combina el consumo de café de especialidad con competiciones lúdicas.
4 y 5 de julio	Visitas Mediadas Patrimoniales	Museo Colchagua, Santa Cruz	Cultura	Recorridos guiados intensivos por los pabellones precolombinos e históricos del museo.
4 y 6 de julio	Torneo Copa Caroya 2026	Recintos Deportivos, Rengo	Deporte	Campeonato interregional que reúne diversas disciplinas de contacto y artes marciales.
7 de julio	Fabrizio Copano «Escápate»	Teatro Regional Lucho Gatica, Rancagua	Comedia	Exitosa rutina de stand-up que aborda la contingencia mediática y la paranoia digital.
9 de julio	Asskha Sumathra: “Lo que no se vio en Viña”	Teatro Regional Lucho Gatica, Rancagua	Comedia	Espectáculo de transformismo y humor sin censura, altamente aclamado por la crítica.
9 de julio	Expo Dinosaurios	Mall Outlet, Rancagua	Feria	Muestra educativa e interactiva de animatrónica a escala real, ideal para vacaciones de invierno.
10 de julio	Jorge Alis: Argentino + QL que nunca!	Gran Arena Monticello, Mostazal	Comedia	Rutina humorística catártica sobre la idiosincrasia chileno-argentina en tiempos modernos.
10 de julio	La Noche de Esterito feat. Cata Bedwell	Los Tres Platos, Rancagua	Comedia	Monólogos de comedia en formato íntimo dentro de la ruta gastronómica y de bares.
10 de julio	Curso: Gestión Cultural Aplicada	Universidad de O'Higgins (UOH)	Cultura	Segunda sesión académica enfocada en la viabilidad económica de proyectos culturales.
11 de julio	Dark Metal Queens	Caudillo Stage (Barley), Rancagua	Música	Concierto tributo magistral a las bandas de metal sinfónico femenino (Epica, Within Temptation, The Gathering).
11 de julio	Festival de Cine «Los Girasoles de Rancagua»	Casa de la Cultura, Rancagua	Cultura	Proyección y conversatorios dedicados a visibilizar el cine y cortometrajes independientes locales.
11 de julio	1° Copa Pyongwon Fénix: Poomsae 2026	Recintos Deportivos, Rengo	Deporte	Competición especializada estrictamente en la demostración de fórmulas (Poomsae) de Taekwondo.
11 de julio	Valgoio	Bar Republicano, Rancagua	Comedia	Función nocturna de stand-up en uno de los bares más concurridos del centro cívico.
11 de julio	PROMO. SI ES MI HIJO SEÑORA	Bar Republicano, Rancagua	Comedia	Rutina de humor local de temática costumbrista y crítica social.
11 y 12 de julio	31 Minutos - Radio Guaripolo	Gran Arena Monticello, Mostazal	Cultura	Dos jornadas del majestuoso montaje teatral y musical protagonizado por Tulio Triviño y compañía.
11 y 12 de julio	Visitas Mediadas Patrimoniales	Museo Colchagua, Santa Cruz	Cultura	Segunda franja de fin de semana para explorar el repositorio privado más grande del país.
12 de julio	Candlelight: Las Cuatro Estaciones de Vivaldi	Casablanca Centro de Eventos, Rancagua	Música	Concierto de música docta ejecutado por un cuarteto de cuerdas en una atmósfera iluminada por miles de velas.
12 de julio	Candlelight: Mozart vs Beethoven	Casablanca Centro de Eventos, Rancagua	Música	Duelo sinfónico de genios musicales en formato acústico inmersivo y visualmente deslumbrante.
15 de julio	Tributo a Engelbert Humperdinck	Alejos Ruta 66, Rancagua	Música	Noche elegante de nostalgia AM dedicada a los clásicos del "Rey de los Crooners" (Release Me, The Last Waltz).
17 de julio	La Descendencia Chilena	Gran Arena Monticello, Mostazal	Música	Enérgico espectáculo folclórico que rescata la identidad campera y la música de raíz nacional.
18 de julio	Festival Pulso Naranja	Gran Arena Monticello, Mostazal	Música	Maratón musical que congrega a diversas bandas y agrupaciones de arrastre juvenil y popular.
18 de julio	Cumbre Ranchera	Moka Club Multiespacio, Rancagua	Música	Mega fiesta de cumbia ranchera y norteña, con presentaciones en vivo de Sangre Chilena y La Marca Tropikal.
18 de julio	Tren Turístico Chile: Viña Valle Secreto	Vía Férrea Central - Rengo	Gastronomía	Viaje patrimonial en tren que incluye música, catas a bordo y finaliza con un almuerzo de maridaje en Rengo.
18 y 19 de julio	Visitas Mediadas Patrimoniales	Museo Colchagua, Santa Cruz	Cultura	Tercer fin de semana de apertura guiada de los espacios de exhibición museológica.
21 de julio	Myriam Hernández - Tauro Tour	Teatro Regional Lucho Gatica, Rancagua	Música	Concierto de gala de la principal baladista chilena, repasando sus éxitos históricos y nuevo material.
23 de julio	Pastor Rocha "Rocha School"	Teatro Regional Lucho Gatica, Rancagua	Comedia	Función teatral de humor basada en las dinámicas y anécdotas de la docencia y el sistema escolar.
24 de julio	Ella Baila Sola	Gran Arena Monticello, Mostazal	Música	Gira internacional celebrando 30 años de carrera del emblemático dúo de pop acústico español.
24 de julio	Curso: Gestión Cultural Aplicada	Universidad de O'Higgins (UOH)	Cultura	Tercera jornada de capacitación académica vinculada al sector de las industrias creativas regionales.
25 de julio	Stefan Kramer / Un show de Emergencia	Casino Colchagua, Santa Cruz	Comedia	Rutina humorística magistral cargada de imitaciones políticas y del espectáculo por el as de la comedia chilena.
25 de julio	Tren Turístico Chile: Viña Koyle	Vía Férrea - San Fernando/Santa Cruz	Gastronomía	Experiencia enoturística de lujo enfocada en la viticultura orgánica de montaña y la alta mesa de Colchagua.
25 de julio	Gala Aniversario Poyenmahatu	Centro Cultural Oriente, Rancagua	Cultura	Encuentro artístico y folclórico que celebra la trayectoria de agrupaciones de danza tradicional.
25 y 26 de julio	Visitas Mediadas Patrimoniales	Museo Colchagua, Santa Cruz	Cultura	Último fin de semana del mes destinado al recorrido interactivo y didáctico del museo.
26 de julio	Campeonato Gran Dragón Rengo 2026	Gimnasio Municipal, Rengo	Deporte	Torneo regional cumbre de combate y destrezas de diversas escuelas de Taekwondo.
26 de julio	Candlelight: Tributo a ABBA y Más	Casablanca Centro de Eventos, Rancagua	Música	Homenaje acústico sinfónico a los himnos pop de la agrupación sueca, en un ambiente íntimo de luz de velas.
30 de julio	Obra Teatral: "Sala de Profes"	Teatro Regional Lucho Gatica, Rancagua	Cultura	Montaje dramático que reflexiona agudamente sobre las tensiones y la crisis del actual sistema educativo.
31 de julio	O'Higgins F.C. vs Boca Juniors	Estadio El Teniente, Rancagua	Deporte	Histórico duelo de playoffs de la Copa Sudamericana CONMEBOL frente al gigante del fútbol argentino.
31 de julio	Santa Feria - Hace Frio	Gran Arena Monticello, Mostazal	Música	Concierto de altísima convocatoria de la banda líder de la nueva cumbia chilena y ritmos de bronce.
31 de julio	Tributo a la Reina del Pop Madonna	Alejos Ruta 66, Rancagua	Música	Cierre de mes con un espectáculo audiovisual inmersivo repasando los clásicos bailables de Madonna.
31 de julio	Curso: Gestión Cultural Aplicada	Universidad de O'Higgins (UOH)	Cultura	Sesión final y cierre del programa de certificación en formulación de proyectos artísticos.`.split('\n');

const EMOJIS = {
  'Música': '🎸',
  'Cultura': '🎭',
  'Deporte': '⚽',
  'Comedia': '😂',
  'Feria': '🎪',
  'Gastronomía': '🍷'
};

const evs = lines.map(line => {
  if(!line.trim()) return;
  const parts = line.split('\t');
  if(parts.length < 5) return;
  
  let diaStr = parts[0];
  let titulo = parts[1].replace(/'/g, "\\'");
  let lugar = parts[2].replace(/'/g, "\\'");
  let cat = parts[3].replace(/'/g, "\\'");
  let desc = parts[4].replace(/'/g, "\\'");
  
  let d = 1;
  const match = diaStr.match(/(\d+)/);
  if(match) d = parseInt(match[1]);
  if(diaStr.includes('Todo julio')) d = 1;
  
  let dStr = d < 10 ? '0' + d : d;
  let dateStr = '2026-07-' + dStr + 'T20:00:00Z';
  
  // Categorias oficiales de la app
  let catF = 'Feria';
  if (cat.includes('Música')) catF = 'Música';
  if (cat.includes('Cultura')) catF = 'Cultura';
  if (cat.includes('Deporte')) catF = 'Deporte';
  if (cat.includes('Comedia')) catF = 'Comedia';
  if (cat.includes('Gastronomía')) catF = 'Gastronomía';
  
  let emoji = EMOJIS[catF] || '✨';
  
  return `  { region: 'O\\'Higgins', lugar: '${lugar}', titulo: '${titulo}', descripcion: '${desc}', fecha: new Date('${dateStr}'), categoria: '${catF}', emoji: '${emoji}' },`;
}).filter(Boolean).join('\n');

fs.writeFileSync('ohiggins.txt', '  // 🌟 O’HIGGINS (Julio)\n' + evs);
console.log('Done');
