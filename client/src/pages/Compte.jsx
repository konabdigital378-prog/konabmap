import { useEffect, useState } from 'react';
import { supa, saveProfil } from '../supabase.js';
import { VILLES, LIGNES } from '../data.js';

function erreurAmicale(e, setMsg, setCooldown) {
  const m = String(e?.message || e || '');
  const sec = m.match(/after (\d+) seconds/i);
  if (sec) {
    setMsg(`Trop de tentatives ⏳ Réessaie dans ${sec[1]}s (une seule fois).`, true);
    setCooldown(60);
    return;
  }
  if (/user already registered/i.test(m)) setMsg('Compte déjà créé 👍 Clique « Se connecter ».', true);
  else if (/invalid login credentials/i.test(m)) setMsg('Email ou mot de passe incorrect ❌', true);
  else if (/email not confirmed/i.test(m)) setMsg('Vérifie tes emails et clique le lien 📧', true);
  else if (/password/i.test(m)) setMsg('Mot de passe : 6 caractères minimum.', true);
  else setMsg('Erreur : ' + m, true);
}

export default function Compte({ session, onSession, isPremium, goPremium }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState(['', false]);
  const [cooldown, setCooldown] = useState(0);
  const [pseudo, setPseudo] = useState(localStorage.getItem('pseudo') || '');
  const [ville, setVille] = useState(localStorage.getItem('ville') || 'Ouagadougou');
  const [univ, setUniv] = useState(localStorage.getItem('universite') || '');
  const [arret, setArret] = useState(localStorage.getItem('mon-arret') || '');

  useEffect(() => {
    if (cooldown <= 0) return;
    const iv = setInterval(() => setCooldown((n) => (n <= 1 ? 0 : n - 1)), 1000);
    return () => clearInterval(iv);
  }, [cooldown > 0]);

  const setMessage = (t, err) => setMsg([t, !!err]);

  const cool = (fn) => async () => {
    if (cooldown > 0) return;
    await fn();
  };

  const signup = cool(async () => {
    if (!email || pass.length < 6) return setMessage('Email + mot de passe (6 caractères min)', true);
    try {
      await supa.auth.signUp({ email, password: pass });
      setMessage("Compte créé ✅ Vérifie tes emails si demandé, puis connecte-toi.");
    } catch (e) { erreurAmicale(e, setMessage, setCooldown); }
  });

  const login = cool(async () => {
    try {
      const { error } = await supa.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      setMessage('Connecté ✅');
      onSession();
    } catch (e) { erreurAmicale(e, setMessage, setCooldown); }
  });

  const reset = async (e) => {
    e.preventDefault();
    if (!email) return setMessage("Entre ton email d'abord", true);
    try {
      const { error } = await supa.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
      if (error) throw error;
      setMessage('Email de réinitialisation envoyé ✅');
    } catch (err) { setMessage('Erreur : ' + (err.message || err), true); }
  };

  const arretsVille = [...new Set(
    Object.values(LIGNES).filter((l) => (l.ville || 'Ouagadougou') === ville).flatMap((l) => l.arrets.map((a) => a.nom))
  )];

  const sauverProfil = async () => {
    const p = pseudo.trim() || 'Étudiant';
    localStorage.setItem('pseudo', p);
    localStorage.setItem('ville', ville);
    localStorage.setItem('universite', univ);
    localStorage.setItem('mon-arret', arret);
    try {
      await saveProfil({ pseudo: p, ville, universite: univ });
    } catch (e) { console.warn('profil non sauvé:', e?.message); }
    onSession(p, ville, false);
  };

  return (
    <div className="page" id="page-compte">
      <section className="card" id="auth-card">
        <h2>🔐 Mon compte</h2>
        {!session ? (
          <div id="auth-form">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" autoComplete="email" />
            <label>Mot de passe</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            <div className="row">
              <button className="btn primary" disabled={cooldown > 0} onClick={login}>
                Se connecter{cooldown > 0 ? ` (${cooldown}s)` : ''}
              </button>
              <button className="btn secondary" disabled={cooldown > 0} onClick={signup}>Créer un compte</button>
            </div>
            <p className="hint"><a href="#" onClick={reset}>Mot de passe oublié ?</a></p>
            <p className="hint" style={msg[1] ? { color: 'red' } : { color: 'green' }}>{msg[0]}</p>
          </div>
        ) : (
          <div id="auth-ok">
            <p>✅ Connecté : <b>{session.user.email}</b></p>
            <button className="btn secondary" onClick={async () => { await supa.auth.signOut(); onSession(); }}>Se déconnecter</button>
          </div>
        )}
      </section>

      {session && (
        <section className="card" id="profil-card">
          <h2>👋 Connexion étudiant</h2>
          <label>Ton prénom / pseudo</label>
          <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Ex: Awa" />
          <label>Ta ville</label>
          <select value={ville} onChange={(e) => { setVille(e.target.value); setUniv(''); }}>
            {Object.keys(VILLES).map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <label>Ton université</label>
          <select value={univ} onChange={(e) => setUniv(e.target.value)}>
            <option value="">— Choisir —</option>
            {VILLES[ville].universites.map((u) => <option key={u.nom} value={u.nom}>🎓 {u.nom}</option>)}
          </select>
          <label>Tu es où ? (arrêt proche)</label>
          <select value={arret} onChange={(e) => setArret(e.target.value)}>
            <option value="">— Choisir —</option>
            {arretsVille.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <button className="btn primary" onClick={sauverProfil}>Se connecter</button>
          <p className="hint">La plateforme affiche ensuite uniquement les bus, lignes et arrêts de ta ville.</p>
        </section>
      )}

      {session && <Historique isPremium={isPremium} goPremium={goPremium} />}
    </div>
  );
}

function Historique({ isPremium, goPremium }) {
  const [trajets, setTrajets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('trajets') || '[]'); } catch { return []; }
  });
  if (trajets.length === 0) return null;
  const visibles = isPremium ? trajets : trajets.slice(0, 5);
  const vider = () => { localStorage.setItem('trajets', '[]'); setTrajets([]); };
  const minutes = trajets.reduce((s, t) => s + (t.dureeMin || 0), 0);
  const top = Object.entries(trajets.reduce((m, t) => { m[t.ligne] = (m[t.ligne] || 0) + 1; return m; }, {}))
    .sort((a, b) => b[1] - a[1])[0];
  return (
    <section className="card">
      <h2>📊 Mes statistiques</h2>
      <div className="hero-stats">
        <div className="hero-stat" style={{ background: '#eafff1', color: '#062a5e' }}>🚌 {trajets.length}<small>trajets partagés</small></div>
        <div className="hero-stat" style={{ background: '#eafff1', color: '#062a5e' }}>⏱️ {minutes}<small>minutes guidées</small></div>
        <div className="hero-stat" style={{ background: '#eafff1', color: '#062a5e' }}>⭐ {top ? top[0] : '—'}<small>ligne préférée</small></div>
      </div>
      <h2 style={{ marginTop: 12 }}>🧾 Mes derniers trajets partagés</h2>
      {visibles.map((t, i) => (
        <div key={i} className="hist-item">
          <span>🚌 <b>{t.ligne}</b> • {t.ville}</span>
          <small>{new Date(t.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} • {t.dureeMin} min</small>
        </div>
      ))}
      <button className="btn secondary" onClick={vider}>Effacer l'historique</button>
      {!isPremium && trajets.length > 5 && (
        <button className="btn primary" onClick={goPremium}>💎 Premium : voir tout l'historique</button>
      )}
    </section>
  );
}
