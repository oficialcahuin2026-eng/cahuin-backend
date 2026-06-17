import * as Location from 'expo-location';
import {
  inferirRegionPorCiudad,
  normalizarCiudadChile,
  normalizarRegionChile,
} from './chileLocations';

const firstText = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';

export const pedirPermisoUbicacion = () => Location.requestForegroundPermissionsAsync();

export const consultarPermisoUbicacion = () => Location.getForegroundPermissionsAsync();

export const obtenerCoordenadasActuales = () =>
  Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

export const detectarUbicacionChile = async (coords) => {
  const lugares = await Location.reverseGeocodeAsync({
    latitude: coords.latitude,
    longitude: coords.longitude,
  });

  const lugar = lugares?.[0];
  if (!lugar) return null;

  const ciudadRaw = firstText(lugar.city, lugar.subregion, lugar.district, lugar.name);
  const regionRaw = firstText(lugar.region, lugar.subregion);
  const ciudad = normalizarCiudadChile(ciudadRaw);
  const region = normalizarRegionChile(regionRaw) || inferirRegionPorCiudad(ciudad);

  if (!ciudad && !region) return null;

  return {
    ciudad,
    region: region || inferirRegionPorCiudad(ciudad),
  };
};
