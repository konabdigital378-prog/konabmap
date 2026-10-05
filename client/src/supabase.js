import { createClient } from '@supabase/supabase-js';

const URL = localStorage.getItem('supa_url') || 'https://cyrkhrdjeztcjcwzsszg.supabase.co';
const KEY = localStorage.getItem('supa_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cmtocmRqZXp0Y2pjd3pzc3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNDQ5ODcsImV4cCI6MjEwNjcyMDk4N30.rBm983A6GSWaUBFSozILGsgbZXQFCqeelyPE_EtcsiM';

export const supa = createClient(URL, KEY);

export async function saveProfil({ pseudo, ville, universite }) {
  const { data: { user } } = await supa.auth.getUser();
  const { error } = await supa.from('profils').upsert(
    { pseudo, ville, universite, user_id: user?.id || null, email: user?.email || null, updated_at: new Date().toISOString() },
    { onConflict: 'pseudo' }
  );
  if (error) throw error;
}

export async function shareBusPosition({ pseudo, ville, ligne, affluence, lat, lng, vitesse }) {
  const { error } = await supa.from('bus_positions').upsert(
    { pseudo, ville, ligne, affluence: affluence || 'places', lat, lng, vitesse: vitesse || 0, updated_at: new Date().toISOString() },
    { onConflict: 'pseudo' }
  );
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supa.auth.getSession();
  return data.session;
}

export async function isAdmin() {
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return false;
  const { data, error } = await supa.from('admins').select('user_id').eq('user_id', user.id).limit(1);
  return !error && data && data.length > 0;
}

export async function adminStats() {  const [profils, bus] = await Promise.all([
    supa.from('profils').select('ville', { count: 'exact' }),
    supa.from('bus_positions').select('ville,ligne,pseudo,lat,lng,updated_at'),
  ]);
  const parVille = {};
  (profils.data || []).forEach((p) => { parVille[p.ville] = (parVille[p.ville] || 0) + 1; });
  return { total: profils.count ?? (profils.data || []).length, parVille, bus: bus.data || [] };
}

export async function listUsers() {  const { data } = await supa.from('profils').select('pseudo,email,ville,universite,updated_at').order('updated_at', { ascending: false }).limit(100);
  return data || [];
}

export async function fetchHoraires() {
  const { data } = await supa.from('horaires').select('*');
  const map = {};
  (data || []).forEach((h) => { map[h.ligne] = h; });
  return map;
}

export async function moyennesAvis() {
  const { data } = await supa.from('avis').select('ligne,note');
  const m = {};
  (data || []).forEach((a) => {
    if (!m[a.ligne]) m[a.ligne] = { total: 0, n: 0 };
    m[a.ligne].total += a.note;
    m[a.ligne].n += 1;
  });
  const res = {};
  for (const [k, v] of Object.entries(m)) res[k] = { moy: v.total / v.n, n: v.n };
  return res;
}

export async function noterLigne(ligne, note) {
  const { data: { user } } = await supa.auth.getUser();
  if (!user) throw new Error("Connecte-toi pour noter");
  const { error } = await supa.from('avis').upsert({ ligne, user_id: user.id, note });
  if (error) throw error;
}

export async function fetchDeparts(ville) {
  let q = supa.from('departs').select('*').order('heure');
  if (ville) q = q.eq('ville', ville);
  const { data } = await q.limit(2000);
  return data || [];
}

export async function demanderVille(ville, pseudo) {
  const { data: { user } } = await supa.auth.getUser();
  const { error } = await supa.from('ville_demandes').insert({
    ville: ville.trim().slice(0, 40), user_id: user?.id || null, pseudo: pseudo || null,
  });
  if (error) throw error;
}

export async function topDemandes() {
  const { data } = await supa.from('ville_demandes').select('ville');
  const m = {};
  (data || []).forEach((d) => { m[d.ville] = (m[d.ville] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

export async function notify(titre, message) {
  try {
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission === 'granted') new Notification(titre, { body: message, icon: 'logo.png' });
  } catch { /* ignore */ }
}
