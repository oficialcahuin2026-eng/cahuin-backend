const regiones = [
  { 
    nombre: "Arica y Parinacota", 
    nombreCorto: "Arica y Parinacota",
    comunas: ["Arica", "Camarones", "Putre", "General Lagos", "Villa Frontera", "San Miguel de Azapa", "Poconchile", "Molinos", "Chapisca", "Sora", "Las Maitas", "Alto de Ramírez", "Caleta Vítor"]
  },
  { 
    nombre: "Tarapacá", 
    nombreCorto: "Tarapacá",
    comunas: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Pica", "Huara", "Camiña", "Colchane", "Mocha", "La Tirana", "Cariquima", "Isluga", "Cancosa", "Mamiña"]
  },
  { 
    nombre: "Antofagasta", 
    nombreCorto: "Antofagasta",
    comunas: ["Antofagasta", "Calama", "Tocopilla", "Mejillones", "Taltal", "San Pedro de Atacama", "María Elena", "Sierra Gorda", "Ollagüe", "Salar del Carmen", "La Chimba", "Cobija", "Paposo"]
  },
  { 
    nombre: "Atacama", 
    nombreCorto: "Atacama",
    comunas: ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Huasco", "Freirina", "Alto del Carmen", "El Salvador"]
  },
  { 
    nombre: "Coquimbo", 
    nombreCorto: "Coquimbo",
    comunas: ["La Serena", "Coquimbo", "Ovalle", "Illapel", "Los Vilos", "Salamanca", "Vicuña", "Monte Patria", "Combarbalá", "Andacollo", "Punitaqui", "Canela", "Río Hurtado", "Paihuano", "La Higuera", "Tongoy", "El Palqui"]
  },
  { 
    nombre: "Valparaíso", 
    nombreCorto: "Valparaíso",
    comunas: ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "Concón", "San Antonio", "Quillota", "San Felipe", "Los Andes", "La Calera", "Limache", "La Ligua", "San Esteban", "Olmué", "Quintero", "Puchuncaví", "Casablanca", "Nogales", "Hijuelas", "La Cruz", "Papudo", "Zapallar", "Petorca", "Cabildo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "Catemu", "Llay-Llay", "Panquehue", "Putaendo", "Santa María", "Juan Fernández", "Isla de Pascua (Hanga Roa)", "Algarrobo", "Mirasol", "El Yeco", "Ventanas", "Placilla de Peñuelas", "Reñaca", "Peñablanca", "El Belloto"]
  },
  { 
    nombre: "Metropolitana de Santiago", 
    nombreCorto: "Metropolitana",
    comunas: ["Santiago", "Puente Alto", "Maipú", "La Florida", "San Bernardo", "Las Condes", "Peñalolén", "Pudahuel", "La Pintana", "El Bosque", "Ñuñoa", "Cerro Navia", "Recoleta", "Renca", "Conchalí", "La Granja", "Estación Central", "Quilicura", "Providencia", "Pedro Aguirre Cerda", "Lo Espejo", "Macul", "Lo Prado", "Quinta Normal", "San Joaquín", "La Reina", "San Ramón", "Melipilla", "La Cisterna", "Vitacura", "Colina", "Lampa", "Tiltil", "Pirque", "San José de Maipo", "Buin", "Calera de Tango", "Paine", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Padre Hurtado", "Peñaflor", "Talagante", "El Monte", "Isla de Maipo", "Chicureo", "Chamisero", "Valle Grande", "Ciudad del Valle", "Bajos de San Agustín", "Alto Jahuel", "La Obra", "Las Vertientes"]
  },
  { 
    nombre: "Libertador General Bernardo O'Higgins", 
    nombreCorto: "O'Higgins",
    comunas: ["Rancagua", "San Fernando", "Rengo", "Machalí", "Santa Cruz", "Pichilemu", "San Vicente de Tagua Tagua", "Graneros", "Mostazal", "Requínoa", "Codegua", "Coinco", "Coltauco", "Doñihue", "Las Cabras", "Malloa", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Chépica", "Chimbarongo", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "La Estrella", "Litueche", "Marchigüe", "Navidad", "Paredones", "Lo Miranda", "Gultro", "Los Lirios", "Punta Diamante", "La Punta"]
  },
  { 
    nombre: "Maule", 
    nombreCorto: "Maule",
    comunas: ["Talca", "Curicó", "Linares", "Constitución", "Cauquenes", "Molina", "San Javier", "Parral", "San Clemente", "Longaví", "Maule", "Rauco", "Romeral", "Teno", "Colbún", "Retiro", "Villa Alegre", "Yerbas Buenas", "Hualañé", "Licantén", "Sagrada Familia", "Empedrado", "Curepto", "Pelarco", "Pencahue", "Río Claro", "San Rafael", "Vichuquén", "Chanco", "Pelluhue"]
  },
  { 
    nombre: "Ñuble", 
    nombreCorto: "Ñuble",
    comunas: ["Chillán", "Chillán Viejo", "San Carlos", "Coihueco", "Bulnes", "Yungay", "Quillón", "San Ignacio", "El Carmen", "Quirihue", "Cobquecura", "Coelemu", "Ninhue", "Portezuelo", "Ránquil", "Trehuaco", "Pemuco", "Pinto", "Ñiquén", "San Fabián", "San Nicolás"]
  },
  { 
    nombre: "Biobío", 
    nombreCorto: "Bío Bío",
    comunas: ["Concepción", "Talcahuano", "Los Ángeles", "Coronel", "San Pedro de la Paz", "Chiguayante", "Hualpén", "Penco", "Tomé", "Lota", "Hualqui", "Santa Juana", "Lebu", "Arauco", "Cañete", "Curanilahue", "Los Álamos", "Contulmo", "Cabrero", "Monte Águila", "Mulchén", "Nacimiento", "Santa Bárbara", "Yumbel", "Florida", "Huépil", "Laraquete"]
  },
  { 
    nombre: "La Araucanía", 
    nombreCorto: "Araucanía",
    comunas: ["Temuco", "Padre Las Casas", "Angol", "Villarrica", "Victoria", "Lautaro", "Nueva Imperial", "Pucón", "Pitrufquén", "Collipulli", "Loncoche", "Traiguén", "Curacautín", "Carahue", "Gorbea", "Purén", "Cunco", "Renaico", "Vilcún", "Freire", "Cholchol", "Teodoro Schmidt", "Toltén", "Galvarino", "Lumaco", "Saavedra", "Ercilla", "Los Sauces", "Melipeuco", "Perquenco", "Curarrehue", "Lonquimay"]
  },
  { 
    nombre: "Los Ríos", 
    nombreCorto: "Los Ríos",
    comunas: ["Valdivia", "La Unión", "Río Bueno", "Panguipulli", "Lanco", "Corral", "Los Lagos", "Paillaco", "San José de la Mariquina", "Máfil", "Futrono", "Lago Ranco"]
  },
  { 
    nombre: "Los Lagos", 
    nombreCorto: "Los Lagos",
    comunas: ["Puerto Montt", "Osorno", "Puerto Varas", "Castro", "Ancud", "Quellón", "Frutillar", "Calbuco", "Fresia", "Los Muermos", "Llanquihue", "Maullín", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quemchi", "Quinchao", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena", "Alerce", "Llanquihue (ciudad)", "Alerce (localidad)"]
  },
  { 
    nombre: "Aysén del General Carlos Ibáñez del Campo", 
    nombreCorto: "Aysén",
    comunas: ["Coyhaique", "Puerto Aysén", "Cisnes", "Chile Chico", "Cochrane", "Río Ibáñez", "Guaitecas", "Lago Verde", "Tortel", "O'Higgins"]
  },
  { 
    nombre: "Magallanes y de la Antártica Chilena", 
    nombreCorto: "Magallanes",
    comunas: ["Punta Arenas", "Puerto Natales", "Porvenir", "Puerto Williams", "San Gregorio", "Laguna Blanca", "Río Verde", "Cabo de Hornos", "Torres del Paine", "Timaukel", "Primavera", "Villa Las Estrellas", "Puerto Edén"]
  }
];

module.exports = regiones;
