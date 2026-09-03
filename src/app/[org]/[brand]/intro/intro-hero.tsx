// Page Intro — hero. La comparaison qui compte pour un client n'est pas
// "export vs API" (un détail de fonctionnement interne) mais "ce que
// l'appli Instagram montre déjà" vs "ce que Community Intelligence apporte
// en plus" — c'est cette seconde comparaison qui doit porter la page.

export function IntroHero() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 820 }}>
      <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, textWrap: "pretty" }}>
        Comprendre ce que Community Intelligence peut réellement savoir
      </h1>
      <p style={{ margin: 0, fontSize: 16, color: "var(--text-muted)", lineHeight: 1.6, textWrap: "pretty" }}>
        Instagram mesure ce qui se passe. Community Intelligence construit la mémoire de votre communauté pour
        comprendre comment elle se forme, évolue et se fidélise.
      </p>
    </div>
  );
}
