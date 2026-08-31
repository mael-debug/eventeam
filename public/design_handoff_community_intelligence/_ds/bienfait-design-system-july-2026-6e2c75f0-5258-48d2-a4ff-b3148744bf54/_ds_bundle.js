/* @ds-bundle: {"format":4,"namespace":"BienfaitDesignSystem_6e2c75","components":[{"name":"Logo","sourcePath":"components/brand/Logo.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"}],"sourceHashes":{"components/brand/Logo.jsx":"8f2c6a39a99d","components/core/Badge.jsx":"b6406f2ef116","components/core/Button.jsx":"f2dc397ce316","components/core/Card.jsx":"8a4a78e98737","components/core/Chip.jsx":"e638697ec340","ui_kits/site-marketing/Forfaits.jsx":"4bb5cad0dc71","ui_kits/site-marketing/Hero.jsx":"2b8dc4aa1a4f","ui_kits/site-marketing/Services.jsx":"f115ed379446","ui_kits/site-marketing/SiteFooter.jsx":"8ba3bfd3e08d","ui_kits/site-marketing/SiteHeader.jsx":"19540f72a3de","ui_kits/site-marketing/doc-page.js":"371bab66f42d"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BienfaitDesignSystem_6e2c75 = window.BienfaitDesignSystem_6e2c75 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Bienfait — Logo. Wordmark typographique uniquement : « Bienfait » en Plus
 * Jakarta Sans extrabold. Pas de monogramme, pas de tuile.
 * color : "encre" · "vert" · "creme" · "blanc" · "inverse" (pour fond sombre)
 */
function Logo({
  color = "encre",
  size = 32,
  style,
  ...rest
}) {
  const couleurs = {
    encre: "var(--encre)",
    vert: "var(--bleu)",
    creme: "var(--surface-creme)",
    blanc: "#FFFFFF",
    inverse: "#FFFFFF"
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "img",
    "aria-label": "Bienfait",
    style: {
      fontFamily: "var(--font-corps)",
      fontWeight: 800,
      fontSize: size * 0.7,
      letterSpacing: "-0.03em",
      color: couleurs[color] || couleurs.encre,
      lineHeight: 1,
      ...style
    }
  }, rest), "Bienfait");
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logo.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Bienfait — Badge / tag.
 * Variantes pastel (forfait, temps, cadrage), statut (point vert), et neutre.
 */
function Badge({
  variant = "forfait",
  dot = false,
  children,
  style,
  ...rest
}) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontFamily: "var(--font-corps)",
    fontWeight: "var(--fw-medium)",
    fontSize: "0.82rem",
    lineHeight: 1,
    padding: "5px 12px",
    borderRadius: "var(--rayon-chip)"
  };
  const variants = {
    forfait: {
      background: "var(--vert-pastel)",
      color: "var(--bleu)"
    },
    cadrage: {
      background: "var(--bleu-bg)",
      color: "var(--bleu)"
    },
    temps: {
      background: "var(--pastel-jaune)",
      color: "var(--encre)"
    },
    accent: {
      background: "var(--pastel-violet)",
      color: "var(--encre)"
    },
    statut: {
      background: "var(--carte-claire)",
      color: "var(--encre)",
      border: "1px solid var(--bordure)"
    }
  };
  const showDot = dot || variant === "statut";
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      ...base,
      ...variants[variant],
      ...style
    }
  }, rest), showDot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: "7px",
      height: "7px",
      borderRadius: "50%",
      background: "var(--vert-logo)",
      flex: "none"
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Bienfait — Bouton en pilule.
 * Variantes : primaire (vert logo), encre, secondaire (contour crème), lien (souligné).
 */
function Button({
  variant = "primaire",
  size = "md",
  as = "button",
  href,
  disabled = false,
  iconLeft,
  iconRight,
  children,
  style,
  ...rest
}) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: "var(--font-corps)",
    fontWeight: "var(--fw-semibold)",
    lineHeight: 1,
    borderRadius: "var(--rayon-bouton)",
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
    opacity: disabled ? 0.5 : 1,
    transition: "transform .12s ease, box-shadow .12s ease, background .12s ease"
  };
  const sizes = {
    sm: {
      padding: "7px 14px",
      fontSize: "0.85rem"
    },
    md: {
      padding: "10px 20px",
      fontSize: "0.95rem"
    },
    lg: {
      padding: "14px 28px",
      fontSize: "1.05rem"
    }
  };
  const variants = {
    primaire: {
      background: "var(--vert-logo)",
      color: "var(--encre)"
    },
    bleu: {
      background: "var(--bleu)",
      color: "var(--text-on-bleu)"
    },
    encre: {
      background: "var(--encre)",
      color: "var(--carte-claire)"
    },
    secondaire: {
      background: "var(--carte-claire)",
      color: "var(--encre)",
      borderColor: "var(--bordure)"
    },
    lien: {
      background: "transparent",
      color: "var(--encre)",
      textDecoration: "underline",
      padding: "4px 6px",
      borderRadius: "6px"
    }
  };
  const Tag = href ? "a" : as;
  const composed = {
    ...base,
    ...(variant === "lien" ? {} : sizes[size]),
    ...variants[variant],
    ...style
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    "aria-disabled": disabled || undefined,
    style: composed,
    onMouseEnter: e => {
      if (!disabled) e.currentTarget.style.transform = "translateY(-1px)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = "translateY(0)";
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Bienfait — Carte.
 * Variantes : claire (défaut), encre (contraste fort), pastel (bento ludique).
 * Sous-parties optionnelles : num (01/02), title, children (corps).
 */
function Card({
  variant = "claire",
  num,
  title,
  interactive = true,
  tilt = 0,
  children,
  style,
  ...rest
}) {
  const variants = {
    claire: {
      background: "var(--carte-claire)",
      color: "var(--encre)",
      border: "1px solid var(--bordure-carte)"
    },
    encre: {
      background: "var(--encre)",
      color: "var(--surface-creme)",
      border: "1px solid var(--encre)"
    },
    bleu: {
      background: "var(--bleu)",
      color: "#FFFFFF",
      border: "1px solid var(--bleu)"
    },
    vert: {
      background: "var(--vert-pastel)",
      color: "var(--bleu)",
      border: "1px solid transparent"
    },
    pastel: {
      background: "var(--pastel-violet)",
      color: "var(--encre)",
      border: "1px solid transparent"
    }
  };
  const base = {
    borderRadius: "var(--rayon-carte)",
    padding: "24px",
    boxShadow: "var(--ombre-carte)",
    transform: tilt ? `rotate(${tilt}deg)` : undefined,
    transition: "box-shadow .18s ease, transform .18s ease",
    ...variants[variant],
    ...style
  };
  const muted = variant === "encre" || variant === "bleu" ? "rgba(255,255,255,0.62)" : "rgba(28,26,22,0.55)";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: base,
    onMouseEnter: e => {
      if (!interactive) return;
      e.currentTarget.style.boxShadow = "var(--ombre-carte-hover)";
      e.currentTarget.style.transform = tilt ? `rotate(${tilt}deg) translateY(-2px)` : "translateY(-2px)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = "var(--ombre-carte)";
      e.currentTarget.style.transform = tilt ? `rotate(${tilt}deg)` : "translateY(0)";
    }
  }, rest), num && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-corps)",
      fontWeight: "var(--fw-semibold)",
      fontSize: "0.85rem",
      color: muted
    }
  }, num), title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-corps)",
      fontWeight: "var(--fw-bold)",
      fontSize: "1.25rem",
      margin: "4px 0 8px"
    }
  }, title), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Bienfait — Chip d'intégration / logo partenaire.
 * Fond crème, contour, coins pilule. Sert à lister outils, intégrations, tech.
 */
