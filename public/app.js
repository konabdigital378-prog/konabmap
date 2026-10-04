// ===== DONNÉES SOTRACO (source: sotraco.bf/toutes-les-lignes) =====
// Points majeurs vérifiés OpenStreetMap ; arrêts intermédiaires = position indicative le long de l'itinéraire officiel
const LIGNES = {
  L1: { nom: "L1 - Karpala ↔ Naba Koom", couleur: "#009639", detail: "Station SOGEL B - Palais de justice - Lycée Thomas Sankara - SIAO - Maison de la Femme - Av. Charles de Gaulle - Maison du peuple - Naba Koom", arrets: [
    { nom: "Karpala (SOGEL B)", lat: 12.331, lng: -1.485 },
    { nom: "SIAO", lat: 12.351, lng: -1.490 },
    { nom: "Maison de la Femme", lat: 12.365, lng: -1.495 },
    { nom: "Maison du peuple", lat: 12.372, lng: -1.524 },
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
  ]},
  L2: { nom: "L2 - Yamtenga ↔ Naba Koom", couleur: "#EF2D2D", detail: "Yamtenga (lycée communal) - Mairie de Bogodogo - Ouaga Inter - Rond-point Patte d'Oie - Mogho Naba - Grande mosquée - Naba Koom", arrets: [
    { nom: "Yamtenga", lat: 12.400, lng: -1.440 },
    { nom: "Mairie de Bogodogo", lat: 12.385, lng: -1.460 },
    { nom: "Rond-point Patte d'Oie", lat: 12.336, lng: -1.526 },
    { nom: "Mogho Naba", lat: 12.355, lng: -1.515 },
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
  ]},
  L3: { nom: "L3 - Bissighin ↔ Zone des écoles", couleur: "#0066cc", detail: "Bissighin - Rimkieta - Échangeur du Nord - Baskuy - Kolog Naba - Place de la Nation - Zone des écoles", arrets: [
    { nom: "Bissighin", lat: 12.388, lng: -1.608 },
    { nom: "Échangeur du Nord", lat: 12.388, lng: -1.557 },
    { nom: "Marché Baskuy", lat: 12.380, lng: -1.530 },
    { nom: "Place de la Nation", lat: 12.369, lng: -1.529 },
    { nom: "Terminus Zone des écoles", lat: 12.365, lng: -1.510 },
  ]},
  L4: { nom: "L4 - Sandogo ↔ Zone des écoles", couleur: "#ff8800", detail: "Sandogo - ONEA Pissy - SONABHY - Échangeur Ouest - Gounghin - Police - Place de la Nation - Zone des écoles", arrets: [
    { nom: "Sandogo", lat: 12.314, lng: -1.599 },
    { nom: "ONEA Pissy", lat: 12.338, lng: -1.564 },
    { nom: "Échangeur de l'Ouest", lat: 12.351, lng: -1.557 },
    { nom: "Place de la Nation", lat: 12.369, lng: -1.529 },
    { nom: "Terminus Zone des écoles", lat: 12.365, lng: -1.510 },
  ]},
  L5: { nom: "L5 - Bargo/Saaba ↔ Naba Koom", couleur: "#9900cc", detail: "Bargo - Saaba - Bendogo - Échangeur Est - Gare de l'Est - Yalgado - Naba Koom", arrets: [
    { nom: "Bargo (route Fada)", lat: 12.414, lng: -1.415 },
    { nom: "Marché Saaba", lat: 12.375, lng: -1.419 },
    { nom: "Échangeur de l'Est", lat: 12.375, lng: -1.460 },
    { nom: "CHU Yalgado", lat: 12.384, lng: -1.506 },
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
    { nom: "Mairie Saaba", lat: 12.377, lng: -1.421 },
    { nom: "Taabtenga", lat: 12.365, lng: -1.440 },
    { nom: "Musée National", lat: 12.380, lng: -1.472 },
    { nom: "Maison de la Femme", lat: 12.365, lng: -1.495 },
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
  ]},
  L10: { nom: "L10 - Tengandogo ↔ Zone des écoles", couleur: "#3333cc", detail: "CHU Tengandogo - Patte d'Oie - Naab Raaga - Bambata - Place Nation - Zone des écoles", arrets: [
    { nom: "CHU Tengandogo", lat: 12.290, lng: -1.500 },
    { nom: "Rond-point Patte d'Oie", lat: 12.336, lng: -1.526 },
    { nom: "Lycée Bambata", lat: 12.355, lng: -1.515 },
    { nom: "Place de la Nation", lat: 12.369, lng: -1.529 },
    { nom: "Terminus Zone des écoles", lat: 12.365, lng: -1.510 },
  ]},
  L11: { nom: "L11 - Rimkiéta ↔ Naba Koom", couleur: "#666600", detail: "Rimkiéta SODEPIS - Marché 10 Yaar - Sankaryaré - Av 56 - Naba Koom", arrets: [
    { nom: "Rimkiéta SODEPIS", lat: 12.378, lng: -1.586 },
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
    { nom: "Kamboinsin", lat: 12.462, lng: -1.555 },
    { nom: "Hôpital Paul 6", lat: 12.420, lng: -1.545 },
    { nom: "Échangeur du Nord", lat: 12.388, lng: -1.557 },
    { nom: "Larlé", lat: 12.380, lng: -1.525 },
    { nom: "Terminus Zone des écoles", lat: 12.365, lng: -1.510 },
  ]},
  L15: { nom: "L15 - Naba Koom ↔ Belle Ville", couleur: "#ff3300", detail: "Naba Koom - Stade municipal - Naab Raaga - Patte d'Oie - ASECNA - Belle ville Watinoma", arrets: [
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
    { nom: "Stade municipal", lat: 12.361, lng: -1.529 },
    { nom: "Patte d'Oie", lat: 12.336, lng: -1.526 },
    { nom: "Cité ASECNA", lat: 12.320, lng: -1.505 },
    { nom: "Belle ville Watinoma", lat: 12.300, lng: -1.520 },
  ]},
  L16: { nom: "L16 - Bassinko ↔ Naba Koom", couleur: "#3399ff", detail: "Bassinko - AZIMMO - Ave Maria - Marché bétail - Échangeur Nord - Naba Koom", arrets: [
    { nom: "Bassinko", lat: 12.411, lng: -1.657 },
    { nom: "Cité AZIMMO", lat: 12.410, lng: -1.570 },
    { nom: "Échangeur du Nord", lat: 12.388, lng: -1.557 },
    { nom: "Lycée Municipal", lat: 12.385, lng: -1.530 },
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
  ]},
  L17: { nom: "L17 - Boassa ↔ Zone des écoles", couleur: "#996633", detail: "Boassa - Sandogo - Pissy - Échangeur Ouest - Gounghin - Nation - Zone des écoles", arrets: [
    { nom: "Boassa", lat: 12.330, lng: -1.600 },
    { nom: "Sandogo", lat: 12.314, lng: -1.599 },
    { nom: "Échangeur de l'Ouest", lat: 12.351, lng: -1.557 },
    { nom: "Place de la Nation", lat: 12.369, lng: -1.529 },
    { nom: "Terminus Zone des écoles", lat: 12.365, lng: -1.510 },
  ]},
  UO1A: { nom: "Spéciale UO - Kossodo ↔ SIAO via UO", couleur: "#009639", detail: "Cité Kossodo - Somgandé - Échangeur Est - UO1 Joseph Ki-Zerbo - SIAO", arrets: [
    { nom: "Cité Univ Kossodo", lat: 12.424, lng: -1.484 },
    { nom: "Échangeur de l'Est", lat: 12.375, lng: -1.460 },
    { nom: "Université UJKZ (UO1)", lat: 12.379, lng: -1.499 },
    { nom: "Pharmacie Nemadis", lat: 12.365, lng: -1.495 },
    { nom: "SIAO", lat: 12.351, lng: -1.490 },
  ]},
  UTS1: { nom: "Spéciale UTS Axe 1 - UO1 ↔ UTS", couleur: "#FEDD00", detail: "UO1 - CHU Charles de Gaulle - Échangeur Est - Saaba - Péage - Univ Thomas Sankara", arrets: [
    { nom: "Université UJKZ (UO1)", lat: 12.379, lng: -1.499 },
    { nom: "CHU Charles de Gaulle", lat: 12.375, lng: -1.470 },
    { nom: "Carrefour Saaba", lat: 12.373, lng: -1.425 },
    { nom: "Péage", lat: 12.350, lng: -1.405 },
    { nom: "Univ Thomas Sankara", lat: 12.345, lng: -1.390 },
  ]},
  KOUBRI: { nom: "Inter - Ouaga ↔ Koubri", couleur: "#660099", detail: "Koubri - Balkuy - Trame Ouaga 2000 - Gare routière", arrets: [
    { nom: "Marché Koubri", lat: 12.187, lng: -1.401 },
    { nom: "Balkuy", lat: 12.295, lng: -1.469 },
    { nom: "Ouaga 2000", lat: 12.306, lng: -1.503 },
    { nom: "Gare routière", lat: 12.360, lng: -1.520 },
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
  ]},
  ZINIARE: { nom: "Inter - Ouaga ↔ Ziniaré", couleur: "#003366", detail: "Ziniaré - Loumbila - Kossodo - SOTRACO siège - Yalgado - Naba Koom", arrets: [
    { nom: "Ziniaré", lat: 12.583, lng: -1.233 },
    { nom: "Loumbila", lat: 12.534, lng: -1.385 },
    { nom: "Kossodo SOTRACO", lat: 12.424, lng: -1.484 },
    { nom: "CHU Yalgado", lat: 12.384, lng: -1.506 },
    { nom: "Terminus Naba Koom", lat: 12.368, lng: -1.519 },
  ]},
};

