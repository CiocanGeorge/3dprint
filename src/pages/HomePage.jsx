import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./HomePage.module.css";
import { useAuth } from "../context/AuthContext";

// ─── Catalog de modele ────────────────────────────────────────────────────────
// Adaugă modele noi aici — fiecare card e un entry în acest array
const MODELS = [
  {
    id: "monogram",
    path: "/customizer/monogram",
    title: "Monogramă 3D",
    description:
      "Literă mare cu numele gravat deasupra. Export STL pentru imprimare 3D.",
    tags: ["Serif", "Personalizabil", "STL Export"],
    accent: "#5c6ac4",
    preview: "monogram", // tip de preview canvas
  },
   {
    id: "license_plate",
    path: "/customizer/license_plate",
    title: "Plăcuță Auto",
    description:
      "Plăcuță de înmatriculare 3D cu număr și nume personalizate. Export STL pentru imprimare 3D.",
    tags: ["Serif", "Personalizabil", "STL Export"],
    accent: "#5c6ac4",
    preview: "license_plate", // tip de preview canvas
  },
  // Adaugă modele viitoare aici:
  // { id: 'ring', path: '/customizer/ring', title: 'Inel cu inițiale', ... },
  // { id: 'tag',  path: '/customizer/tag',  title: 'Tag personalizat', ... },
];

// ─── Mini canvas preview ──────────────────────────────────────────────────────
// Randează o literă 2D pe canvas ca thumbnail — fără Three.js, instant

function MonogramPreview({ accent }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    // Background deschis
    ctx.fillStyle = "#f5f3f0";
    ctx.fillRect(0, 0, w, h);

    // Gradient subtil
    const grd = ctx.createRadialGradient(
      w / 2,
      h / 2,
      10,
      w / 2,
      h / 2,
      w * 0.7,
    );
    grd.addColorStop(0, accent + "18");
    grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Litera mare
    ctx.font = `bold ${w * 0.55}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = accent;
    ctx.shadowColor = accent + "55";
    ctx.shadowBlur = 12;
    ctx.fillText("M", w / 2, h / 2 - h * 0.04);

    // Numele dedesubt
    ctx.shadowBlur = 0;
    ctx.font = `${w * 0.085}px monospace`;
    ctx.fillStyle = "rgba(26,23,20,0.45)";
    ctx.letterSpacing = "0.15em";
    ctx.fillText("MONOGRAM", w / 2, h / 2 + h * 0.3);
  }, [accent]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={200}
      className={styles.previewCanvas}
    />
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function ModelCard({ model }) {
  const navigate = useNavigate();

  return (
    <div
      className={styles.card}
      onClick={() => navigate(model.path)}
      style={{ "--card-accent": model.accent }}
    >
      <div className={styles.cardPreview}>
        <MonogramPreview accent={model.accent} />
        <div className={styles.cardOverlay}>
          <span className={styles.openBtn}>
            Deschide Editor
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6h8M6 2l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <h3 className={styles.cardTitle}>{model.title}</h3>
          <span className={styles.cardBadge}>3D</span>
        </div>
        <p className={styles.cardDesc}>{model.description}</p>
        <div className={styles.cardTags}>
          {model.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Coming soon cards — placeholder */}
      <div className={styles.cardAccentLine} />
    </div>
  );
}

function ComingSoonCard() {
  return (
    <div
      className={styles.card}
      style={{ "--card-accent": "#444", opacity: 0.5, cursor: "default" }}
    >
      <div className={styles.cardPreview} style={{ background: "#111" }}>
        <div className={styles.comingSoonInner}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="#444"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <path
              d="M16 10v6M16 20v2"
              stroke="#555"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>În curând</span>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <h3 className={styles.cardTitle} style={{ color: "#555" }}>
            Model nou
          </h3>
        </div>
        <p className={styles.cardDesc} style={{ color: "#444" }}>
          Urmează curând
        </p>
      </div>
      <div className={styles.cardAccentLine} />
    </div>
  );
}

// ─── HomePage ─────────────────────────────────────────────────────────────────

export function HomePage() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <span className={styles.navLogoMark}>M</span>
          <div>
            <div className={styles.navLogoTitle}>Monogram Studio</div>
            <div className={styles.navLogoSub}>3D Print Customizer</div>
          </div>
        </div>
        <span className={styles.navBadge}>Beta</span>
        <div className={styles.navLinks}>
          {isAuthenticated ? (
            <div className={styles.navUser}>
              <button
                className={styles.navDashBtn}
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </button>
              <button
                className={styles.avatarBtn}
                onClick={() => navigate("/profile")}
              >
                {user.initials}
              </button>
            </div>
          ) : (
            <button
              className={styles.navLoginBtn}
              onClick={() => navigate("/login")}
            >
              Intră în cont
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroEyebrow}>Personalizare 3D</div>
          <h1 className={styles.heroTitle}>
            Creează obiecte
            <span className={styles.heroAccent}> unice</span> pentru tine
          </h1>
          <p className={styles.heroSub}>
            Alege un model, personalizează-l în timp real și exportă fișierul
            STL gata de imprimat.
          </p>
        </div>
        <div className={styles.heroDecor}>
          <div className={styles.heroOrb} />
        </div>
      </section>

      {/* Grid */}
      <section className={styles.grid}>
        <div className={styles.gridHeader}>
          <h2 className={styles.gridTitle}>Modele disponibile</h2>
          <span className={styles.gridCount}>
            {MODELS.length} model{MODELS.length !== 1 ? "e" : ""}
          </span>
        </div>
        <div className={styles.cards}>
          {MODELS.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
          <ComingSoonCard />
          {/* <ComingSoonCard /> */}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>Monogram Studio © 2025</span>
        <span className={styles.footerDot}>·</span>
        <span>Export STL · FDM · SLA · SLS</span>
      </footer>
    </div>
  );
}