function Chip({
  icon,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      fontFamily: "var(--font-corps)",
      fontWeight: "var(--fw-medium)",
      fontSize: "0.88rem",
      lineHeight: 1,
      padding: "8px 14px",
      borderRadius: "var(--rayon-chip)",
      background: "var(--carte-claire)",
      border: "1px solid var(--bordure)",
      color: "var(--encre)",
      ...style
    }
  }, rest), icon, children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site-marketing/Forfaits.jsx
try { (() => {
// Bienfait — Forfaits
function Forfaits({
  onNav
}) {
  const {
    Card,
    Button,
    Badge
  } = window.BienfaitDesignSystem_6e2c75;
  const plans = [{
    nom: "Essentiel",
    prix: "4 900 €",
    desc: "Cadrage + un premier cas d'usage.",
    feats: ["Atelier de cadrage", "1 automatisation", "Formation express"],
    variant: "claire",
    cta: "secondaire"
  }, {
    nom: "Croissance",
    prix: "9 900 €",
    desc: "Déploiement multi-cas, accompagné.",
    feats: ["Jusqu'à 4 automatisations", "1 agent copilote", "Support 3 mois"],
    variant: "encre",
    cta: "primaire",
    star: true
  }, {
    nom: "Sur-mesure",
    prix: "Sur devis",
    desc: "Programme annuel, run inclus.",
    feats: ["Périmètre illimité", "Run & améliorations", "Interlocuteur dédié"],
    variant: "claire",
    cta: "secondaire"
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--surface-creme)",
      borderTop: "1px solid var(--bordure)",
      borderBottom: "1px solid var(--bordure)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--max-contenu)",
      margin: "0 auto",
      padding: "64px 32px"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-corps)",
      fontWeight: 800,
      fontSize: "2rem",
      textAlign: "center",
      margin: "0 0 6px"
    }
  }, "Des forfaits clairs"), /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: "center",
      color: "var(--text-muted)",
      margin: "0 0 36px"
    }
  }, "Pas de facturation \xE0 la surprise. Vous savez ce que vous payez."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "16px",
      alignItems: "start"
    }
  }, plans.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.nom,
    variant: p.variant,
    interactive: false,
    style: p.star ? {
      transform: "scale(1.03)",
      boxShadow: "var(--ombre-flottante)"
    } : {}
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "10px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-corps)",
      fontWeight: 800,
      fontSize: "1.4rem"
    }
  }, p.nom), p.star && /*#__PURE__*/React.createElement(Badge, {
    variant: "forfait"
  }, "Populaire")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-corps)",
      fontWeight: 800,
      fontSize: "2.2rem",
      lineHeight: 1
    }
  }, p.prix), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "10px 0 16px",
      opacity: p.variant === "encre" ? 0.85 : 1,
      color: p.variant === "encre" ? undefined : "var(--text-muted)"
    }
  }, p.desc), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      margin: "0 0 20px",
      padding: 0,
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      fontSize: "0.95rem"
    }
  }, p.feats.map(f => /*#__PURE__*/React.createElement("li", {
    key: f,
    style: {
      display: "flex",
      gap: "8px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--vert-logo)",
      fontWeight: 700
    }
  }, "\u2713"), f))), /*#__PURE__*/React.createElement(Button, {
    variant: p.cta,
    onClick: () => onNav("contact"),
    style: {
      width: "100%"
    }
  }, "Choisir ", p.nom))))));
}
Object.assign(window, {
  Forfaits
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site-marketing/Forfaits.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site-marketing/Hero.jsx
try { (() => {
// Bienfait — Section héros
function Hero({
  onNav
}) {
  const {
    Button,
    Chip
  } = window.BienfaitDesignSystem_6e2c75;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: "var(--max-contenu)",
      margin: "0 auto",
      padding: "80px 32px 56px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-corps)",
      fontWeight: 600,
      fontSize: "0.8rem",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--bleu)"
    }
  }, "Agence de digitalisation & IA"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-corps)",
      fontWeight: 800,
      fontSize: "4rem",
      lineHeight: 1.05,
      letterSpacing: "-0.01em",
      margin: "18px auto 0",
      maxWidth: "16ch"
    }
  }, "Digitaliser vos process, ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--bleu)"
    }
  }, "avec bienfait")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "1.25rem",
      color: "var(--text-muted)",
      maxWidth: "56ch",
      margin: "22px auto 0",
      lineHeight: 1.6
    }
  }, "Nous cadrons, automatisons et d\xE9ployons vos cas d'usage IA \u2014 de l'atelier de priorisation \xE0 la mise en production, avec vos \xE9quipes."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "12px",
      justifyContent: "center",
      marginTop: "32px"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primaire",
    size: "lg",
    onClick: () => onNav("contact")
  }, "Prendre rendez-vous"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondaire",
    size: "lg",
    onClick: () => onNav("services")
  }, "D\xE9couvrir nos services")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "10px",
      justifyContent: "center",
      flexWrap: "wrap",
      marginTop: "40px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "0.85rem",
      color: "var(--text-muted)",
      alignSelf: "center",
      marginRight: "4px"
    }
  }, "Int\xE9grations\xA0:"), ["OpenAI", "Notion", "Make", "Airtable", "Slack", "HubSpot"].map(t => /*#__PURE__*/React.createElement(Chip, {
    key: t
  }, t))));
}
Object.assign(window, {
  Hero
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site-marketing/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site-marketing/Services.jsx
try { (() => {
// Bienfait — Bento des services
function Services() {
  const {
    Card,
    Badge
  } = window.BienfaitDesignSystem_6e2c75;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: "var(--max-contenu)",
      margin: "0 auto",
      padding: "56px 32px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: "24px",
      marginBottom: "28px"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-corps)",
      fontWeight: 800,
      fontSize: "2rem",
      margin: 0
    }
  }, "Un accompagnement ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--bleu)"
    }
  }, "de bout en bout")), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--text-muted)",
      maxWidth: "34ch",
      margin: 0
    }
  }, "Du diagnostic \xE0 la mise en production, sans jargon.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.3fr 1fr 1fr",
      gridTemplateRows: "auto auto",
      gap: "16px"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    variant: "encre",
    num: "01",
    title: "Cadrage IA",
    style: {
      gridRow: "span 2",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 auto",
      opacity: 0.85
    }
  }, "Nous cartographions vos process, identifions les cas d'usage \xE0 fort ROI et b\xE2tissons une feuille de route r\xE9aliste."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      marginTop: "20px"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: "temps"
  }, "Atelier 2 jours"), /*#__PURE__*/React.createElement(Badge, {
    variant: "cadrage"
  }, "Feuille de route"))), /*#__PURE__*/React.createElement(Card, {
    variant: "bleu",
    num: "02",
    title: "Automatisation"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      opacity: 0.85
    }
  }, "Workflows connect\xE9s \xE0 vos outils m\xE9tier existants.")), /*#__PURE__*/React.createElement(Card, {
    variant: "vert",
    num: "03",
    title: "Agents & copilotes"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, "Assistants sur-mesure branch\xE9s sur vos donn\xE9es.")), /*#__PURE__*/React.createElement(Card, {
    variant: "claire",
    num: "04",
    title: "Formation"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, "Mont\xE9e en comp\xE9tence des \xE9quipes, en fran\xE7ais.")), /*#__PURE__*/React.createElement(Card, {
    variant: "claire",
    num: "05",
    title: "Support & run"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: "var(--text-muted)"
    }
  }, "Suivi mensuel, am\xE9liorations continues."))));
}
Object.assign(window, {
  Services
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site-marketing/Services.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site-marketing/SiteFooter.jsx
try { (() => {
// Bienfait — Pied de page + bloc contact
function SiteFooter() {
  const {
    Button
  } = window.BienfaitDesignSystem_6e2c75;
  const col = {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  };
  const link = {
    color: "rgba(244,241,234,0.7)",
    textDecoration: "none",
    fontSize: "0.92rem",
    cursor: "pointer"
  };
  const h = {
    fontFamily: "var(--font-corps)",
    fontWeight: 600,
    fontSize: "0.8rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--vert-logo)",
    margin: 0
  };
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--encre)",
      color: "var(--surface-creme)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--max-contenu)",
      margin: "0 auto",
      padding: "72px 32px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "32px",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      paddingBottom: "48px",
      borderBottom: "1px solid rgba(244,241,234,0.14)"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-corps)",
      fontWeight: 800,
      fontSize: "2.4rem",
      margin: 0,
      maxWidth: "18ch"
    }
  }, "Parlons de votre ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--vert-logo)"
    }
  }, "prochain chantier")), /*#__PURE__*/React.createElement(Button, {
    variant: "primaire",
    size: "lg"
  }, "R\xE9server 30 min")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr",
      gap: "32px",
      paddingTop: "48px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: col
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-corps)",
      fontWeight: 800,
      fontSize: "1.5rem",
      letterSpacing: "-0.03em"
    }
  }, "Bienfait"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "rgba(244,241,234,0.6)",
      fontSize: "0.92rem",
      maxWidth: "34ch",
      margin: 0
    }
  }, "Agence de digitalisation & IA. Nous rendons l'IA utile, concr\xE8te et adopt\xE9e.")), /*#__PURE__*/React.createElement("div", {
    style: col
  }, /*#__PURE__*/React.createElement("p", {
    style: h
  }, "Services"), /*#__PURE__*/React.createElement("a", {
    style: link
  }, "Cadrage"), /*#__PURE__*/React.createElement("a", {
    style: link
  }, "Automatisation"), /*#__PURE__*/React.createElement("a", {
    style: link
  }, "Formation")), /*#__PURE__*/React.createElement("div", {
    style: col
  }, /*#__PURE__*/React.createElement("p", {
    style: h
  }, "Agence"), /*#__PURE__*/React.createElement("a", {
    style: link
  }, "R\xE9alisations"), /*#__PURE__*/React.createElement("a", {
    style: link
  }, "Blog"), /*#__PURE__*/React.createElement("a", {
    style: link
  }, "Contact")), /*#__PURE__*/React.createElement("div", {
    style: col
  }, /*#__PURE__*/React.createElement("p", {
    style: h
  }, "Suivez-nous"), /*#__PURE__*/React.createElement("a", {
    style: link
  }, "LinkedIn"), /*#__PURE__*/React.createElement("a", {
    style: link
  }, "Newsletter"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "40px",
      fontSize: "0.82rem",
      color: "rgba(244,241,234,0.45)"
    }
  }, "\xA9 2026 Bienfait \u2014 Tous droits r\xE9serv\xE9s.")));
}
Object.assign(window, {
  SiteFooter
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site-marketing/SiteFooter.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site-marketing/SiteHeader.jsx
try { (() => {
// Bienfait — En-tête du site marketing
function SiteHeader({
  onNav
}) {
  const {
    Button,
    Badge
  } = window.BienfaitDesignSystem_6e2c75;
  const link = {
    fontFamily: "var(--font-corps)",
    fontWeight: 500,
    fontSize: "0.95rem",
    color: "var(--encre)",
    textDecoration: "none",
    cursor: "pointer"
  };
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      background: "rgba(233,230,223,0.82)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--bordure)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--max-contenu)",
      margin: "0 auto",
      padding: "16px 32px",
      display: "flex",
      alignItems: "center",
      gap: "32px"
    }
  }, /*#__PURE__*/React.createElement("a", {
    onClick: () => onNav("accueil"),
    style: {
      fontFamily: "var(--font-corps)",
      fontWeight: 800,
      fontSize: "1.5rem",
      letterSpacing: "-0.03em",
      color: "var(--encre)",
      textDecoration: "none",
      cursor: "pointer"
    }
  }, "Bienfait"), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: "24px",
      marginLeft: "8px"
    }
  }, /*#__PURE__*/React.createElement("a", {
    style: link,
    onClick: () => onNav("services")
  }, "Services"), /*#__PURE__*/React.createElement("a", {
    style: link,
    onClick: () => onNav("forfaits")
  }, "Forfaits"), /*#__PURE__*/React.createElement("a", {
    style: link,
    onClick: () => onNav("cas")
  }, "R\xE9alisations"), /*#__PURE__*/React.createElement("a", {
    style: link,
    onClick: () => onNav("blog")
  }, "Blog")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: "14px"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: "statut"
  }, "Nouveaux cr\xE9neaux"), /*#__PURE__*/React.createElement(Button, {
    variant: "encre",
    size: "sm",
    onClick: () => onNav("contact")
  }, "Prendre rendez-vous"))));
}
Object.assign(window, {
  SiteHeader
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site-marketing/SiteHeader.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site-marketing/doc-page.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).
/* BEGIN USAGE */
/**
 * <doc-page> — paged-document shell for printable HTML.
 *
 * FIRST, decide how the document paginates — up front, before building:
 *
 * - FLOWING document (the default): write the whole document as one
 *   normal HTML flow inside <doc-page>; the browser's print engine
 *   splits it onto pages at export. Use for long-form documents with a
 *   single text flow: reports, memos, letters, essays.
 * - EXPLICIT pagination: a fixed set of pre-paginated pages, one
 *   <section class="page"> child per page. Use when the user asks for a
 *   specific page count, or the design implies one: a one-page resume, a
 *   two-sided flier, a poster, a certificate, a brochure — any richly
 *   laid-out document without a single text flow.
 * - If in doubt, ask the user as part of the build.
 *
 * PAGE SIZING — paper differs by country (letter vs A4), so the printed
 * sheet is not one fixed truth:
 * - FLOWING documents pin NO paper size: the print engine paginates
 *   onto the user's real paper, and the content reflows to it.
 * - EXPLICITLY PAGINATED documents print each page at a FIXED page box
 *   with overflow hidden — letter by default, size="a4" for a clearly
 *   metric user, the user's chosen paper when they export. Design each
 *   page to FILL that box, fitting letter and A4 alike without overlap.
 * - width/height pin an explicit fixed size, ONLY when the user gives
 *   one.
 * Never write your own @page rule or hard-code paper dimensions in the
 * content.
 *
 * Sizing modes (attributes):
 *   (none)                      — portrait: flowing docs use the user's
 *           paper; explicitly paginated pages use the named size box
 *           (letter unless size="a4")
 *   orientation="landscape"     — the same, landscape
 *   width / height              — explicit fixed size, ONLY when the user
 *           gives one (e.g. width="22in" height="30in" for a 22×30
 *           poster): the page IS the design's size, printed at true
 *           dimensions (or scaled onto the user's paper at print time).
 *           Any absolute CSS length: px/in/mm/cm/pt/pc.
 * The component announces the chosen mode to the host app at runtime (a
 * meta tag it injects), so the print path can inject the user's true
 * paper size.
 *
 * On screen the document renders on a desk background: a flowing
 * document as one tall scrolling sheet (Google Docs' pageless view);
 * explicitly paginated documents as one card per page.
 *
 * EXPLICIT pagination usage:
 *   <style>doc-page:not(:defined){visibility:hidden}</style>
 *   <doc-page>
 *     <section class="page" id="p1">…one page's design…</section>
 *     <section class="page" id="p2">…</section>
 *   </doc-page>
 *   <script src="doc-page.js"></script>
 * How the page box works, concretely: each .page prints as ONE full-bleed
 * sheet at a FIXED physical size — letter by default (set size="a4" for
 * a clearly metric user), the user's chosen paper when they export —
 * with overflow hidden. Nothing scrolls and nothing reflows onto a next
 * sheet: content that misses the box is CLIPPED. Design each page to
 * FILL that page box, and to fit it — letter and A4 alike — without
 * overlap. Each page is a size container; don't size anything in
 * viewport units (they track the window, not the page), and never set
 * width or height on the .page section itself (the component sizes the
 * page box; an authored height like 100% is meaningless at print and is
 * overridden). The component owns the page box, the screen card chrome,
 * and the page breaks (never add your own break-before/after). Don't mix
 * .page sections with flowing content or header/footer slots in the same
 * document.
 *
 * FLOWING usage:
 *   <style>doc-page:not(:defined){visibility:hidden}</style>
 *   <doc-page margin="0.75in">
 *     <h1>Title</h1>
 *     <p>…body…</p>
 *   </doc-page>
 *   <script src="doc-page.js"></script>
 * There is no manual page-splitting — the browser's print engine
 * paginates at export. Standard break-hygiene rules (`break-inside:
 * avoid` on figures, code blocks, images and table rows; `orphans/
 * widows: 3`) are applied so paragraphs and groups split cleanly. On
 * screen and at print, headings default to `text-wrap: balance` and
 * body text to `text-wrap: pretty`; the defaults have zero specificity,
 * so any text-wrap you declare wins.
 *
 * Other attributes:
 *   size    — letter | a4 | legal (default letter). Flowing documents:
 *           preview proportion only — it does NOT pin their printed
 *           paper (the print dialog's paper governs); leave it alone
 *           there. Explicitly paginated documents: it sets the page box
 *           the cards and the pinned @page share (the export dialog's
 *           choice overrides both at print) — set size="a4" for a
 *           clearly metric user. Scaled-fit: names the sheet the fit is
 *           computed against, same a4-for-metric-users advice.
 *   content-width / content-height — the design's own fixed dimensions
 *           (CSS lengths), for scaling a fixed-size design ONTO the
 *           named sheet: content lays out at exactly this size, and the
 *           component scales it to fit that sheet's printable area
 *           (centered horizontally, top-aligned; the export dialog
 *           re-fits to the user's actual paper choice where available).
 *           Both must be set; they do not change the page box. For pages
 *           WITHOUT running header/footer slots.
 *   margin  — printable inset on every page of a FLOWING document
 *           (default 0.75in); margin="0" makes pages full-bleed.
 *           Explicitly paginated pages are always full-bleed.
 *
 * Running header/footer (flowing documents only): give an element
 * `slot="header"` or `slot="footer"` and it repeats on every printed
 * page via `position: fixed`. To keep body text from sliding under it,
 * the component prints inside a single-cell table whose <thead>/<tfoot>
 * are spacers sized to the header/footer height — browsers repeat
 * thead/tfoot on every page, so each sheet's content starts below the
 * header and ends above the footer. On screen the header/footer render
 * once at the top/bottom of the sheet.
 *
 * At print the component injects `@page { margin: 0 }` (which leaves
 * Chrome no margin box to draw its date/URL/page-count header in) and
 * moves the visual margin onto the sheet's own padding. It also marks
 * the document as owning its print CSS (a
 * `meta[name="omelette-owns-print"]` it injects at runtime), so the
 * PDF export never injects page-geometry CSS of its own on top.
 *
 * Print best practices for the content you author:
 * - Multi-column text: use CSS columns (`column-count` +
 *   `column-gap`), never side-by-side flex/grid columns — only real
 *   CSS columns flow and break across pages. `column-span: all` lets
 *   a heading span the columns; `hyphens: auto` (needs `lang` on
 *   the html element) keeps narrow columns readable.
 * - Page breaks in flowing documents: `break-before: page` on an
 *   element that must start a new page (a chapter, an appendix). Add
 *   your own kept-together blocks (callouts, stat tiles, cards) to a
 *   `break-inside: avoid` rule, and keep each one shorter than a page.
 * - Extend `orphans: 3; widows: 3` to any custom text blocks you add
 *   (p and li are covered by default).
 * - Give long tables a <thead> — browsers repeat it on every printed
 *   page.
 * - No `position: fixed`/`sticky` and no viewport units in content:
 *   fixed elements stamp every printed page (running headers/footers go
 *   in the component's slots) and `100vh` mis-sizes at print.
 *
 * Author content as static HTML so the user can click-to-edit any text
 * directly. Do not set width/padding/background on the document body —
 * the component owns the sheet box.
 */
/* END USAGE */

(() => {
  const PAPER = {
    letter: ['8.5in', '11in'],
    a4: ['210mm', '297mm'],
    legal: ['8.5in', '14in']
  };
  const CSS_LENGTH = /^\d+(\.\d+)?(px|in|mm|cm|pt|pc)$/;
  // Unitless "0" is a valid CSS length and the natural way to write
  // margin="0"; normalise it to 0px so max()/calc() (which reject a bare
  // number) keep working.
  const safeLen = (v, fb) => {
    v = (v || '').trim();
    return v === '0' ? '0px' : CSS_LENGTH.test(v) ? v : fb;
  };
  // WebKit (Safari and every iOS browser shell) never repeats a table's
  // thead/tfoot on printed pages (WebKit bug 17205), so the spacer-borne
  // vertical margins of a FLOWING document reach only the first page
  // there. Engine check, not browser check: vendor is 'Apple Computer,
  // Inc.' exactly for WebKit and 'Google Inc.' for Blink.
  const WK_PRINT = /apple/i.test(navigator.vendor || '');
  // CSS length → px number (CSS absolute units are exact: 1in = 96px).
  // Returns NaN for anything safeLen would reject — callers gate on it.
  const PX_PER = {
    px: 1,
    in: 96,
    mm: 96 / 25.4,
    cm: 96 / 2.54,
    pt: 96 / 72,
    pc: 16
  };
  const toPx = v => {
    const m = /^(\d+(?:\.\d+)?)(px|in|mm|cm|pt|pc)$/.exec((v || '').trim());
    return m ? parseFloat(m[1]) * PX_PER[m[2]] : NaN;
  };
  const stylesheet = `
    :host {
      position: relative;
      display: block;
      /* When the viewport is narrower than the page, grow to wrap the
       * sheet (plus this padding) instead of staying viewport-width, so
       * the desk background and right margin reach the sheet's far edge
       * in the horizontal scroll. */
      min-width: max-content;
      min-height: 100vh;
      background: #f5f5f4;
      padding: 48px 24px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      --doc-page-w: 8.5in;
      --doc-page-h: 11in;
      --doc-page-margin: 0.75in;
      --doc-hdr-h: 0px;
      --doc-ftr-h: 0px;
      --doc-hdr-pad: 0px;
      --doc-ftr-pad: 0px;
    }
    .sheet {
      width: var(--doc-page-w);
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 2px 10px rgba(20, 20, 19, 0.12);
      border-radius: 7px;
      box-sizing: border-box;
      padding: var(--doc-page-margin);
    }
    .frame { width: 100%; border-collapse: collapse; }
    /* Scaled-fit mode (content-width/content-height): the inner .fit box
     * lays the content out at its authored fixed size and scales it onto
     * the printable area; .fit-box reserves the scaled footprint in flow
     * (transforms don't affect layout) and centers it. Without the mode,
     * both divs are unstyled block pass-throughs. */
    /* Explicit pagination: direct .page children are the pages. The sheet
     * becomes a transparent stack and each page carries the card look on
     * screen; at print each page is exactly one full-bleed sheet. The
     * ::slotted defaults are deliberately weak (document CSS wins), so
     * authored page styling can override any of this. */
    .sheet.paginated {
      background: transparent;
      box-shadow: none;
      border-radius: 0;
      padding: 0;
    }
    .paginated ::slotted(.page) {
      position: relative;
      display: block;
      width: 100%;
      aspect-ratio: var(--doc-page-ar);
      container-type: size;
      overflow: hidden;
      box-sizing: border-box;
      background: #fff;
      border-radius: 7px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
      break-inside: avoid;
    }
    .paginated ::slotted(.page:not(:first-child)) { margin-top: 1rem; }
    @media print {
      .sheet.paginated { padding: 0; }
      /* The flowing-document vertical inset lives on the repeating
       * thead/tfoot spacers, not the sheet padding — they must go too,
       * or each full-sheet .page is pushed ~margin down and spills onto
       * a second sheet. Paginated pages are full-bleed by definition
       * (content owns its insets). */
      .sheet.paginated .hdr-space,
      .sheet.paginated .ftr-space { height: 0; }
      .paginated ::slotted(.page) {
        border-radius: 0 !important;
        box-shadow: none !important;
        margin: 0 !important;
        /* Physical page-box sizing, no viewport units: Safari resolves
         * 100vh against the window, not the page box, so a vh-sized card
         * paginates wrong there. --doc-page-w/h are the named size by
         * default and are overridden to the user's chosen paper by the
         * export path, so every card is exactly one sheet either way.
         * Width + height (same source values as @page size) rather than
         * width + aspect-ratio: the ratio is a 6-decimal rounding of the
         * same division, and a few millionths of overflow would spill a
         * blank sheet after every page. The screen-only aspect-ratio
         * (preview proportions) must not leak into print. cqh typography
         * tracks the same box.
         *
         * Every declaration is !important: per CSS Scoping, unimportant
         * shadow ::slotted rules LOSE to the document context, so a page
         * section's authored inline style would silently beat this print
         * geometry. A model-authored height:100% did exactly that — the
         * percentage resolves as auto in the all-auto print ancestry, the
         * base rule's size containment turns auto into ZERO, and
         * overflow:hidden then paints nothing: a blank PDF with perfect
         * page boxes. At print the component's geometry is the design's
         * whole contract, so it must win over any authored sizing. */
        aspect-ratio: auto !important;
        width: var(--doc-page-w) !important;
        height: var(--doc-page-h) !important;
        overflow: hidden !important;
      }
      .paginated ::slotted(.page:not(:first-child)) {
        break-before: page !important;
        margin-top: 0 !important;
      }
    }
    .fit-mode .fit-box {
      width: calc(var(--doc-fit-w) * var(--doc-fit-scale));
      height: calc(var(--doc-fit-h) * var(--doc-fit-scale));
      margin: 0 auto;
      break-inside: avoid;
    }
    .fit-mode .fit {
      width: var(--doc-fit-w);
      height: var(--doc-fit-h);
      transform: scale(var(--doc-fit-scale));
      transform-origin: top left;
    }
    .frame td, .frame th { padding: 0; text-align: left; font-weight: inherit; }
    .hdr-space { height: var(--doc-hdr-h); }
    .ftr-space { height: var(--doc-ftr-h); }
    ::slotted([slot="header"]),
    ::slotted([slot="footer"]) { display: block; box-sizing: border-box; }
    @media print {
      :host { background: none; padding: 0; min-width: 0; min-height: 0; }
      .sheet {
        width: auto; margin: 0; box-shadow: none; border-radius: 0;
        padding: 0 var(--doc-page-margin);
      }
      /* The thead/tfoot spacers repeat on every page, so they carry the
       * vertical page margin (which the sheet's own padding cannot, since
       * that padding is consumed once on the first/last page). The running
       * header/footer are fixed inside that band. */
      /* The 0.35in is breathing room between a running header/footer and
       * the body; without one the spacer is exactly the page margin, so a
       * margin="0" full-bleed document gets truly full-bleed pages. */
      .hdr-space { height: max(var(--doc-page-margin), calc(var(--doc-hdr-h) + var(--doc-hdr-pad))); }
      .ftr-space { height: max(var(--doc-page-margin), calc(var(--doc-ftr-h) + var(--doc-ftr-pad))); }
      /* WebKit flowing documents: @page carries the vertical margin (see
       * _syncPrintPageRule), so the spacers keep only whatever a running
       * header/footer needs BEYOND it — page 1 would otherwise double its
       * top inset. Paginated sheets already zero their spacers above. */
      .sheet.wk-print:not(.paginated) .hdr-space { height: max(0px, calc(max(var(--doc-page-margin), calc(var(--doc-hdr-h) + var(--doc-hdr-pad))) - var(--doc-page-margin))); }
      .sheet.wk-print:not(.paginated) .ftr-space { height: max(0px, calc(max(var(--doc-page-margin), calc(var(--doc-ftr-h) + var(--doc-ftr-pad))) - var(--doc-page-margin))); }
      ::slotted([slot="header"]) {
        position: fixed; top: 0; left: 0; right: 0; margin: 0;
        padding: calc(var(--doc-page-margin) * 0.45) var(--doc-page-margin) 0;
      }
      ::slotted([slot="footer"]) {
        position: fixed; bottom: 0; left: 0; right: 0; margin: 0;
        padding: 0 var(--doc-page-margin) calc(var(--doc-page-margin) * 0.45);
      }
    }
  `;
  class DocPage extends HTMLElement {
    static get observedAttributes() {
      return ['size', 'width', 'height', 'margin', 'orientation', 'content-width', 'content-height'];
    }
    constructor() {
      super();
      this._root = this.attachShadow({
        mode: 'open'
      });
      this._mo = typeof MutationObserver === 'function' ? new MutationObserver(() => this._scheduleMeasure()) : null;
    }

    /** The named paper's [w, h], swapped when orientation="landscape".
     *  Only the named size swaps — explicit width/height are exact values
     *  the author already oriented. */
    _paperSize() {
      const named = PAPER[(this.getAttribute('size') || '').toLowerCase()] || PAPER.letter;
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      return landscape ? [named[1], named[0]] : named;
    }
    get pageWidth() {
      return safeLen(this.getAttribute('width'), this._paperSize()[0]);
    }
    get pageHeight() {
      return safeLen(this.getAttribute('height'), this._paperSize()[1]);
    }
    get pageMargin() {
      return safeLen(this.getAttribute('margin'), '0.75in');
    }

    /** Scaled-fit mode's content box [w, h] as CSS lengths, or null when
     *  the mode is off (either attribute missing/invalid/zero — a partial
     *  declaration falls back to normal flow rather than guessing). */
    _contentFit() {
      const w = safeLen(this.getAttribute('content-width'), null);
      const h = safeLen(this.getAttribute('content-height'), null);
      if (!w || !h) return null;
      const wPx = toPx(w),
        hPx = toPx(h);
      return wPx > 0 && hPx > 0 ? [w, h, wPx, hPx] : null;
    }
    connectedCallback() {
      if (!this._sheet) this._render();
      this._syncSize();
      this._syncPrintPageRule();
      this._ensureTextWrapDefaults();
      this._ensureOwnsPrintMeta();
      this._syncFixedSizeMeta();
      this._syncPrintSizingMeta();
      if (this._mo) this._mo.observe(this, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true
      });
      this._onResize = () => this._scheduleMeasure();
      window.addEventListener('resize', this._onResize);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => this._scheduleMeasure());
      }
      this._scheduleMeasure();
    }
    disconnectedCallback() {
      window.removeEventListener('resize', this._onResize);
      if (this._mo) this._mo.disconnect();
      if (this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = null;
      }
      // Drop the head rules when the last doc-page leaves, so a deleted
      // document's @page geometry and text-wrap defaults can't apply to
      // whatever replaces it.
      const survivor = document.querySelector('doc-page');
      if (!survivor) {
        ['doc-page-print', 'doc-page-text-wrap', 'doc-page-owns-print', 'doc-page-fixed-size', 'doc-page-print-sizing'].forEach(id => {
          const tag = document.getElementById(id);
          if (tag) tag.remove();
        });
        // A live deck-stage deferred its own print-sizing meta to ours —
        // hand the page-global meta over so the deck isn't left unmarked.
        const deck = document.querySelector('deck-stage');
        if (deck && typeof deck._ensurePrintSizingMeta === 'function') {
          deck._ensurePrintSizingMeta();
        }
      } else {
        // A departed owner hands each page-global meta to whatever
        // doc-page remains (or it's removed).
        if (typeof survivor._syncFixedSizeMeta === 'function') {
          survivor._syncFixedSizeMeta();
        }
        if (typeof survivor._syncPrintSizingMeta === 'function') {
          survivor._syncPrintSizingMeta();
        }
      }
    }
    attributeChangedCallback() {
      if (!this._sheet) return;
      this._syncSize();
      this._syncPrintPageRule();
      this._syncFixedSizeMeta();
      this._syncPrintSizingMeta();
      this._scheduleMeasure();
    }
    _render() {
      this._root.innerHTML = `
        <style>${stylesheet}</style>
        <style id="vars"></style>
        <div class="sheet" data-screen-label="Document">
          <table class="frame" role="presentation">
            <thead><tr><th><div class="hdr-space"><slot name="header"></slot></div></th></tr></thead>
            <tbody><tr><td class="body"><div class="fit-box"><div class="fit"><slot></slot></div></div></td></tr></tbody>
            <tfoot><tr><td><div class="ftr-space"><slot name="footer"></slot></div></td></tr></tfoot>
          </table>
        </div>`;
      this._sheet = this._root.querySelector('.sheet');
      this._vars = this._root.getElementById('vars');
    }

    /** Runtime sizing lives in a shadow <style> :host rule, never on the
     *  light-DOM host element, so serialize-persist can't write it back. */
    _syncSize(hdrH, ftrH) {
      // Scaled-fit mode: content at its authored size, scaled onto the
      // printable area (page minus margins on both axes). The factor is a
      // plain number var so calc(length * number) stays valid; 4 decimals
      // keeps the shadow style stable across re-measures. Upscaling is
      // allowed — print transforms are vector, so text and CSS stay crisp
      // (raster images soften, which the catalog bullet warns about).
      const fit = this._contentFit();
      let fitVars = '';
      if (fit) {
        const marginPx = toPx(this.pageMargin) || 0;
        const availW = toPx(this.pageWidth) - 2 * marginPx;
        const availH = toPx(this.pageHeight) - 2 * marginPx;
        const scale = Math.min(availW / fit[2], availH / fit[3]);
        if (scale > 0 && Number.isFinite(scale)) {
          fitVars = '--doc-fit-w:' + fit[0] + ';' + '--doc-fit-h:' + fit[1] + ';' + '--doc-fit-scale:' + scale.toFixed(4) + ';';
        }
      }
      this._sheet.classList.toggle('fit-mode', !!fitVars);
      // Numeric w/h ratio for the paginated page cards' aspect-ratio —
      // aspect-ratio takes a number, not a length ratio, so compute it
      // here (CSS length division isn't portable). 6 decimals keeps the
      // shadow style stable across re-syncs.
      const arW = toPx(this.pageWidth);
      const arH = toPx(this.pageHeight);
      const ar = arW > 0 && arH > 0 ? (arW / arH).toFixed(6) : '0.772727';
      this._vars.textContent = ':host{' + fitVars + '--doc-page-ar:' + ar + ';' + '--doc-page-w:' + this.pageWidth + ';' + '--doc-page-h:' + this.pageHeight + ';' + '--doc-page-margin:' + this.pageMargin + ';' + '--doc-hdr-h:' + (hdrH || 0) + 'px;' + '--doc-ftr-h:' + (ftrH || 0) + 'px;' + '--doc-hdr-pad:' + (hdrH ? '0.35in' : '0px') + ';' + '--doc-ftr-pad:' + (ftrH ? '0.35in' : '0px') + '}';
    }

    /** @page is a no-op inside shadow DOM, so the rule lives in <head>.
     *  Re-appended on every sync so it stays last in source order — the
     *  @page cascade is source-order per descriptor, so this rule wins
     *  over any other @page rule in the document.
     *
     *  The @page SIZE is pinned where the page box IS part of the design:
     *  explicit-fixed-size mode (width + height authored), scaled-fit
     *  mode (the named sheet the fit targets), and explicit pagination
     *  (the named size the cards share — so card and sheet agree on
     *  every print path, and the export path's chosen paper overrides
     *  BOTH with one later rule). For FLOWING documents no paper size is
     *  emitted at all — the true size comes from the user's preference,
     *  injected by the export path or chosen in the print dialog — so a
     *  flowing document never fights the paper it lands on.
     *  margin: 0 is emitted in every mode: it leaves Chrome no margin box
     *  to draw its date/URL/page-count header in, and the visual margin
     *  lives on the sheet's own padding. */
    _syncPrintPageRule() {
      const id = 'doc-page-print';
      let tag = document.getElementById(id);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = id;
      }
      document.head.appendChild(tag);
      // Three print-geometry regimes:
      // - true-size: the page IS the design — pin its exact size.
      // - scaled-fit (content-width/height): the fit factor is computed
      //   against the NAMED paper's printable area, so that paper must
      //   stay pinned or the scaled content overflows a smaller sheet
      //   (the export path re-fits and re-pins at print time on top).
      // - default modes: no paper size — but landscape still needs the
      //   paper-agnostic 'size: landscape' keyword, because the size
      //   descriptor is what carries orientation; without it a landscape
      //   document prints portrait whenever nothing injects a size.
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      // Explicit pagination pins the page box to the SAME values that
      // size the cards (the named size by default, the export path's
      // chosen paper when its later rule overrides both) — card and
      // sheet agree on every print path, and a mismatched real paper
      // shrinks-to-fit in the dialog instead of clipping a Letter card
      // on A4. Declared before the paginated read below so both derive
      // from one check.
      const paginatedNow = this.querySelector(':scope > .page') !== null;
      const sizeDescriptor = this._trueSizePx() ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : this._contentFit() ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : paginatedNow ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : landscape ? 'size: landscape; ' : '';
      // WebKit never repeats the thead/tfoot spacers that carry a flowing
      // document's vertical page margins (see WK_PRINT above), so pages
      // after the first print edge-to-edge there. Carry the VERTICAL
      // margins on @page for WebKit instead, and the shadow print CSS
      // trims the first-page spacers by the same amount (.sheet.wk-print
      // rules). Horizontal inset stays on the sheet's own padding in
      // every engine. Blink keeps margin: 0 (a nonzero margin there
      // re-opens the box Chrome draws its header furniture in). One cost,
      // learned in testing: Safari's own date/URL headers are a USER
      // dialog setting ("Print headers and footers") that renders in the
      // margin area when room exists — margin: 0 only suppressed it by
      // leaving no room, and no CSS controls it. The export dialog's
      // Safari guide teaches turning the setting off for flowing
      // documents. Explicitly paginated and fixed-size documents keep
      // margin: 0 everywhere: their pages ARE the sheet.
      const wkFlowing = WK_PRINT && !paginatedNow && !this._trueSizePx() && !this._contentFit();
      const marginDescriptor = wkFlowing ? 'margin: ' + this.pageMargin + ' 0; ' : 'margin: 0; ';
      // Shadow-internal marker (never serialized), kept in lockstep with
      // the @page decision above: the print CSS trims the first-page
      // spacers ONLY while @page actually carries the margins — a
      // true-size or scaled-fit sheet keeps margin: 0 and must keep its
      // spacers too. Re-synced here so attribute changes and pagination
      // flips move both together.
      if (this._sheet) this._sheet.classList.toggle('wk-print', wkFlowing);
      tag.textContent = '@page { ' + sizeDescriptor + marginDescriptor + '} ' + '@media print { html, body { margin: 0 !important; padding: 0 !important; background: none !important; height: auto !important; overflow: visible !important; } ' + 'h1,h2,h3,h4,h5,h6 { break-after: avoid; } ' + 'figure,pre,blockquote,img,svg,tr { break-inside: avoid; } ' + 'p,li { orphans: 3; widows: 3; } ' + '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; ' + 'backdrop-filter: none !important; -webkit-backdrop-filter: none !important; } ' + '*, *::before, *::after { animation-delay: -99s !important; animation-duration: .001s !important; ' + 'animation-iteration-count: 1 !important; animation-fill-mode: both !important; ' + 'animation-play-state: running !important; transition-duration: 0s !important; } }';
    }

    /** Typographic defaults for document text: balance headings, avoid
     *  widowed/orphaned words in body copy (browsers without text-wrap
     *  support drop the declarations). Zero-specificity via :where() so
     *  any text-wrap authored on those elements wins; document-level so the
     *  rules reach the slotted (light DOM) content — shadow styles can't.
     *  data-omelette-injected marks the tag for the host editor to strip
     *  at serialize, so it is never written back as authored source. */
    _ensureTextWrapDefaults() {
      if (document.getElementById('doc-page-text-wrap')) return;
      const tag = document.createElement('style');
      tag.id = 'doc-page-text-wrap';
      tag.setAttribute('data-omelette-injected', '');
      tag.textContent = ':where(h1,h2,h3,h4,h5,h6){text-wrap:balance}' + ':where(p,li,blockquote,figcaption){text-wrap:pretty}';
      document.head.appendChild(tag);
    }

    /** Declares that this document owns its print CSS. The instant-PDF
     *  export checks for the meta by NAME PRESENCE alone (content is
     *  ignored) and skips its automatic print-CSS injections, so the
     *  component's @page geometry is never overridden by a heuristic.
     *  data-omelette-injected keeps it out of serialized source. */
    _ensureOwnsPrintMeta() {
      if (document.getElementById('doc-page-owns-print')) return;
      const tag = document.createElement('meta');
      tag.id = 'doc-page-owns-print';
      tag.name = 'omelette-owns-print';
      tag.content = 'true';
      tag.setAttribute('data-omelette-injected', '');
      document.head.appendChild(tag);
    }

    /** This page's valid true-size page box (explicit width AND height)
     *  as [w, h] px ints, or null when the mode is off. */
    _trueSizePx() {
      if (!safeLen(this.getAttribute('width'), null) || !safeLen(this.getAttribute('height'), null)) return null;
      const w = Math.round(toPx(this.pageWidth));
      const h = Math.round(toPx(this.pageHeight));
      return w > 0 && h > 0 ? [w, h] : null;
    }

    /** True-size pages (explicit width AND height) also declare the page
     *  box as the preview size: the in-app preview reads
     *  meta[name="omelette-fixed-size"] (content "W,H" in px ints) and
     *  scales the sheet into view — without it an 18in poster previews at
     *  true size with scrollbars. Never overrides an author-set meta
     *  (only the component's own id is managed). The meta is page-global
     *  while doc-page instances are not, so every sync recomputes the
     *  page-wide owner — the first connected true-size doc-page — and a
     *  non-true-size sibling's sync can never delete the owner's meta.
     *  Removed when no true-size page remains (the owner's disconnect
     *  re-syncs via any survivor) or when an author-set meta exists. */
    _syncFixedSizeMeta() {
      const id = 'doc-page-fixed-size';
      const own = document.getElementById(id);
      const authored = document.querySelector('meta[name="omelette-fixed-size"]:not([data-omelette-injected])');
      // The page-wide owner, not this instance: an upgraded true-size page
      // anywhere in the document keeps the meta alive and sized.
      let box = null;
      for (const el of document.querySelectorAll('doc-page')) {
        box = typeof el._trueSizePx === 'function' ? el._trueSizePx() : null;
        if (box) break;
      }
      if (!box || authored) {
        if (own) own.remove();
        return;
      }
      const tag = own || document.createElement('meta');
      tag.id = id;
      tag.name = 'omelette-fixed-size';
      tag.content = box[0] + ',' + box[1];
      tag.setAttribute('data-omelette-injected', '');
      if (!own) document.head.appendChild(tag);
    }

    /** This page's print-sizing mode: 'fixed' when an explicit width AND
     *  height are authored (the page is the design's own size), else the
     *  default paper in the authored orientation. */
    _printSizingMode() {
      if (this._trueSizePx()) return 'fixed';
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      return landscape ? 'default-landscape' : 'default-portrait';
    }

    /** Announces the print-sizing mode to the host app:
     *  meta[name="omelette-print-sizing"] with content 'default-portrait',
     *  'default-landscape', or 'fixed' (fixed pages also carry the
     *  omelette-fixed-size meta with the page box in px). The export path
     *  probes it to decide what true paper size to inject at print time —
     *  in the default modes the component emits no paper size of its own.
     *  Same page-global ownership rules as the fixed-size meta above:
     *  first connected doc-page owns it, an authored meta is never
     *  overridden, removed when no doc-page remains. */
    _syncPrintSizingMeta() {
      const id = 'doc-page-print-sizing';
      const own = document.getElementById(id);
      const authored = document.querySelector('meta[name="omelette-print-sizing"]:not([data-omelette-injected])');
      // A fixed page wins outright (mirroring the fixed-size loop above,
      // so the two metas can never contradict each other in a mixed
      // multi-page document); otherwise the first page's mode holds.
      let mode = null;
      for (const el of document.querySelectorAll('doc-page')) {
        if (typeof el._printSizingMode !== 'function') continue;
        const m = el._printSizingMode();
        if (m === 'fixed') {
          mode = m;
          break;
        }
        if (mode === null) mode = m;
      }
      if (!mode || authored) {
        if (own) own.remove();
        return;
      }
      // A deck-stage that connected first injected its own meta and
      // defers to any existing one — take it over, or the document ends
      // up with two conflicting injected metas (a doc-page page is the
      // document; the deck re-ensures its meta if every doc-page leaves).
      const deckMeta = document.getElementById('deck-stage-print-sizing');
      if (deckMeta) deckMeta.remove();
      const tag = own || document.createElement('meta');
      tag.id = id;
      tag.name = 'omelette-print-sizing';
      tag.content = mode;
      tag.setAttribute('data-omelette-injected', '');
      if (!own) document.head.appendChild(tag);
    }
    _scheduleMeasure() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = null;
        this._measure();
      });
    }

    /** Slot heights feed the print spacers (--doc-hdr-h / --doc-ftr-h), so
     *  they re-measure on content mutation, resize, and font load. The
     *  same pass detects explicit pagination (direct .page children) and
     *  toggles the sheet between the flowing-document card and the
     *  page-per-card stack — content edits can add or remove pages at any
     *  time, so this tracks the same mutations the measurement does. */
    _measure() {
      const hdr = this.querySelector(':scope > [slot="header"]');
      const ftr = this.querySelector(':scope > [slot="footer"]');
      const wasPaginated = this._sheet.classList.contains('paginated');
      this._sheet.classList.toggle('paginated', this.querySelector(':scope > .page') !== null);
      // The WebKit @page margin is flowing-only, so a pagination flip
      // must re-emit the rule (content edits can add or remove .page
      // sections at any time).
      if (this._sheet.classList.contains('paginated') !== wasPaginated) {
        this._syncPrintPageRule();
      }
      this._syncSize(hdr ? hdr.offsetHeight : 0, ftr ? ftr.offsetHeight : 0);
    }
  }
  if (!customElements.get('doc-page')) {
    customElements.define('doc-page', DocPage);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site-marketing/doc-page.js", error: String((e && e.message) || e) }); }

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Chip = __ds_scope.Chip;

})();
