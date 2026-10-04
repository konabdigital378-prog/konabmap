const TABS = [
  { id: 'accueil', emoji: '🏠', label: 'Accueil' },
  { id: 'lignes', emoji: '🗺️', label: 'Lignes' },
  { id: 'trajet', emoji: '🧭', label: 'Trajet' },
  { id: 'compte', emoji: '👤', label: 'Compte' },
  { id: 'admin', emoji: '🛡️', label: 'Admin', admin: true },
];

export default function BottomNav({ page, go, isAdmin }) {
  return (
    <nav id="nav">
      {TABS.filter((t) => !t.admin || isAdmin).map((t) => (
        <button key={t.id} data-page={t.id} className={page === t.id ? 'active' : ''} onClick={() => go(t.id)}>
          {t.emoji}
          <small>{t.label}</small>
        </button>
      ))}
    </nav>
  );
}
