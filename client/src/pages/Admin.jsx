import { useEffect, useState } from 'react';
import { supa, adminStats, listUsers } from '../supabase.js';

export default function Admin({ ville }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [titre, setTitre] = useState('');
  const [message, setMessage] = useState('');

  const charger = async () => {
    try {
      setStats(await adminStats());
      setUsers(await listUsers());
    } catch (e) {
      setStats({ erreur: e.message || String(e) });
    }
  };

  useEffect(() => { charger(); }, []);

  const supprimer = async (pseudo) => {
    if (!confirm(`Supprimer ${pseudo} ?`)) return;
    try {
      const { error } = await supa.from('profils').delete().eq('pseudo', pseudo);
      if (error) throw error;
      charger();
    } catch (e) { alert('Erreur : ' + (e.message || e)); }
  };

  const envoyer = async () => {
    if (!titre.trim() || !message.trim()) return alert('Titre + message requis');
    try {
      const { error } = await supa.from('notifications').insert({ titre, message, ville });
      if (error) throw error;
      alert('Message envoyé 📢');
      setTitre('');
      setMessage('');
    } catch (e) { alert('Erreur : ' + (e.message || e)); }
  };

  const purger = async () => {
    try {
      const limite = new Date(Date.now() - 10 * 60000).toISOString();
      const { data, error } = await supa.from('bus_positions').delete().lt('updated_at', limite).select('pseudo');
      if (error) throw error;
      alert(`${(data || []).length} position(s) supprimée(s) 🧹`);
    } catch (e) { alert('Erreur : ' + (e.message || e)); }
  };

  return (
    <div className="page" id="page-admin">
      <section className="card" id="admin-panel" style={{ border: '3px solid #660099' }}>
        <h2>🛡️ Panel Admin</h2>
        <div id="admin-stats">
          {!stats && <p className="hint">Chargement...</p>}
          {stats?.erreur && <p className="hint">Erreur: {stats.erreur}</p>}
          {stats && !stats.erreur && (
            <>
              <p>👥 <b>{stats.total}</b> étudiants inscrits<br /><small>{Object.entries(stats.parVille).map(([v, n]) => `${v}: ${n}`).join(' • ') || '—'}</small></p>
              <p>🚌 <b>{stats.bus.length}</b> positions bus en base<br /><small>{stats.bus.slice(0, 8).map((b) => `${b.ligne} (${b.ville}) par ${b.pseudo}`).join(' • ') || 'aucune'}</small></p>
            </>
          )}
        </div>
        <button className="btn secondary" onClick={charger}>🔄 Actualiser</button>
        <h3>📢 Message à tous</h3>
        <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre (ex: Grève ligne L1)" />
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message..." />
        <button className="btn primary" onClick={envoyer}>Envoyer</button>
        <h3>👥 Étudiants ({users.length})</h3>
        <div id="admin-users">
          {users.map((u) => (
            <div key={u.pseudo} className="bus-item">
              <b>{u.pseudo}</b> <small>{u.email || ''}</small><br />
              <small>{u.ville || ''} • {u.universite || ''}</small>
              <button style={{ float: 'right' }} onClick={() => supprimer(u.pseudo)}>Suppr</button>
            </div>
          ))}
          {users.length === 0 && <p className="hint">Aucun inscrit.</p>}
        </div>
        <h3>🧹 Nettoyage positions</h3>
        <button className="btn secondary" onClick={purger}>Supprimer positions de +10 min</button>
      </section>
    </div>
  );
}
