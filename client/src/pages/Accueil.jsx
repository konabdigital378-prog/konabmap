import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LIGNES, VILLES } from '../data.js';
import { socket } from '../socket.js';
import { distanceM, formatDist, formatEta, getFavs, AFFL } from '../lib.js';
import { shareBusPosition, notify } from '../supabase.js';

export default function Accueil({ ville, userPos, bus, go, focusLigne, clearFocus }) {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const lignesLayer = useRef(null);
  const highlightLayer = useRef(null);
  const busMarkers = useRef({});
  const [ligne, setLigne] = useState('');
  const [affluence, setAffluence] = useState('places');
  const [destination, setDestination] = useState('');
  const [partage, setPartage] = useState(false);
  const [favsOnly, setFavsOnly] = useState(false);
  const [alertesFavs, setAlertesFavs] = useState(false);
  const [filtre, setFiltre] = useState('toutes');
  const [recherche, setRecherche] = useState('');
  const [alertSonore, setAlertSonore] = useState(true);
  const watchId = useRef(null);
  const debutPartage = useRef(null);
  const dejaAlerte = useRef({});
  const userMarker = useRef(null);

  const univ = localStorage.getItem('universite') || '';
  const lignesVille = Object.entries(LIGNES).filter(([, l]) => (l.ville || 'Ouagadougou') === ville);

  useEffect(() => {
    if (lignesVille.length > 0) setLigne((prev) => (prev && LIGNES[prev] ? prev : lignesVille[0][0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ville]);

  // Init carte
  useEffect(() => {
    mapObj.current = L.map(mapRef.current).setView([12.3714, -1.5197], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapObj.current);
    lignesLayer.current = L.layerGroup().addTo(mapObj.current);
    highlightLayer.current = L.layerGroup().addTo(mapObj.current);
    return () => mapObj.current.remove();
  }, []);

  // Lignes de la ville
  useEffect(() => {
    const map = mapObj.current;
    if (!map) return;
    lignesLayer.current.clearLayers();
    const v = VILLES[ville] || VILLES['Ouagadougou'];
    map.setView(v.centre, v.zoom);
    for (const [, l] of lignesVille) {
      L.polyline(l.arrets.map((a) => [a.lat, a.lng]), { color: l.couleur, weight: 4, opacity: 0.7 }).addTo(lignesLayer.current);
      l.arrets.forEach((a) => {
        L.circleMarker([a.lat, a.lng], { radius: 7, color: '#000', fillColor: '#fff', fillOpacity: 1, weight: 2 })
          .bindPopup(`<b>${a.nom}</b><br>${l.nom}`)
          .addTo(lignesLayer.current);
      });
    }
    v.universites.forEach((u) => {
      L.marker([u.lat, u.lng]).bindPopup(`🎓 <b>${u.nom}</b>`).addTo(lignesLayer.current);
    });
    setTimeout(() => map.invalidateSize(), 150);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ville]);

  // Ligne mise en avant depuis Lignes/Trajet
  useEffect(() => {
    const map = mapObj.current;
    if (!map) return;
    highlightLayer.current.clearLayers();
    if (focusLigne && LIGNES[focusLigne]) {
      const l = LIGNES[focusLigne];
      const latlngs = l.arrets.map((a) => [a.lat, a.lng]);
      L.polyline(latlngs, { color: '#FEDD00', weight: 9, opacity: 0.9 }).addTo(highlightLayer.current);
      L.polyline(latlngs, { color: l.couleur, weight: 5, opacity: 1 }).addTo(highlightLayer.current);
      map.fitBounds(latlngs, { padding: [30, 30] });
    }
  }, [focusLigne]);
  useEffect(() => {
    const map = mapObj.current;
    if (!map || !userPos) return;
    if (!userMarker.current) {
      userMarker.current = L.marker([userPos.lat, userPos.lng]).addTo(map).bindPopup('Toi 📍');
    } else userMarker.current.setLatLng([userPos.lat, userPos.lng]);
  }, [userPos]);

  // Marqueurs bus
  useEffect(() => {
    const map = mapObj.current;
    if (!map) return;
    const ids = new Set(bus.map((b) => b.id));
    for (const id of Object.keys(busMarkers.current)) {
      if (!ids.has(id)) {
        map.removeLayer(busMarkers.current[id]);
        delete busMarkers.current[id];
      }
    }
    bus.forEach((b) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${LIGNES[b.ligne]?.couleur || '#009639'};color:#fff;border:2px solid #000;border-radius:20px;padding:4px 10px;font-weight:900;white-space:nowrap">🚌 ${b.ligne}</div>`,
        iconSize: [70, 30],
      });
      if (!busMarkers.current[b.id]) {
        busMarkers.current[b.id] = L.marker([b.lat, b.lng], { icon }).addTo(map).bindPopup(`<b>Bus ${b.ligne}</b><br>Partagé par ${b.pseudo}`);
      } else busMarkers.current[b.id].setLatLng([b.lat, b.lng]);
    });
  }, [bus]);

  const pseudo = () => localStorage.getItem('pseudo') || 'Étudiant';

  const demarrer = () => {
    if (!navigator.geolocation) return alert('GPS non supporté');
    navigator.geolocation.getCurrentPosition(
      () => {
        setPartage(true);
        debutPartage.current = Date.now();
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            const payload = {
              pseudo: pseudo(), ligne, ville, affluence, destination,
              lat: pos.coords.latitude, lng: pos.coords.longitude,
              vitesse: pos.coords.speed || 0,
            };
            socket.emit('partage-position', payload);
            shareBusPosition(payload).catch(() => {});
          },
          () => alert('Active la localisation GPS'),
          { enableHighAccuracy: true, maximumAge: 2000 }
        );
      },
      () => alert('Autorise la localisation pour partager comme bus 🙏')
    );
  };

  const arreter = () => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    socket.emit('stop-partage');
    // Historique local du trajet
    try {
      const h = JSON.parse(localStorage.getItem('trajets') || '[]');
      h.unshift({ ligne, ville, date: new Date().toISOString(), dureeMin: debutPartage.current ? Math.max(1, Math.round((Date.now() - debutPartage.current) / 60000)) : 0 });
      localStorage.setItem('trajets', JSON.stringify(h.slice(0, 20)));
    } catch { /* ignore */ }
    setPartage(false);
  };

  useEffect(() => () => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  let visibles = favsOnly ? bus.filter((b) => getFavs().includes(b.ligne)) : bus;
  if (filtre !== 'toutes') visibles = visibles.filter((b) => b.ligne === filtre);

  const voir = (b) => mapObj.current.setView([b.lat, b.lng], 15);
  const meLocaliser = () => { if (userPos) mapObj.current.setView([userPos.lat, userPos.lng], 15); };

  const alerter = (b, distTxt) => {
    if (!alertSonore || dejaAlerte.current[b.id]) return;
    if (alertesFavs && !getFavs().includes(b.ligne)) return;
    dejaAlerte.current[b.id] = true;
    notify(`Bus ${b.ligne} proche !`, `À ${distTxt} de toi, prépare-toi !`).catch(() => {});
    setTimeout(() => delete dejaAlerte.current[b.id], 15000);
  };

  const signaler = (b) => {
    if (!confirm(`Signaler un souci sur le bus ${b.ligne} (panne, retard, conduite...) ?`)) return;
    socket.emit('signalement', { busId: b.id });
    alert('Signalement envoyé, merci 🙏');
  };

  return (
    <div className="page" id="page-accueil">
      <div className="hero">
        <div className="hero-ville">📍 {ville}</div>
        <div className="hero-titre">{univ ? univ.replace(/^Université\s*/, '') : 'Choisis ton université'}</div>
        <div className="hero-stats">
          <div className="hero-stat">🚌 {bus.length}<small>bus en direct</small></div>
          <div className="hero-stat">🗺️ {lignesVille.length}<small>lignes</small></div>
          <div className="hero-stat">🎓 {VILLES[ville]?.universites.length || 0}<small>universités</small></div>
        </div>
      </div>

      {!univ && (
        <div className="cta-card">
          👋 Dis-nous où tu étudies pour voir tes bus !
          <button className="btn primary" onClick={() => go('compte')}>Choisir ma ville et mon université</button>
        </div>
      )}

      <div className="map-wrap">
        <div id="map" ref={mapRef}></div>
        <button className="locate-btn" onClick={meLocaliser} title="Me localiser">📍</button>
      </div>

      <section className="card highlight">
        <h2>📍 Où est le prochain bus ?</h2>
        <label>Ligne du bus</label>
        <select value={ligne} onChange={(e) => setLigne(e.target.value)}>
          {lignesVille.map(([code, l]) => (
            <option key={code} value={code}>{code} - {l.nom.split(' - ').slice(1).join(' - ')}</option>
          ))}
        </select>
        <label>Places libres dans ton bus ?</label>
        <select value={affluence} onChange={(e) => setAffluence(e.target.value)}>
          <option value="places">✅ Places libres</option>
          <option value="debout">🟡 Debout seulement</option>
          <option value="plein">🔴 Complet</option>
        </select>
        <label>Tu descends où ? (optionnel)</label>
        <select value={destination} onChange={(e) => setDestination(e.target.value)}>
          <option value="">— Non précisé —</option>
          {(LIGNES[ligne]?.arrets || []).map((a) => <option key={a.nom} value={a.nom}>{a.nom}</option>)}
        </select>
        <div className="row">
          {!partage ? (
            <button className="btn share" onClick={demarrer}>🟢 Je suis DANS le bus<br /><small>Partager ma position</small></button>
          ) : (
            <button className="btn stop" onClick={arreter}>🔴 Arrêter<br /><small>Descendre</small></button>
          )}
        </div>
        <p className="hint" style={partage ? { color: 'green' } : {}}>
          {partage ? `🟢 Tu partages comme BUS ${ligne}. Les autres te voient !` : "Tu n'es pas en partage. Les autres ne te voient pas."}
        </p>
      </section>

      <section className="card">
        <h2>🚏 Bus autour de moi</h2>
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="🔍 Filtrer (ligne ou pseudo)..." style={{ marginBottom: 8 }} />
        <div className="chips">
          <button className={'chip' + (filtre === 'toutes' ? ' on' : '')} onClick={() => setFiltre('toutes')}>Tous</button>
          {[...new Set(bus.map((b) => b.ligne))].map((c) => (
            <button key={c} className={'chip' + (filtre === c ? ' on' : '')} onClick={() => setFiltre(filtre === c ? 'toutes' : c)}>🚌 {c}</button>
          ))}
        </div>
        <label><input type="checkbox" checked={favsOnly} onChange={(e) => setFavsOnly(e.target.checked)} /> ⭐ Mes lignes favorites seulement</label>
        <div id="liste-bus">
          {visibles.length === 0 && <p className="hint">Aucun bus partagé pour l'instant. Monte dans un bus et partage !</p>}
          {visibles
            .filter((b) => !recherche || (b.ligne + ' ' + b.pseudo).toLowerCase().includes(recherche.toLowerCase()))
            .map((b) => {
            const d = userPos ? distanceM(userPos.lat, userPos.lng, b.lat, b.lng) : null;
            const proche = d !== null && d < 800;
            if (proche) alerter(b, formatDist(d));
            const age = b.updatedAt ? Math.max(0, Math.round((Date.now() - b.updatedAt) / 1000)) : null;
            return (
              <div key={b.id} className={'bus-item' + (proche ? ' proche' : '')}>
                <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: LIGNES[b.ligne]?.couleur || '#009639', marginRight: 6 }}></span>
                <b>🚌 {b.ligne}</b> par {b.pseudo}
                {b.signalements > 0 && <span style={{ color: '#c11f1f', fontWeight: 800 }}> • ⚠️ x{b.signalements}</span>}<br />
                📏 {d === null ? '—' : formatDist(d)} • ⏱️ {d === null ? '—' : formatEta(d)}
                {b.vitesse > 1 ? ` • ${Math.round(b.vitesse * 3.6)} km/h` : ''}
                {age !== null ? (age < 8 ? ' • 🟢 en direct' : ` • maj il y a ${age}s`) : ''}<br />
                <small>{AFFL[b.affluence] || ''}{b.destination ? ` • ↓ ${b.destination}` : ''}</small>
                <div className="row" style={{ marginTop: 6 }}>
                  <button className="btn secondary" style={{ marginTop: 0 }} onClick={() => voir(b)}>Voir</button>
                  <button className="btn secondary" style={{ marginTop: 0 }} onClick={() => signaler(b)}>⚠️ Souci</button>
                </div>
              </div>
            );
          })}
        </div>
        <label><input type="checkbox" checked={alertSonore} onChange={(e) => setAlertSonore(e.target.checked)} /> M'alerter quand un bus est à moins de 800m</label>
        <label><input type="checkbox" checked={alertesFavs} onChange={(e) => setAlertesFavs(e.target.checked)} /> Alertes seulement pour mes lignes ⭐</label>
      </section>
    </div>
  );
}
