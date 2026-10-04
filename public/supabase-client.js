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

  // Profil étudiant : pseudo + ville + université
  async function saveProfil({ pseudo, ville, universite }) {
    const c = db(); if (!c) return;
    await c.from("profils").upsert(
      { pseudo, ville, universite, updated_at: new Date().toISOString() },
      { onConflict: "pseudo" }
    );
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

  return { saveProfil, shareBusPosition, onBusPositions, notify, registerPush, configured };
})();
