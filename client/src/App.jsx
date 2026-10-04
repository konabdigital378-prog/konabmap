import { useCallback, useEffect, useState } from 'react';
import Splash from './components/Splash.jsx';
import BottomNav from './components/BottomNav.jsx';
import Accueil from './pages/Accueil.jsx';
import Lignes from './pages/Lignes.jsx';
import Trajet from './pages/Trajet.jsx';
import Compte from './pages/Compte.jsx';
import Admin from './pages/Admin.jsx';
import { socket } from './socket.js';
import { supa, getSession, isAdmin, notify } from './supabase.js';

export default function App() {
  const [splash, setSplash] = useState(true);
  const [page, setPage] = useState('accueil');
  const [session, setSession] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [profil, setProfil] = useState(() => ({
    pseudo: localStorage.getItem('pseudo') || '',
    ville: localStorage.getItem('ville') || 'Ouagadougou',
  }));
  const [bienvenue, setBienvenue] = useState('');
  const [banner, setBanner] = useState('');
  const [busAll, setBusAll] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [installEvt, setInstallEvt] = useState(null);
  const [focusLigne, setFocusLigne] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('km-theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('km-theme', theme);
  }, [theme]);

  const montrerBienvenue = useCallback((pseudo, ville, retour) => {
    setBienvenue(retour ? `Bon retour ${pseudo} 👋 ! Voici les bus de ${ville}.` : `Bienvenue ${pseudo} 🎉 ! Voici ton environnement ${ville}.`);
    setPage('accueil');
    setTimeout(() => setBienvenue(''), 9000);
  }, []);

  const refreshSession = useCallback(async (pseudo, ville, retour = true) => {
    const s = await getSession();
    setSession(s);
    if (s) setAdmin(await isAdmin());
    else setAdmin(false);
    if (pseudo && ville) {
      setProfil({ pseudo, ville });
      montrerBienvenue(pseudo, ville, retour);
    }
  }, [montrerBienvenue]);

  // Session initiale
  useEffect(() => {
    refreshSession();
    if (Notification && Notification.permission === 'default') Notification.requestPermission();
  }, [refreshSession]);

  // Retour utilisateur connu après splash
  useEffect(() => {
    if (!splash && profil.pseudo && profil.ville && localStorage.getItem('universite')) {
      montrerBienvenue(profil.pseudo, profil.ville, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splash]);

  // Temps réel bus
  useEffect(() => {
    const h = (b) => setBusAll(b);
    socket.on('bus-list', h);
    return () => socket.off('bus-list', h);
  }, []);

  // GPS utilisateur
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setUserPos((u) => u || { lat: 12.368, lng: -1.519 }),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Broadcast admin en direct
  useEffect(() => {
    const ch = supa
      .channel('broadcast')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (p) => {
        setBanner(`📢 ${p.new.titre || 'Info'} : ${p.new.message || ''}`);
        setTimeout(() => setBanner(''), 20000);
      })
      .subscribe();
    return () => supa.removeChannel(ch);
  }, []);

  // Prompt installation PWA
  useEffect(() => {
    const h = (e) => { e.preventDefault(); setInstallEvt(e); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
    }
  }, []);

  const voirLigne = (code) => {
    setFocusLigne(code);
    setPage('accueil');
    window.scrollTo({ top: 0 });
  };

  const busVille = busAll.filter((b) => !b.ville || b.ville === profil.ville);

  const installer = async () => {
    if (!installEvt) return alert("Ouvre le menu du navigateur → Ajouter à l'écran d'accueil");
    installEvt.prompt();
    await installEvt.userChoice;
    setInstallEvt(null);
  };

  if (splash) return <Splash done={() => setSplash(false)} />;

  return (
    <>
      <header>
        <div className="logo"><img src="logo.png" alt="KonabMap" /> KonabMap</div>
        <div className="subtitle">SOTRACO • {profil.ville} • Pour étudiants</div>
        <div id="online-count">{busVille.length} bus en ligne</div>
        <button className="theme-btn" onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))} title="Mode sombre/clair">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      {banner && <div id="alerte">{banner}</div>}
      {bienvenue && (
        <div id="bienvenue"><img src="logo.png" alt="" /><span>{bienvenue}</span></div>
      )}

      <main>
        {page === 'accueil' && <Accueil ville={profil.ville} userPos={userPos} bus={busVille} go={(p) => { setPage(p); window.scrollTo({ top: 0 }); }} focusLigne={focusLigne} clearFocus={() => setFocusLigne('')} />}
        {page === 'lignes' && <Lignes ville={profil.ville} onVoir={voirLigne} />}
        {page === 'trajet' && <Trajet ville={profil.ville} onVoir={voirLigne} />}
        {page === 'compte' && <Compte session={session} onSession={refreshSession} />}
        {page === 'admin' && (admin ? <Admin ville={profil.ville} /> : (
          <div className="page"><section className="card"><p className="hint">🔒 Réservé aux administrateurs.</p></section></div>
        ))}
      </main>

      <footer>Fait pour les étudiants du Burkina 🇧🇫 • Données collaboratives : la position vient des étudiants dans les bus</footer>

      {installEvt && (
        <button className="btn primary" id="btn-install" style={{ position: 'fixed', bottom: 84, right: 16, width: 'auto', zIndex: 2000 }} onClick={installer}>
          📲 Installer l'app
        </button>
      )}

      <BottomNav page={page} go={(p) => { setPage(p); window.scrollTo({ top: 0 }); }} isAdmin={admin} />
    </>
  );
}
