// ===== KonabMap × Supabase =====
// 1. Crée un projet sur https://supabase.com puis colle ici URL + clé anon
//    (ou stocke-les dans localStorage: supa_url / supa_key pour tester sans toucher le code)
// 2. Exécute supabase-schema.sql dans l'éditeur SQL Supabase.
// Tant que ce n'est pas configuré, l'app continue en local + Socket.io.
const SUPABASE_URL = localStorage.getItem("supa_url") || "https://cyrkhrdjeztcjcwzsszg.supabase.co";
const SUPABASE_KEY = localStorage.getItem("supa_key") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cmtocmRqZXp0Y2pjd3pzc3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNDQ5ODcsImV4cCI6MjEwNjcyMDk4N30.rBm983A6GSWaUBFSozILGsgbZXQFCqeelyPE_EtcsiM";

window.KonabSupa = (() => {
  const configured = () => !SUPABASE_URL.includes("VOTRE-PROJET") && !!window.supabase;
  let client = null;
  function db() {
    if (!configured()) return null;
    if (!client) client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return client;
  }

  // Profil étudiant : pseudo + ville + université (lié au compte Auth)
  async function saveProfil({ pseudo, ville, universite }) {
    const c = db(); if (!c) return;
    const { data: { user } } = await c.auth.getUser();
    const { error } = await c.from("profils").upsert(
      { pseudo, ville, universite, user_id: user?.id || null, email: user?.email || null, updated_at: new Date().toISOString() },
      { onConflict: "pseudo" }
    );
    if (error) throw error;
  }

  // ===== AUTHENTIFICATION =====
  async function signUp(email, password) {
    const c = db(); if (!c) throw new Error("Supabase non configuré");
    const { data, error } = await c.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }
  async function signIn(email, password) {
    const c = db(); if (!c) throw new Error("Supabase non configuré");
    const { data, error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }
  async function signOut() {
    const c = db(); if (!c) return;
    await c.auth.signOut();
  }
  async function resetPassword(email) {
    const c = db(); if (!c) throw new Error("Supabase non configuré");
    const { error } = await c.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
    if (error) throw error;
  }
  async function getSession() {
    const c = db(); if (!c) return null;
    const { data } = await c.auth.getSession();
    return data.session;
  }
  function onAuthChange(cb) {
    const c = db(); if (!c) return () => {};
    const { data } = c.auth.onAuthStateChange((_e, session) => cb(session));
    return () => data.subscription.unsubscribe();
  }

  // ===== ADMIN =====
  async function isAdmin() {
    const c = db(); if (!c) return false;
    const { data: { user } } = await c.auth.getUser();
    if (!user) return false;
    const { data, error } = await c.from("admins").select("user_id").eq("user_id", user.id).limit(1);
    return !error && data && data.length > 0;
  }
  async function stats() {
    const c = db(); if (!c) return null;
    const [profils, bus] = await Promise.all([
      c.from("profils").select("ville", { count: "exact" }),
      c.from("bus_positions").select("ville,ligne,pseudo,updated_at"),
    ]);
    const parVille = {};
    (profils.data || []).forEach(p => { parVille[p.ville] = (parVille[p.ville] || 0) + 1; });
    return { total: profils.count ?? (profils.data || []).length, parVille, bus: bus.data || [] };
  }
  async function listUsers() {
    const c = db(); if (!c) return [];
    const { data } = await c.from("profils").select("pseudo,email,ville,universite,updated_at").order("updated_at", { ascending: false }).limit(100);
    return data || [];
  }
  async function deleteUser(pseudo) {
    const c = db(); if (!c) return;
    const { error } = await c.from("profils").delete().eq("pseudo", pseudo);
    if (error) throw error;
  }
  async function broadcast(titre, message, ville) {
    const c = db(); if (!c) return;
    const { error } = await c.from("notifications").insert({ titre, message, ville: ville || null });
    if (error) throw error;
  }
  async function purgeBus(minutes) {
    const c = db(); if (!c) return 0;
    const limite = new Date(Date.now() - minutes * 60000).toISOString();
    const { data, error } = await c.from("bus_positions").delete().lt("updated_at", limite).select("pseudo");
    if (error) throw error;
    return (data || []).length;
  }
  function onBroadcast(cb) {
    const c = db(); if (!c) return () => {};
    const ch = c.channel("broadcast")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (p) => cb(p.new))
      .subscribe();
    return () => c.removeChannel(ch);
  }

  // Position bus partagée (en + du Socket.io temps réel)
  async function shareBusPosition({ pseudo, ville, ligne, affluence, lat, lng, vitesse }) {
    const c = db(); if (!c) return;
    await c.from("bus_positions").upsert(
      { pseudo, ville, ligne, affluence: affluence || 'places', lat, lng, vitesse: vitesse || 0, updated_at: new Date().toISOString() },
      { onConflict: "pseudo" }
    );
  }

  // Écoute temps réel des bus d'une ville (complète Socket.io)
  function onBusPositions(ville, cb) {
    const c = db(); if (!c) return () => {};
    const ch = c.channel("bus-" + ville)
      .on("postgres_changes", { event: "*", schema: "public", table: "bus_positions", filter: `ville=eq.${ville}` }, cb)
      .subscribe();
    return () => c.removeChannel(ch);
  }

  // Notification locale immédiate (push serveur = étape 2, voir README)
  async function notify(titre, message) {
    try {
      if (Notification.permission === "default") await Notification.requestPermission();
      if (Notification.permission === "granted") new Notification(titre, { body: message, icon: "logo.png" });
    } catch {}
    // Mémorise pour futures push serveur
    try {
      const c = db(); if (!c) return;
      await c.from("notifications").insert({ titre, message, created_at: new Date().toISOString() });
    } catch {}
  }

  // Push Web : enregistre l'abonnement navigateur pour envois serveur futurs
  // Nécessite une clé VAPID (Supabase Edge Function ou serveur). Stub prêt.
  async function registerPush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      const c = db(); if (!c || !sub) return;
      await c.from("push_subscriptions").upsert(
        { endpoint: sub.endpoint, subscription: sub.toJSON(), created_at: new Date().toISOString() },
        { onConflict: "endpoint" }
      );
    } catch {}
  }

  return { saveProfil, shareBusPosition, onBusPositions, notify, registerPush, configured,
    signUp, signIn, signOut, resetPassword, getSession, onAuthChange,
    isAdmin, stats, listUsers, deleteUser, broadcast, purgeBus, onBroadcast };
})();