// ===== VILLES + UNIVERSITÉS (la plateforme gère le reste) =====
const VILLES = {
  "Ouagadougou": { centre: [12.3714, -1.5197], zoom: 12, universites: [
    { nom: "Université Joseph Ki-Zerbo (UJKZ)", lat: 12.379, lng: -1.499 },
    { nom: "Université Thomas Sankara (UTS)", lat: 12.345, lng: -1.390 },
    { nom: "Université Saint-Thomas d'Aquin (USTA)", lat: 12.360, lng: -1.480 },
  ]},
  "Bobo-Dioulasso": { centre: [11.178, -4.306], zoom: 12, universites: [
    { nom: "Université Nazi Boni (UNB)", lat: 11.181, lng: -4.363 },
    { nom: "INSSA Bobo", lat: 11.180, lng: -4.290 },
    { nom: "UCAO Bobo", lat: 11.175, lng: -4.295 },
  ]},
  "Koudougou": { centre: [12.248, -2.365], zoom: 13, universites: [
    { nom: "Université Norbert Zongo (UNZ)", lat: 12.236, lng: -2.399 },
  ]},
  "Ouahigouya": { centre: [13.582, -2.421], zoom: 13, universites: [
    { nom: "Université de Ouahigouya", lat: 13.580, lng: -2.420 },
    { nom: "ENEP Ouahigouya", lat: 13.585, lng: -2.425 },
  ]},
  "Dédougou": { centre: [12.466, -3.459], zoom: 13, universites: [
    { nom: "Université de Dédougou", lat: 12.466, lng: -3.459 },
    { nom: "ENEP Dédougou", lat: 12.470, lng: -3.455 },
  ]},
};
for (const l of Object.values(LIGNES)) if (!l.ville) l.ville = "Ouagadougou";

