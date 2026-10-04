export function distanceM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const AFFL = { places: '✅ Places libres', debout: '🟡 Debout seulement', plein: '🔴 Complet' };

export function getFavs() {
  try {
    return JSON.parse(localStorage.getItem('favs') || '[]');
  } catch {
    return [];
  }
}

export function formatDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export function formatEta(m) {
  const minutes = Math.round((m / 1000 / 20) * 60);
  return minutes < 1 ? 'arrive !' : `~${minutes} min`;
}
