import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import Splash from './components/Splash.jsx';
import BottomNav from './components/BottomNav.jsx';
import Accueil from './pages/Accueil.jsx';
const Lignes = lazy(() => import('./pages/Lignes.jsx'));
const Trajet = lazy(() => import('./pages/Trajet.jsx'));
const Compte = lazy(() => import('./pages/Compte.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const Premium = lazy(() => import('./pages/Premium.jsx'));
import { socket } from './socket.js';
import { supa, getSession, isAdmin, notify } from './supabase.js';

export default function App() {
  const [splash, setSplash] = useState(true);
  const [page, setPage] = useState('accueil');
  const [session, setSession] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
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
  const [suiviId, setSuiviId] = useState('');
  const sessionRef = useRef(null);
  sessionRef.current = session;

  // Lien de suivi partagé (?bus=<id>)
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('bus');
    if (id) {
      setSuiviId(id);
      setPage('accueil');
      history.replaceState(null, '', location.pathname);
    }
  }, []);
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
    if (s) {
      setAdmin(await isAdmin());
      try {
        const { data } = await supa.from('profils').select('premium_until').eq('user_id', s.user.id).limit(1);
        const fin = data?.[0]?.premium_until ? new Date(data[0].premium_until) : null;
        setIsPremium(!!(fin && fin > new Date()));
      } catch { setIsPremium(false); }
    } else {
      setAdmin(false);
      setIsPremium(false);
    }
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

  // Abonnement push Web (notifications même app fermée)
  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const cfg = await fetch('/api/config').then((r) => r.json());
        if (!cfg.vapidPublic || !('serviceWorker' in navigator)) return;
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          const key = Uint8Array.from(atob(cfg.vapidPublic.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
          sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
        }
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON(), ville: localStorage.getItem('ville'), pseudo: localStorage.getItem('pseudo') }),
        });
      } catch { /* push optionnel */ }
    })();
  }, [session]);

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

  // Broadcast : perso (mon user_id), ma ville, ou collectif
  useEffect(() => {
    const ch = supa
      .channel('broadcast')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (p) => {
        const n = p.new;
        const pourMoi = !n.user_id || (sessionRef.current && n.user_id === sessionRef.current.user.id);
        const maVille = !n.ville || n.ville === (localStorage.getItem('ville') || 'Ouagadougou');
        if (pourMoi && maVille) {
          setBanner(`📢 ${n.titre || 'Info'} : ${n.message || ''}`);
          setTimeout(() => setBanner(''), 25000);
        }
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

  const goPremium = () => {
    setPage('premium');
    window.scrollTo({ top: 0 });
  };

  const busVille = busAll.filter((b) => !b.ville || b.ville === profil.ville);

  // Abonnement obligatoire : sans pass actif (et non admin), seul Premium/Compte accessibles
  const profilComplet = !!localStorage.getItem('universite');
  const bloque = !!session && profilComplet && !isPremium && !admin;
  const pageAffichee = bloque && page !== 'compte' ? 'premium' : page;

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
      {bloque && <div id="alerte">💎 Abonnement requis (100 FCFA/30j) pour utiliser les services — active ton pass ci-dessous 👇</div>}
      {bienvenue && (
        <div id="bienvenue"><img src="logo.png" alt="" /><span>{bienvenue}</span></div>
      )}

      <main>
        <Suspense fallback={<section className="card"><p className="hint">Chargement…</p></section>}>
        {pageAffichee === 'accueil' && <Accueil ville={profil.ville} userPos={userPos} bus={busVille} isPremium={isPremium} goPremium={goPremium} suiviId={suiviId} clearSuivi={() => setSuiviId('')} go={(p) => { setPage(p); window.scrollTo({ top: 0 }); }} focusLigne={focusLigne} clearFocus={() => setFocusLigne('')} />}
        {pageAffichee === 'lignes' && <Lignes ville={profil.ville} onVoir={voirLigne} isPremium={isPremium} goPremium={goPremium} />}
        {pageAffichee === 'trajet' && <Trajet ville={profil.ville} onVoir={voirLigne} />}
        {pageAffichee === 'compte' && <Compte session={session} onSession={refreshSession} isPremium={isPremium} goPremium={goPremium} />}
        {pageAffichee === 'premium' && <Premium />}
        </Suspense>
        {pageAffichee === 'admin' && (admin ? <Admin ville={profil.ville} /> : (
          <div className="page"><section className="card"><p className="hint">🔒 Réservé aux administrateurs.</p></section></div>
        ))}
      </main>

      <footer>Fait pour les étudiants du Burkina 🇧🇫 • Données collaboratives : la position vient des étudiants dans les bus</footer>

      {installEvt && (
        <button className="btn primary" id="btn-install" style={{ position: 'fixed', bottom: 84, right: 16, width: 'auto', zIndex: 2000 }} onClick={installer}>
          📲 Installer l'app
        </button>
      )}

      <BottomNav page={pageAffichee} go={(p) => { setPage(p); window.scrollTo({ top: 0 }); }} isAdmin={admin} verrouille={bloque} />
    </>
  );
}
