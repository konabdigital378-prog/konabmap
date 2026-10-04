import { useEffect, useState } from 'react';
import { supa, adminStats, listUsers } from '../supabase.js';

export default function Admin({ ville }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [titre, setTitre] = useState('');
  const [message, setMessage] = useState('');
  const [commandes, setCommandes] = useState([]);
  const [codes, setCodes] = useState([]);
  const [cible, setCible] = useState('tous');
  const [ciblePseudo, setCiblePseudo] = useState('');
  const [events, setEvents] = useState([]);

  const token = async () => (await supa.auth.getSession()).data.session?.access_token;
  const api = async (path, opts = {}) => {
    const t = await token();
    const r = await fetch(path, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.message || 'Erreur serveur');
    return d;
  };

  const charger = async () => {
    try {
      setStats(await adminStats());
      setUsers(await listUsers());
      const d = await api('/api/admin/orders').catch(() => ({ orders: [] }));
      setCommandes(d.orders || []);
    } catch (e) {
      setStats({ erreur: e.message || String(e) });
    }
  };

  const validerCommande = async (id, ok) => {
    if (ok && !confirm('Valider ce paiement et activer le pass ?')) return;
    if (!ok && !confirm('Rejeter ce paiement ?')) return;
    try {
      await api('/api/admin/validate', { method: 'POST', body: JSON.stringify({ orderId: id, ok }) });
      charger();
    } catch (e) { alert('Erreur : ' + (e.message || e)); }
  };

  const genererCodes = async () => {
    try {
      const d = await api('/api/admin/codes', { method: 'POST', body: JSON.stringify({ jours: 30, qty: 5 }) });
      setCodes(d.codes || []);
    } catch (e) { alert('Erreur : ' + (e.message || e)); }
  };

  useEffect(() => { charger(); }, []);

  // Alertes temps réel : nouvel inscrit + nouveau paiement
  useEffect(() => {
    const ch = supa
      .channel('admin-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profils' }, (p) => {
        setEvents((e) => [`👋 Nouvel inscrit : ${p.new.pseudo} (${p.new.ville})`, ...e].slice(0, 10));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (p) => {
        setEvents((e) => [`💰 Nouveau paiement : ${p.new.ref} — ${p.new.amount_fcfa} F`, ...e].slice(0, 10));
        charger();
      })
      .subscribe();
    return () => supa.removeChannel(ch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      let user_id = null;
      if (cible === 'perso') {
        if (!ciblePseudo.trim()) return alert('Pseudo du destinataire requis');
        const { data } = await supa.from('profils').select('user_id').eq('pseudo', ciblePseudo.trim()).limit(1);
        if (!data?.[0]?.user_id) return alert('Étudiant introuvable');
        user_id = data[0].user_id;
      }
      const { error } = await supa.from('notifications').insert({
        titre, message, user_id,
        ville: cible === 'ville' ? ville : null,
      });
      if (error) throw error;
      alert(cible === 'perso' ? `Message envoyé à ${ciblePseudo} 📩` : 'Message envoyé 📢');
      setTitre('');
      setMessage('');
      setCiblePseudo('');
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
        {events.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {events.map((e, i) => <p key={i} className="hint" style={{ color: '#009639', fontWeight: 700 }}>{e}</p>)}
          </div>
        )}
        <h3>📢 Message aux utilisateurs</h3>
        <select value={cible} onChange={(e) => setCible(e.target.value)}>
          <option value="tous">📢 Tous les utilisateurs</option>
          <option value="ville">🏙️ Ma ville ({ville})</option>
          <option value="perso">📩 Une personne (pseudo)</option>
        </select>
        {cible === 'perso' && (
          <input value={ciblePseudo} onChange={(e) => setCiblePseudo(e.target.value)} placeholder="Pseudo exact..." style={{ marginTop: 8 }} />
        )}
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
        <h3>💰 Commandes Premium ({commandes.length})</h3>
        <div>
          {commandes.map((o) => (
            <div key={o.id} className="bus-item">
              <b>{o.ref}</b> <small>{o.amount_fcfa} F • {o.pseudo || o.user_id?.slice(0, 8)}</small><br />
              <small>{o.status} • score OCR {o.ocr_confidence || 0}%</small>
              <div className="row" style={{ marginTop: 6 }}>
                <button className="btn primary" style={{ marginTop: 0 }} onClick={() => validerCommande(o.id, true)}>Valider</button>
                <button className="btn secondary" style={{ marginTop: 0 }} onClick={() => validerCommande(o.id, false)}>Rejeter</button>
              </div>
            </div>
          ))}
          {commandes.length === 0 && <p className="hint">Aucune commande en attente.</p>}
        </div>
        <h3>🎟️ Codes promo (30j)</h3>
        <button className="btn secondary" onClick={genererCodes}>Générer 5 codes</button>
        {codes.map((c) => <p key={c.code} style={{ fontFamily: 'monospace', fontWeight: 800 }}>{c.code}</p>)}
      </section>
    </div>
  );
}
