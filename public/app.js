// ===== DONNÉES RÉELLES SOTRACO OUAGA (source: sotraco.bf/toutes-les-lignes) =====
// Coordonnées approximatives pour la carte - itinéraires texte officiels complets
const LIGNES = {
  L1: { nom: "L1 - Karpala ↔ Naba Koom", couleur: "#009639", detail: "Station SOGEL B - Palais de justice - Lycée Thomas Sankara - SIAO - Maison de la Femme - Av. Charles de Gaulle - Maison du peuple - Naba Koom", arrets: [
    { nom: "Karpala (SOGEL B)", lat: 12.430, lng: -1.455 },
    { nom: "SIAO", lat: 12.355, lng: -1.490 },
    { nom: "Maison de la Femme", lat: 12.365, lng: -1.495 },
    { nom: "Maison du peuple", lat: 12.366, lng: -1.518 },
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
  ]},
  L2: { nom: "L2 - Yamtenga ↔ Naba Koom", couleur: "#EF2D2D", detail: "Yamtenga (lycée communal) - Mairie de Bogodogo - Ouaga Inter - Rond-point Patte d'Oie - Mogho Naba - Grande mosquée - Naba Koom", arrets: [
    { nom: "Yamtenga", lat: 12.400, lng: -1.440 },
    { nom: "Mairie de Bogodogo", lat: 12.385, lng: -1.460 },
    { nom: "Rond-point Patte d'Oie", lat: 12.340, lng: -1.500 },
    { nom: "Mogho Naba", lat: 12.355, lng: -1.515 },
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
  ]},
  L3: { nom: "L3 - Bissighin ↔ Zone des écoles", couleur: "#0066cc", detail: "Bissighin - Rimkieta - Échangeur du Nord - Baskuy - Kolog Naba - Place de la Nation - Zone des écoles", arrets: [
    { nom: "Bissighin", lat: 12.420, lng: -1.570 },
    { nom: "Échangeur du Nord", lat: 12.400, lng: -1.540 },
    { nom: "Marché Baskuy", lat: 12.380, lng: -1.530 },
    { nom: "Place de la Nation", lat: 12.370, lng: -1.522 },
    { nom: "Terminus Zone des écoles", lat: 12.365, lng: -1.510 },
  ]},
  L4: { nom: "L4 - Sandogo ↔ Zone des écoles", couleur: "#ff8800", detail: "Sandogo - ONEA Pissy - SONABHY - Échangeur Ouest - Gounghin - Police - Place de la Nation - Zone des écoles", arrets: [
    { nom: "Sandogo", lat: 12.360, lng: -1.600 },
    { nom: "ONEA Pissy", lat: 12.345, lng: -1.575 },
    { nom: "Échangeur de l'Ouest", lat: 12.355, lng: -1.560 },
    { nom: "Place de la Nation", lat: 12.370, lng: -1.522 },
    { nom: "Terminus Zone des écoles", lat: 12.365, lng: -1.510 },
  ]},
  L5: { nom: "L5 - Bargo/Saaba ↔ Naba Koom", couleur: "#9900cc", detail: "Bargo - Saaba - Bendogo - Échangeur Est - Gare de l'Est - Yalgado - Naba Koom", arrets: [
    { nom: "Bargo (route Fada)", lat: 12.380, lng: -1.400 },
    { nom: "Marché Saaba", lat: 12.360, lng: -1.410 },
    { nom: "Échangeur de l'Est", lat: 12.375, lng: -1.460 },
    { nom: "CHU Yalgado", lat: 12.380, lng: -1.495 },
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
  ]},
  L6: { nom: "L6 - Koulweoguin ↔ Naba Koom", couleur: "#009999", detail: "Koulweoguin - Tanghin - Collège Protestant - Paspanga - ONATEL - Naba Koom", arrets: [
    { nom: "Koulweoguin", lat: 12.420, lng: -1.500 },
    { nom: "Marché Tanghin", lat: 12.405, lng: -1.510 },
    { nom: "Paspanga", lat: 12.385, lng: -1.515 },
    { nom: "ONATEL", lat: 12.375, lng: -1.518 },
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
  ]},
  L9: { nom: "L9 - Saaba ↔ Naba Koom (Taabtenga)", couleur: "#cc6600", detail: "Mairie Saaba - Taabtenga - Musée National - Maison Femme - Trinité - Naba Koom", arrets: [
    { nom: "Mairie Saaba", lat: 12.360, lng: -1.410 },
    { nom: "Taabtenga", lat: 12.365, lng: -1.440 },
    { nom: "Musée National", lat: 12.370, lng: -1.470 },
    { nom: "Maison de la Femme", lat: 12.365, lng: -1.495 },
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
  ]},
  L10: { nom: "L10 - Tengandogo ↔ Zone des écoles", couleur: "#3333cc", detail: "CHU Tengandogo - Patte d'Oie - Naab Raaga - Bambata - Place Nation - Zone des écoles", arrets: [
    { nom: "CHU Tengandogo", lat: 12.290, lng: -1.500 },
    { nom: "Rond-point Patte d'Oie", lat: 12.340, lng: -1.500 },
    { nom: "Lycée Bambata", lat: 12.355, lng: -1.515 },
    { nom: "Place de la Nation", lat: 12.370, lng: -1.522 },
    { nom: "Terminus Zone des écoles", lat: 12.365, lng: -1.510 },
  ]},
  L11: { nom: "L11 - Rimkiéta ↔ Naba Koom", couleur: "#666600", detail: "Rimkiéta SODEPIS - Marché 10 Yaar - Sankaryaré - Av 56 - Naba Koom", arrets: [
    { nom: "Rimkiéta SODEPIS", lat: 12.430, lng: -1.540 },
    { nom: "Marché 10 Yaar", lat: 12.410, lng: -1.535 },
    { nom: "Sankaryaré", lat: 12.390, lng: -1.525 },
    { nom: "Nations Unies", lat: 12.368, lng: -1.519 },
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
  ]},
  L12: { nom: "L12 - Bonheur ville ↔ Zone des écoles", couleur: "#cc0066", detail: "Bonheur ville - Cissin - Gounghin - Cathédrale - Hôtel de ville - Zone des écoles", arrets: [
    { nom: "Bonheur ville", lat: 12.350, lng: -1.580 },
    { nom: "Cissin PETROFA", lat: 12.345, lng: -1.560 },
    { nom: "Cathédrale", lat: 12.360, lng: -1.525 },
    { nom: "Rond-point Nations Unies", lat: 12.368, lng: -1.519 },
    { nom: "Terminus Zone des écoles", lat: 12.365, lng: -1.510 },
  ]},
  L13: { nom: "L13 - Kamboinsin ↔ Zone des écoles", couleur: "#006600", detail: "Kamboinsin - Paul 6 - Échangeur Nord - Nonsin - Larlé - Nation - Zone des écoles", arrets: [
    { nom: "Kamboinsin", lat: 12.450, lng: -1.550 },
    { nom: "Hôpital Paul 6", lat: 12.420, lng: -1.545 },
    { nom: "Échangeur du Nord", lat: 12.400, lng: -1.540 },
    { nom: "Larlé", lat: 12.380, lng: -1.525 },
    { nom: "Terminus Zone des écoles", lat: 12.365, lng: -1.510 },
  ]},
  L15: { nom: "L15 - Naba Koom ↔ Belle Ville", couleur: "#ff3300", detail: "Naba Koom - Stade municipal - Naab Raaga - Patte d'Oie - ASECNA - Belle ville Watinoma", arrets: [
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
    { nom: "Stade municipal", lat: 12.355, lng: -1.515 },
    { nom: "Patte d'Oie", lat: 12.340, lng: -1.500 },
    { nom: "Cité ASECNA", lat: 12.320, lng: -1.505 },
    { nom: "Belle ville Watinoma", lat: 12.300, lng: -1.520 },
  ]},
  L16: { nom: "L16 - Bassinko ↔ Naba Koom", couleur: "#3399ff", detail: "Bassinko - AZIMMO - Ave Maria - Marché bétail - Échangeur Nord - Naba Koom", arrets: [
    { nom: "Bassinko", lat: 12.420, lng: -1.600 },
    { nom: "Cité AZIMMO", lat: 12.410, lng: -1.570 },
    { nom: "Échangeur du Nord", lat: 12.400, lng: -1.540 },
    { nom: "Lycée Municipal", lat: 12.385, lng: -1.530 },
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
  ]},
  L17: { nom: "L17 - Boassa ↔ Zone des écoles", couleur: "#996633", detail: "Boassa - Sandogo - Pissy - Échangeur Ouest - Gounghin - Nation - Zone des écoles", arrets: [
    { nom: "Boassa", lat: 12.330, lng: -1.600 },
    { nom: "Sandogo", lat: 12.360, lng: -1.600 },
    { nom: "Échangeur de l'Ouest", lat: 12.355, lng: -1.560 },
    { nom: "Place de la Nation", lat: 12.370, lng: -1.522 },
    { nom: "Terminus Zone des écoles", lat: 12.365, lng: -1.510 },
  ]},
  UO1A: { nom: "Spéciale UO - Kossodo ↔ SIAO via UO", couleur: "#009639", detail: "Cité Kossodo - Somgandé - Échangeur Est - UO1 Joseph Ki-Zerbo - SIAO", arrets: [
    { nom: "Cité Univ Kossodo", lat: 12.400, lng: -1.460 },
    { nom: "Échangeur de l'Est", lat: 12.375, lng: -1.460 },
    { nom: "Université UJKZ (UO1)", lat: 12.382, lng: -1.503 },
    { nom: "Pharmacie Nemadis", lat: 12.365, lng: -1.495 },
    { nom: "SIAO", lat: 12.355, lng: -1.490 },
  ]},
  UTS1: { nom: "Spéciale UTS Axe 1 - UO1 ↔ UTS", couleur: "#FEDD00", detail: "UO1 - CHU Charles de Gaulle - Échangeur Est - Saaba - Péage - Univ Thomas Sankara", arrets: [
    { nom: "Université UJKZ (UO1)", lat: 12.382, lng: -1.503 },
    { nom: "CHU Charles de Gaulle", lat: 12.375, lng: -1.470 },
    { nom: "Carrefour Saaba", lat: 12.360, lng: -1.420 },
    { nom: "Péage", lat: 12.350, lng: -1.405 },
    { nom: "Univ Thomas Sankara", lat: 12.345, lng: -1.390 },
  ]},
  KOUBRI: { nom: "Inter - Ouaga ↔ Koubri", couleur: "#660099", detail: "Koubri - Balkuy - Trame Ouaga 2000 - Gare routière", arrets: [
    { nom: "Marché Koubri", lat: 12.210, lng: -1.400 },
    { nom: "Balkuy", lat: 12.320, lng: -1.450 },
    { nom: "Ouaga 2000", lat: 12.330, lng: -1.500 },
    { nom: "Gare routière", lat: 12.360, lng: -1.520 },
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
  ]},
  ZINIARE: { nom: "Inter - Ouaga ↔ Ziniaré", couleur: "#003366", detail: "Ziniaré - Loumbila - Kossodo - SOTRACO siège - Yalgado - Naba Koom", arrets: [
    { nom: "Ziniaré", lat: 12.580, lng: -1.300 },
    { nom: "Loumbila", lat: 12.490, lng: -1.380 },
    { nom: "Kossodo SOTRACO", lat: 12.400, lng: -1.460 },
    { nom: "CHU Yalgado", lat: 12.380, lng: -1.495 },
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
  ]},
};

