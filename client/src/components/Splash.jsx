import { useEffect } from 'react';

export default function Splash({ done }) {
  useEffect(() => {
    const t = setTimeout(done, 2300);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <div id="splash" onClick={done}>
      <div className="splash-photo"><img src="etudiant.jpg" alt="Étudiant KonabMap" /></div>
      <img src="logo.png" alt="KonabMap" id="splash-logo" />
      <div id="splash-titre">KONABMAP</div>
      <div id="splash-soustitre">Suivez vos bus en temps réel 🚌</div>
      <div id="splash-loader">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}