Object.assign(LIGNES, {
  B1: { ville: "Bobo-Dioulasso", nom: "B1 - Belleville ↔ Tiéfo Amoro", couleur: "#009639", detail: "Cité univ Belleville (CROUB) - Lycée national - BCEAO - CHU Souro Sanou - Tiéfo Amoro", arrets: [
    { nom: "Cité Univ Belleville (CROUB)", lat: 11.200, lng: -4.270 },
    { nom: "Lycée national", lat: 11.190, lng: -4.280 },
    { nom: "BCEAO", lat: 11.182, lng: -4.288 },
    { nom: "CHU Souro Sanou", lat: 11.180, lng: -4.290 },
    { nom: "Place Tiéfo Amoro", lat: 11.178, lng: -4.306 },
  ]},
  B5: { ville: "Bobo-Dioulasso", nom: "B5 - Farako Ba ↔ Tiéfo Amoro", couleur: "#EF2D2D", detail: "Farako Ba - Matourkou - Av Sangoulé Lamizana - Nation - Tiéfo Amoro", arrets: [
    { nom: "Farako Ba", lat: 11.150, lng: -4.310 },
    { nom: "Matourkou", lat: 11.160, lng: -4.300 },
    { nom: "Rond-point Nation", lat: 11.175, lng: -4.292 },
    { nom: "LONAB", lat: 11.177, lng: -4.291 },
    { nom: "Place Tiéfo Amoro", lat: 11.178, lng: -4.306 },
  ]},
  B8: { ville: "Bobo-Dioulasso", nom: "B8 - Djoulankolo ↔ Tiéfo Amoro", couleur: "#0066cc", detail: "Djoulankolo - ENEP - Maison culture - Nation - Tiéfo Amoro", arrets: [
    { nom: "Djoulankolo", lat: 11.195, lng: -4.310 },
    { nom: "ENEP Bobo", lat: 11.185, lng: -4.300 },
    { nom: "Maison de la culture", lat: 11.180, lng: -4.295 },
    { nom: "Place Tiéfo Amoro", lat: 11.178, lng: -4.306 },
  ]},
  BUNB: { ville: "Bobo-Dioulasso", nom: "Spéciale UNB - Total ↔ Nazi Boni Nasso", couleur: "#FEDD00", detail: "Station Total - Place femme - Amphi 22 - Cité univ - Université Nazi Boni Nasso", arrets: [
    { nom: "Station Total route Ouaga", lat: 11.185, lng: -4.275 },
    { nom: "Place de la femme", lat: 11.180, lng: -4.285 },
    { nom: "Amphi du 22", lat: 11.185, lng: -4.290 },
    { nom: "Université Nazi Boni Nasso", lat: 11.181, lng: -4.363 },
  ]},
  K1: { ville: "Koudougou", nom: "K1 - Forces vives ↔ Univ Norbert Zongo", couleur: "#009639", detail: "Cité forces vives - Gouvernorat - Mairie - Univ Norbert Zongo", arrets: [
    { nom: "Cité forces vives", lat: 12.260, lng: -2.370 },
    { nom: "Mairie Koudougou", lat: 12.253, lng: -2.362 },
    { nom: "Terminus central", lat: 12.252, lng: -2.361 },
    { nom: "Université Norbert Zongo", lat: 12.236, lng: -2.399 },
  ]},
  K3: { ville: "Koudougou", nom: "K3 - Goundi ↔ Gare routière", couleur: "#EF2D2D", detail: "Goundi - Univ Koudougou - Terminus central - Gare routière", arrets: [
    { nom: "Goundi", lat: 12.245, lng: -2.375 },
    { nom: "Université Koudougou", lat: 12.236, lng: -2.399 },
    { nom: "Terminus central", lat: 12.252, lng: -2.361 },
    { nom: "Gare routière Koudougou", lat: 12.253, lng: -2.350 },
  ]},
  OLSE1: { ville: "Ouahigouya", nom: "Spéciale Univ ↔ Nation", couleur: "#009639", detail: "Université Ouahigouya - Gare routière - Cathédrale - Place Nation", arrets: [
    { nom: "Université de Ouahigouya", lat: 13.580, lng: -2.420 },
    { nom: "Gare routière", lat: 13.581, lng: -2.421 },
    { nom: "Cathédrale", lat: 13.582, lng: -2.422 },
    { nom: "Place de la Nation", lat: 13.584, lng: -2.424 },
  ]},
  DLSE1: { ville: "Dédougou", nom: "Spéciale Univ ↔ Nazi Boni", couleur: "#009639", detail: "Université Dédougou - ONEA - Gouvernorat - Rond-point Nazi Boni", arrets: [
    { nom: "Université de Dédougou", lat: 12.466, lng: -3.459 },
    { nom: "ONEA Dédougou", lat: 12.468, lng: -3.457 },
    { nom: "Gouvernorat", lat: 12.470, lng: -3.455 },
    { nom: "Rond-point Nazi Boni", lat: 12.472, lng: -3.453 },
  ]},
});