const socket = io();
let map, userMarker, userPos = null;
let busMarkers = {};
let partageActif = false;
let watchId = null;
let demoInterval = null;
let alerteDejaJouee = {};

map = L.map('map').setView([12.3714, -1.5197], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

// Dessiner lignes + arrêts
for (const [code, l] of Object.entries(LIGNES)) {
  const latlngs = l.arrets.map(a => [a.lat, a.lng]);
  L.polyline(latlngs, { color: l.couleur, weight: 4, opacity: 0.7 }).addTo(map);
  l.arrets.forEach(a => {
    L.circleMarker([a.lat, a.lng], { radius: 7, color: "#000", fillColor: "#fff", fillOpacity: 1, weight: 2 })
      .bindPopup(`<b>${a.nom}</b><br>${l.nom}`).addTo(map);
  });
}

// Remplir selects
function tousArrets() {
  const s = new Map();
  for (const l of Object.values(LIGNES)) for (const a of l.arrets) s.set(a.nom, a);
  return [...s.entries()];
}
const arretsUniques = tousArrets();
for (const selId of ["mon-arret", "depart", "arrivee"]) {
  const sel = document.getElementById(selId);
  arretsUniques.forEach(([nom]) => {
    const o = document.createElement("option"); o.value = nom; o.textContent = nom; sel.appendChild(o);
  });
}
document.getElementById("depart").value = "Université UJKZ";
document.getElementById("arrivee").value = "Gare Gounghin";

// Profil
const pseudoInput = document.getElementById("pseudo");
pseudoInput.value = localStorage.getItem("pseudo") || "";
document.getElementById("save-profil").onclick = () => {
  localStorage.setItem("pseudo", pseudoInput.value || "Étudiant");
  localStorage.setItem("mon-arret", document.getElementById("mon-arret").value);
  alert("Enregistré ✅ : " + (pseudoInput.value || "Étudiant"));
};
if (localStorage.getItem("mon-arret")) document.getElementById("mon-arret").value = localStorage.getItem("mon-arret");

function getPseudo() { return pseudoInput.value.trim() || localStorage.getItem("pseudo") || "Étudiant"; }

// Position utilisateur
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(p => {
    userPos = { lat: p.coords.latitude, lng: p.coords.longitude };
    if (!userMarker) {
      userMarker = L.marker([userPos.lat, userPos.lng]).addTo(map).bindPopup("Toi 📍");
      map.setView([userPos.lat, userPos.lng], 14);
    } else userMarker.setLatLng([userPos.lat, userPos.lng]);
  }, () => {
    // GPS refusé -> centre Ouaga par défaut pour test
    if (!userPos) { userPos = { lat: 12.368, lng: -1.519 }; }
  }, { enableHighAccuracy: true });
} else { userPos = { lat: 12.368, lng: -1.519 }; }

