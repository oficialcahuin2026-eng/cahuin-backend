const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const conectarDB = require('./config/db');
const Panorama = require('./models/Panorama');
const { normalizarRegionChile } = require('./utils/chileLocations');

(async () => {
  try {
    await conectarDB();
    
    const inputRegion = 'Araucania';
    const normalized = normalizarRegionChile(inputRegion);
    const regexStr = normalized.replace('i', '[ií]');
    
    console.log('Input:', inputRegion);
    console.log('Normalized:', normalized);
    console.log('Regex string:', regexStr);
    
    // What's actually in the DB?
    const allRegions = await Panorama.distinct('region', { esOficial: true });
    console.log('All regions in DB:', allRegions);
    
    // Try the regex
    const regex = new RegExp(regexStr, 'i');
    console.log('Regex:', regex);
    console.log('Test "Araucanía":', regex.test('Araucanía'));
    console.log('Test "Araucania":', regex.test('Araucania'));
    
    // Actual query
    const count = await Panorama.countDocuments({
      esOficial: true,
      region: { $regex: regexStr, $options: 'i' },
      $or: [
        { fecha: { $gte: new Date() } },
        { fechaFin: { $gte: new Date() } }
      ]
    });
    console.log('Count with regex:', count);
    
    // Try direct
    const count2 = await Panorama.countDocuments({
      esOficial: true,
      region: { $regex: /Araucan[ií]a/i },
    });
    console.log('Count with direct regex:', count2);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
