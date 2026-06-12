export const REGIONES_CHILE = {
  'Arica y Parinacota': ['Arica', 'Putre', 'Camarones', 'General Lagos'],
  'Tarapacá': ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Pica', 'Huara'],
  'Antofagasta': ['Antofagasta', 'Calama', 'Tocopilla', 'San Pedro de Atacama', 'Mejillones'],
  'Atacama': ['Copiapo', 'Vallenar', 'Caldera', 'Chanaral', 'Huasco'],
  'Coquimbo': ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel', 'Vicuna'],
  'Valparaíso': ['Valparaiso', 'Vina del Mar', 'Quilpue', 'Villa Alemana', 'San Antonio'],
  'Metropolitana': ['Santiago', 'Santiago Centro', 'Providencia', 'Maipu', 'Puente Alto', 'La Florida', 'Nunoa'],
  "O'Higgins": ['Rancagua', 'San Fernando', 'Pichilemu', 'Santa Cruz', 'Machali'],
  'Maule': ['Talca', 'Curico', 'Linares', 'Cauquenes', 'Constitucion'],
  'Ñuble': ['Chillan', 'San Carlos', 'Bulnes', 'Quirihue', 'Coihueco'],
  'Bío Bío': ['Concepcion', 'Talcahuano', 'Los Angeles', 'San Pedro de la Paz', 'Coronel'],
  'Araucanía': ['Temuco', 'Villarrica', 'Pucon', 'Angol', 'Victoria', 'Padre Las Casas'],
  'Los Ríos': ['Valdivia', 'La Union', 'Panguipulli', 'Rio Bueno', 'Futrono'],
  'Los Lagos': ['Puerto Montt', 'Osorno', 'Castro', 'Puerto Varas', 'Ancud'],
  'Aysén': ['Coyhaique', 'Puerto Aysen', 'Chile Chico', 'Cochrane'],
  'Magallanes': ['Punta Arenas', 'Puerto Natales', 'Porvenir', 'Cabo de Hornos'],
};

const normalizarTexto = (valor = '') => valor
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[’']/g, '')
  .toLowerCase()
  .trim();

export const inferirRegionPorCiudad = (ciudad = '') => {
  const claveCiudad = normalizarTexto(ciudad);
  if (!claveCiudad) return '';

  for (const [region, ciudades] of Object.entries(REGIONES_CHILE)) {
    if (ciudades.some((item) => normalizarTexto(item) === claveCiudad)) return region;
  }

  return '';
};

export const normalizarRegionChile = (region = '') => {
  const clave = normalizarTexto(region);
  const alias = {
    'arica y parinacota': 'Arica y Parinacota',
    tarapaca: 'Tarapacá',
    antofagasta: 'Antofagasta',
    atacama: 'Atacama',
    coquimbo: 'Coquimbo',
    valparaiso: 'Valparaíso',
    metropolitana: 'Metropolitana',
    'metropolitana de santiago': 'Metropolitana',
    santiago: 'Metropolitana',
    ohiggins: "O'Higgins",
    maule: 'Maule',
    nuble: 'Ñuble',
    biobio: 'Bío Bío',
    'bio bio': 'Bío Bío',
    araucania: 'Araucanía',
    'la araucania': 'Araucanía',
    'los rios': 'Los Ríos',
    'los lagos': 'Los Lagos',
    aysen: 'Aysén',
    magallanes: 'Magallanes',
  };

  return alias[clave] || region;
};

export const normalizarCiudadChile = (ciudad = '') => {
  const clave = normalizarTexto(ciudad);
  if (!clave) return '';

  for (const ciudades of Object.values(REGIONES_CHILE)) {
    const encontrada = ciudades.find((item) => normalizarTexto(item) === clave);
    if (encontrada) return encontrada;
  }

  return ciudad;
};
