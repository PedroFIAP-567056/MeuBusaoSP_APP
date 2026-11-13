// GPS do celular (expo-location)
import * as Location from 'expo-location';

// Pede permissão e devolve { latitude, longitude } ou { erro, bloqueado }
export async function pegarLocalizacao() {
  const gpsLigado = await Location.hasServicesEnabledAsync();
  if (!gpsLigado) {
    return { erro: 'O GPS do celular está desligado. Ligue a localização e tente de novo.' };
  }

  const permissao = await Location.requestForegroundPermissionsAsync();
  if (!permissao.granted) {
    // canAskAgain false = o usuário negou de vez, só dá para liberar nas configurações
    return {
      erro: 'Precisamos da sua localização para achar os pontos de ônibus perto de você.',
      bloqueado: !permissao.canAskAgain,
    };
  }

  try {
    const local = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: local.coords.latitude, longitude: local.coords.longitude };
  } catch (erro) {
    return { erro: 'Não foi possível pegar sua localização. Tente de novo.' };
  }
}

// Distância em metros entre dois pontos (fórmula de Haversine)
export function distanciaEmMetros(lat1, lon1, lat2, lon2) {
  const raioDaTerra = 6371000;
  const paraRadianos = (graus) => graus * Math.PI / 180;

  const dLat = paraRadianos(lat2 - lat1);
  const dLon = paraRadianos(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(paraRadianos(lat1)) * Math.cos(paraRadianos(lat2)) * Math.sin(dLon / 2) ** 2;

  return raioDaTerra * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Andando a 5 km/h, uma pessoa anda uns 80 metros por minuto
export function minutosAPe(metros) {
  return Math.ceil(metros / 80);
}

export function textoDistancia(metros) {
  if (metros < 1000) return Math.round(metros) + ' m';
  return (metros / 1000).toFixed(1).replace('.', ',') + ' km';
}
