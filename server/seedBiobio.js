const mongoose = require('mongoose');
require('dotenv').config();
const Panorama = require('./models/Panorama');

const rawData = `01 de Julio	Wirivilú, ser de agua (Saynata)	Pabellón 83, Lota	Cultura	Profunda propuesta escénica de teatro visual e identitario para infancias, parte del Pu! Festival.
02 de Julio	Un Cuento Chileno (Teatro)	Teatro Biobío, Concepción	Cultura	Aclamada obra escénica maulina que explora el horror y la mitología local en su inicio de gira nacional.
02 de Julio	Huachipato FC vs. Deportes Concepción	Estadio CAP, Talcahuano	Deporte	Tenso partido oficial válido por la fase de grupos de la Copa Chile, de alta convocatoria.
03 de Julio	El Kanka - Gira La Calma 2026	Teatro Biobío, Concepción	Música	Concierto íntimo del reconocido cantautor español repasando sus éxitos en su regreso internacional.
03 de Julio	Mi pequeño Pachakuti	Centro Cultural de Arauco, Arauco	Cultura	Obra teatral familiar que aborda con sensibilidad la cosmovisión andina y el cambio climático (Pu! Festival).
04 de Julio	Día Nacional de la Cuequera y el Cuequero	Plaza Tribunales, Concepción	Cultura	Extensa jornada diurna de danza y folclore con escenario compartido y agrupaciones de música en vivo.
04 de Julio	Orquesta Sinfónica UdeC: Concierto 74 Años	Teatro UdeC, Concepción	Música	Programa magistral de aniversario bajo la experta dirección de Luis Toro Araya y la cellista Milena Marena.
04 de Julio	Papelucho Casi Caaasi Huérfano	Teatro Biobío, Concepción	Cultura	Montaje familiar inspirado en las vivencias del icónico y travieso personaje de la literatura infantil nacional.
04 de Julio	Taller familiar Danza Expansiva	Casa de la Cultura, Chiguayante	Cultura	Actividad formativa enfocada en la exploración corporal consciente e integración intergeneracional (Pu! Festival).
04 al 25 de Julio	Visitas Guiadas Teatro Biobío	Teatro Biobío, Concepción	Cultura	Recorridos patrimoniales sabatinos gratuitos para descubrir la arquitectura e ingeniería escénica del coliseo.
05 de Julio	Los Vásquez - Gira Amores de Invierno	Teatro UdeC, Concepción	Música	Multitudinario concierto de corte romántico y pop "cebolla" del aclamado dúo chileno.
05 de Julio	U. de Concepción vs. Rangers (Copa Chile)	Estadio Federico Schwager, Coronel	Deporte	Partido oficial clave y definitorio por el Grupo F del torneo copero, disputado en la comuna minera.
05 de Julio	Cross Country Club Atletismo Penco 2026	Fundo Coihueco, Penco	Deporte	Desafiante competencia atlética matutina de campo traviesa abierta para diversas categorías y edades.
06 de Julio	Lunes Cinematográficos: 'Never rarely...'	Teatro UdeC, Concepción	Cultura	Proyección en sala grande del galardonado y descarnado drama realista de la directora Eliza Hitman.
06 de Julio	Deportes Concepción vs. Deportes Temuco	Estadio CAP, Talcahuano	Deporte	Encuentro nocturno de Copa Chile reubicado en Talcahuano debido a labores de resiembra y mantención.
06 al 10 de Julio	Festival Festhome Lebu	Lebu y Concepción	Cultura	Actividades de industria y exhibición correspondientes al certamen cinematográfico regional.
07 de Julio	Concierto Aniversario 35 años UCSC	C. de Extensión UCSC, Concepción	Música	Presentación conmemorativa de la Orquesta Clásica y Coro UCSC abarcando complejas piezas de música docta.
07 de Julio	Carreras Hípicas Regionales	Club Hípico, Penco	Deporte	Jornada oficial de la hípica regional (Reunión N°33) congregando al circuito ecuestre del sur de Chile.
08 de Julio	Conce Suena 2: Monsinore + Yesca + Kangore	Casa de Salud, Concepción	Música	Exitoso ciclo de fomento a bandas emergentes locales con entrada liberada y sistema de votación del público.
08 de Julio	Leguau Compañía - Cultura Viva Somos Barrio	Esc. María Esther Breve, Coronel	Cultura	Función gratuita de circo familiar orientada al rescate de la memoria en sectores vulnerables.
08 al 10 de Julio	Antígona del pueblo Pez	Sala de Cámara TBB, Concepción	Cultura	Profundo montaje teatral dramático de factura regional en una atmósfera de sala íntima y experimental.
09 de Julio	Rodrigo Villegas: Esto es para ustedes	Teatro Lihuén, Concepción	Comedia	Rutina estelar de stand-up comedy de alta demanda a cargo del reconocido humorista y triunfador de Viña.
09 de Julio	Ballet Folclórico de Coronel (BAFCOR)	Teatro Biobío, Concepción	Cultura	Majestuosa gala de celebración por los 20 años de una de las agrupaciones de danza folclórica más importantes.
09 de Julio	Concierto Dúo de Violín y Guitarra	Iglesia Luterana, Concepción	Música	Sublime concierto de cámara con entrada liberada protagonizado por los maestros Jeimmi Carrasco y Mauro Millán.
09 de Julio	Oceanborn: Tributo a Nightwish	Riff Bar, Los Ángeles	Música	Enérgica presentación musical en vivo dedicada a la impecable reproducción del metal sinfónico.
09 de Julio	Sesión del Consejo Regional del Biobío	Corporación Cultural, Los Ángeles	Ferias u otro panorama	Sesión administrativa clave del ente gubernamental para aprobar carteras de financiamiento provincial.
09 de Julio	Carreras Hípicas Regionales	Club Hípico, Penco	Deporte	Segunda jornada semanal (Reunión N°34) de la actividad hípica y rentada de la zona sur.
10 de Julio	Lanzamiento Película 'Americana'	Balmaceda Arte Joven, Concepción	Cultura	Función de estreno de la obra cinematográfica independiente y posterior foro con sus creadores.
10 de Julio	Destruyendo Autos + Blum en Concepción	Zar Studios, Concepción	Cultura	Actividad teórica y práctica en torno a la historia, técnicas y reglas de disciplinas de intervención urbana.
10 de Julio	Luis Slimming: Armando Chistes	Teatro Lihuén, Concepción	Comedia	Doble función nocturna de stand-up comedy (19:30 y 22:30) con el consagrado "Don Comedia".
10 de Julio	Santos Dumont: Canciones Chilenas	Teatro Biobío, Concepción	Música	Refinado concierto acústico de la emblemática y pionera agrupación de pop rock psicodélico penquista.
10 de Julio	Dúo de Violín y Guitarra (San Pedro)	Corp. Cultural, San Pedro de la Paz	Música	Extensión gratuita de la aplaudida gira de cámara de Jeimmi Carrasco y Mauro Millán al sur del río.
10 de Julio	Manuel García: Fin de Gira Pánico	Teatro Municipal, Los Ángeles	Música	Show extendido cerrando el emotivo ciclo de reinterpretación del disco más emblemático del trovador nacional.
10 de Julio	Freestyle National League (FNL)	Gimnasio Bicentenario, Huépil	Cultura	Inédito encuentro nacional de batallas de rap improvisado y cultura urbana en la comuna de Tucapel.
10 de Julio	Lanzamiento de libro: La parada siguiente	Punto Lector Municipal, Los Ángeles	Cultura	Presentación literaria del primer libro escrito por el talentoso estudiante local Esteban Bascone.
10 al 12 de Julio	La Sole: Picante pero Feliz	Teatro UdeC, Concepción	Comedia	Aclamado montaje de comedia protagonizado por el agudo y viral personaje de la actriz Paloma Larraín.
11 de Julio	Tenemos Explosivos & C.A.F.	La Bodeguita de Nicanor, Concepción	Música	Extenso concierto doble de las aclamadas agrupaciones de post-hardcore y jazz rap alternativo chileno.
11 de Julio	Fiesta Generación 90-2000	Templo Crápula, Concepción	Ferias u otro panorama	Efervescente fiesta temática retro enfocada en revivir la nostalgia musical de las discotecas de los años 90s y 2000.
11 de Julio	Orquesta USS: Requiem Aeternam	Teatro Biobío, Concepción	Música	Magno y sobrecogedor concierto de música docta y canto lírico enfocado en las históricas misas de réquiem.
11 de Julio	La Mutra en vivo	Sala de Cámara TBB, Concepción	Música	Íntima presentación en vivo de la banda local, destacando fusiones rítmicas de la identidad sonora penquista.
11 de Julio	Los Grillos Sordos (Pu! Festival)	Teatro Extensión UCSC, Concepción	Cultura	Conmovedora obra teatral dirigida a las infancias y la familia, marcando el último fin de semana de vacaciones.
11 de Julio	Leafar Riobueno: Masterclass y Concierto	Corp. Cultural, San Pedro de la Paz	Música	Intensa jornada de bronce con clase técnica (15:00) y solemne recital clásico vespertino (19:00) del trompetista.
11 de Julio	4ta Fecha Circuito de Ajedrez	Sede Prieto 880, Nacimiento	Deporte	Tradicional competencia de ajedrez rápido que congrega a los más agudos exponentes de la provincia.
11 de Julio	Torneo Ajedrez Nachita Campeona U13	Sede Postdam 751, Hualpén	Deporte	Certamen conmemorativo y formativo diseñado para promover y foguear a la promesa infantil de la región.
11 de Julio	81ro Torneo Aviador Acevedo	Sede Squella 298, Lota	Deporte	Encuentro sabatino ininterrumpido del histórico club de ajedrez de la zona minera.
11 de Julio	Oficina de Asuntos (Pu! Festival)	Corp. Cultural, Los Ángeles	Cultura	Brillante y divertida comedia satírica sobre dinámicas laborales a cargo de La Daniel López Company.
11 de Julio	Diagnóstico Participativo de Discapacidad	Comuna de Los Álamos	Ferias u otro panorama	Encuentro cívico institucional convocado para diseñar planes integrales de rehabilitación comunal inclusiva.
12 de Julio	Deportes Concepción vs. Pto. Montt	Estadio Ester Roa, Concepción	Deporte	Cruce oficial y definitorio del Grupo H de la Copa Chile, marcando el anhelado retorno al principal recinto deportivo.
13 de Julio	Lunes Cinematográficos: 'But I'm a Cheerleader'	Teatro UdeC, Concepción	Cultura	El prestigioso ciclo enfocado en las grandes directoras proyecta el clásico filme satírico LGBT de Jamie Babbit.
13 Jul - 14 Ago	Exposición 'Chile Sumergido'	Corp. Cultural, San Pedro de la Paz	Cultura	Muestra visual inmersiva y gratuita del fotógrafo José Tomás Yakasovic sobre la biodiversidad marina nacional.
14 de Julio	La Odisea (La Otra Zapatilla Teatro)	Liceo M. Latorre, Curanilahue	Cultura	Creativo montaje teatral lúdico e itinerante que reinventa el poema épico homérico para todas las edades.
15 de Julio	El Padre del Cóndor: Capítulo 3	Bandera 1001, Concepción	Cultura	Presentación escénica experimental e íntima que mezcla narrativas fragmentadas y música atmosférica local.
15 de Julio	Fiesta Trinity Resurrections	Templo Crápula, Concepción	Ferias u otro panorama	Noche de culto dedicada de lleno a la música oscura, los potentes sonidos sintéticos y la escena post-punk.
15 de Julio	Charly Benavente en Bar Callejón	Bar Callejón, Concepción	Música	Presentación cercana y en formato acústico del talentoso cantautor araucano en uno de los bares clásicos de la ciudad.
15 de Julio	Metalengua en vivo	Casa de Salud, Concepción	Música	Enérgico show de trasnoche de la aplaudida y excéntrica banda chilena de pop de fusión y ritmos bailables.
15 de Julio	XIII Open de Ajedrez Lebu 2026	Mackay 730, Lebu	Deporte	Importante torneo competitivo de ajedrez válido para rankings nacionales, con sustanciosos premios en efectivo.
16 de Julio	Jueves 16 Feriado Emo	Bandera 1001, Concepción	Ferias u otro panorama	Popular celebración alternativa que congrega a la numerosa comunidad nostálgica de la cultura emo y el screamo.
16 de Julio	Conce Suena 2: S. Anguita + Meduza MC	Casa de Salud, Concepción	Música	Sesión de integración de vibrantes ritmos urbanos, hip-hop, R&B y experimentación vocal con entrada gratuita.
16 de Julio	Natalia Valdebenito en Teatro Lihuén	Teatro Lihuén, Concepción	Comedia	Agotadas funciones dobles (19:30 y 22:30) donde la actriz despliega su implacable, inteligente y feminista humor.
16 de Julio	El día que un colibrí se posó en mi ventana	Sala de Cámara TBB, Concepción	Cultura	Delicada obra dramática contemporánea programada en la sala experimental del gran recinto teatral del Biobío.
16 de Julio	Pulso de un hombre homosexual latinoamericano	Teatro Biobío, Concepción	Cultura	Desgarrador y valiente montaje de artes escénicas que fusiona texto actoral y danza contemporánea identitaria.
16 de Julio	Santi Cairo en vivo	La Bodeguita de Nicanor, Concepción	Música	Extenso show de cumbia villera a cargo del ex-vocalista de Yerba Brava para detonar la previa del fin de semana.
16 de Julio	Tributo a My Chemical Romance	Riff Bar, Los Ángeles	Música	Fiel y visceral concierto tributo a la icónica agrupación de rock conceptual norteamericana liderado por Black Romance.
16 de Julio	Centenario Coronación Virgen del Carmen	Estación Yumbel, Yumbel	Ferias u otro panorama	Solemne e histórica celebración comunitaria con peregrinación, eucaristía y vigorosos bailes de agrupaciones de caporales.
16 de Julio	Elección Agrupación de Feriantes Tubul	Restaurante Tubul, Arauco	Ferias u otro panorama	Acto cívico fundamental para la estructuración sindical y económica de los comerciantes y pescadores de la costa.
17 de Julio	Vestigial - Todo afuera nada adentro	Bandera 1001, Concepción	Música	Estridente concierto en vivo que reúne a agrupaciones independientes emergentes de la fiera escena metalcore y hardcore.
17 de Julio	A Perfect Tool en vivo	Templo Crápula, Concepción	Música	Sofisticada presentación de alta factura técnica interpretando clásicos de las bandas de culto Tool y A Perfect Circle.
17 de Julio	Liturgia Sintética	Club Space, Concepción	Música	Fiesta nocturna de nicho enfocada enteramente en los veloces ritmos del techno, el darkwave y la electrónica industrial.
17 de Julio	Orquesta Ciudadana: Shakespeare	Teatro Biobío, Concepción	Música	Concierto sinfónico temático compuesto por piezas magistrales inspiradas en las inmortales tragedias del bardo inglés.
17 de Julio	Adrián Correa 'El Cebolla': Vida Loca	Teatro Lihuén, Concepción	Comedia	Show de humor unipersonal, dinámico y deslenguado a cargo de uno de los exintegrantes de Fusión Humor.
17 de Julio	Tributo a System of a Down	Riff Bar, Los Ángeles	Música	Espectáculo cargado de adrenalina homenajeando la vertiginosa rabia y el virtuosismo de la mítica banda armenio-estadounidense.
17 de Julio	Ritual From the Crypt II	Zalsi Puedes, Talcahuano	Música	Cumbre regional de metal extremo subterráneo, congregando bandas implacables de death y black metal del circuito.
17 de Julio	Pollypocket: Barra Libre para Chica	Club V, Tomé	Ferias u otro panorama	Bulliciosa noche de discoteca y esparcimiento con promociones de coctelería especiales dirigidas al público femenino local.
18 de Julio	Despejado - Aniversario 10 años	Bandera 1001, Concepción	Música	Concierto conmemorativo repasando la sólida primera década de trayectoria de esta valorada agrupación independiente.
18 de Julio	Candola Metal Fest III	La Esquina Rosada, Concepción	Música	Festival autogestionado de música pesada organizado a total beneficio del desarrollo y preservación del centro cultural.
18 de Julio	Nu Metal Night	Templo Crápula, Concepción	Música	Intensa fiesta temática y shows en vivo tributando el pesado legado de gigantes del estilo como Korn, Slipknot y Linkin Park.
18 de Julio	Julius Popper - Gira 25 años	Teatro Biobío, Concepción	Música	Histórico concierto de larga duración de la célebre banda de blues rock y bronces penquista celebrando un cuarto de siglo en ruta.
18 de Julio	Myriam Hernández - Tauro Tour	Teatro UdeC, Concepción	Música	Esperada escala local de la impecable gira internacional de la baladista romántica más importante y premiada de Chile.
18 de Julio	Alex Ortiz en Concepción	Teatro Lihuén, Concepción	Comedia	Divertida e hilarante rutina de stand-up comedy ("El Flaite Chileno"), consolidando su arrollador éxito tras su paso por Viña.
18 de Julio	Taller familiar Circo en Familia	Teatro Biobío, Concepción	Cultura	Actividad de integración física y lúdica guiada por el elenco profesional de acrobacia de la obra de circo "Tormenta".
18 de Julio	Raid Cañetazo 2026	Sede Cayucupil, Cañete	Deporte	Espectacular y extremo evento masivo de motos de enduro atravesando los agrestes e imponentes paisajes de Nahuelbuta.
18 de Julio	Fiesta 90 2000 Los Ángeles: Room Dance	Room Dance, Los Ángeles	Ferias u otro panorama	Mega fiesta bailable retro que incluye, como principal atractivo, un espectacular show tributo internacional a la banda Bon Jovi.
18 de Julio	Socios del Humor	Av. Los Robles 3668, Coronel	Comedia	Dos leyendas institucionales del humor chileno (Centella y Charola Pizarro) se unen en un espectáculo imperdible de larga duración.
19 de Julio	Bros y la Galaxia & Las Guerreras Kpop	Teatro Municipal, Los Ángeles	Cultura	Vanguardista e interactivo espectáculo familiar que mezcla asombrosas acrobacias, estética gamer y complejas rutinas de baile pop coreano.
20 de Julio	Lunes Cinematográficos: 'Zama'	Teatro UdeC, Concepción	Cultura	El prestigioso y selecto ciclo de cine exhibe en pantalla grande la aclamada e hipnótica cinta histórica de la directora argentina Lucrecia Martel.
20 y 21 de Julio	Felipe Avello	Teatro UdeC, Concepción	Comedia	Extensas jornadas dobles a cargo del inigualable comediante nacional, agotando el aforo máximo del recinto universitario.
21 de Julio	Circuito Regional Atletismo	Estadio F. Schwager, Coronel	Deporte	Competitiva séptima fecha del campeonato escolar oficial, avalado y respaldado técnicamente por el Instituto Nacional de Deportes.
22 de Julio	Isabel (Isabel, desterrada en Isabel)	Teatro Biobío, Concepción	Cultura	Compleja puesta en escena en formato de monólogo teatral que explora la psiquis de una de las figuras históricas más icónicas del país.
22 de Julio	Nochejapo en Teatro Lihuén	Teatro Lihuén, Concepción	Cultura	Colorido punto de encuentro temático diseñado especialmente para los fieles aficionados a la cultura nipona, la animación, el manga y la gastronomía.
22 de Julio	Elección Mujeres Genesis	Centro C. Pichilo, Arauco	Ferias u otro panorama	Encuentro cívico local de carácter eleccionario para la reestructuración comunitaria de la agrupación vecinal y productiva de mujeres.
23 de Julio	Libro: El caso de las maestras rurales	Punto Lector Municipal, Los Ángeles	Cultura	Presentación literaria formal de la elogiada novela regional escrita por la talentosa periodista Paz Ávalos González.
23 de Julio	3ra Fecha Circuito Aviador Acevedo	Sede Squella 298, Lota	Deporte	Continuación de la rigurosa liga de ajedrez escolar y por equipos en las dependencias del histórico club lotino.
24 de Julio	Yo Duelo	Teatro Biobío, Concepción	Cultura	Sensible obra de teatro dramático contemporáneo que aborda temáticas tabúes como la pérdida, el luto prolongado y la resiliencia en la sociedad moderna.
24 de Julio	La secreta obscenidad de cada día	Teatro Biobío, Concepción	Cultura	Impecable montaje del clásico y corrosivo drama político de tintes psicoanalíticos escrito por el incombustible Marco Antonio de la Parra.
24 de Julio	Cari Monteci: Café, Música y Fútbol	Le Petit Hotel Cafetería, Concepción	Música	Novedoso formato de show estilo boutique que intercala íntimos acordes femeninos en vivo con una apasionada conversación y debate futbolero.
24 de Julio	Pinguino Core en vivo	Refugio Bar, Concepción	Música	Ruidoso festival de la escena musical underground local que brinda merecida cabida a las agrupaciones emergentes del punk y hardcore penquista.
24 de Julio	Carlita: Nadie dijo que sería fácil	Teatro Lihuén, Concepción	Comedia	Exitosa doble función nocturna (19:30 y 22:30) de la influencer abordando con sarcasmo las presiones de la adultez desde una perspicaz perspectiva femenina.
24 de Julio	Crux - Tributo a Los Bunkers	Zalsi Puedes, Talcahuano	Música	Larga noche de rock chileno tributando a la perfección el infinito catálogo de los máximos ídolos y embajadores musicales de la ciudad puerto.
24-25 de Julio	Programa Sinfónico 6: Misterios y Leyendas	Teatro UdeC, Concepción	Música	Extraordinario concierto docto liderado por la batuta de Dayner Tafur-Díaz con la participación estelar y solista del destacado violinista Freddy Varela.
25 de Julio	Hollow Knight Acústico	Teatro Lihuén, Concepción	Música	Dos aplaudidas funciones ejecutadas por el Cuarteto Bronte que transforman la magistral banda sonora orquestal del videojuego en un sutil recital de cuerdas.
25 de Julio	El Padre del Cóndor (Obra Principal)	Teatro Biobío, Concepción	Cultura	Majestuosa culminación de este proyecto escénico, trasladando la obra experimental a la Sala Principal del gran recinto teatral del Biobío.
25 de Julio	Onceavo presenta 2	Refugio Bar, Concepción	Música	Oscura y vibrante noche dedicada de lleno a la creciente escena urbana independiente, convocando a hábiles productores de beats, MCs de hip-hop y exponentes de trap.
25 de Julio	Parking Lot Histórico	Templo Crápula, Concepción	Música	Extensa sesión festiva que viaja a los dorados años noventa mediante una cuidadosa y bailable selección de grandes himnos del indie y el rock alternativo mundial.
25 de Julio	Sesiones Madriguera Vol. 1	Balmaceda Arte Joven, Concepción	Música	Imprescindible plataforma artística diseñada para ser la vitrina que permita descubrir en directo el trabajo fresco de los nuevos creadores de la región.
25 de Julio	Tata Barahona & LSD en vivo	La Bodeguita de Nicanor, Concepción	Música	Extenso e histórico concierto del legendario e inagotable trovador nacional celebrando a tablero vuelto los 15 años de su fundamental disco 'Fotografías'.
25 de Julio	Tool Apc en vivo	Teatro Lihuén, Concepción	Música	Impecable show musical consagrado a replicar la intrincada rítmica y las complejas atmósferas progresivas ideadas por el estadounidense Maynard James Keenan.
25 de Julio	Fiesta +40 Concepción (+25)	C. El Venado 715, San Pedro	Ferias u otro panorama	Cotizada y masiva fiesta bailable retro exclusiva para un público adulto mayor a 25 años, apostando por las comodidades y seguridad de los grandes salones.
25 de Julio	Michael El Musical Live	Teatro Marina del Sol, Talcahuano	Música	Deslumbrante superproducción internacional de factura oficial que logra capturar la magia, las complejas coreografías y la energía del indiscutido Rey del Pop.
25 de Julio	The Vastness Session 1	Zalsi Puedes, Talcahuano	Música	Brutal cumbre sonora enfocada en los amantes de los decibeles pesados, abarcando densas y lúgubres expresiones del post-metal, el sludge y la experimentación.
26 de Julio	Ella Baila Sola - Tour 30 Aniversario	Teatro UdeC, Concepción	Música	Melancólico y exitoso paso por el sur de Chile del icónico y perdurable dúo vocal femenino del pop español, conmemorando tres décadas de trayectoria.
26 de Julio	Deportes Concepción vs. O'Higgins F.C.	Estadio Ester Roa, Concepción	Deporte	Partido trascendental válido por la infartante Fecha 16 de la Primera División, marcando la reapertura oficial de la cancha titular del Biobío.
26 de Julio	System of a Down Tributo	Teatro Lihuén, Concepción	Música	Liberadora descarga de adrenalina con una banda soporte que ejecuta fielmente los ritmos vertiginosos y la implacable estridencia política de SOAD.
26 de Julio	Los Ángeles Clásicos (Ex Ángeles Negros)	Teatro Marina del Sol, Talcahuano	Música	Elegante velada cargada de romanticismo y recuerdos con las legendarias voces fundacionales que ayudaron a patentar la balada en todo el continente.
27 de Julio	Elección Comerciantes Feria Los Araucanos	Sede Local, Arauco	Ferias u otro panorama	Vital proceso de estructuración cívica y sindical que permite afianzar el poder de negociación de los trabajadores independientes de la tradicional feria libre.
28 al 01 de Ago	FimcCo: Festival Internacional de Música de Cámara	Sala de Cámara TBB, Concepción	Música	Imponente semana de inauguración de la edición 2026 "Memorias", la cual congrega a los ejecutantes clásicos de cuerdas y vientos más refinados del medio internacional.
30 de Julio	Gloria del Canto: Mucho más que un musical	Teatro Biobío, Concepción	Cultura	Ambiciosa y deslumbrante propuesta de teatro musical protagonizada íntegramente por formidables talentos de la zona, combinando impecable despliegue vocal y coreográfico.
30 de Julio	Pearl Jam Ten en vivo	Teatro Lihuén, Concepción	Música	Fiel e intenso homenaje sonoro y visual a uno de los discos seminales y pilares indiscutidos de la revolución del grunge de la ciudad de Seattle.
30 de Julio	Jonasty Tour en Concepción	Teatro Lihuén, Concepción	Música	Cita nocturna ineludible con los acelerados sonidos del rap nacional y las rimas contestatarias del cada vez más pujante circuito urbano nacional underground.
31 de Julio	Que Vuelvan Los Lentos	Teatro Lihuén, Concepción	Ferias u otro panorama	Singular y romántica noche temática enfocada exclusivamente en el segmento de público que desea retornar a las clásicas dinámicas de las pistas de baile de las décadas pasadas.
31 de Julio	Cierre Concurso VRID SEMILLA	Universidad de Concepción	Cultura	Hito neurálgico en el desarrollo académico e investigativo, marcando la fecha tope para la postulación a fondos de fomento a las ciencias y a los jóvenes académicos locales.
31 de Julio	Fiesta Especial de Cierre de Julio	Templo Crápula, Concepción	Ferias u otro panorama	Vertiginosa y extensa jornada nocturna diseñada para bajar el telón del mes de las vacaciones de invierno, mezclando la electrónica, el indie y los clásicos de la cultura alternativa`;