// ===== PARTAGE : JE SUIS DANS LE BUS =====
const btnDansBus = document.getElementById("btn-dans-bus");
const btnStop = document.getElementById("btn-stop");
const statut = document.getElementById("statut-partage");

btnDansBus.onclick = () => {
  const ligne = document.getElementById("ligne").value;
  if (!navigator.geolocation) return alert("GPS non supporté");
  navigator.geolocation.getCurrentPosition(() => {
    partageActif = true;
    btnDansBus.classList.add("hidden"); btnStop.classList.remove("hidden");
    statut.textContent = "🟢 Tu partages ta position comme BUS " + ligne + ". Les autres te voient !";
    statut.style.color = "green";
    watchId = navigator.geolocation.watchPosition(pos => {
      socket.emit("partage-position", {
        pseudo: getPseudo(), ligne,
        lat: pos.coords.latitude, lng: pos.coords.longitude,
        vitesse: pos.coords.speed || 0
      });
    }, err => alert("Active la localisation GPS"), { enableHighAccuracy: true, maximumAge: 2000 });
  }, () => alert("Autorise la localisation pour partager comme bus 🙏"));
};

btnStop.onclick = arreterPartage;
function arreterPartage() {
  partageActif = false;
  if (watchId) navigator.geolocation.clearWatch(watchId);
  if (demoInterval) clearInterval(demoInterval);
  socket.emit("stop-partage");
  btnDansBus.classList.remove("hidden"); btnStop.classList.add("hidden");
  statut.textContent = "Tu n'es pas en partage. Les autres ne te voient pas.";
  statut.style.color = "";
}

