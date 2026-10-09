const QA = [
  {
    q: "Comment voir où est mon bus ?",
    a: "Prends un abonnement (100 FCFA/30j, page Premium), choisis ta ville et ton université (page Compte), puis regarde la carte d'accueil : les bus partagés apparaissent en direct avec leur ligne, la distance et le temps estimé.",
  },
  {
    q: "Comment partager ma position quand je suis dans le bus ?",
    a: "Page Accueil : choisis ta ligne, indique les places libres et ta destination, puis touche « Je suis DANS le bus ». Ta position est envoyée toutes les quelques secondes, même à l'arrêt. N'oublie pas « Arrêter » en descendant !",
  },
  {
    q: "Pourquoi je ne vois aucun bus ?",
    a: "Vérifie 3 choses : 1) ton abonnement est actif (page Premium), 2) ta ville est la bonne (page Compte), 3) un étudiant partage actuellement dans ta ville. Sans partageur, la carte montre les horaires théoriques.",
  },
  {
    q: "Comment payer les 100 FCFA ?",
    a: "Page Premium : touche « Activer », envoie 100F par Orange Money au numéro affiché, puis uploade la capture du reçu. Vérification automatique immédiate, sinon l'admin valide sous 24h et t'envoie un code d'activation par notification.",
  },
  {
    q: "J'ai un code, où l'entrer ?",
    a: "Page Premium, section « J'ai un code » : entre-le (ex : KMAB-XXXXXX) et ton pass de 30 jours s'active aussitôt.",
  },
  {
    q: "Comment recevoir une alerte avant mon bus ?",
    a: "Page Accueil, section « Mes rappels de départ » : choisis ligne, terminus et heure. Tu es notifié avant chaque départ, même app fermée (notifications push). Les alertes de proximité (bus à moins de 800m) sont dans « Bus autour de moi ».",
  },
  {
    q: "L'app ne me localise pas, que faire ?",
    a: "Page Compte, section « État du service » : touche « Tester » pour le GPS. Autorise la localisation dans ton navigateur/téléphone. Sans GPS, l'app utilise le centre de ta ville.",
  },
  {
    q: "Comment installer l'app sur mon téléphone ?",
    a: "Android (Chrome) : menu ⋮ → « Ajouter à l'écran d'accueil » → Installer. iPhone (Safari) : Partager → « Sur l'écran d'accueil ». Un bouton « Installer l'app » apparaît aussi automatiquement.",
  },
];

export default function Aide() {
  return (
    <div className="page" id="page-aide">
      <section className="card">
        <h2>❓ Aide & mode d'emploi</h2>
        <p className="hint">Tout savoir pour utiliser KonabMap comme un pro 🚌</p>
        {QA.map((x, i) => (
          <details key={i}>
            <summary><b>{x.q}</b></summary>
            <p><small>{x.a}</small></p>
          </details>
        ))}
      </section>
      <section className="card">
        <h2>📞 Contacter l'admin</h2>
        <p className="hint">Problème de paiement, de compte ou suggestion ? L'admin lit tous les messages envoyés via la page Compte → signale ton pseudo et ta ville.</p>
      </section>
    </div>
  );
}
