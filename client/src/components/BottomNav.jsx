const TABS = [
  { id: 'accueil', emoji: '🏠', label: 'Accueil' },
  { id: 'lignes', emoji: '🗺️', label: 'Lignes' },
  { id: 'trajet', emoji: '🧭', label: 'Trajet' },
  { id: 'premium', emoji: '💎', label: 'Premium' },
  { id: 'aide', emoji: '❓', label: 'Aide' },
  { id: 'compte', emoji: '👤', label: 'Compte' },
  { id: 'admin', emoji: '🛡️', label: 'Admin', admin: true },
];

export default function BottomNav({ page, go, isAdmin, verrouille }) {
  const visibles = TABS.filter((t) => (!t.admin || isAdmin) && (!verrouille || ['premium', 'compte', 'aide'].includes(t.id)));
  return (
    <nav id="nav">
      {visibles.map((t) => (
        <button key={t.id} data-page={t.id} className={page === t.id ? 'active' : ''} onClick={() => go(t.id)}>
          {t.emoji}
          <small>{t.label}</small>
        </button>
      ))}
    </nav>
  );
}
