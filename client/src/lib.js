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

// Échappe le HTML (popups Leaflet = HTML brut, données d'autres utilisateurs)
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Annonce vocale (français) — accessibilité, téléphones partagés
export function parler(texte) {
  try {
    if (localStorage.getItem('voix') !== 'oui') return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = 'fr-FR';
    window.speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

// Niveaux contributeurs (trajets partagés)
export function niveauContributeur(nb) {
  if (nb >= 50) return { nom: 'Légende 🏆', emoji: '🏆' };
  if (nb >= 20) return { nom: 'Or 🥇', emoji: '🥇' };
  if (nb >= 10) return { nom: 'Argent 🥈', emoji: '🥈' };
  if (nb >= 3) return { nom: 'Bronze 🥉', emoji: '🥉' };
  return { nom: 'Débutant 🌱', emoji: '🌱' };
}

// Exporte les départs d'une ligne (aujourd'hui) en fichier agenda .ics
export function telechargerICS(ligne, heures) {
  const j = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const jour = `${j.getFullYear()}${pad(j.getMonth() + 1)}${pad(j.getDate())}`;
  const events = heures.map((h) => {
    const [a, b] = h.split(':');
    const debut = `${jour}T${a}${b}00`;
    return `BEGIN:VEVENT\nUID:${ligne}-${h}-${jour}@konabmap\nDTSTART:${debut}\nDURATION:PT30M\nSUMMARY:Bus ${ligne} — KonabMap\nEND:VEVENT`;
  }).join('\n');
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//KonabMap//Bus//FR\n${events}\nEND:VCALENDAR`;
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `bus-${ligne}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

const toMin = (s) => {
  const [a, b] = String(s || '06:00').split(':').map(Number);
  return a * 60 + b;
};
const toHM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

// Prochains départs théoriques d'une ligne (premier/dernier/fréquence admin)
export function prochainsDeparts(h, n = 3) {
  if (!h || h.actif === false) return [];
  const freq = Math.max(5, h.frequence_min || 20);
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const res = [];
  for (let t = toMin(h.premier); t <= toMin(h.dernier) && res.length < n; t += freq) {
    if (t >= cur) res.push(toHM(t));
  }
  return res;
}

export function statutHoraire(h) {
  if (!h || h.actif === false) return '⛔ Suspendue';
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  if (cur < toMin(h.premier)) return `▶️ Reprise à ${h.premier}`;
  if (cur > toMin(h.dernier)) return `🌙 Terminé, reprise ${h.premier}`;
  return '🟢 En service';
}

// Toutes les heures restantes aujourd'hui (modèle fréquence) — pour export agenda
export function toutesHeures(h) {
  if (!h || h.actif === false) return [];
  const freq = Math.max(5, h.frequence_min || 20);
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const res = [];
  for (let t = toMin(h.premier); t <= toMin(h.dernier); t += freq) {
    if (t >= cur) res.push(toHM(t));
  }
  return res;
}
export function typeJour() {
  return new Date().getDay() === 0 ? 'dim' : 'sem';
}

// Prochains départs EXACTS (feuilles de marche) pour une ligne, groupés par terminus
export function prochainsExacts(departs, ligne, n = 3) {
  const t = typeJour();
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const parTerminus = {};
  departs
    .filter((d) => d.ligne === ligne && (d.jours === t || (!d.jours && t === 'sem')))
    .forEach((d) => {
      const [a, b] = String(d.heure).split(':').map(Number);
      const m = a * 60 + b;
      if (m >= cur) {
        if (!parTerminus[d.terminus]) parTerminus[d.terminus] = [];
        if (parTerminus[d.terminus].length < n) parTerminus[d.terminus].push(d.heure.slice(0, 5));
      }
    });
  return parTerminus;
}