const EMOJIS = {
  'Música': '🎸',
  'Cultura': '🎭',
  'Deporte': '⚽',
  'Comedia': '😂',
  'Feria': '🎪',
  'Gastronomía': '🍷'
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI_DIRECT || process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Clear previous biobio events if any
    await Panorama.deleteMany({ region: "Biobío" });
    console.log("Deleted old Biobío events");
    
    const lines = rawData.split('\n');
    
    const toInsert = lines.map(line => {
      if(!line.trim()) return null;
      const parts = line.split('\t');
      if(parts.length < 5) return null;
      
      let diaStr = parts[0];
      let titulo = parts[1].trim();
      let lugar = parts[2].trim();
      let cat = parts[3].trim();
      let desc = parts[4].trim();
      
      let d = 1;
      const match = diaStr.match(/(\\d+)/);
      if(match) d = parseInt(match[1]);
      
      let dStr = d < 10 ? '0' + d : d;
      let dateStr = '2026-07-' + dStr + 'T20:00:00Z';
      
      let catF = 'Feria';
      if (cat.includes('Música')) catF = 'Música';
      if (cat.includes('Cultura')) catF = 'Cultura';
      if (cat.includes('Deporte')) catF = 'Deporte';
      if (cat.includes('Comedia')) catF = 'Comedia';
      if (cat.includes('Gastronomía')) catF = 'Gastronomía';
      if (cat.includes('Ferias u otro panorama')) catF = 'Feria';
      
      let emoji = EMOJIS[catF] || '✨';
      
      return {
        region: 'Biobío',
        lugar: lugar,
        titulo: titulo,
        descripcion: desc || "Panorama en Biobío",
        fecha: new Date(dateStr),
        categoria: catF,
        emoji: emoji,
        esOficial: true,
        activo: true
      };
    }).filter(Boolean);
    
    await Panorama.insertMany(toInsert);
    console.log("Inserted " + toInsert.length + " events for Biobío");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