// Démo sans GPS : simule un bus qui bouge sur la ligne
document.getElementById("btn-demo").onclick = () => {
  const ligne = document.getElementById("ligne").value;
  const arrets = LIGNES[ligne].arrets;
  let i = 0, t = 0;
  partageActif = true;
  btnDansBus.classList.add("hidden"); btnStop.classList.remove("hidden");
  statut.textContent = "🧪 DÉMO : tu simules un bus " + ligne + " à Ouaga";
  demoInterval = setInterval(() => {
    const a = arrets[i % arrets.length], b = arrets[(i + 1) % arrets.length];
    t += 0.2; if (t >= 1) { t = 0; i++; }
    const lat = a.lat + (b.lat - a.lat) * t;
    const lng = a.lng + (b.lng - a.lng) * t;
    socket.emit("partage-position", { pseudo: getPseudo() + " (démo)", ligne, lat, lng, vitesse: 8 });
  }, 2000);
};

// ===== RECEVOIR BUS =====
function distanceM(lat1, lon1, lat2, lon2) {
  const R = 6371000, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

socket.on("bus-list", (bus) => {
  document.getElementById("online-count").textContent = bus.length + " bus en ligne";
  // nettoyer anciens markers
  const ids = new Set(bus.map(b => b.id));
  for (const id of Object.keys(busMarkers)) if (!ids.has(id)) { map.removeLayer(busMarkers[id]); delete busMarkers[id]; }

  const liste = document.getElementById("liste-bus");
  liste.innerHTML = bus.length ? "" : "<p class='hint'>Aucun bus partagé pour l'instant.</p>";

  bus.forEach(b => {
    const icon = L.divIcon({ className: "", html: `<div style="background:${LIGNES[b.ligne]?.couleur || '#009639'};color:#fff;border:2px solid #000;border-radius:20px;padding:4px 10px;font-weight:900;white-space:nowrap">🚌 ${b.ligne}</div>`, iconSize: [70, 30] });
    if (!busMarkers[b.id]) busMarkers[b.id] = L.marker([b.lat, b.lng], { icon }).addTo(map).bindPopup(`<b>Bus ${b.ligne}</b><br>Partagé par ${b.pseudo}`);
    else busMarkers[b.id].setLatLng([b.lat, b.lng]);

    let distTxt = "—", eta = "—", proche = false;
    if (userPos) {
      const d = distanceM(userPos.lat, userPos.lng, b.lat, b.lng);
      distTxt = d < 1000 ? Math.round(d) + " m" : (d / 1000).toFixed(1) + " km";
      const minutes = Math.round((d / 1000) / 20 * 60); // 20 km/h moyen
      eta = minutes < 1 ? "arrive !" : "~" + minutes + " min";
      if (d < 800) proche = true;
    }
    const div = document.createElement("div");
    div.className = "bus-item" + (proche ? " proche" : "");
    div.innerHTML = `<b>🚌 ${b.ligne}</b> par ${b.pseudo}<br>📏 ${distTxt} • ⏱️ ${eta} <button style="float:right">Voir</button>`;
    div.querySelector("button").onclick = () => map.setView([b.lat, b.lng], 15);
    liste.appendChild(div);

    // Alerte
    if (proche && document.getElementById("alerte-sonore").checked && !alerteDejaJouee[b.id]) {
      alerteDejaJouee[b.id] = true;
      const al = document.getElementById("alerte");
      al.textContent = `🔔 Bus ${b.ligne} proche de toi (${distTxt}) ! Prépare-toi !`;
      al.classList.remove("hidden");
      try { new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play(); } catch {}
      if (Notification && Notification.permission === "granted") new Notification(`Bus ${b.ligne} arrive !`);
      setTimeout(() => { al.classList.add("hidden"); delete alerteDejaJouee[b.id]; }, 15000);
    }
  });
});
if (Notification && Notification.permission === "default") Notification.requestPermission();

// ===== ITINERAIRE =====
document.getElementById("btn-itineraire").onclick = () => {
  const dep = document.getElementById("depart").value, arr = document.getElementById("arrivee").value;
  const res = document.getElementById("resultat-itineraire");
  const lignesDirectes = Object.entries(LIGNES).filter(([_, l]) =>
    l.arrets.some(a => a.nom === dep) && l.arrets.some(a => a.nom === arr));
  if (lignesDirectes.length) {
    res.innerHTML = lignesDirectes.map(([c, l]) =>
      `<p>✅ Prends <b>${c}</b> : ${l.nom}<br><small>${dep} → ${arr} direct, sans correspondance</small></p>`).join("");
  } else {
    const lDep = Object.entries(LIGNES).filter(([_, l]) => l.arrets.some(a => a.nom === dep));
    const lArr = Object.entries(LIGNES).filter(([_, l]) => l.arrets.some(a => a.nom === arr));
    res.innerHTML = `<p>⚠️ Pas de direct. Options :<br>Depuis <b>${dep}</b> : ${lDep.map(([c]) => c).join(", ") || "aucune"}<br>Jusqu'à <b>${arr}</b> : ${lArr.map(([c]) => c).join(", ") || "aucune"}<br><small>Descends à <b>Université UJKZ</b> pour correspondance (hub étudiant).</small></p>`;
  }
};

// ===== INFOS LIGNES (itinéraires officiels sotraco.bf) =====
document.getElementById("lignes-info").innerHTML = Object.entries(LIGNES).map(([c, l]) =>
  `<details><summary><b>${c}</b> - ${l.nom}</summary><p><small>🛣️ ${l.detail || ""}</small></p><ul>${l.arrets.map(a => `<li>${a.nom}</li>`).join("")}</ul><small>Source: sotraco.bf • Premier: 6h00 • Dernier: 20h00 • Ticket ~200F</small></details>`).join("");
