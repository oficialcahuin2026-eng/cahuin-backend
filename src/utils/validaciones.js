export function validarRUT(rut) {
  if (!rut) return false;
  const clean = rut.replace(/[.\s]/g, '').toUpperCase();
  if (!/^\d{7,8}-[\dK]$/.test(clean)) return false;
  const [num, dv] = clean.split('-');
  let sum = 0, mul = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    sum += parseInt(num[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const exp = 11 - (sum % 11);
  const dvCalc = exp === 11 ? '0' : exp === 10 ? 'K' : String(exp);
  return dvCalc === dv;
}

export function formatearRUT(rut) {
  const clean = rut.replace(/[^0-9kK]/g, '');
  if (clean.length < 2) return clean;
  const cuerpo = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpo}-${clean.slice(-1).toUpperCase()}`;
}

export function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validarPassword(pw) {
  return pw.length >= 8 && /\d/.test(pw);
}

export function calcularEdad(fechaNacimiento) {
  const hoy = new Date(), nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const diff = hoy.getMonth() - nac.getMonth();
  if (diff < 0 || (diff === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export const REGIONES = [
  { codigo:'XV',  nombre:'Arica y Parinacota'     },
  { codigo:'I',   nombre:'Tarapacá'                },
  { codigo:'II',  nombre:'Antofagasta'             },
  { codigo:'III', nombre:'Atacama'                 },
  { codigo:'IV',  nombre:'Coquimbo'                },
  { codigo:'V',   nombre:'Valparaíso'              },
  { codigo:'RM',  nombre:'Metropolitana'           },
  { codigo:'VI',  nombre:"O'Higgins"               },
  { codigo:'VII', nombre:'Maule'                   },
  { codigo:'XVI', nombre:'Ñuble'                   },
  { codigo:'VIII',nombre:'Biobío'                  },
  { codigo:'IX',  nombre:'La Araucanía'            },
  { codigo:'XIV', nombre:'Los Ríos'                },
  { codigo:'X',   nombre:'Los Lagos'               },
  { codigo:'XI',  nombre:'Aysén'                   },
  { codigo:'XII', nombre:'Magallanes y Antártica'  },
];