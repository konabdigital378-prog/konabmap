import { useEffect, useState } from 'react';
import { supa, adminStats, listUsers, fetchHoraires } from '../supabase.js';
import { LIGNES } from '../data.js';

const ONGLETS = [
  { id: 'vue', emoji: '📊', label: "Vue d'ensemble" },
  { id: 'horaires', emoji: '🕒', label: 'Horaires' },
  { id: 'commandes', emoji: '💰', label: 'Commandes' },
  { id: 'users', emoji: '👥', label: 'Étudiants' },
  { id: 'messages', emoji: '📢', label: 'Messages' },
  { id: 'codes', emoji: '🎟️', label: 'Codes' },
];

export default function Admin({ ville }) {
  const [onglet, setOnglet] = useState('vue');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [titre, setTitre] = useState('');
  const [message, setMessage] = useState('');
  const [commandes, setCommandes] = useState([]);
  const [filtreCommandes, setFiltreCommandes] = useState('attente');
  const [imageVoir, setImageVoir] = useState('');
  const [codes, setCodes] = useState([]);
  const [cible, setCible] = useState('tous');
  const [ciblePseudo, setCiblePseudo] = useState('');
  const [events, setEvents] = useState([]);
  const [horaires, setHoraires] = useState({});
  const [editH, setEditH] = useState({});
  const [departs, setDeparts] = useState([]);
  const [depLigne, setDepLigne] = useState('');
  const [depTerminus, setDepTerminus] = useState('');
  const [depJours, setDepJours] = useState('sem');
  const [depHeure, setDepHeure] = useState('06:00');

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
      const d = await api('/api/admin/orders?statut=' + filtreCommandes).catch(() => ({ orders: [] }));
      setCommandes(d.orders || []);
      setHoraires(await fetchHoraires().catch(() => ({})));
      const { data: deps } = await supa.from('departs').select('*').eq('ville', ville).order('ligne').order('heure').limit(1000);
      setDeparts(deps || []);
      if (!depLigne) {
        const lv = Object.entries(LIGNES).filter(([, l]) => (l.ville || 'Ouagadougou') === ville);
        if (lv.length > 0) setDepLigne(lv[0][0]);
      }
    } catch (e) {
      setStats({ erreur: e.message || String(e) });
    }
  };

  const voirImage = async (id) => {
    try {
      const d = await api('/api/admin/order-image/' + id);
      setImageVoir(d.image);
    } catch (e) { alert(e.message || 'Aucune image'); }
  };

  const validerCommande = async (id, ok) => {    if (ok && !confirm('Valider ce paiement ? Un code sera envoyé à l’étudiant.')) return;
    if (!ok && !confirm('Rejeter ce paiement ?')) return;
    try {
      const d = await api('/api/admin/validate', { method: 'POST', body: JSON.stringify({ orderId: id, ok }) });
      alert(ok ? `Validé ✅ Code envoyé : ${d.code}` : 'Rejeté.');
      charger();
    } catch (e) { alert('Erreur : ' + (e.message || e)); }
  };

  const genererCodes = async () => {
    try {
      const d = await api('/api/admin/codes', { method: 'POST', body: JSON.stringify({ jours: 30, qty: 5 }) });
      setCodes(d.codes || []);
    } catch (e) { alert('Erreur : ' + (e.message || e)); }
  };

  const promouvoir = async (pseudo) => {
    if (!confirm(`Passer ${pseudo} admin ?`)) return;
    try {
      await api('/api/admin/promote', { method: 'POST', body: JSON.stringify({ pseudo }) });
      alert(`${pseudo} est admin 🛡️`);
    } catch (e) { alert('Erreur : ' + (e.message || e)); }
  };

  useEffect(() => { charger(); }, []);

  useEffect(() => { charger(); }, [filtreCommandes]);

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

  const sauverHoraire = async (code) => {
    const h = editH[code];
    if (!h) return;
    try {
      const { error } = await supa.from('horaires').upsert({
        ligne: code, ville: LIGNES[code]?.ville || 'Ouagadougou',
        premier: h.premier, dernier: h.dernier, frequence_min: Number(h.frequence_min) || 20,
        actif: h.actif !== false, updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      alert(`Horaire ${code} enregistré ✅`);
      setHoraires(await fetchHoraires().catch(() => ({})));
    } catch (e) { alert('Erreur : ' + (e.message || e)); }
  };

  const ajouterDepart = async () => {
    if (!depLigne || !depTerminus.trim() || !depHeure) return alert('Ligne + terminus + heure requis');
    try {
      const { error } = await supa.from('departs').insert({ ligne: depLigne, ville, terminus: depTerminus.trim(), jours: depJours, heure: depHeure });
      if (error) throw error;
      setDepTerminus('');
      charger();
    } catch (e) { alert('Erreur : ' + (e.message || e)); }
  };

  const supprimerDepart = async (id) => {
    try {
      const { error } = await supa.from('departs').delete().eq('id', id);
      if (error) throw error;
      charger();
    } catch (e) { alert('Erreur : ' + (e.message || e)); }
  };

  const lignesVille = Object.entries(LIGNES).filter(([, l]) => (l.ville || 'Ouagadougou') === ville);
  const usersFiltres = users.filter((u) => !q || (u.pseudo + ' ' + (u.email || '') + ' ' + (u.ville || '')).toLowerCase().includes(q.toLowerCase()));
  const maxVille = Math.max(1, ...Object.values(stats?.parVille || { x: 1 }));

  return (
    <div className="page" id="page-admin">
      <section className="card" id="admin-panel" style={{ border: '3px solid #660099' }}>
        <h2>🛡️ Panel Admin</h2>
        <div className="chips">
          {ONGLETS.map((t) => (
            <button key={t.id} className={'chip' + (onglet === t.id ? ' on' : '')} onClick={() => setOnglet(t.id)}>
              {t.emoji} {t.label}{t.id === 'commandes' && commandes.length > 0 ? ` (${commandes.length})` : ''}
            </button>
          ))}
        </div>

        {onglet === 'vue' && (
          <>
            <div id="admin-stats">
              {!stats && <p className="hint">Chargement...</p>}
              {stats?.erreur && <p className="hint">Erreur: {stats.erreur}</p>}
              {stats && !stats.erreur && (
                <>
                  <p>👥 <b>{stats.total}</b> étudiants inscrits</p>
                  {Object.entries(stats.parVille).map(([v, n]) => (
                    <div key={v} style={{ margin: '4px 0' }}>
                      <small>{v} — <b>{n}</b></small>
                      <div style={{ height: 8, background: '#eee', borderRadius: 8 }}>
                        <div style={{ height: '100%', width: `${Math.round((n / maxVille) * 100)}%`, background: '#009639', borderRadius: 8 }} />
                      </div>
                    </div>
                  ))}
                  <p>🚌 <b>{stats.bus.length}</b> positions bus en base<br /><small>{stats.bus.slice(0, 8).map((b) => `${b.ligne} (${b.ville}) par ${b.pseudo}`).join(' • ') || 'aucune'}</small></p>
                </>
              )}
            </div>
            <button className="btn secondary" onClick={charger}>🔄 Actualiser</button>
            {events.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <h3>🔔 En direct</h3>
                {events.map((e, i) => <p key={i} className="hint" style={{ color: '#009639', fontWeight: 700 }}>{e}</p>)}
              </div>
            )}
            <h3>🧹 Nettoyage positions</h3>
            <button className="btn secondary" onClick={purger}>Supprimer positions de +10 min</button>
          </>
        )}

        {onglet === 'horaires' && (
          <>
            <p className="hint">Définis premier départ, dernier et fréquence par ligne — l'app calcule les prochains départs exacts.</p>
            {lignesVille.map(([c, l]) => {
              const h = editH[c] || horaires[c] || { premier: '06:00', dernier: '20:00', frequence_min: 20, actif: true };
              const set = (k, v) => setEditH((e) => ({ ...e, [c]: { ...h, [k]: v } }));
              return (
                <div key={c} className="bus-item">
                  <b>{c}</b> <small>{l.nom.split(' - ').slice(1).join(' - ')}</small>
                  <div className="row" style={{ marginTop: 6 }}>
                    <input type="time" value={h.premier} onChange={(e) => set('premier', e.target.value)} aria-label="Premier" />
                    <input type="time" value={h.dernier} onChange={(e) => set('dernier', e.target.value)} aria-label="Dernier" />
                    <input type="number" min="5" max="120" value={h.frequence_min} onChange={(e) => set('frequence_min', e.target.value)} aria-label="Fréquence min" style={{ maxWidth: 80 }} />
                  </div>
                  <div className="row" style={{ marginTop: 6 }}>
                    <label style={{ margin: 0 }}><input type="checkbox" checked={h.actif !== false} onChange={(e) => set('actif', e.target.checked)} /> Active</label>
                    <button className="btn primary" style={{ marginTop: 0 }} onClick={() => sauverHoraire(c)}>Enregistrer</button>
                  </div>
                </div>
              );
            })}
            <h3>📋 Départs exacts (feuilles de marche)</h3>
            <div className="row">
              <select value={depLigne} onChange={(e) => setDepLigne(e.target.value)} aria-label="Ligne">
                {lignesVille.map(([c]) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={depJours} onChange={(e) => setDepJours(e.target.value)} aria-label="Jours" style={{ maxWidth: 130 }}>
                <option value="sem">Lun–Sam</option>
                <option value="dim">Dim/Fériés</option>
              </select>
              <input type="time" value={depHeure} onChange={(e) => setDepHeure(e.target.value)} aria-label="Heure" style={{ maxWidth: 110 }} />
            </div>
            <input value={depTerminus} onChange={(e) => setDepTerminus(e.target.value)} placeholder="Terminus (ex: UCAO)" style={{ marginTop: 8 }} />
            <button className="btn primary" onClick={ajouterDepart}>+ Ajouter ce départ</button>
            {departs.map((d) => (
              <div key={d.id} className="hist-item">
                <span><b>{d.ligne}</b> • {d.terminus} <small>({d.jours === 'dim' ? 'dim' : 'sem'})</small></span>
                <span><b>{d.heure.slice(0, 5)}</b> <button className="btn secondary" style={{ width: 'auto', marginTop: 0, padding: '4px 10px' }} onClick={() => supprimerDepart(d.id)}>✕</button></span>
              </div>
            ))}
            {departs.length === 0 && <p className="hint">Aucun départ exact saisi pour {ville}.</p>}
          </>
        )}

        {onglet === 'commandes' && (
          <>
            <div className="chips">
              {[['attente', '🕐 En attente'], ['validated', '✅ Validées'], ['auto_validated', '⚡ Auto'], ['rejected', '❌ Rejetées'], ['toutes', '📋 Toutes']].map(([v, l]) => (
                <button key={v} className={'chip' + (filtreCommandes === v ? ' on' : '')} onClick={() => setFiltreCommandes(v)}>{l}</button>
              ))}
            </div>
            <button className="btn secondary" onClick={charger}>🔄 Actualiser</button>
            {commandes.map((o) => (
              <div key={o.id} className="bus-item">
                <b>{o.ref}</b> <small>{o.amount_fcfa} F • {o.pseudo || o.user_id?.slice(0, 8)} • {new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</small><br />
                <small>{o.status} • score OCR {o.ocr_confidence || 0}%</small>
                {o.ocr_text
                  ? <details><summary>Voir la preuve OCR</summary><p className="hint">{o.ocr_text.slice(0, 500)}</p></details>
                  : <p className="hint">📷 Aucune capture envoyée par l'étudiant.</p>}
                <div className="row" style={{ marginTop: 6 }}>
                  <button className="btn secondary" style={{ marginTop: 0 }} onClick={() => voirImage(o.id)}>🖼️ Image</button>
                  <button className="btn primary" style={{ marginTop: 0 }} onClick={() => validerCommande(o.id, true)}>Valider + code</button>
                  <button className="btn secondary" style={{ marginTop: 0 }} onClick={() => validerCommande(o.id, false)}>Rejeter</button>
                </div>
                <div className="row" style={{ marginTop: 6 }}>
                  <button className="btn primary" style={{ marginTop: 0 }} onClick={() => validerCommande(o.id, true)}>Valider + code</button>
                  <button className="btn secondary" style={{ marginTop: 0 }} onClick={() => validerCommande(o.id, false)}>Rejeter</button>
                </div>
              </div>
            ))}
            {commandes.length === 0 && <p className="hint">Aucune commande en attente.</p>}
          </>
        )}

        {imageVoir && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }} onClick={() => setImageVoir('')}>
            <div style={{ maxWidth: 560, width: '100%' }} onClick={(e) => e.stopPropagation()}>
              <img src={imageVoir} alt="Preuve de paiement" style={{ width: '100%', borderRadius: 14 }} />
              <button className="btn primary" onClick={() => setImageVoir('')}>Fermer</button>
            </div>
          </div>
        )}

        {onglet === 'users' && (
          <>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Rechercher (pseudo, email, ville)..." style={{ marginBottom: 8 }} />
            <p className="hint">👥 {usersFiltres.length} étudiant(s)</p>
            {usersFiltres.map((u) => (
              <div key={u.pseudo} className="bus-item">
                <b>{u.pseudo}</b> <small>{u.email || ''}</small><br />
                <small>{u.ville || ''} • {u.universite || ''}</small>
                <div className="row" style={{ marginTop: 6 }}>
                  <button className="btn secondary" style={{ marginTop: 0 }} onClick={() => promouvoir(u.pseudo)}>🛡️ Admin</button>
                  <button className="btn secondary" style={{ marginTop: 0 }} onClick={() => supprimer(u.pseudo)}>Suppr</button>
                </div>
              </div>
            ))}
            {usersFiltres.length === 0 && <p className="hint">Aucun inscrit.</p>}
          </>
        )}

        {onglet === 'messages' && (
          <>
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
          </>
        )}

        {onglet === 'codes' && (
          <>
            <button className="btn secondary" onClick={genererCodes}>Générer 5 codes (30j)</button>
            {codes.map((c) => <p key={c.code} style={{ fontFamily: 'monospace', fontWeight: 800 }}>{c.code}</p>)}
          </>
        )}
      </section>
    </div>
  );
}
