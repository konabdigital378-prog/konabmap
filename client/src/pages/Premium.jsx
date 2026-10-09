import { useEffect, useState } from 'react';
import { supa } from '../supabase.js';

const STATUS = {
  pending: '🕐 En attente de paiement',
  manual_pending: '🔍 Vérification manuelle (< 24 h)',
  auto_validated: '✅ Payé — pass activé',
  validated: '✅ Payé — pass activé',
  rejected: '❌ Rejeté — contacte l’admin',
};

export function usePremium() {
  const [premium, setPremium] = useState(null);
  const refresh = async () => {
    try {
      const { data: { user } } = await supa.auth.getUser();
      if (!user) return setPremium(null);
      const { data } = await supa.from('profils').select('premium_until').eq('user_id', user.id).limit(1);
      const fin = data?.[0]?.premium_until ? new Date(data[0].premium_until) : null;
      setPremium(fin && fin > new Date() ? fin : false);
    } catch { setPremium(false); }
  };
  useEffect(() => { refresh(); }, []);
  return { premium, refreshPremium: refresh };
}

export default function Premium({ onPremium, onCompte, session }) {
  const { premium, refreshPremium } = usePremium();
  const [merchant, setMerchant] = useState('...');
  const [prix, setPrix] = useState(100);
  const [jours, setJours] = useState(30);
  const [order, setOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(false);
  const [ocrPct, setOcrPct] = useState(0);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(['', false]);

  const token = async () => (await supa.auth.getSession()).data.session?.access_token;
  const api = async (path, opts = {}) => {
    const t = await token();
    if (!t) throw new Error("Connecte-toi d'abord 🔐");
    const r = await fetch(path, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.message || 'Erreur serveur');
    return d;
  };

  const charger = async () => {
    try {
      const d = await api('/api/pay');
      setOrders(d.orders || []);
      setMerchant(d.merchant);
      setPrix(d.prix);
      setJours(d.jours);
      // Reprend la commande en cours si l'utilisateur revient
      const encours = (d.orders || []).find((o) => o.status === 'pending' || o.status === 'manual_pending');
      if (encours) setOrder(encours);
    } catch { /* non connecté */ }
  };
  useEffect(() => { charger(); }, []);

  const commander = async () => {
    if (order && (order.status === 'pending' || order.status === 'manual_pending')) {
      return setMsg([`Commande ${order.ref} déjà en cours.`, false]);
    }
    setBusy(true);
    try {
      const d = await api('/api/pay', { method: 'POST' });
      setOrder(d.order);
      setMerchant(d.merchant);
      charger();
      setMsg([`Commande ${d.order.ref} créée.`, false]);
    } catch (e) { setMsg([e.message, true]); } finally { setBusy(false); }
  };

  const compresser = (f) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const max = 1280;
      const ratio = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => reject(new Error('Image illisible'));
    img.src = URL.createObjectURL(f);
  });

  const envoyerPreuve = async (f) => {
    if (!f || !order) return;
    setBusy(true);
    setOcrPct(0);
    try {
      const uri = await compresser(f);
      setOcrPct(5);
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(['fra', 'eng'], undefined, {
        logger: (m) => { if (m.status === 'recognizing text') setOcrPct(5 + Math.round(m.progress * 90)); },
      });
      const { data } = await worker.recognize(f);
      await worker.terminate();
      setOcrPct(100);
      const d = await api('/api/pay', { method: 'PUT', body: JSON.stringify({ orderId: order.id, ocrText: data.text, imageDataUri: uri }) });
      if (d.auto) {
        setMsg([`Paiement vérifié ✅ Ton code : ${d.code} — il est aussi dans tes notifications. Entre-le ci-dessous pour activer ton pass !`, false]);
        setCode(d.code);
        setOrder(null);
        refreshPremium();
      } else {
        setMsg([`Preuve reçue (score ${d.confidence}%) — validation manuelle sous 24 h.`, false]);
        setOrder({ ...order, status: 'manual_pending' });
      }
      charger();
    } catch (e) { setMsg([e.message, true]); } finally { setBusy(false); setOcrPct(0); }
  };

  const utiliserCode = async () => {
    if (!code.trim()) return setMsg(['Entre ton code', true]);
    setBusy(true);
    try {
      const d = await api('/api/engage', { method: 'POST', body: JSON.stringify({ action: 'redeem', code }) });
      setMsg([`Code accepté ✅ Pass actif ${d.jours} jours !`, false]);
      setCode('');
      refreshPremium();
      if (onPremium) onPremium();
    } catch (e) { setMsg([e.message, true]); } finally { setBusy(false); }
  };

  return (
    <div className="page" id="page-premium">
      <div className="premium-banner">
        <img src="etudiant.jpg" alt="Étudiants KonabMap" />
        <div className="premium-badge">💎 {prix} FCFA / {jours} jours</div>
      </div>
      <section className="card" style={{ textAlign: 'center', background: 'linear-gradient(160deg,#062a5e,#009639)', color: '#fff' }}>
        <h2 style={{ color: '#fff' }}>Pass Premium</h2>
        {premium ? (
          <p>✅ Actif jusqu'au <b>{premium.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</b> ({Math.max(0, Math.ceil((premium - Date.now()) / 86400000))} jours restants)</p>
        ) : premium === false ? (
          <p>Partage ta position, alertes favoris, favoris illimités, badge ⭐</p>
        ) : (
          <p className="hint">Connecte-toi pour voir ton statut.</p>
        )}
        {!premium && (
          <button className="btn primary" style={{ background: '#FEDD00', color: '#3a2b00' }} disabled={busy} onClick={commander}>
            {busy ? '…' : `Activer pour ${prix} FCFA`}
          </button>
        )}
        {!session && (
          <p>👆 <b>Étapes :</b> 1️⃣ crée ton compte <button className="btn secondary" onClick={onCompte}>Aller à Compte</button> 2️⃣ reviens ici payer 100F</p>
        )}
      </section>

      {order && order.status !== 'manual_pending' && (
        <section className="card">
          <h2>Commande <b>{order.ref}</b> — {order.amount_fcfa} FCFA</h2>
          <ol className="hint">
            <li>1. Envoie <b>{order.amount_fcfa} FCFA</b> via Orange Money au <b>{merchant}</b></li>
            <li>2. Capture le SMS / reçu de transfert</li>
            <li>3. Uploade ici — vérification automatique</li>
          </ol>
          <label style={{ display: 'block', border: '2px dashed #00000030', borderRadius: 14, padding: 20, textAlign: 'center', cursor: 'pointer' }}>
            <input type="file" accept="image/*" style={{ display: 'none' }} disabled={busy} onChange={(e) => envoyerPreuve(e.target.files[0])} />
            <div style={{ fontSize: 32 }}>🧾</div>
            <div style={{ fontWeight: 700 }}>{busy ? `Analyse… ${ocrPct}%` : 'Uploader la capture Orange Money'}</div>
          </label>
          {busy && ocrPct > 0 && <div style={{ height: 8, background: '#eee', borderRadius: 8, overflow: 'hidden' }}><div style={{ height: '100%', background: '#009639', width: `${ocrPct}%` }} /></div>}
        </section>
      )}

      <section className="card">
        <h2>🎟️ J'ai un code</h2>
        <div className="row">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="KMAB-..." style={{ fontFamily: 'monospace' }} />
          <button className="btn secondary" style={{ width: 'auto', marginTop: 0 }} disabled={busy} onClick={utiliserCode}>Valider</button>
        </div>
        <p className="hint" style={msg[1] ? { color: 'red' } : { color: 'green' }}>{msg[0]}</p>
      </section>

      {orders.length > 0 && (
        <section className="card">
          <h2>Mes commandes</h2>
          {orders.map((o) => (
            <div key={o.id} className="hist-item">
              <span><b>{o.ref}</b> <small>{o.amount_fcfa} F</small></span>
              <small>{STATUS[o.status] || o.status}</small>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