const socket = io();
let map, userMarker, userPos = null;
let busMarkers = {};
let partageActif = false;
let watchId = null;
let alerteDejaJouee = {};

map = L.map('map').setView([12.3714, -1.5197], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
let lignesLayer = L.layerGroup().addTo(map);

function lignesDeVille(ville) {
  return Object.entries(LIGNES).filter(([_, l]) => (l.ville || "Ouagadougou") === ville);
}

// Dessiner lignes + arrêts d'une ville (+ marqueurs universités)
function afficherVille(ville) {
  lignesLayer.clearLayers();
  const v = VILLES[ville] || VILLES["Ouagadougou"];
  map.setView(v.centre, v.zoom);
  for (const [code, l] of lignesDeVille(ville)) {
    const latlngs = l.arrets.map(a => [a.lat, a.lng]);
    L.polyline(latlngs, { color: l.couleur, weight: 4, opacity: 0.7 }).addTo(lignesLayer);
    l.arrets.forEach(a => {
      L.circleMarker([a.lat, a.lng], { radius: 7, color: "#000", fillColor: "#fff", fillOpacity: 1, weight: 2 })
        .bindPopup(`<b>${a.nom}</b><br>${l.nom}`).addTo(lignesLayer);
    });
  }
  v.universites.forEach(u => {
    L.marker([u.lat, u.lng]).bindPopup(`🎓 <b>${u.nom}</b>`).addTo(lignesLayer);
  });
  document.querySelector(".subtitle").textContent = `SOTRACO • ${ville} • Pour étudiants`;
}

// Remplir selects selon ville
function lignesInfoHTML(ville, filtre) {
  const q = (filtre || "").toLowerCase();
  return lignesDeVille(ville)
    .filter(([c, l]) => !q || (c + " " + l.nom + " " + (l.detail || "") + " " + l.arrets.map(a => a.nom).join(" ")).toLowerCase().includes(q))
    .map(([c, l]) =>
      `<details><summary><b>${c}</b> - ${l.nom} <span class="fav" data-ligne="${c}" style="cursor:pointer">${estFav(c) ? "⭐" : "☆"}</span></summary><p><small>🛣️ ${l.detail || ""}</small></p><ul>${l.arrets.map(a => `<li>${a.nom}</li>`).join("")}</ul><small>Source: sotraco.bf • Horaires et tarifs : agences SOTRACO</small></details>`).join("");
}
function remplirSelectsVille(ville) {
  const selLigne = document.getElementById("ligne");
  selLigne.innerHTML = "";
  lignesDeVille(ville).forEach(([code, l]) => {
    const o = document.createElement("option"); o.value = code; o.textContent = `${code} - ${l.nom.replace(/^L\d+ - |^Spéciale |^Inter - /, "")}`;
    o.textContent = code + " - " + l.nom.split(" - ").slice(1).join(" - ");
    selLigne.appendChild(o);
  });
  const arrets = new Map();
  for (const [_, l] of lignesDeVille(ville)) for (const a of l.arrets) arrets.set(a.nom, a);
  for (const selId of ["mon-arret", "depart", "arrivee"]) {
    const sel = document.getElementById(selId);
    sel.innerHTML = "";
    arrets.forEach((a, nom) => {
      const o = document.createElement("option"); o.value = nom; o.textContent = nom; sel.appendChild(o);
    });
  }
  const v = VILLES[ville];
  if (v && v.universites.length) {
    document.getElementById("depart").value = v.universites[0].nom && [...arrets.keys()].find(n => n.includes("Universit")) || [...arrets.keys()][0];
  }
  document.getElementById("lignes-info").innerHTML = lignesInfoHTML(ville, document.getElementById("recherche-ligne")?.value);
  document.querySelectorAll("#lignes-info .fav").forEach(el => {
    el.onclick = (e) => { e.preventDefault(); toggleFav(el.dataset.ligne); };
  });
}
document.getElementById("recherche-ligne")?.addEventListener("input", (e) => {
  document.getElementById("lignes-info").innerHTML = lignesInfoHTML(getVille(), e.target.value);
  document.querySelectorAll("#lignes-info .fav").forEach(el => {
    el.onclick = (ev) => { ev.preventDefault(); toggleFav(el.dataset.ligne); };
  });
});

function getVille() { return document.getElementById("ville")?.value || localStorage.getItem("ville") || "Ouagadougou"; }
function getUniv() { return document.getElementById("universite")?.value || localStorage.getItem("universite") || ""; }

// Profil + connexion ville/université
const pseudoInput = document.getElementById("pseudo");
pseudoInput.value = localStorage.getItem("pseudo") || "";
const villeSel = document.getElementById("ville");
Object.keys(VILLES).forEach(v => {
  const o = document.createElement("option"); o.value = v; o.textContent = v; villeSel.appendChild(o);
});
villeSel.value = localStorage.getItem("ville") || "Ouagadougou";
function remplirUniversites() {
  const uSel = document.getElementById("universite");
  uSel.innerHTML = "";
  VILLES[villeSel.value].universites.forEach(u => {
    const o = document.createElement("option"); o.value = u.nom; o.textContent = "🎓 " + u.nom; uSel.appendChild(o);
  });
  if (localStorage.getItem("universite")) uSel.value = localStorage.getItem("universite");
}
remplirUniversites();
villeSel.onchange = () => {
  remplirUniversites();
  afficherVille(villeSel.value);
  remplirSelectsVille(villeSel.value);
};
document.getElementById("save-profil").onclick = async () => {
  const pseudo = pseudoInput.value.trim() || "Étudiant";
  const ville = villeSel.value, univ = document.getElementById("universite").value;
  localStorage.setItem("pseudo", pseudo);
  localStorage.setItem("ville", ville);
  localStorage.setItem("universite", univ);
  localStorage.setItem("mon-arret", document.getElementById("mon-arret").value);
  afficherVille(ville);
  remplirSelectsVille(ville);
  // Stockage Supabase (si configuré) + notification push d'accueil
  if (window.KonabSupa) {
    KonabSupa.saveProfil({ pseudo, ville, universite: univ }).catch(() => {});
    KonabSupa.notify(`Bienvenue ${pseudo} !`, `Environnement ${ville} activé 🚌`).catch(() => {});
  }
  montrerBienvenue(pseudo, ville, false);
};
afficherVille(villeSel.value);
remplirSelectsVille(villeSel.value);
if (localStorage.getItem("mon-arret")) {
  const m = localStorage.getItem("mon-arret");
  if ([...document.getElementById("mon-arret").options].some(o => o.value === m))
    document.getElementById("mon-arret").value = m;
}

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
      const payload = {
        pseudo: getPseudo(), ligne, ville: getVille(),
        affluence: document.getElementById("affluence").value,
        lat: pos.coords.latitude, lng: pos.coords.longitude,
        vitesse: pos.coords.speed || 0
      };
      socket.emit("partage-position", payload);
      if (window.KonabSupa) KonabSupa.shareBusPosition(payload).catch(() => {});
    }, err => alert("Active la localisation GPS"), { enableHighAccuracy: true, maximumAge: 2000 });
  }, () => alert("Autorise la localisation pour partager comme bus 🙏"));
};

