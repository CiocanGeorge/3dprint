import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import styles from "./OverviewPage.module.css";

export function OverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filaments, setFilaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("filaments")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error)
          setFilaments(
            data.map((f) => ({
              id: f.id,
              brand: f.brand,
              material: f.material,
              colorName: f.color_name,
              color: f.color,
              weight: f.weight,
              remaining: f.remaining,
            })),
          );
        setLoading(false);
      });
  }, [user]);

  const totalSpools = filaments.length;
  const totalGrams = filaments.reduce(
    (s, f) => s + (f.remaining ?? f.weight),
    0,
  );
  const lowStock = filaments.filter(
    (f) => (f.remaining ?? f.weight) < 100,
  ).length;
  const brands = [...new Set(filaments.map((f) => f.brand))].length;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bună dimineața" : hour < 18 ? "Bună ziua" : "Bună seara";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {greeting}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className={styles.sub}>
            Iată ce se întâmplă cu stocul tău de filamente
          </p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard
          icon="🧵"
          label="Total role"
          value={loading ? "—" : totalSpools}
          color="indigo"
        />
        <StatCard
          icon="⚖️"
          label="Grame disponibile"
          value={loading ? "—" : `${totalGrams.toLocaleString()}g`}
          color="violet"
        />
        <StatCard
          icon="⚠️"
          label="Stoc scăzut"
          value={loading ? "—" : lowStock}
          color={lowStock > 0 ? "red" : "green"}
        />
        <StatCard
          icon="🏷️"
          label="Branduri"
          value={loading ? "—" : brands}
          color="blue"
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Acțiuni rapide</h2>
        <div className={styles.actions}>
          <ActionCard
            icon="🧵"
            title="Gestionează filamente"
            desc="Adaugă, editează sau șterge role de filament din stoc"
            onClick={() => navigate("/dashboard/filament")}
          />
          <ActionCard
            icon="🖨️"
            title="Imprimări"
            desc="Urmărește istoricul imprimărilor și consumul de filament"
            onClick={() => navigate("/dashboard/prints")}
          />
          <ActionCard
            icon="📦"
            title="Comenzi"
            desc="Gestionează comenzile de filament noi"
            onClick={() => navigate("/dashboard/orders")}
          />
        </div>
      </div>

      {!loading && lowStock > 0 && (
        <div className={styles.alertBanner}>
          <span>⚠️</span>
          <div>
            <strong>
              {lowStock} rol{lowStock > 1 ? "e" : "ă"}
            </strong>{" "}
            cu stoc sub 100g.
            <button
              onClick={() => navigate("/dashboard/filament")}
              className={styles.alertLink}
            >
              Vezi detalii →
            </button>
          </div>
        </div>
      )}

      {!loading && filaments.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Filamente recente</h2>
            <button
              className={styles.seeAll}
              onClick={() => navigate("/dashboard/filament")}
            >
              Vezi toate →
            </button>
          </div>
          <div className={styles.recentList}>
            {filaments.slice(0, 4).map((f) => (
              <div key={f.id} className={styles.recentItem}>
                <div
                  className={styles.recentColor}
                  style={{ background: f.color || "#888" }}
                />
                <div className={styles.recentInfo}>
                  <span className={styles.recentName}>
                    {f.brand} — {f.material}
                  </span>
                  <span className={styles.recentMeta}>
                    {f.colorName} · {f.remaining ?? f.weight}g rămase
                  </span>
                </div>
                <div className={styles.recentBar}>
                  <div
                    className={styles.recentBarFill}
                    style={{
                      width: `${Math.min(100, ((f.remaining ?? f.weight) / f.weight) * 100)}%`,
                      background: f.color || "var(--accent)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    indigo: { bg: "rgba(92,106,196,0.08)", text: "#5c6ac4" },
    violet: { bg: "rgba(138,107,191,0.08)", text: "#8a6bbf" },
    red: { bg: "rgba(220,38,38,0.08)", text: "#dc2626" },
    green: { bg: "rgba(22,163,74,0.08)", text: "#16a34a" },
    blue: { bg: "rgba(59,130,246,0.08)", text: "#3b82f6" },
  };
  const c = colors[color] || colors.indigo;
  return (
    <div
      className={styles.statCard}
      style={{ "--stat-bg": c.bg, "--stat-text": c.text }}
    >
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick, soon }) {
  return (
    <div
      className={`${styles.actionCard} ${soon ? styles.actionSoon : ""}`}
      onClick={!soon ? onClick : undefined}
    >
      <div className={styles.actionIcon}>{icon}</div>
      <div className={styles.actionTitle}>
        {title} {soon && <span className={styles.soonTag}>Soon</span>}
      </div>
      <div className={styles.actionDesc}>{desc}</div>
      {!soon && <div className={styles.actionArrow}>→</div>}
    </div>
  );
}
