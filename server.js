// Serveur SOTRACO temps réel - suivi collaboratif
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

// Healthcheck pour Render
app.get('/health', (req, res) => {
  res.json({ ok: true, bus: busActifs.size, time: new Date().toISOString() });
});

// busActifs : socketId -> { pseudo, ligne, lat, lng, vitesse, cap, updatedAt }
const busActifs = new Map();

function nettoyage() {
  const now = Date.now();
  for (const [id, b] of busActifs) {
    if (now - b.updatedAt > 30000) { // 30s sans signal = parti
      busActifs.delete(id);
    }
  }
}
setInterval(() => {
  nettoyage();
  io.emit('bus-list', [...busActifs.values()]);
}, 3000);

io.on('connection', (socket) => {
  console.log('connecté:', socket.id);
  // envoyer liste immédiate
  socket.emit('bus-list', [...busActifs.values()]);

  socket.on('partage-position', (data) => {
    // data: { pseudo, ligne, ville, lat, lng, vitesse }
    if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return;
    busActifs.set(socket.id, {
      id: socket.id,
      pseudo: String((data.pseudo || 'Étudiant')).slice(0, 30),
      ligne: String((data.ligne || 'L1')).slice(0, 10),
      ville: String((data.ville || 'Ouagadougou')).slice(0, 30),
      lat: data.lat,
      lng: data.lng,
      vitesse: data.vitesse || 0,
      updatedAt: Date.now()
    });
  });

  socket.on('stop-partage', () => {
    busActifs.delete(socket.id);
    io.emit('bus-list', [...busActifs.values()]);
  });

  socket.on('disconnect', () => {
    busActifs.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
// En local + Render on écoute, sur Vercel on exporte le handler
if (!process.env.VERCEL) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SOTRACO app en ligne sur port ${PORT}`);
  });
}

module.exports = app;
module.exports.server = server;
