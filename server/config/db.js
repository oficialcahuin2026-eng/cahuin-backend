const mongoose = require('mongoose');

const atlasFallbacks = {
  'cluster0.bxq32ip.mongodb.net': {
    hosts: [
      'ac-b9tpx5k-shard-00-00.bxq32ip.mongodb.net:27017',
      'ac-b9tpx5k-shard-00-01.bxq32ip.mongodb.net:27017',
      'ac-b9tpx5k-shard-00-02.bxq32ip.mongodb.net:27017',
    ].join(','),
    replicaSet: 'atlas-vmgnhy-shard-0',
  },
};

const getSrvFallbackUri = (mongoUri) => {
  if (!mongoUri?.startsWith('mongodb+srv://')) return null;

  const parsed = new URL(mongoUri);
  const hosts = process.env.MONGO_ATLAS_HOSTS || atlasFallbacks[parsed.hostname]?.hosts;
  if (!hosts) return null;

  const withoutScheme = mongoUri.replace(/^mongodb\+srv:\/\//, '');
  const atIndex = withoutScheme.lastIndexOf('@');
  const auth = atIndex >= 0 ? `${withoutScheme.slice(0, atIndex)}@` : '';
  const hostAndRest = atIndex >= 0 ? withoutScheme.slice(atIndex + 1) : withoutScheme;
  const slashIndex = hostAndRest.indexOf('/');
  const rest = slashIndex >= 0 ? hostAndRest.slice(slashIndex) : '';
  const queryIndex = rest.indexOf('?');
  const pathname = queryIndex >= 0 ? rest.slice(0, queryIndex) : rest;
  const query = queryIndex >= 0 ? rest.slice(queryIndex + 1) : '';
  const params = new URLSearchParams(query);
  const replicaSet = process.env.MONGO_REPLICA_SET || atlasFallbacks[parsed.hostname]?.replicaSet;

  if (!params.has('ssl') && !params.has('tls')) params.set('ssl', 'true');
  if (!params.has('authSource')) params.set('authSource', 'admin');
  if (replicaSet && !params.has('replicaSet')) params.set('replicaSet', replicaSet);

  return `mongodb://${auth}${hosts}${pathname || '/'}?${params.toString()}`;
};

const conectar = (uri) => mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });

const conectarDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI_DIRECT || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('Falta configurar MONGO_URI en el archivo .env');
    }

    let conn;
    try {
      conn = await conectar(mongoUri);
    } catch (error) {
      const fallbackUri = getSrvFallbackUri(mongoUri);
      if (!fallbackUri || !/querySrv|ENOTFOUND|EAI_AGAIN|ECONNREFUSED/i.test(error.message)) {
        throw error;
      }
      console.warn('MongoDB SRV no resolvio; reintentando con seedlist directo.');
      conn = await conectar(fallbackUri);
    }

    console.log(`MongoDB conectado a la base de datos: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error al conectar MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = conectarDB;
