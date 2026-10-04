import { useState } from 'react';
import { LIGNES } from '../data.js';
import { getFavs } from '../lib.js';

export default function Lignes({ ville }) {
  const [q, setQ] = useState('');
  const [favs, setFavs] = useState(getFavs());

  const toggleFav = (code) => {
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
          {lignes.map(([c, l]) => (
            <details key={c}>
              <summary>
                <b>{c}</b> - {l.nom}{' '}
                <span className="fav" style={{ cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); toggleFav(c); }}>
                  {favs.includes(c) ? '⭐' : '☆'}
                </span>
              </summary>
              <p><small>🛣️ {l.detail || ''}</small></p>
              <ul>{l.arrets.map((a) => <li key={a.nom}>{a.nom}</li>)}</ul>
              <small>Source: sotraco.bf • Horaires et tarifs : agences SOTRACO</small>
            </details>
          ))}
          {lignes.length === 0 && <p className="hint">Aucune ligne trouvée.</p>}
        </div>
        <p className="hint">Points majeurs vérifiés OpenStreetMap, arrêts intermédiaires indicatifs.</p>
      </section>
    </div>
  );
}
