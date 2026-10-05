import { useEffect, useState } from 'react';
import { LIGNES } from '../data.js';
import { getFavs, prochainsDeparts, prochainsExacts, statutHoraire, typeJour } from '../lib.js';
import { fetchHoraires, fetchDeparts } from '../supabase.js';

export default function Lignes({ ville, onVoir, isPremium, goPremium }) {
  const [q, setQ] = useState('');
  const [favs, setFavs] = useState(getFavs());
  const [horaires, setHoraires] = useState({});
  const [departs, setDeparts] = useState({});
  const [, tick] = useState(0);

  useEffect(() => {
    fetchHoraires().then(setHoraires).catch(() => {});
    fetchDeparts(ville).then((d) => {
      const g = {};
      d.forEach((x) => { if (!g[x.ligne]) g[x.ligne] = []; g[x.ligne].push(x); });
      setDeparts(g);
    }).catch(() => {});
    const iv = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ville]);

  const toggleFav = (code) => {
    if (!favs.includes(code) && favs.length >= 3 && !isPremium) {
      alert('💎 3 favoris max en gratuit — passe Premium pour illimité (100 FCFA/30j)');
      goPremium();
      return;
    }
    const f = favs.includes(code) ? favs.filter((x) => x !== code) : [...favs, code];
    setFavs(f);
    localStorage.setItem('favs', JSON.stringify(f));
  };

  const query = q.toLowerCase();
  const lignes = Object.entries(LIGNES)
    .filter(([, l]) => (l.ville || 'Ouagadougou') === ville)
    .filter(([c, l]) => !query || (c + ' ' + l.nom + ' ' + (l.detail || '') + ' ' + l.arrets.map((a) => a.nom).join(' ')).toLowerCase().includes(query));

  return (
    <div className="page" id="page-lignes">
      <section className="card">
        <h2>🕒 Lignes & arrêts SOTRACO</h2>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Rechercher une ligne ou un arrêt..." style={{ marginBottom: 8 }} />
        <div id="lignes-info">
          {lignes.map(([c, l]) => {
            const h = horaires[c];
            const prochains = prochainsDeparts(h);
            const exacts = prochainsExacts(departs[c] || [], c);
            const aExacts = Object.keys(exacts).length > 0;
            return (
              <details key={c}>
                <summary>
                  <b>{c}</b> - {l.nom}{' '}
                  {aExacts && <span title="Horaires officiels">📋</span>}
                  <span className="fav" style={{ cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); toggleFav(c); }}>
                    {favs.includes(c) ? '⭐' : '☆'}
                  </span>
                </summary>
                <p><small>🛣️ {l.detail || ''}</small></p>
                {aExacts ? (
                  <div>
                    <p><small>📋 <b>Feuille de marche officielle</b> ({typeJour() === 'dim' ? 'dimanche & fériés' : 'lundi à samedi'})</small></p>
                    {Object.entries(exacts).map(([term, heures]) => (
                      <p key={term}><small>🚌 <b>{term}</b> : <b>{heures.join(' • ')}</b></small></p>
                    ))}
                  </div>
                ) : h ? (
                  <p>🕒 <b>{h.premier}–{h.dernier}</b> toutes les <b>{h.frequence_min} min</b> • {statutHoraire(h)}<br />
                    <small>Prochains départs : <b>{prochains.join(' • ') || '—'}</b></small></p>
                ) : (
                  <p className="hint">🕒 Horaires en cours de saisie par l'admin.</p>
                )}
                <ul>{l.arrets.map((a) => <li key={a.nom}>{a.nom}</li>)}</ul>
                <button className="btn secondary" onClick={() => onVoir(c)}>📍 Voir sur la carte</button>
                <small>Source: sotraco.bf • Tarifs : agences SOTRACO</small>
              </details>
            );
          })}
          {lignes.length === 0 && <p className="hint">Aucune ligne trouvée.</p>}
        </div>
        <p className="hint">Points majeurs vérifiés OpenStreetMap, arrêts intermédiaires indicatifs.</p>
      </section>
    </div>
  );
}
