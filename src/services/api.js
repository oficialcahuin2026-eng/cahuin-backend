import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockPanoramas } from '../data/mockPanoramas';

export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.15:5000/api').replace(/\/+$/, '');

// ðŸŒŸ LA SOLUCIÃ“N: Faltaba la palabra "export" aquí para que el AuthContext lo pueda usar
export const api = axios.create({ 
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('@cahuin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const extraerMensajeError = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === 'string') {
    const limpio = payload.trim();
    if (limpio.startsWith('<')) return 'El servidor respondio HTML en vez de JSON. Revisa la URL del backend.';
    return limpio || fallback;
  }
  return payload.message || payload.error || fallback;
};

export const parseFetchResponse = async (respuesta) => {
  const contentType = respuesta.headers?.get?.('content-type') || '';
  const texto = await respuesta.text();
  let payload = {};

  if (texto) {
    const pareceJson = contentType.includes('application/json') || /^[\[{]/.test(texto.trim());
    if (pareceJson) {
      try {
        payload = JSON.parse(texto);
      } catch {
        throw new Error('El backend envio una respuesta JSON invalida.');
      }
    } else {
      payload = { message: texto };
    }
  }

  if (!respuesta.ok) {
    throw new Error(extraerMensajeError(payload, `Error HTTP ${respuesta.status}`));
  }

  return payload;
};

api.interceptors.request.use(async (config) => {
  const authHeader = await getAuthHeader();
  config.headers = { ...config.headers, ...authHeader };
  return config;
});

api.interceptors.response.use(
  (res) => res.data || {},
  (err) => {
    const customError = new Error(err.response?.data?.message || "Error de conexión po'");
    customError.response = err.response;
    return Promise.reject(customError);
  }
);

export const authService = {
  login: (credenciales) => api.post('/auth/login', credenciales),
  loginGoogle: (token) => api.post('/auth/google', { token }),
  loginFacebook: (accessToken) => api.post('/auth/facebook', { accessToken }),
  loginTelefono: (telefono) => api.post('/auth/telefono', { telefono }),
  register: (datos) => api.post('/auth/register', datos),
};

export const userService = {
  getMiPerfil: ()     => api.get('/users/me'),
  verificar:   ()     => api.post('/users/me/verificar', {}),
  actualizar:  (data) => api.put('/users/me', data),
  
  subirFotoBase64: (base64) => api.post('/users/fotos/base64', { base64 }),

  actualizarFotos: async (formData) => {
    const respuesta = await fetch(`${BASE_URL}/users/fotos`, {
      method: 'POST', 
      body: formData, 
      headers: await getAuthHeader()
    });
    return parseFetchResponse(respuesta);
  },

  descubrir: async (q) => {
    try {
      const data = await api.get('/users/descubrir', { params: q });
      return data || { perfiles: [] };
    } catch (e) {
      return { perfiles: [] };
    }
  },
  getPerfil:        (id)            => api.get(`/users/${id}`),
  bloquear:         (id)            => api.post(`/users/${id}/bloquear`, {}),
  reportar:         (id, data = {}) => api.post(`/users/${id}/reportar`, data),
  listarReportesAdmin: (estado = 'pendiente') => api.get('/users/admin/reportes', { params: { estado } }),
  resolverReporteAdmin: (id, data) => api.patch(`/users/admin/reportes/${id}`, data),
  calificar:        (id, rating)    => api.post(`/users/${id}/calificar`, { rating }),
  registrarVista:   (id)            => api.post(`/users/${id}/visto`, {}),
  getVistasPremium: ()              => api.get('/users/me/vistas'),
  getLikesRecibidos: ()             => api.get('/users/me/likes'),
  getAnalyticsPerfil: ()            => api.get('/users/me/analytics'),
  activarBoost:      ()             => api.post('/users/me/boost', {}),
  continuarRachaSwipes: ()          => api.post('/users/me/racha-swipes/continuar', {}),
  guardarArquetipo: (arquetipo)     => api.post('/users/me/arquetipo', { arquetipo }),
  getTrending:      (params)        => api.get('/users/trending', { params }),
  togglePausaCuenta:()              => api.post('/users/me/pausa', {}),
  eliminarCuenta:   (motivo)        => api.post('/users/me/eliminar-cuenta', { motivo }),
  enviarPreguntaAnonima: (id, texto) => api.post(`/users/${id}/preguntas`, { texto }),
  getMisPreguntasAnonimas: () => api.get('/users/me/preguntas'),
  responderPreguntaAnonima: (id, respuesta, visibleEnPerfil = true) => api.post(`/users/preguntas/${id}/responder`, { respuesta, visibleEnPerfil }),
  getDiario:        (matchId)       => api.get(`/users/diario/${matchId}`),
  escribirDiario:   (matchId, texto)=> api.post(`/users/diario/${matchId}`, { texto })
};

export const matchService = {
  darLike:        (id, origen = 'radar') => api.post(`/matches/like/${id}`, { origen }),
  darSuperLike:   (id, origen = 'radar') => api.post(`/matches/superlike/${id}`, { origen }),
  pasar:          (id) => api.post(`/matches/pass/${id}`, {}),
  darDislike:     (id) => api.post(`/matches/pass/${id}`, {}),
  getMisMatches: async () => {
    try {
      const data = await api.get('/matches');
      return data || { matches: [] };
    } catch (e) {
      return { matches: [] };
    }
  },
  eliminar:       (id) => api.delete(`/matches/${id}`),
  responderRompehielo: (id, respuestas) => api.post(`/matches/${id}/rompehielo`, { respuestas }),
  generarRelampago:    ()   => api.post('/matches/relampago/generar', {}), 
  salvarRelampago:     (id) => api.post(`/matches/relampago/${id}/salvar`, {}),
  deshacerUltimoDislike: () => api.post('/matches/deshacer-dislike', {}),
  jugarRuletaCiega: () => api.post('/matches/ruleta-ciega', {}),
  revelarse:        (id) => api.post(`/matches/${id}/revelarse`, {})
};

export const mensajeService = {
  listar: async (matchId) => {
    try { return await api.get(`/mensajes/${matchId}`); } catch (e) {
      return { mensajes: [] };
    }
  },
  enviar: async (matchId, texto) => {
    try { return await api.post(`/mensajes/${matchId}`, { texto }); } catch (e) {
      return { mensaje: { _id: `m_${Date.now()}`, texto, remitente: 'me', createdAt: new Date().toISOString() } };
    }
  }
};

export const cartaService = {
  getCartas:  ()            => api.get('/cartas'),
  reaccionar: (id, tipo)    => api.post(`/cartas/${id}/reaccionar`, { tipo }),
  crear:      (texto)       => api.post('/cartas', { texto }),
  eliminar:   (id)          => api.delete(`/cartas/${id}`),
};

export const premiumService = {
  getPlanes:  ()       => api.get('/premium/planes'),
  getRegalos: ()       => api.get('/premium/regalos'),
  getEstado:  ()       => api.get('/premium/estado'),
  suscribir:  (planId) => api.post('/premium/suscribir', { planId }),
};

export const paymentService = {
  getProducts: () => api.get('/payments/products'),
  crearMercadoPagoPreference: (productId) => api.post('/payments/mercadopago/preference', { productId }),
};

export const iaService = {
  getWingman: (targetUserId, contextoChat) => api.post('/ia/wingman', { targetUserId, contextoChat }),
  getEnergia: (mensajes) => api.post('/ia/energia', { mensajes })
};

export const panoramaService = {
  listar: async (params) => {
    try {
      const data = await api.get('/panoramas', { params });
      if (data && data.panoramas && data.panoramas.length > 0) return data;
    } catch (e) {}
    // Fallback a los panoramas locales si el backend no los tiene o no responde
    const targetRegion = params?.region;
    let filtered = mockPanoramas;
    if (targetRegion) {
        filtered = mockPanoramas.filter(p => p.region === targetRegion);
    }
    return { panoramas: filtered };
  },
  crear:  (data)   => api.post('/panoramas', data),
  unirse: (id)     => api.post(`/panoramas/${id}/unirse`, {}),
  gestionarSolicitud: (id, usuarioId, accion) => api.post(`/panoramas/gestionar`, { id, usuarioId, accion }),
  abandonar: (id)  => api.post(`/panoramas/${id}/abandonar`, {}),
  enviarMensaje: (id, texto, audioUrl) => api.post(`/panoramas/${id}/mensajes`, { texto, audioUrl }),
  listarMisGrupos: () => api.get('/panoramas/mis-grupos'),
  obtener: (id) => api.get(`/panoramas/${id}`)
};

export const socialService = {
  listarHistorias: () => api.get('/social/historias'),
  crearHistoria: async (data) => {
    if (data?.imagen) {
      const formData = new FormData();
      formData.append('texto', data.texto || '');
      formData.append('lugar', data.lugar || '');
      formData.append('emoji', data.emoji || 'ðŸ“¸');
      formData.append('imagen', {
        uri: data.imagen.uri,
        name: data.imagen.name || 'historia.jpg',
        type: data.imagen.type || 'image/jpeg',
      });
      const respuesta = await fetch(`${BASE_URL}/social/historias`, {
        method: 'POST',
        body: formData,
        headers: await getAuthHeader(),
      });
      return parseFetchResponse(respuesta);
    }
    return api.post('/social/historias', data);
  },
  reaccionarHistoria: (id) => api.post(`/social/historias/${id}/reaccionar`, {}),
  comentarHistoria: (id, texto) => api.post(`/social/historias/${id}/comentar`, { texto }),
  sumarseHistoria: (id) => api.post(`/social/historias/${id}/sumarse`, {}),
  listarHistoriasExito: (estado = 'publicadas') => api.get('/social/historias-exito', { params: { estado } }),
  crearHistoriaExito: async (data) => {
    const formData = new FormData();
    formData.append('nombres', data.nombres || '');
    formData.append('ciudad', data.ciudad || '');
    formData.append('historia', data.historia || '');
    formData.append('contacto', data.contacto || '');
    formData.append('imagen', {
      uri: data.imagen.uri,
      name: data.imagen.name || 'historia-exito.jpg',
      type: data.imagen.type || 'image/jpeg',
    });
    const respuesta = await fetch(`${BASE_URL}/social/historias-exito`, {
      method: 'POST',
      body: formData,
      headers: await getAuthHeader(),
    });
    return parseFetchResponse(respuesta);
  },
  revisarHistoriaExito: (id, data) => api.patch(`/social/historias-exito/${id}/revisar`, data),
  getCahuinDia: () => api.get('/social/cahuin-dia'),
  votarCahuinDia: (opcion) => api.post('/social/cahuin-dia/votar', { opcion }),
  getSwipePanoramas: () => api.get('/social/swipe-panoramas'),
  votarPanorama: (id, decision) => api.post(`/social/swipe-panoramas/${id}`, { decision }),
  getMapaCalor: () => api.get('/social/mapa-calor'),
  crearBotella: (texto, audio = '') => api.post('/social/botellas', { texto, audio }),
  getBotellaActual: () => api.get('/social/botellas/actual'),
  responderBotella: (id, texto) => api.post(`/social/botellas/${id}/responder`, { texto }),
  soltarBotella: (id) => api.post(`/social/botellas/${id}/soltar`, {}),
  getAlertas: () => api.get('/social/alertas'),
};
