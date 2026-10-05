// Serveur SOTRACO temps réel - suivi collaboratif
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const DIST = path.join(__dirname, 'client', 'dist');
app.use(express.static(fs.existsSync(DIST) ? DIST : path.join(__dirname, 'public')));
app.use(express.json({ limit: '6mb' }));

// Healthcheck pour Render
app.get('/health', (req, res) => {
  res.json({ ok: true, bus: busActifs.size, time: new Date().toISOString() });
});

// ===== ABONNEMENT PREMIUM 100 FCFA (Orange Money manuel + preuve OCR) =====
let supaAdmin = null;
try {
  const { createClient } = require('@supabase/supabase-js');
  if (process.env.SUPABASE_SERVICE_KEY) {
    supaAdmin = createClient(
      process.env.SUPABASE_URL || 'https://cyrkhrdjeztcjcwzsszg.supabase.co',
      process.env.SUPABASE_SERVICE_KEY
    );
  }
} catch (e) { console.warn('Supabase admin inactif:', e.message); }
const PRIX = 100, JOURS = 30;
const MERCHANT = process.env.MERCHANT_NUMBER || '+226 65 41 37 99';

function codeAbo() {
  return 'KMAB-' + Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
}

async function envoyerCodeAbo(userId, jours, ville, motif) {
  // Génère un code unique, le marque utilisé, et l'envoie par notification
  for (let i = 0; i < 5; i++) {
    const code = codeAbo();
    const { error } = await supaAdmin.from('promo_codes').insert({ code, jours, used_by: userId, used_at: new Date().toISOString() });
    if (!error) {
      await supaAdmin.from('notifications').insert({
        titre: 'Paiement vérifié ✅', message: `${motif} Ton code d'activation : ${code} — entre-le dans Premium pour valider ton abonnement.`,
        user_id: userId, ville: ville || null,
      });
      return code;
    }
  }
  throw new Error('Ressaie dans un instant');
}

function refCommande() {
  return 'KM-' + Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
}

async function userFrom(req) {
  if (!supaAdmin) { const e = new Error('Paiements non configurés'); e.status = 503; throw e; }
  const tok = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!tok) { const e = new Error("Connecte-toi d'abord"); e.status = 401; throw e; }
  const { data, error } = await supaAdmin.auth.getUser(tok);
  if (error || !data.user) { const e = new Error('Session invalide, reconnecte-toi'); e.status = 401; throw e; }
  const { data: adm } = await supaAdmin.from('admins').select('user_id').eq('user_id', data.user.id).limit(1);
  return { user: data.user, admin: !!(adm && adm.length) };
}

async function activerPremium(userId, jours) {
  const { data: prof } = await supaAdmin.from('profils').select('premium_until').eq('user_id', userId).limit(1);
  let base = new Date();
  const cur = prof?.[0]?.premium_until ? new Date(prof[0].premium_until) : null;
  if (cur && cur > base) base = cur;
  const fin = new Date(base.getTime() + jours * 86400000).toISOString();
  await supaAdmin.from('profils').update({ is_premium: true, premium_until: fin, updated_at: new Date().toISOString() }).eq('user_id', userId);
  return fin;
}

app.get('/api/config', (req, res) => res.json({ merchant: MERCHANT, prix: PRIX, jours: JOURS, devise: 'FCFA' }));

