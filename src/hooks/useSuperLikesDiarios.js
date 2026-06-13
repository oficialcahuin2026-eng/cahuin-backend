import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPERLIKES_KEY = '@cahuin_superlikes_diarios';

export function useSuperLikesDiarios() {
  const [usadosHoy, setUsadosHoy] = useState(0);

  const cargarConteo = useCallback(async () => {
    try {
      const dataStr = await AsyncStorage.getItem(SUPERLIKES_KEY);
      if (dataStr) {
        const data = JSON.parse(dataStr);
        const hoy = new Date().toDateString();
        if (data.fecha === hoy) {
          setUsadosHoy(data.count);
        } else {
          // Es un nuevo día
          setUsadosHoy(0);
          await AsyncStorage.setItem(SUPERLIKES_KEY, JSON.stringify({ fecha: hoy, count: 0 }));
        }
      } else {
        setUsadosHoy(0);
      }
    } catch (e) {
      console.warn("Error cargando superlikes diarios:", e);
      setUsadosHoy(0);
    }
  }, []);

  useEffect(() => {
    cargarConteo();
  }, [cargarConteo]);

  const registrarSuperLike = async () => {
    try {
      const hoy = new Date().toDateString();
      const nuevoConteo = usadosHoy + 1;
      setUsadosHoy(nuevoConteo);
      await AsyncStorage.setItem(SUPERLIKES_KEY, JSON.stringify({ fecha: hoy, count: nuevoConteo }));
    } catch (e) {
      console.warn("Error guardando superlikes diarios:", e);
    }
  };

  return { usadosHoy, registrarSuperLike, recargar: cargarConteo };
}