btnStop.onclick = arreterPartage;
function arreterPartage() {
  partageActif = false;
  if (watchId) navigator.geolocation.clearWatch(watchId);
  socket.emit("stop-partage");
  btnDansBus.classList.remove("hidden"); btnStop.classList.add("hidden");
  statut.textContent = "Tu n'es pas en partage. Les autres ne te voient pas.";
  statut.style.color = "";
}

// ===== RECEVOIR BUS =====
function distanceM(lat1, lon1, lat2, lon2) {
  const R = 6371000, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ===== FAVORIS =====
function getFavs() { try { return JSON.parse(localStorage.getItem("favs") || "[]"); } catch { return []; } }
function estFav(code) { return getFavs().includes(code); }
function toggleFav(code) {
  let f = getFavs();
  f = f.includes(code) ? f.filter(x => x !== code) : [...f, code];
  localStorage.setItem("favs", JSON.stringify(f));
  remplirSelectsVille(getVille()); // rafraîchit étoiles
}
const AFFL = { places: "✅ Places libres", debout: "🟡 Debout seulement", plein: "🔴 Complet" };

socket.on("bus-list", (allBus) => {
  // La plateforme ne montre que les bus de TA ville
  const ville = getVille();
  let bus = allBus.filter(b => !b.ville || b.ville === ville);
  if (document.getElementById("favs-only")?.checked) bus = bus.filter(b => estFav(b.ligne));
  // Triés du plus proche au plus loin
  if (userPos) bus = [...bus].sort((a, b2) => distanceM(userPos.lat, userPos.lng, a.lat, a.lng) - distanceM(userPos.lat, userPos.lng, b2.lat, b2.lng));
  document.getElementById("online-count").textContent = bus.length + " bus en ligne à " + ville;
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
    const aff = AFFL[b.affluence] || "";
    const age = b.updatedAt ? Math.max(0, Math.round((Date.now() - b.updatedAt) / 1000)) : null;
    const frais = age === null ? "" : (age < 8 ? " • 🟢 en direct" : ` • maj il y a ${age}s`);
    const vit = b.vitesse > 1 ? ` • ${Math.round(b.vitesse * 3.6)} km/h` : "";
    div.innerHTML = `<b>🚌 ${b.ligne}</b> par ${b.pseudo}<br>📏 ${distTxt} • ⏱️ ${eta}${vit}${frais}<br><small>${aff}</small> <button style="float:right">Voir</button>`;
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
  const ville = getVille();
  const lignesVille = Object.entries(LIGNES).filter(([_, l]) => (l.ville || "Ouagadougou") === ville);
  const lignesDirectes = lignesVille.filter(([_, l]) =>
    l.arrets.some(a => a.nom === dep) && l.arrets.some(a => a.nom === arr));
  if (lignesDirectes.length) {
    res.innerHTML = lignesDirectes.map(([c, l]) =>
      `<p>✅ Prends <b>${c}</b> : ${l.nom}<br><small>${dep} → ${arr} direct, sans correspondance</small></p>`).join("");
  } else {
    const lDep = lignesVille.filter(([_, l]) => l.arrets.some(a => a.nom === dep));
    const lArr = lignesVille.filter(([_, l]) => l.arrets.some(a => a.nom === arr));
    const hub = getUniv() || "ton université";
    res.innerHTML = `<p>⚠️ Pas de direct à ${ville}. Options :<br>Depuis <b>${dep}</b> : ${lDep.map(([c]) => c).join(", ") || "aucune"}<br>Jusqu'à <b>${arr}</b> : ${lArr.map(([c]) => c).join(", ") || "aucune"}<br><small>Correspondance conseillée à <b>${hub}</b>.</small></p>`;
  }
};

// Note: #lignes-info est rempli par remplirSelectsVille() selon la ville.
