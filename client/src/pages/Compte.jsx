import { useEffect, useState } from 'react';
import { supa, saveProfil } from '../supabase.js';
import { VILLES, LIGNES } from '../data.js';
import { niveauContributeur } from '../lib.js';

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

  const detecterVille = () => {
    if (!navigator.geolocation) return alert('GPS non supporté');
    navigator.geolocation.getCurrentPosition((pos) => {
      let best = null, bestD = Infinity;
      for (const [v, info] of Object.entries(VILLES)) {
        const dLat = pos.coords.latitude - info.centre[0], dLng = pos.coords.longitude - info.centre[1];
        const d = dLat * dLat + dLng * dLng;
        if (d < bestD) { bestD = d; best = v; }
      }
      if (best) { setVille(best); setUniv(''); alert(`Ville détectée : ${best} 📍`); }
    }, () => alert('Active la localisation GPS'));
  };

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
      <Reseau />
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
            <button className="btn secondary" style={{ color: '#c11f1f' }} onClick={async () => {
              if (!confirm('Supprimer définitivement ton compte et tes données ?')) return;
              if (!confirm('Vraiment ? Cette action est irréversible.')) return;
              try {
                const t = (await supa.auth.getSession()).data.session?.access_token;
                const r = await fetch('/api/account', { method: 'DELETE', headers: { Authorization: 'Bearer ' + t } });
                if (!r.ok) throw new Error('Échec suppression');
                await supa.auth.signOut();
                localStorage.clear();
                location.reload();
              } catch (e) { alert(e.message); }
            }}>🗑️ Supprimer mon compte</button>
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
          <button className="btn secondary" onClick={detecterVille}>📍 Détecter ma ville (GPS)</button>
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
          <button className="btn secondary" onClick={async () => {
            try {
              const { data: { user } } = await supa.auth.getUser();
              if (!user) return alert('Connecte-toi (compte) d’abord');
              const { error } = await supa.from('profils').update({ demande_chauffeur: true }).eq('user_id', user.id);
              if (error) throw error;
              alert('Demande envoyée 🚍 L’admin vérifiera ton statut chauffeur.');
            } catch (e) { alert(e.message); }
          }}>🚍 Je suis chauffeur SOTRACO : demander le badge vérifié</button>
        </section>
      )}

      {session && (
        <section className="card">
          <h2>🏅 Mon niveau contributeur</h2>
          <Badge />
          <button className="btn secondary" onClick={inviter}>💌 Inviter mes amis sur KonabMap</button>
        </section>
      )}
      {session && <Historique isPremium={isPremium} goPremium={goPremium} />}
      {session && <MesNotifications />}
    </div>
  );
}

function MesNotifications() {
  const [notifs, setNotifs] = useState([]);
  const [nouvelles, setNouvelles] = useState(0);
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supa.auth.getUser();
        if (!user) return;
        const ville = localStorage.getItem('ville') || 'Ouagadougou';
        const { data } = await supa.from('notifications').select('titre,message,created_at')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .order('created_at', { ascending: false }).limit(20);
        const liste = (data || []).filter((n) => !n.ville || n.ville === ville);
        const vu = Number(localStorage.getItem('notifsVues') || 0);
        setNouvelles(liste.filter((n) => new Date(n.created_at).getTime() > vu).length);
        setNotifs(liste);
        localStorage.setItem('notifsVues', String(Date.now()));
      } catch { /* ignore */ }
    })();
  }, []);
  if (notifs.length === 0) return null;
  return (
    <section className="card">
      <h2>🔔 Mes notifications {nouvelles > 0 && <span style={{ background: '#EF2D2D', color: '#fff', borderRadius: 999, padding: '2px 10px', fontSize: 13 }}>{nouvelles} nouvelles</span>}</h2>
      {notifs.map((n, i) => (
        <div key={i} className="hist-item">
          <span><b>{n.titre}</b><br /><small>{n.message}</small></span>
          <small>{new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</small>
        </div>
      ))}
    </section>
  );
}

function Reseau() {
  const [s, setS] = useState(null);
  useEffect(() => {
    fetch('/api/stats').then((r) => r.json()).then(setS).catch(() => {});
  }, []);
  if (!s) return null;
  return (
    <section className="card">
      <h2>🇧🇫 Le réseau KonabMap</h2>
      <div className="hero-stats">
        <div className="hero-stat" style={{ background: '#eafff1', color: '#062a5e' }}>👥 {s.etudiants ?? '—'}<small>étudiants</small></div>
        <div className="hero-stat" style={{ background: '#eafff1', color: '#062a5e' }}>🚌 {s.busDirect ?? '—'}<small>bus en direct</small></div>
        <div className="hero-stat" style={{ background: '#eafff1', color: '#062a5e' }}>📋 {s.lignesHorairesExacts ?? '—'}<small>lignes à horaires exacts</small></div>
      </div>
    </section>
  );
}

function Badge() {  let nb = 0;
  try { nb = JSON.parse(localStorage.getItem('trajets') || '[]').length; } catch { /* ignore */ }
  const niv = niveauContributeur(nb);
  return <p style={{ fontSize: 18 }}>Partages : <b>{nb}</b> • Niveau <b>{niv.nom}</b></p>;
}

async function inviter() {
  const txt = '🚌 Rejoins-moi sur KonabMap : suis les bus SOTRACO en temps réel ! ';
  const url = location.origin;
  try {
    if (navigator.share) await navigator.share({ title: 'KonabMap', text: txt, url });
    else {
      await navigator.clipboard.writeText(txt + url);
      alert('Lien copié, envoie-le à tes amis 💌');
    }
  } catch { /* annulé */ }
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