app.get('/api/pay', async (req, res) => {
  try {
    const { user } = await userFrom(req);
    const { data } = await supaAdmin.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    res.json({ orders: data || [], merchant: MERCHANT, prix: PRIX, jours: JOURS });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.post('/api/pay', async (req, res) => {
  try {
    const { user } = await userFrom(req);
    let order = null;
    const { data: prof } = await supaAdmin.from('profils').select('pseudo').eq('user_id', user.id).limit(1);
    const pseudo = prof?.[0]?.pseudo || null;
    for (let i = 0; i < 5 && !order; i++) {
      const { data, error } = await supaAdmin.from('orders')
        .insert({ ref: refCommande(), user_id: user.id, pseudo, amount_fcfa: PRIX, jours: JOURS, status: 'pending' })
        .select().single();
      if (!error) order = data;
    }
    if (!order) throw new Error('Réessaie dans un instant');
    res.json({ order, merchant: MERCHANT });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.put('/api/pay', async (req, res) => {
  try {
    const { user } = await userFrom(req);
    const { orderId, ocrText } = req.body || {};
    const { data: order, error: e1 } = await supaAdmin.from('orders').select('*').eq('id', orderId).eq('user_id', user.id).single();
    if (e1 || !order) throw new Error('Commande introuvable');
    const chiffres = String(ocrText || '').replace(/\D/g, '');
    const aMontant = /(^|[^0-9])100([^0-9]|$)/.test(String(ocrText || '').replace(/[\s.,]/g, ' ').replace(/[^0-9 ]/g, ''));
    const marchandChiffres = MERCHANT.replace(/\D/g, '');
    const aMarchand = marchandChiffres.length >= 8 && chiffres.includes(marchandChiffres);
    const confidence = (aMontant ? 50 : 0) + (aMarchand ? 50 : 0);
    if (confidence >= 100) {
      const code = await envoyerCodeAbo(user.id, order.jours, null, 'Preuve convaincante. ');
      await supaAdmin.from('orders').update({ status: 'auto_validated', ocr_text: String(ocrText || '').slice(0, 4000), ocr_confidence: confidence, validated_at: new Date().toISOString() }).eq('id', order.id);
      return res.json({ auto: true, confidence, code });
    }
    await supaAdmin.from('orders').update({ status: 'manual_pending', ocr_text: String(ocrText || '').slice(0, 4000), ocr_confidence: confidence }).eq('id', order.id);
    res.json({ auto: false, confidence });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.post('/api/engage', async (req, res) => {
  try {
    const { user } = await userFrom(req);
    const code = String((req.body || {}).code || '').trim().toUpperCase();
    if (!code) throw new Error('Entre ton code');
    const { data: rows } = await supaAdmin.from('promo_codes').select('*').eq('code', code).limit(1);
    const promo = rows?.[0];
    if (!promo || promo.used_by) throw new Error('Code invalide ou déjà utilisé');
    await supaAdmin.from('promo_codes').update({ used_by: user.id, used_at: new Date().toISOString() }).eq('code', code);
    const fin = await activerPremium(user.id, promo.jours);
    res.json({ jours: promo.jours, fin });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

async function requireAdmin(req) {
  const { user, admin } = await userFrom(req);
  if (!admin) { const e = new Error('Réservé aux admins'); e.status = 403; throw e; }
  return user;
}

app.get('/api/admin/orders', async (req, res) => {
  try {
    await requireAdmin(req);
    const statut = String(req.query.statut || 'attente');
    let q = supaAdmin.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
    if (statut === 'attente') q = q.in('status', ['pending', 'manual_pending']);
    else if (statut !== 'toutes') q = q.eq('status', statut);
    const { data } = await q;
    res.json({ orders: data || [] });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.post('/api/admin/validate', async (req, res) => {
  try {
    await requireAdmin(req);
    const { orderId, ok } = req.body || {};
    const { data: order } = await supaAdmin.from('orders').select('*').eq('id', orderId).single();
    if (!order) throw new Error('Commande introuvable');
    if (ok) {
      const code = await envoyerCodeAbo(order.user_id, order.jours, null, 'Paiement validé par l\'admin. ');
      await supaAdmin.from('orders').update({ status: 'validated', validated_at: new Date().toISOString() }).eq('id', order.id);
      return res.json({ ok: true, code });
    }
    await supaAdmin.from('orders').update({ status: 'rejected' }).eq('id', order.id);
    res.json({ ok: true });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.post('/api/admin/codes', async (req, res) => {
  try {
    await requireAdmin(req);
    const jours = Math.max(1, Math.min(365, Number((req.body || {}).jours) || 30));
    const qty = Math.max(1, Math.min(50, Number((req.body || {}).qty) || 5));
    const codes = [];
    for (let i = 0; i < qty; i++) {
      const code = 'KMAB-' + Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
      const { error } = await supaAdmin.from('promo_codes').insert({ code, jours });
      if (!error) codes.push({ code, jours });
    }
    res.json({ codes });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.post('/api/admin/promote', async (req, res) => {
  try {
    await requireAdmin(req);
    const pseudo = String((req.body || {}).pseudo || '').trim();
    if (!pseudo) throw new Error('Pseudo requis');
    const { data } = await supaAdmin.from('profils').select('user_id').eq('pseudo', pseudo).limit(1);
    if (!data?.[0]?.user_id) throw new Error('Étudiant introuvable');
    const { error } = await supaAdmin.from('admins').upsert({ user_id: data[0].user_id });
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

// Fallback SPA React
app.get('*', (req, res, next) => {
  const index = path.join(DIST, 'index.html');
  if (req.method === 'GET' && fs.existsSync(index)) return res.sendFile(index);
  next();
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
    // data: { pseudo, ligne, ville, affluence, destination, lat, lng, vitesse }
    if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return;
    const prev = busActifs.get(socket.id);
    busActifs.set(socket.id, {
      id: socket.id,
      pseudo: String((data.pseudo || 'Étudiant')).slice(0, 30),
      ligne: String((data.ligne || 'L1')).slice(0, 10),
      ville: String((data.ville || 'Ouagadougou')).slice(0, 30),
      affluence: ['places', 'debout', 'plein'].includes(data.affluence) ? data.affluence : 'places',
      destination: String((data.destination || '')).slice(0, 60),
      signalements: prev?.signalements || 0,
      lat: data.lat,
      lng: data.lng,
      vitesse: data.vitesse || 0,
      updatedAt: Date.now()
    });
  });

  socket.on('signalement', ({ busId }) => {
    const b = busActifs.get(busId);
    if (b) {
      b.signalements = (b.signalements || 0) + 1;
      io.emit('bus-list', [...busActifs.values()]);
    }
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
