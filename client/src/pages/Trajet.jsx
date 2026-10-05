import { useState } from 'react';
import { LIGNES } from '../data.js';
import { dureeTrajet } from '../lib.js';

export default function Trajet({ ville, onVoir }) {
  const lignesVille = Object.entries(LIGNES).filter(([, l]) => (l.ville || 'Ouagadougou') === ville);
  const arrets = [...new Set(lignesVille.flatMap(([, l]) => l.arrets.map((a) => a.nom)))];
  const univ = arrets.find((n) => n.includes('Universit')) || arrets[0];
  const [dep, setDep] = useState(univ);
  const [arr, setArr] = useState(arrets[1] || arrets[0]);
  const [res, setRes] = useState(null);
  const [arretQ, setArretQ] = useState(arrets[0]);

  const chercher = () => {
    const directes = lignesVille.filter(([, l]) => l.arrets.some((a) => a.nom === dep) && l.arrets.some((a) => a.nom === arr));
    if (directes.length > 0) {
      setRes({ directes });
    } else {
      const lDep = lignesVille.filter(([, l]) => l.arrets.some((a) => a.nom === dep));
      const lArr = lignesVille.filter(([, l]) => l.arrets.some((a) => a.nom === arr));
      // Correspondances à 1 transfert : arrêt commun entre une ligne de départ et une d'arrivée
      const correspondances = [];
      for (const [c1, l1] of lDep) {
        for (const [c2, l2] of lArr) {
          if (c1 === c2) continue;
          const hub = l1.arrets.map((a) => a.nom).find((n) => l2.arrets.some((a) => a.nom === n));
          if (hub) correspondances.push({ c1, c2, hub });
          if (correspondances.length >= 3) break;
        }
        if (correspondances.length >= 3) break;
      }
      setRes({ lDep: lDep.map(([c]) => c), lArr: lArr.map(([c]) => c), correspondances });
    }
  };

  return (
    <div className="page" id="page-trajet">
      <section className="card">
        <h2>🧭 Quel bus prendre ?</h2>
        <label>Départ</label>
        <select value={dep} onChange={(e) => setDep(e.target.value)}>
          {arrets.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <label>Arrivée</label>
        <select value={arr} onChange={(e) => setArr(e.target.value)}>
          {arrets.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <button className="btn primary" onClick={chercher}>Chercher</button>
        <div id="resultat-itineraire">          {res && res.directes && res.directes.map(([c, l]) => {
            const duree = dureeTrajet(l, dep, arr);
            return (
              <p key={c}>✅ Prends <b>{c}</b> : {l.nom}<br /><small>{dep} → {arr} direct, sans correspondance{duree ? ` • ${duree} de trajet` : ''}</small><br /><button className="btn secondary" onClick={() => onVoir(c)}>📍 Voir sur la carte</button></p>
            );
          })}
          {res && !res.directes && (
            <p>⚠️ Pas de direct à {ville}. Options :<br />Depuis <b>{dep}</b> : {res.lDep.join(', ') || 'aucune'}<br />Jusqu'à <b>{arr}</b> : {res.lArr.join(', ') || 'aucune'}<br /><small>Correspondance conseillée à <b>{localStorage.getItem('universite') || 'ton université'}</b>.</small></p>
          )}
          {res && !res.directes && (res.correspondances || []).map((t, i) => (
            <p key={i}>🔀 <b>{t.c1}</b> jusqu'à <b>{t.hub}</b>, puis <b>{t.c2}</b> jusqu'à {arr}<br />
              <button className="btn secondary" onClick={() => onVoir(t.c1)}>📍 Voir {t.c1}</button>
            </p>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>🚏 Quelles lignes passent par mon arrêt ?</h2>
        <select value={arretQ} onChange={(e) => setArretQ(e.target.value)}>
          {arrets.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <div className="chips" style={{ marginTop: 8 }}>
          {lignesVille.filter(([, l]) => l.arrets.some((a) => a.nom === arretQ)).map(([c]) => (
            <button key={c} className="chip" onClick={() => onVoir(c)}>🚌 {c} 📍</button>
          ))}
        </div>
        {lignesVille.filter(([, l]) => l.arrets.some((a) => a.nom === arretQ)).length === 0 && (
          <p className="hint">Aucune ligne ne passe par cet arrêt.</p>
        )}
      </section>
    </div>
  );
}
