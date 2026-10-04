// ===== DONNÉES EXEMPLE SOTRACO OUAGA (à remplacer par vraies données) =====
const LIGNES = {
  L1: { nom: "L1 - Karpala ↔ Gounghin", couleur: "#009639", arrets: [
    { nom: "Karpala", lat: 12.430, lng: -1.455 },
    { nom: "Wayalghin", lat: 12.410, lng: -1.470 },
    { nom: "Université UJKZ", lat: 12.382, lng: -1.503 },
    { nom: "Rond-point Nations Unies", lat: 12.368, lng: -1.519 },
    { nom: "Gare Gounghin", lat: 12.355, lng: -1.560 },
  ]},
  L2: { nom: "L2 - Saaba ↔ Pissy", couleur: "#EF2D2D", arrets: [
    { nom: "Saaba", lat: 12.360, lng: -1.410 },
    { nom: "Wemtenga", lat: 12.365, lng: -1.470 },
    { nom: "Université UJKZ", lat: 12.382, lng: -1.503 },
    { nom: "Grand Marché", lat: 12.361, lng: -1.532 },
    { nom: "Pissy", lat: 12.340, lng: -1.560 },
  ]},
  L7: { nom: "L7 - Kamboinsin ↔ SIAO", couleur: "#0066cc", arrets: [
    { nom: "Kamboinsin", lat: 12.450, lng: -1.550 },
    { nom: "Tampouy", lat: 12.410, lng: -1.540 },
    { nom: "Université UJKZ", lat: 12.382, lng: -1.503 },
    { nom: "Ouaga 2000", lat: 12.330, lng: -1.500 },
    { nom: "SIAO", lat: 12.355, lng: -1.490 },
  ]},
  L15: { nom: "L15 - Bassinko ↔ Balkuy", couleur: "#ff8800", arrets: [
    { nom: "Bassinko", lat: 12.420, lng: -1.600 },
    { nom: "Pissy", lat: 12.340, lng: -1.560 },
    { nom: "Gare Gounghin", lat: 12.355, lng: -1.560 },
    { nom: "Université UJKZ", lat: 12.382, lng: -1.503 },
    { nom: "Balkuy", lat: 12.320, lng: -1.450 },
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

// ===== INFOS LIGNES =====
document.getElementById("lignes-info").innerHTML = Object.entries(LIGNES).map(([c, l]) =>
  `<details><summary><b>${c}</b> - ${l.nom}</summary><ul>${l.arrets.map(a => `<li>${a.nom}</li>`).join("")}</ul><small>Premier : 6h00 • Dernier : 20h00 • Ticket ~200F</small></details>`).join("");
