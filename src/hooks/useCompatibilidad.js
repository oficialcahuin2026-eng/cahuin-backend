function interseccion(a = [], b = []) {
  return a.filter(x => b.includes(x));
}

const REGIONES_CERCANAS = {
  RM: ['V', 'VI', 'VII'], V: ['RM', 'IV'],
  IX: ['VIII', 'XIV', 'X'], X: ['IX', 'XIV', 'XI'],
};

function regionesCercanas(r1, r2) {
  return REGIONES_CERCANAS[r1]?.includes(r2) || REGIONES_CERCANAS[r2]?.includes(r1) || false;
}

export function calcularCompatibilidad(yo, otro) {
  if (!yo || !otro) return 0;
  let p = 0;
  if (yo.region === otro.region) p += 25;
  else if (regionesCercanas(yo.region, otro.region)) p += 12;
  p += Math.min(20, interseccion(yo.gastronomia, otro.gastronomia).length * 5);
  p += Math.min(15, interseccion(yo.fiestas, otro.fiestas).length * 5);
  p += Math.min(15, interseccion(yo.musica, otro.musica).length * 5);
  const difFam = Math.abs((yo.valorFamilia || 3) - (otro.valorFamilia || 3));
  p += difFam === 0 ? 15 : difFam === 1 ? 8 : 0;
  p += Math.min(10, interseccion(yo.aventura, otro.aventura).length * 4);
  return Math.min(100, Math.round(p));
}

export function emojiCompatibilidad(pct) {
  if (pct >= 90) return '🔥 ¡Entero bacán!';
  if (pct >= 70) return '💃 Muy compatible';
  if (pct >= 50) return '😊 Buena onda';
  if (pct >= 30) return '🤔 Hay diferencias';
  return '🙃 Son bien distintos';
}

export default function useCompatibilidad(yo) {
  return { calcular: (otro) => calcularCompatibilidad(yo, otro), emojiCompatibilidad };
}