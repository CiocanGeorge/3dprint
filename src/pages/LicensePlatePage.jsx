import { useEffect, useRef, useState, useCallback } from "react";
import { LicensePlateScene } from "../components/LicensePlateScene";

export default function LicensePlatePage() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);

  const [plateText, setPlateText] = useState("AB-123-CD");
  const [nameText, setNameText] = useState("YOUR NAME");
  const [countryText, setCountryText] = useState("F");

  // Init scene
  useEffect(() => {
    if (!canvasRef.current) return;
    sceneRef.current = new LicensePlateScene(canvasRef.current);
    return () => sceneRef.current?.destroy();
  }, []);

  // Update text live
  useEffect(() => {
    sceneRef.current?.updateText(plateText, nameText, countryText);
  }, [plateText, nameText, countryText]);

  const handleExportAll = useCallback(() => {
    sceneRef.current?.exportAll();
  }, []);

  const handleExportCombined = useCallback(() => {
    sceneRef.current?.exportCombined();
  }, []);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.badge}>3D CUSTOMIZER</span>
          <h1 style={styles.title}>Plăcuță Auto</h1>
          <p style={styles.subtitle}>Personalizează și exportă pentru imprimare 3D</p>
        </div>
      </div>

      <div style={styles.layout}>
        {/* Canvas */}
        <div style={styles.canvasWrap}>
          <canvas ref={canvasRef} style={styles.canvas} />
          <div style={styles.canvasHint}>🖱 Drag pentru rotire • Scroll pentru zoom</div>
        </div>

        {/* Panel dreapta */}
        <div style={styles.panel}>
          <div style={styles.panelTitle}>
            <span style={styles.panelTitleIcon}>✏️</span>
            Editare
          </div>

          {/* Număr */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              <span style={styles.labelDot} />
              Număr înmatriculare
            </label>
            <input
              style={styles.input}
              value={plateText}
              maxLength={12}
              onChange={(e) => setPlateText(e.target.value)}
              placeholder="AB-123-CD"
              spellCheck={false}
            />
            <span style={styles.hint}>{plateText.length}/12 caractere</span>
          </div>

          {/* Țară */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              <span style={styles.labelDot} />
              Cod țară (banda EU)
            </label>
            <input
              style={{ ...styles.input, ...styles.inputSmall }}
              value={countryText}
              maxLength={3}
              onChange={(e) => setCountryText(e.target.value)}
              placeholder="F"
              spellCheck={false}
            />
          </div>

          {/* Nume */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              <span style={styles.labelDot} />
              Nume personalizat
            </label>
            <input
              style={styles.input}
              value={nameText}
              maxLength={20}
              onChange={(e) => setNameText(e.target.value)}
              placeholder="YOUR NAME"
              spellCheck={false}
            />
            <span style={styles.hint}>{nameText.length}/20 caractere</span>
          </div>

          {/* Divider */}
          <div style={styles.divider} />

          {/* Legenda culori */}
          <div style={styles.panelTitle}>
            <span style={styles.panelTitleIcon}>🎨</span>
            Piese STL
          </div>
          <div style={styles.colorLegend}>
            {[
              { color: "#111111", label: "Corp (ramă neagră)" },
              { color: "#f5f5f0", label: "Fundal alb" },
              { color: "#003399", label: "Bandă EU albastră" },
              { color: "#333333", label: "Text număr" },
              { color: "#ffffff", label: "Text țară" },
              { color: "#222222", label: "Nume personalizat" },
            ].map(({ color, label }) => (
              <div key={label} style={styles.legendRow}>
                <div style={{ ...styles.legendDot, background: color, border: color === "#ffffff" || color === "#f5f5f0" ? "1px solid #555" : "none" }} />
                <span style={styles.legendLabel}>{label}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={styles.divider} />

          {/* Export buttons */}
          <div style={styles.panelTitle}>
            <span style={styles.panelTitleIcon}>📦</span>
            Export STL
          </div>

          <button style={styles.btnPrimary} onClick={handleExportAll}>
            <span style={styles.btnIcon}>⬇️</span>
            Export separat (6 fișiere STL)
          </button>

          <button style={styles.btnSecondary} onClick={handleExportCombined}>
            <span style={styles.btnIcon}>⬇️</span>
            Export combinat (1 fișier STL)
          </button>

          <p style={styles.exportNote}>
            Exportul separat păstrează culorile pentru imprimante multi-material (Bambu Lab, Prusa MMU, etc.)
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#e8e8f0",
  },
  header: {
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(10px)",
    padding: "20px 32px",
  },
  headerInner: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  badge: {
    background: "linear-gradient(90deg, #003399, #0055cc)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    padding: "4px 10px",
    borderRadius: 4,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: -0.5,
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    color: "#8888aa",
    marginLeft: "auto",
  },
  layout: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "32px 24px",
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 24,
    alignItems: "start",
  },
  canvasWrap: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    aspectRatio: "16/9",
  },
  canvas: {
    width: "100%",
    height: "100%",
    display: "block",
  },
  canvasHint: {
    position: "absolute",
    bottom: 12,
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    pointerEvents: "none",
    whiteSpace: "nowrap",
  },
  panel: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: "#8888aa",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  panelTitleIcon: {
    fontSize: 14,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#aaaacc",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#003399",
    display: "inline-block",
  },
  input: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: 1,
    outline: "none",
    transition: "border-color 0.2s",
    width: "100%",
    boxSizing: "border-box",
    textTransform: "uppercase",
  },
  inputSmall: {
    width: 80,
  },
  hint: {
    fontSize: 10,
    color: "#666688",
    textAlign: "right",
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.06)",
    margin: "4px 0",
  },
  colorLegend: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: 12,
    color: "#aaaacc",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #003399, #0055cc)",
    border: "none",
    borderRadius: 10,
    padding: "12px 16px",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "opacity 0.2s, transform 0.1s",
    width: "100%",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "12px 16px",
    color: "#cccce0",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "opacity 0.2s",
    width: "100%",
  },
  btnIcon: {
    fontSize: 16,
  },
  exportNote: {
    fontSize: 11,
    color: "#666688",
    lineHeight: 1.5,
    margin: 0,
  },
};
