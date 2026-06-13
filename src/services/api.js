import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://cahuin-backend-1.onrender.com/api').replace(/\/+$/, '');

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
  (err) => Promise.reject(new Error(err.response?.data?.message || "Error de conexión po'"))
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
      if (data && data.usuarios && data.usuarios.length > 0) return data;
    } catch (e) {}
    // Fake data for UI redesign
    return {
      usuarios: [
        { _id: 'mock1', nombre: 'Valeria', edad: 24, foto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=900', biografia: 'Amante de los gatos y el sushi 🍣', profesion: 'Diseñadora', universidad: 'UAndes', arquetipo: { nombre: 'La Artista', emoji: '🎨', color: '#F472B6' }, ciudad: 'Santiago' },
        { _id: 'mock2', nombre: 'Joaquín', edad: 26, foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=900', biografia: 'Siempre listo para un pique a la playa 🏄‍♂️', profesion: 'Ingeniero', universidad: 'PUC', arquetipo: { nombre: 'El Aventurero', emoji: '🏕️', color: '#34A853' }, ciudad: 'Viña del Mar' },
        { _id: 'mock3', nombre: 'Sofía', edad: 22, foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=900', biografia: 'Busco alguien para ir a conciertos 🎸', profesion: 'Estudiante', universidad: 'UCh', arquetipo: { nombre: 'La Melómana', emoji: '🎧', color: '#8B5CF6' }, ciudad: 'Concepción' }
      ]
    };
  },
  getPerfil:        (id)            => api.get(`/users/${id}`),
  bloquear:         (id)            => api.post(`/users/${id}/bloquear`, {}),
  reportar:         (id)            => api.post(`/users/${id}/reportar`, {}),
  calificar:        (id, rating)    => api.post(`/users/${id}/calificar`, { rating }),
  registrarVista:   (id)            => api.post(`/users/${id}/visto`, {}),
  getVistasPremium: ()              => api.get('/users/me/vistas'),
  getLikesRecibidos: ()             => api.get('/users/me/likes'),
  getAnalyticsPerfil: ()            => api.get('/users/me/analytics'),
  activarBoost:      ()             => api.post('/users/me/boost', {}),
  continuarRachaSwipes: ()          => api.post('/users/me/racha-swipes/continuar', {}),
  guardarArquetipo: (arquetipo)     => api.post('/users/me/arquetipo', { arquetipo }),
  getTrending:      ()              => api.get('/users/trending'),
  togglePausaCuenta:()              => api.post('/users/me/pausa', {}),
  enviarPreguntaAnonima: (id, texto) => api.post(`/users/${id}/preguntas`, { texto }),
  getMisPreguntasAnonimas: () => api.get('/users/me/preguntas'),
  responderPreguntaAnonima: (id, respuesta, visibleEnPerfil = true) => api.post(`/users/preguntas/${id}/responder`, { respuesta, visibleEnPerfil }),
  getDiario:        (matchId)       => api.get(`/users/diario/${matchId}`),
  escribirDiario:   (matchId, texto)=> api.post(`/users/diario/${matchId}`, { texto })
};

export const matchService = {
  darLike:        (id) => api.post(`/matches/like/${id}`, {}),
  darSuperLike:   (id) => api.post(`/matches/superlike/${id}`, {}),
  pasar:          (id) => api.post(`/matches/pass/${id}`, {}),
  darDislike:     (id) => api.post(`/matches/pass/${id}`, {}),
  getMisMatches: async () => {
    try {
      const data = await api.get('/matches');
      if (data && data.matches && data.matches.length > 0) return data;
    } catch (e) {}
    return {
      matches: [
        { roomId: 'room1', usuario: { _id: 'mock1', nombre: 'Valeria', foto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=900' }, ultimoMensaje: 'Jajaja literal', fechaUltimoMensaje: new Date().toISOString() },
        { roomId: 'room2', usuario: { _id: 'mock3', nombre: 'Sofía', foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=900' }, ultimoMensaje: '¿Vamos o qué?', fechaUltimoMensaje: new Date(Date.now() - 3600000).toISOString() }
      ]
    };
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
      return { mensajes: [ { _id: 'm1', texto: '¡Hola! Qué buena vibra tu perfil 🔥', remitente: { _id: 'mock1', nombre: 'Match' }, createdAt: new Date(Date.now() - 3600000).toISOString() } ] };
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

export const iaService = {
  getWingman: (targetUserId, contextoChat) => api.post('/ia/wingman', { targetUserId, contextoChat }),
  getEnergia: (mensajes) => api.post('/ia/energia', { mensajes })
};

export const panoramaService = {
  listar: (params) => api.get('/panoramas', { params }),
  crear:  (data)   => api.post('/panoramas', data),
  unirse: (id)     => api.post(`/panoramas/${id}/unirse`, {})
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
  getCahuinDia: () => api.get('/social/cahuin-dia'),
  votarCahuinDia: (opcion) => api.post('/social/cahuin-dia/votar', { opcion }),
  getSwipePanoramas: () => api.get('/social/swipe-panoramas'),
  votarPanorama: (id, decision) => api.post(`/social/swipe-panoramas/${id}`, { decision }),
  getMapaCalor: () => api.get('/social/mapa-calor'),
  crearBotella: (texto, audio = '') => api.post('/social/botellas', { texto, audio }),
  getBotellaActual: () => api.get('/social/botellas/actual'),
  responderBotella: (id, texto) => api.post(`/social/botellas/${id}/responder`, { texto }),
  soltarBotella: (id) => api.post(`/social/botellas/${id}/soltar`, {}),
};
