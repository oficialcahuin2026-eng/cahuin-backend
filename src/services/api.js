import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tu IP local directa
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.13:5000/api';

const api = axios.create({ 
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@cahuin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(new Error(err.response?.data?.message || 'Error de conexión po\''))
);

export const authService = {
  register:     (data)  => api.post('/auth/register', data),
  login:        (data)  => api.post('/auth/login', data),
  loginGoogle:  (token) => api.post('/auth/google', { token }),
  verificarRUT: (rut)   => api.post('/auth/verify-rut', { rut }),
};

export const userService = {
  getMiPerfil: ()     => api.get('/users/me'),
  actualizar:  (data) => api.put('/users/me', data),
  actualizarFoto: async (formData) => {
    const token = await AsyncStorage.getItem('@cahuin_token');
    const respuesta = await fetch(`${BASE_URL}/users/me`, {
      method: 'PUT',
      body: formData,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.message || 'Error del servidor');
    return data;
  },
  descubrir:   (q)    => api.get('/users/descubrir', { params: q }),
  getPerfil:   (id)   => api.get(`/users/${id}`),
};

export const matchService = {
  // 🌟 EL PARCHE: Agregamos las llaves vacías {} al final de las rutas
  darLike:      (id) => api.post(`/matches/like/${id}`, {}),
  darSuperLike: (id) => api.post(`/matches/superlike/${id}`, {}),
  pasar:        (id) => api.post(`/matches/pass/${id}`, {}),
  getMisMatches: ()  => api.get('/matches'),
  eliminar:     (id) => api.delete(`/matches/${id}`),
};

export const cuecaService = {
  getEstado: (userId)           => api.get(`/cueca/${userId}`),
  iniciar:   (userId)           => api.post(`/cueca/${userId}/iniciar`, {}), // Parche aplicado
  responder: (userId, ronda, r) => api.post(`/cueca/${userId}/responder`, { ronda, respuesta: r }),
};

export const panoramaService = {
  listar: (params) => api.get('/panoramas', { params }),
  crear:  (data)   => api.post('/panoramas', data),
  unirse: (id)     => api.post(`/panoramas/${id}/unirse`, {}), // Parche aplicado
};

export const recetaService = {
  listar: ()     => api.get('/recetas'),
  crear:  (data) => api.post('/recetas', data),
  like:   (id)   => api.post(`/recetas/${id}/like`, {}), // Parche aplicado
};

export const mensajeService = {
  listar: (matchId)        => api.get(`/mensajes/${matchId}`),
  enviar: (matchId, texto) => api.post(`/mensajes/${matchId}`, { texto }),
};

export const premiumService = {
  getPlanes:  ()       => api.get('/premium/planes'),
  getRegalos: ()       => api.get('/premium/regalos'),
  getEstado:  ()       => api.get('/premium/estado'),
  suscribir:  (planId) => api.post('/premium/suscribir', { planId }),
};