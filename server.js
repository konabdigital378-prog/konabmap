// Serveur SOTRACO temps réel - suivi collaboratif
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(require('compression')());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const DIST = path.join(__dirname, 'client', 'dist');
app.use(express.static(fs.existsSync(DIST) ? DIST : path.join(__dirname, 'public')));
app.use(express.json({ limit: '6mb' }));

// Anti-abus API : 100 req / 15 min par IP, plus strict sur les codes
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }));
app.use('/api/engage', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false }));

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

app.get('/api/config', (req, res) => res.json({ merchant: MERCHANT, prix: PRIX, jours: JOURS, devise: 'FCFA', vapidPublic: process.env.VAPID_PUBLIC || null }));

// Statistiques publiques nationales (aucune donnée personnelle)
app.get('/api/stats', async (req, res) => {
  try {
    if (!supaAdmin) return res.json({ busDirect: busActifs.size });
    const [{ count: etudiants }, { count: votes }, { data: lignes }] = await Promise.all([
      supaAdmin.from('profils').select('pseudo', { count: 'exact', head: true }),
      supaAdmin.from('ville_demandes').select('id', { count: 'exact', head: true }),
      supaAdmin.from('departs').select('ligne'),
    ]);
    const lignesExactes = new Set((lignes || []).map((d) => d.ligne)).size;
    res.json({ busDirect: busActifs.size, etudiants: etudiants ?? 0, votesVilles: votes ?? 0, lignesHorairesExacts: lignesExactes });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Purge auto des positions de +30 min en base (toutes les 10 min)
setInterval(async () => {
  try {
    if (!supaAdmin) return;
    const limite = new Date(Date.now() - 30 * 60000).toISOString();
    await supaAdmin.from('bus_positions').delete().lt('updated_at', limite);
  } catch { /* ignore */ }
}, 10 * 60000);

// Rappels de départs : push à (heure - avance) pour chaque rappel actif, 1 fois/jour
setInterval(async () => {
  try {
    if (!supaAdmin || !webpush) return;
    const now = new Date();
    const cur = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const jour = now.toISOString().slice(0, 10);
    const { data: rappels } = await supaAdmin.from('rappels').select('*').eq('actif', true).limit(2000);
    for (const r of rappels || []) {
      const [a, b] = String(r.heure).split(':').map(Number);
      const depart = a * 60 + b - (r.avance_min || 10);
      const alerte = `${String(Math.floor(((depart + 1440) % 1440) / 60)).padStart(2, '0')}:${String(((depart % 60) + 60) % 60).padStart(2, '0')}`;
      if (alerte !== cur) continue;
      if (r.dernier_envoi && String(r.dernier_envoi).slice(0, 10) === jour) continue;
      await supaAdmin.from('rappels').update({ dernier_envoi: new Date().toISOString() }).eq('id', r.id);
      const { data: subs } = await supaAdmin.from('push_subscriptions').select('subscription').eq('user_id', r.user_id).limit(10);
      const titre = `🚌 ${r.ligne} dans ${r.avance_min || 10} min`;
      const message = `Départ ${r.heure} depuis ${r.terminus} (${r.ville}). Prépare-toi !`;
      await Promise.all((subs || []).map((s) =>
        webpush.sendNotification(s.subscription, JSON.stringify({ titre, message })).catch(() => {})
      ));
    }
  } catch { /* ignore */ }
}, 60000);

app.get('/api/pay', async (req, res) => {
  try {
    const { user } = await userFrom(req);
    const { data } = await supaAdmin.from('orders').select('id,ref,amount_fcfa,jours,status,ocr_confidence,created_at,validated_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
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
    const { orderId, ocrText, imageDataUri } = req.body || {};
    const { data: order, error: e1 } = await supaAdmin.from('orders').select('id,user_id,jours').eq('id', orderId).eq('user_id', user.id).single();
    if (e1 || !order) throw new Error('Commande introuvable');
    const chiffres = String(ocrText || '').replace(/\D/g, '');
    const aMontant = /(^|[^0-9])100([^0-9]|$)/.test(String(ocrText || '').replace(/[\s.,]/g, ' ').replace(/[^0-9 ]/g, ''));
    const marchandChiffres = MERCHANT.replace(/\D/g, '');
    const aMarchand = marchandChiffres.length >= 8 && chiffres.includes(marchandChiffres);
    const confidence = (aMontant ? 50 : 0) + (aMarchand ? 50 : 0);
    const patch = { ocr_text: String(ocrText || '').slice(0, 4000), ocr_confidence: confidence };
    if (typeof imageDataUri === 'string' && imageDataUri.startsWith('data:image/') && imageDataUri.length < 4000000) {
      patch.image_data = imageDataUri;
    }
    if (confidence >= 100) {
      const code = await envoyerCodeAbo(user.id, order.jours, null, 'Preuve convaincante. ');
      patch.status = 'auto_validated';
      patch.validated_at = new Date().toISOString();
      await supaAdmin.from('orders').update(patch).eq('id', order.id);
      return res.json({ auto: true, confidence, code });
    }
    patch.status = 'manual_pending';
    await supaAdmin.from('orders').update(patch).eq('id', order.id);
    res.json({ auto: false, confidence });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.get('/api/admin/order-image/:id', async (req, res) => {
  try {
    await requireAdmin(req);
    const { data } = await supaAdmin.from('orders').select('image_data').eq('id', req.params.id).single();
    if (!data?.image_data) throw new Error('Aucune image pour cette commande');
    res.json({ image: data.image_data });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.post('/api/engage', async (req, res) => {
  try {
    const { user } = await userFrom(req);
    const code = String((req.body || {}).code || '').trim().toUpperCase();
    if (!code) throw new Error('Entre ton code');
    const { data: rows } = await supaAdmin.from('promo_codes').select('*').eq('code', code).limit(1);
    const promo = rows?.[0];
    if (!promo) throw new Error('Code invalide');
    if (promo.consomme_le) throw new Error('Code déjà utilisé');
    if (promo.used_by && promo.used_by !== user.id) throw new Error('Code déjà attribué à un autre compte');
    await supaAdmin.from('promo_codes').update({ used_by: user.id, used_at: promo.used_at || new Date().toISOString(), consomme_le: new Date().toISOString() }).eq('code', code);
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
    let q = supaAdmin.from('orders').select('id,ref,user_id,pseudo,amount_fcfa,jours,status,ocr_text,ocr_confidence,created_at,validated_at').order('created_at', { ascending: false }).limit(50);
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

app.post('/api/admin/verifier-chauffeur', async (req, res) => {
  try {
    await requireAdmin(req);
    const pseudo = String((req.body || {}).pseudo || '').trim();
    if (!pseudo) throw new Error('Pseudo requis');
    const { error } = await supaAdmin.from('profils').update({ chauffeur_verifie: true, demande_chauffeur: false }).eq('pseudo', pseudo);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

// ===== PUSH WEB (VAPID) =====
let webpush = null;
try {
  webpush = require('web-push');
  if (process.env.VAPID_PUBLIC && process.env.VAPID_PRIVATE) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:contact@konabmap.bf', process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);
  } else webpush = null;
} catch { webpush = null; }

app.post('/api/push/subscribe', async (req, res) => {
  try {
    const { user } = await userFrom(req);
    const { subscription, ville, pseudo } = req.body || {};
    if (!subscription?.endpoint) throw new Error('Abonnement invalide');
    const { error } = await supaAdmin.from('push_subscriptions').upsert({
      endpoint: subscription.endpoint, subscription, user_id: user.id,
      pseudo: pseudo || null, ville: ville || null, created_at: new Date().toISOString(),
    });
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.post('/api/push/send', async (req, res) => {
  try {
    await requireAdmin(req);
    if (!webpush) throw new Error('Push non configuré (clés VAPID)');
    const { titre, message, ville, user_id } = req.body || {};
    if (!titre || !message) throw new Error('Titre + message requis');
    let q = supaAdmin.from('push_subscriptions').select('endpoint,subscription,user_id,ville');
    if (user_id) q = q.eq('user_id', user_id);
    else if (ville) q = q.eq('ville', ville);
    const { data } = await q.limit(2000);
    let envoyes = 0, expirés = [];
    await Promise.all((data || []).map(async (s) => {
      try {
        await webpush.sendNotification(s.subscription, JSON.stringify({ titre, message }));
        envoyes++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) expirés.push(s.endpoint);
      }
    }));
    if (expirés.length > 0) await supaAdmin.from('push_subscriptions').delete().in('endpoint', expirés);
    res.json({ ok: true, envoyes, cibles: (data || []).length });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

// Suppression de compte (données + Auth)
app.delete('/api/account', async (req, res) => {
  try {
    if (!supaAdmin) throw new Error('Service indisponible');
    const { user } = await userFrom(req);
    await supaAdmin.from('push_subscriptions').delete().eq('user_id', user.id);
    await supaAdmin.from('bus_positions').delete().eq('pseudo', (await supaAdmin.from('profils').select('pseudo').eq('user_id', user.id).limit(1)).data?.[0]?.pseudo || '__aucun__');
    await supaAdmin.from('ville_demandes').delete().eq('user_id', user.id);
    await supaAdmin.from('profils').delete().eq('user_id', user.id);
    await supaAdmin.auth.admin.deleteUser(user.id);
    res.json({ ok: true });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

// Fallback SPA React
app.use('/api/', (req, res) => res.status(404).json({ message: 'Introuvable' }));
app.get('*', (req, res, next) => {
  const index = path.join(DIST, 'index.html');
  if (req.method === 'GET' && fs.existsSync(index)) return res.sendFile(index);
  next();
});

// busActifs : socketId -> { pseudo, ligne, ... }
const busActifs = new Map();
// Cache badge chauffeur (pseudo -> bool), 5 min
const cacheChauffeurs = new Map();
const cacheT = {};

function nettoyage() {
  const now = Date.now();
  for (const [id, b] of busActifs) {
    if (now - b.updatedAt > 30000) { // 30s sans signal = parti
      busActifs.delete(id);
    }
  }
}
// Bus diffusés (abus masqués : 5+ signalements)
function listeBus() {
  return [...busActifs.values()].filter((b) => (b.signalements || 0) < 5);
}

setInterval(() => {
  nettoyage();
  io.emit('bus-list', listeBus());
}, 3000);

io.on('connection', (socket) => {
  console.log('connecté:', socket.id);
  // envoyer liste immédiate
  socket.emit('bus-list', listeBus());

  socket.on('partage-position', (data) => {
    // data: { pseudo, ligne, ville, affluence, destination, lat, lng, vitesse }
    if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return;
    if (Math.abs(data.lat) > 90 || Math.abs(data.lng) > 180) return;
    const now = Date.now();
    if (now - (socket.data.dernierPartage || 0) < 1500) return; // anti-flood
    socket.data.dernierPartage = now;
    const prev = busActifs.get(socket.id);
    const pseudo = String((data.pseudo || 'Étudiant')).slice(0, 30);
    busActifs.set(socket.id, {
      id: socket.id,
      pseudo,
      ligne: String((data.ligne || 'L1')).slice(0, 10),
      ville: String((data.ville || 'Ouagadougou')).slice(0, 30),
      affluence: ['places', 'debout', 'plein'].includes(data.affluence) ? data.affluence : 'places',
      destination: String((data.destination || '')).slice(0, 60),
      note: String((data.note || '')).slice(0, 80),
      signalements: prev?.signalements || 0,
      merci: prev?.merci || 0,
      chauffeur: prev?.chauffeur ?? null,
      chauffeur_self: data.chauffeur_self === true,
      lat: data.lat,
      lng: data.lng,
      vitesse: data.vitesse || 0,
      updatedAt: Date.now()
    });
    // Badge chauffeur vérifié (vérifié en base, cache 5 min)
    const cache = cacheChauffeurs.get(pseudo);
    if (cache === undefined || Date.now() - (cacheT[pseudo] || 0) > 300000) {
      if (supaAdmin) supaAdmin.from('profils').select('chauffeur_verifie').eq('pseudo', pseudo).limit(1)
        .then(({ data }) => {
          const v = !!data?.[0]?.chauffeur_verifie;
          cacheChauffeurs.set(pseudo, v);
          cacheT[pseudo] = Date.now();
          const b = busActifs.get(socket.id);
          if (b) b.chauffeur = v;
        }).catch(() => {});
      else cacheChauffeurs.set(pseudo, false);
    } else {
      const b = busActifs.get(socket.id);
      if (b) b.chauffeur = cache;
    }
  });

  socket.on('signalement', ({ busId }) => {
    const now = Date.now();
    socket.data.signals = (socket.data.signals || []).filter((t) => now - t < 60000);
    if (socket.data.signals.length >= 5) return; // max 5 signalements/min
    socket.data.signals.push(now);
    const b = busActifs.get(busId);
    if (b) {
      b.signalements = (b.signalements || 0) + 1;
      io.emit('bus-list', listeBus());
    }
  });

  socket.on('remerciement', ({ busId }) => {
    const now = Date.now();
    socket.data.mercis = (socket.data.mercis || []).filter((t) => now - t < 60000);
    if (socket.data.mercis.length >= 5) return; // max 5 mercis/min
    socket.data.mercis.push(now);
    const b = busActifs.get(busId);
    if (b) {
      b.merci = (b.merci || 0) + 1;
      io.emit('bus-list', listeBus());
    }
  });

  socket.on('stop-partage', () => {
    busActifs.delete(socket.id);
    io.emit('bus-list', listeBus());
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

