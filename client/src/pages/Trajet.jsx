import { useState } from 'react';
import { LIGNES } from '../data.js';

export default function Trajet({ ville, onVoir }) {
  const lignesVille = Object.entries(LIGNES).filter(([, l]) => (l.ville || 'Ouagadougou') === ville);
  const arrets = [...new Set(lignesVille.flatMap(([, l]) => l.arrets.map((a) => a.nom)))];
  const univ = arrets.find((n) => n.includes('Universit')) || arrets[0];
  const [dep, setDep] = useState(univ);
  const [arr, setArr] = useState(arrets[1] || arrets[0]);
  const [res, setRes] = useState(null);

  const chercher = () => {
    const directes = lignesVille.filter(([, l]) => l.arrets.some((a) => a.nom === dep) && l.arrets.some((a) => a.nom === arr));
    if (directes.length > 0) {
      setRes({ directes });
    } else {
      setRes({
        lDep: lignesVille.filter(([, l]) => l.arrets.some((a) => a.nom === dep)).map(([c]) => c),
        lArr: lignesVille.filter(([, l]) => l.arrets.some((a) => a.nom === arr)).map(([c]) => c),
      });
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
        <div id="resultat-itineraire">
          {res && res.directes && res.directes.map(([c, l]) => (
            <p key={c}>✅ Prends <b>{c}</b> : {l.nom}<br /><small>{dep} → {arr} direct, sans correspondance</small><br /><button className="btn secondary" onClick={() => onVoir(c)}>📍 Voir sur la carte</button></p>
          ))}
          {res && !res.directes && (
            <p>⚠️ Pas de direct à {ville}. Options :<br />Depuis <b>{dep}</b> : {res.lDep.join(', ') || 'aucune'}<br />Jusqu'à <b>{arr}</b> : {res.lArr.join(', ') || 'aucune'}<br /><small>Correspondance conseillée à <b>{localStorage.getItem('universite') || 'ton université'}</b>.</small></p>
          )}
        </div>
      </section>
    </div>
  );
}
