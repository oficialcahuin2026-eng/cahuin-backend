const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const conectarDB = require('./config/db');
const Panorama = require('./models/Panorama');
const PanoramaSwipe = require('./models/PanoramaSwipe');
const { normalizarRegionChile, inferirRegionPorCiudad } = require('./utils/chileLocations');
const User = require('./models/User');

(async () => {
  try {
    await conectarDB();
    
    // Simulate what the endpoint does
    // 1. Get user
    const user = await User.findOne({}).lean();
    console.log('User region:', user?.region, 'ciudad:', user?.ciudad);
    
    const regionUsuario = (u = {}) => {
      const r = normalizarRegionChile(u.region || '') || inferirRegionPorCiudad(u.ciudad || '');
      return r && r !== 'Por definir' ? r : '';
    };
    
    const region = regionUsuario(user);
    console.log('regionUsuario result:', region);
    
    const normalized = normalizarRegionChile(region);
    console.log('normalizarRegionChile:', normalized);
    
    const regexStr = normalized.replace('i', '[ií]');
    console.log('Final regex string:', regexStr);
    
    // Check what the $or date filter does
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    console.log('inicioDeHoy:', hoy.toISOString());
    
    // The exact query
    const panoramas = await Panorama.find({
      esOficial: true,
      $or: [
        { fecha: { $gte: hoy } },
        { fechaFin: { $gte: hoy } }
      ],
      region: { $regex: regexStr, $options: 'i' },
    }).sort({ fecha: 1 }).limit(200);
    
    console.log('Panoramas found:', panoramas.length);
    if (panoramas.length > 0) {
      console.log('First:', panoramas[0].titulo, '| Region:', panoramas[0].region);
      console.log('Last:', panoramas[panoramas.length - 1].titulo);
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
