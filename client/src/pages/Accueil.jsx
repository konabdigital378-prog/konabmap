import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LIGNES, VILLES } from '../data.js';
import { socket } from '../socket.js';
import { distanceM, formatDist, formatEta, getFavs, AFFL, prochainsDeparts, prochainsExacts, esc, parler, estHeurePointe } from '../lib.js';
import { shareBusPosition, notify, fetchHoraires, fetchDeparts } from '../supabase.js';

export default function Accueil({ ville, userPos, bus, go, focusLigne, clearFocus, isPremium, goPremium, suiviId, clearSuivi }) {
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
  const [tri, setTri] = useState('distance');
  const [recherche, setRecherche] = useState('');
  const [alertSonore, setAlertSonore] = useState(true);
  const [voix, setVoix] = useState(() => localStorage.getItem('voix') === 'oui');
  const watchId = useRef(null);
  const debutPartage = useRef(null);
  const dejaAlerte = useRef({});
  const busConnus = useRef(new Set());
  const userMarker = useRef(null);
  const [horaires, setHoraires] = useState({});
  const [departs, setDeparts] = useState({});
  const [, tick] = useState(0);

  useEffect(() => {
    fetchHoraires().then(setHoraires).catch(() => {});
    fetchDeparts(ville).then((d) => {
      const g = {};
      d.forEach((x) => { if (!g[x.ligne]) g[x.ligne] = []; g[x.ligne].push(x); });
      setDeparts(g);
    }).catch(() => {});
    const iv = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ville]);
  const tileRef = useRef(null);
  const [fond, setFond] = useState(() => localStorage.getItem('fond') || 'clair');
  const [grandeCarte, setGrandeCarte] = useState(false);

  const FONDS = {
    clair: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    humanitaire: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    sombre: 'https://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };
  const ATTR = '© OpenStreetMap · HOT · Imagerie © Esri';

  const univ = localStorage.getItem('universite') || '';
  const lignesVille = Object.entries(LIGNES).filter(([, l]) => (l.ville || 'Ouagadougou') === ville);

  useEffect(() => {
    if (lignesVille.length > 0) setLigne((prev) => (prev && LIGNES[prev] ? prev : lignesVille[0][0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ville]);

  // Init carte
  useEffect(() => {
    mapObj.current = L.map(mapRef.current, { zoomControl: false }).setView([12.3714, -1.5197], 12);
    L.control.zoom({ position: 'bottomright' }).addTo(mapObj.current);
    tileRef.current = L.tileLayer(FONDS[localStorage.getItem('fond') || 'clair'], {
      maxZoom: 19, attribution: ATTR,
    }).addTo(mapObj.current);
    lignesLayer.current = L.layerGroup().addTo(mapObj.current);
    highlightLayer.current = L.layerGroup().addTo(mapObj.current);
    return () => mapObj.current.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Changement de fond
  useEffect(() => {
    const map = mapObj.current;
    if (!map || !tileRef.current) return;
    map.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(FONDS[fond], {
      maxZoom: 19, attribution: ATTR,
    }).addTo(mapObj.current);
    localStorage.setItem('fond', fond);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fond]);

  // Plein écran carte
  useEffect(() => {
    const map = mapObj.current;
    if (map) setTimeout(() => map.invalidateSize(), 200);
  }, [grandeCarte]);

  // Lignes de la ville
  useEffect(() => {
    const map = mapObj.current;
    if (!map) return;
    clearFocus();
    lignesLayer.current.clearLayers();
    const v = VILLES[ville] || VILLES['Ouagadougou'];
    map.setView(v.centre, v.zoom);
    for (const [, l] of lignesVille) {
      L.polyline(l.arrets.map((a) => [a.lat, a.lng]), { color: l.couleur, weight: 4, opacity: 0.85 }).addTo(lignesLayer.current);
      l.arrets.forEach((a) => {
        L.circleMarker([a.lat, a.lng], { radius: 6, color: '#fff', fillColor: l.couleur, fillOpacity: 1, weight: 2 })
          .bindPopup(`<b>${a.nom}</b><br>${l.nom}`)
          .addTo(lignesLayer.current);
      });
    }
    v.universites.forEach((u) => {
      L.marker([u.lat, u.lng], { icon: L.divIcon({ className: '', html: '<div class="univ-pin">🎓</div>', iconSize: [34, 34], iconAnchor: [17, 17] }) })
        .bindPopup(`🎓 <b>${u.nom}</b>`)
        .addTo(lignesLayer.current);
    });
    setTimeout(() => map.invalidateSize(), 150);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ville]);

  // Ligne mise en avant (depuis Lignes/Trajet, ou bus suivi)
  const busSuivi = suiviId ? bus.find((b) => b.id === suiviId) : null;
  const ligneFocus = focusLigne || busSuivi?.ligne || '';
  useEffect(() => {
    const map = mapObj.current;
    if (!map) return;
    highlightLayer.current.clearLayers();
    if (ligneFocus && LIGNES[ligneFocus]) {
      const l = LIGNES[ligneFocus];
      const latlngs = l.arrets.map((a) => [a.lat, a.lng]);
      L.polyline(latlngs, { color: '#FEDD00', weight: 9, opacity: 0.9 }).addTo(highlightLayer.current);
      L.polyline(latlngs, { color: l.couleur, weight: 5, opacity: 1 }).addTo(highlightLayer.current);
      map.fitBounds(latlngs, { padding: [30, 30] });
    }
  }, [ligneFocus]);
  useEffect(() => {
    const map = mapObj.current;
    if (!map || !userPos) return;
    if (!userMarker.current) {
      userMarker.current = L.marker([userPos.lat, userPos.lng], {
        icon: L.divIcon({ className: '', html: '<div class="moi-pin"></div>', iconSize: [24, 24], iconAnchor: [12, 12] }),
      }).addTo(map).bindPopup('Toi 📍');
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
      const couleur = LIGNES[b.ligne]?.couleur || '#009639';
      const frais = b.updatedAt && Date.now() - b.updatedAt < 8000;
      const affColor = b.affluence === 'plein' ? '#EF2D2D' : b.affluence === 'debout' ? '#f5a623' : '#00c853';
      const icon = L.divIcon({
        className: '',
        html: `<div class="bus-pin${frais ? ' live' : ''}" style="--c:${couleur}"><span>🚌</span><b>${esc(b.ligne)}</b><i style="background:${affColor}"></i></div>`,
        iconSize: [78, 34], iconAnchor: [39, 17],
      });
      const popup = `<div class="bus-pop"><b>🚌 Bus ${esc(b.ligne)}</b>${b.chauffeur ? ' ✔️🚍' : ''}<br>Par ${esc(b.pseudo)}${b.destination ? `<br>↓ ${esc(b.destination)}` : ''}${b.signalements > 0 ? `<br>⚠️ ${b.signalements} signalement(s)` : ''}</div>`;
      if (!busMarkers.current[b.id]) {
        busMarkers.current[b.id] = L.marker([b.lat, b.lng], { icon }).addTo(map).bindPopup(popup);
      } else {
        busMarkers.current[b.id].setLatLng([b.lat, b.lng]);
        busMarkers.current[b.id].setIcon(icon);
        busMarkers.current[b.id].setPopupContent(popup);
      }
    });
  }, [bus]);

  const pseudo = () => localStorage.getItem('pseudo') || 'Étudiant';

  const demarrer = () => {
    if (!navigator.geolocation) return alert('GPS non supporté');
    if (!isPremium) {
      alert('💎 Le partage demande un abonnement actif (100 FCFA/30j)');
      goPremium();
      return;
    }
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

  // Alerte quand une ligne favorite passe en direct + stop auto à la fermeture
  useEffect(() => {
    const favs = getFavs();
    bus.forEach((b) => {
      if (!busConnus.current.has(b.id)) {
        busConnus.current.add(b.id);
        const frais = b.updatedAt && Date.now() - b.updatedAt < 90000;
        if (frais && favs.includes(b.ligne)) {
          notify(`Ta ligne ${b.ligne} est en direct !`, `${b.pseudo} partage sa position 🚌`).catch(() => {});
          parler(`Ta ligne ${b.ligne} est en direct !`);
        }
      }
    });
    if (busConnus.current.size > 200) busConnus.current = new Set([...busConnus.current].slice(-100));
    const stop = () => { if (watchId.current) socket.emit('stop-partage'); };
    window.addEventListener('beforeunload', stop);
    return () => {
      window.removeEventListener('beforeunload', stop);
      if (watchId.current) { navigator.geolocation.clearWatch(watchId.current); socket.emit('stop-partage'); }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bus]);

  let visibles = favsOnly ? bus.filter((b) => getFavs().includes(b.ligne)) : [...bus];
  if (filtre !== 'toutes') visibles = visibles.filter((b) => b.ligne === filtre);
  if (userPos && tri === 'distance') {
    visibles = [...visibles].sort((a, b2) => distanceM(userPos.lat, userPos.lng, a.lat, a.lng) - distanceM(userPos.lat, userPos.lng, b2.lat, b2.lng));
  } else if (tri === 'recent') {
    visibles = [...visibles].sort((a, b2) => (b2.updatedAt || 0) - (a.updatedAt || 0));
  } else if (tri === 'ligne') {
    visibles = [...visibles].sort((a, b2) => String(a.ligne).localeCompare(String(b2.ligne)));
  }

  const voir = (b) => mapObj.current.setView([b.lat, b.lng], 15);
  const meLocaliser = () => { if (userPos) mapObj.current.setView([userPos.lat, userPos.lng], 15); };

  // Bus suivi via lien partagé : on le centre + alerte arrivée à mon arrêt
  const arriveeSignalee = useRef(false);
  useEffect(() => {
    if (!suiviId) arriveeSignalee.current = false;
    if (busSuivi && mapObj.current) mapObj.current.setView([busSuivi.lat, busSuivi.lng], 15);
    if (busSuivi && monArret && !arriveeSignalee.current) {
      const d = distanceM(busSuivi.lat, busSuivi.lng, monArret.lat, monArret.lng);
      if (d < 800) {
        arriveeSignalee.current = true;
        notify(`Ton bus suivi arrive à ${monArret.nom} !`, `Bus ${busSuivi.ligne} à ${formatDist(d)} 🚌`).catch(() => {});
        parler(`Ton bus suivi arrive à ton arrêt !`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suiviId, bus.length]);

  // Coordonnées de mon arrêt (profil) pour ETA d'arrivée
  const arretsVille = {};
  lignesVille.forEach(([, l]) => l.arrets.forEach((a) => { arretsVille[a.nom] = a; }));
  const monArret = arretsVille[localStorage.getItem('mon-arret') || ''] || null;

  const copierLien = async (b) => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/?bus=${b.id}`);
      alert('Lien de suivi copié 🔗 Envoie-le à tes amis !');
    } catch { alert(`${location.origin}/?bus=${b.id}`); }
  };

  const partagerWhatsApp = (b) => {
    const txt = encodeURIComponent(`🚌 Suis mon bus ${b.ligne} en direct sur KonabMap : ${location.origin}/?bus=${b.id}`);
    window.open(`https://wa.me/?text=${txt}`, '_blank');
  };

  const alerter = (b, distTxt) => {
    if (!alertSonore || dejaAlerte.current[b.id]) return;
    if (alertesFavs && !getFavs().includes(b.ligne)) return;
    if (!isPremium) return; // alertes = Premium
    dejaAlerte.current[b.id] = true;
    notify(`Bus ${b.ligne} proche !`, `À ${distTxt} de toi, prépare-toi !`).catch(() => {});
    parler(`Bus ${b.ligne} proche, prépare-toi !`);
    setTimeout(() => delete dejaAlerte.current[b.id], 15000);
  };

  const signaler = (b) => {
    if (!confirm(`Signaler un souci sur le bus ${b.ligne} (panne, retard, conduite...) ?`)) return;
    socket.emit('signalement', { busId: b.id });
    alert('Signalement envoyé, merci 🙏');
  };

  return (
    <div className="page" id="page-accueil">
      {suiviId && (
        <div className="cta-card">
          {busSuivi ? `👀 Tu suis le bus ${busSuivi.ligne} de ${busSuivi.pseudo}` : '👀 Suivi en cours... (le bus partagera bientôt sa position)'}
          <button className="btn secondary" onClick={clearSuivi}>Arrêter le suivi</button>
        </div>
      )}
      <div className="hero">
        <div>
          <div className="hero-ville">📍 {ville}{estHeurePointe() ? ' • 🔥 Heure de pointe' : ''}</div>
          <div className="hero-titre">{univ ? univ.replace(/^Université\s*/, '') : 'Choisis ton université'}</div>
          <div className="hero-stats">
            <div className="hero-stat">🚌 {bus.length}<small>bus en direct</small></div>
            <div className="hero-stat">🗺️ {lignesVille.length}<small>lignes</small></div>
            <div className="hero-stat">🇧🇫 {Object.keys(VILLES).length}<small>villes couvertes</small></div>
          </div>
        </div>
        <img className="hero-photo" src="etudiant.jpg" alt="Étudiant" />
      </div>

      {!univ && (
        <div className="cta-card cta-photo">
          <img src="etudiant.jpg" alt="Étudiant" />
          <div>
            👋 Dis-nous où tu étudies pour voir tes bus !
            <button className="btn primary" onClick={() => go('compte')}>Choisir ma ville et mon université</button>
          </div>
        </div>
      )}

      <section className="card">
        <h2>🕒 Prochains départs</h2>
        {(getFavs().length > 0 ? lignesVille.filter(([c]) => getFavs().includes(c)) : lignesVille.slice(0, 4)).map(([c, l]) => {
          const exacts = prochainsExacts(departs[c] || [], c, 2);
          const termes = Object.entries(exacts);
          const freq = prochainsDeparts(horaires[c]);
          return (
            <div key={c} className="hist-item">
              <span><b>{c}</b> <small>{l.nom.split(' - ').slice(1).join(' - ')}</small></span>
              <small>
                {termes.length > 0
                  ? termes.map(([t, hs]) => `📋 ${t.split('(')[0].trim()} ${hs[0]}`).join(' • ')
                  : freq.length > 0 ? `🟢 ${freq.slice(0, 2).join(' • ')}` : '🌙 Terminé'}
              </small>
            </div>
          );
        })}
      </section>

      <div className="map-wrap">
        <div className="carte-outils">
          {['clair', 'humanitaire', 'sombre', 'satellite'].map((f) => (
            <button key={f} className={'chip' + (fond === f ? ' on' : '')} onClick={() => setFond(f)}>
              {f === 'clair' ? '🗺️ Clair' : f === 'humanitaire' ? '🧡 Humanitaire' : f === 'sombre' ? '🌙 Sombre' : '🛰️ Satellite'}
            </button>
          ))}
          <button className="chip" onClick={() => setGrandeCarte((g) => !g)}>{grandeCarte ? '🔽 Réduire' : '⛶ Agrandir'}</button>
        </div>
        <div id="map" ref={mapRef} style={grandeCarte ? { height: '78vh' } : {}}></div>
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
        <div className="row">
          <select value={tri} onChange={(e) => setTri(e.target.value)} aria-label="Trier">
            <option value="distance">📏 Plus proches</option>
            <option value="recent">🕒 Récents</option>
            <option value="ligne">🚌 Par ligne</option>
          </select>
        </div>
        <div id="liste-bus">
          {visibles.length === 0 && <p className="hint">Aucun bus partagé pour l'instant. Monte dans un bus et partage !</p>}
          {visibles.length === 0 && (() => {
            try {
              const c = JSON.parse(localStorage.getItem('lastBus') || 'null');
              if (c?.bus?.length) {
                const min = Math.max(1, Math.round((Date.now() - c.t) / 60000));
                return <p className="hint">📶 Hors-ligne : dernières positions connues il y a {min} min ({c.bus.length} bus).</p>;
              }
            } catch { /* ignore */ }
            return null;
          })()}
          {visibles
            .filter((b) => !recherche || (b.ligne + ' ' + b.pseudo).toLowerCase().includes(recherche.toLowerCase()))
            .map((b) => {
            const d = userPos ? distanceM(userPos.lat, userPos.lng, b.lat, b.lng) : null;
            const proche = d !== null && d < 800;
            if (proche) alerter(b, formatDist(d));
            const age = b.updatedAt ? Math.max(0, Math.round((Date.now() - b.updatedAt) / 1000)) : null;
            const etaArret = monArret ? formatEta(distanceM(b.lat, b.lng, monArret.lat, monArret.lng)) : null;
            return (
              <div key={b.id} className={'bus-item' + (proche ? ' proche' : '')}>
                <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: LIGNES[b.ligne]?.couleur || '#009639', marginRight: 6 }}></span>
                <b>🚌 {b.ligne}</b> par {b.pseudo}{b.chauffeur ? ' ✔️🚍' : ''}
                {b.signalements > 0 && <span style={{ color: '#c11f1f', fontWeight: 800 }}> • ⚠️ x{b.signalements}</span>}<br />
                📏 {d === null ? '—' : formatDist(d)} • ⏱️ {d === null ? '—' : formatEta(d)}
                {b.vitesse > 1 ? ` • ${Math.round(b.vitesse * 3.6)} km/h` : ''}
                {age !== null ? (age < 8 ? ' • 🟢 en direct' : ` • maj il y a ${age}s`) : ''}<br />
                {etaArret && monArret && <span>🚏 Arrive à <b>{monArret.nom}</b> dans ~<b>{etaArret}</b><br /></span>}
                <small>{AFFL[b.affluence] || ''}{b.destination ? ` • ↓ ${b.destination}` : ''}</small>
                <div className="row" style={{ marginTop: 6 }}>
                  <button className="btn secondary" style={{ marginTop: 0 }} onClick={() => voir(b)}>Voir</button>
                  <button className="btn secondary" style={{ marginTop: 0 }} onClick={() => copierLien(b)}>🔗 Lien</button>
                  <button className="btn secondary" style={{ marginTop: 0 }} onClick={() => partagerWhatsApp(b)}>💬 WhatsApp</button>
                  <button className="btn secondary" style={{ marginTop: 0 }} onClick={() => signaler(b)}>⚠️ Souci</button>
                </div>
              </div>
            );
          })}
        </div>
        <label><input type="checkbox" checked={alertSonore} onChange={(e) => {
          if (e.target.checked && !isPremium) { alert('💎 Les alertes de proximité sont Premium (100 FCFA/30j)'); goPremium(); return; }
          setAlertSonore(e.target.checked);
        }} /> M'alerter quand un bus est à moins de 800m 💎</label>
        <label><input type="checkbox" checked={alertesFavs} onChange={(e) => setAlertesFavs(e.target.checked)} /> Alertes seulement pour mes lignes ⭐</label>
        <label><input type="checkbox" checked={voix} onChange={(e) => { setVoix(e.target.checked); localStorage.setItem('voix', e.target.checked ? 'oui' : 'non'); }} /> 🔊 Annonces vocales (français)</label>
      </section>
    </div>
  );
}
