import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import styles from "./SettingsPage.module.css";

const DEFAULT_SETTINGS = {
  studioName: "3D•Print Studio",
  currency: "RON",
  lowStockThreshold: 100,
  energyCostPerHour: 0.8,
  defaultMarkup: 30,
  theme: "dark",
  language: "ro",
};
const CURRENCIES = ["RON", "EUR", "USD", "GBP"];
const PRINTER_EMPTY = { name: "", model: "", active: true };

function settingsFromDB(row) {
  if (!row) return DEFAULT_SETTINGS;
  return {
    studioName: row.studio_name,
    currency: row.currency,
    lowStockThreshold: row.low_stock_threshold,
    energyCostPerHour: row.energy_cost_per_hour,
    defaultMarkup: row.default_markup,
    theme: row.theme,
    language: row.language,
  };
}

export function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [printers, setPrinters] = useState([]);
  const [activeTab, setActiveTab] = useState("studio");
  const [printerModal, setPrinterModal] = useState(null);
  const [printerForm, setPrinterForm] = useState(PRINTER_EMPTY);
  const [currentPrinter, setCurrentPrinter] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("settings").select("*").eq("user_id", user.id).single(),
      supabase
        .from("printers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at"),
    ]).then(([settingsRes, printersRes]) => {
      if (!settingsRes.error && settingsRes.data)
        setSettings(settingsFromDB(settingsRes.data));
      if (!printersRes.error) setPrinters(printersRes.data);
      setLoadingData(false);
    });
  }, [user]);

  const setS = (k) => (v) => setSettings((s) => ({ ...s, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("settings").upsert({
      user_id: user.id,
      studio_name: settings.studioName,
      currency: settings.currency,
      low_stock_threshold: settings.lowStockThreshold,
      energy_cost_per_hour: settings.energyCostPerHour,
      default_markup: settings.defaultMarkup,
      theme: settings.theme,
      language: settings.language,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const openAddPrinter = () => {
    setPrinterForm(PRINTER_EMPTY);
    setCurrentPrinter(null);
    setPrinterModal("add");
  };
  const openEditPrinter = (p) => {
    setPrinterForm({ ...p });
    setCurrentPrinter(p);
    setPrinterModal("edit");
  };

  const savePrinter = async () => {
    if (!printerForm.name.trim()) return;
    if (currentPrinter) {
      const { data, error } = await supabase
        .from("printers")
        .update({
          name: printerForm.name,
          model: printerForm.model,
          active: printerForm.active,
        })
        .eq("id", currentPrinter.id)
        .select()
        .single();
      if (!error)
        setPrinters((ps) =>
          ps.map((p) => (p.id === currentPrinter.id ? data : p)),
        );
    } else {
      const { data, error } = await supabase
        .from("printers")
        .insert({
          user_id: user.id,
          name: printerForm.name,
          model: printerForm.model,
          active: printerForm.active,
        })
        .select()
        .single();
      if (!error) setPrinters((ps) => [...ps, data]);
    }
    setPrinterModal(null);
  };

  const deletePrinter = async (id) => {
    await supabase.from("printers").delete().eq("id", id);
    setPrinters((ps) => ps.filter((p) => p.id !== id));
    setDeleteConfirm(null);
    setPrinterModal(null);
  };

  const togglePrinterActive = async (id) => {
    const printer = printers.find((p) => p.id === id);
    const { data } = await supabase
      .from("printers")
      .update({ active: !printer.active })
      .eq("id", id)
      .select()
      .single();
    if (data) setPrinters((ps) => ps.map((p) => (p.id === id ? data : p)));
  };

  const handleExport = async () => {
    const [filamentsRes, printsRes, ordersRes] = await Promise.all([
      supabase.from("filaments").select("*"),
      supabase.from("prints").select("*"),
      supabase.from("orders").select("*"),
    ]);
    const data = {
      settings,
      printers,
      filaments: filamentsRes.data || [],
      prints: printsRes.data || [],
      orders: ordersRes.data || [],
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monogram-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetAll = async () => {
    await Promise.all([
      supabase.from("filaments").delete().eq("user_id", user.id),
      supabase.from("prints").delete().eq("user_id", user.id),
      supabase.from("orders").delete().eq("user_id", user.id),
      supabase.from("printers").delete().eq("user_id", user.id),
      supabase.from("settings").delete().eq("user_id", user.id),
    ]);
    setSettings(DEFAULT_SETTINGS);
    setPrinters([]);
    setDeleteConfirm(null);
  };

  const TABS = [
    { id: "studio", label: "Studio", icon: <BuildingIcon /> },
    { id: "printers", label: "Imprimante", icon: <PrinterIcon /> },
    { id: "costs", label: "Costuri", icon: <CoinsIcon /> },
    { id: "alerts", label: "Alerte", icon: <BellIcon /> },
    { id: "data", label: "Date", icon: <DatabaseIcon /> },
  ];

  if (loadingData)
    return (
      <div
        className={styles.page}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
        }}
      >
        Se încarcă...
      </div>
    );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Setări</h1>
          <p className={styles.sub}>
            Configurează aplicația după preferințele tale
          </p>
        </div>
        <button
          className={`${styles.saveBtn} ${saved ? styles.saveBtnSuccess : ""}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saved ? (
            <>
              <CheckIcon /> Salvat
            </>
          ) : saving ? (
            "Se salvează..."
          ) : (
            "Salvează modificările"
          )}
        </button>
      </div>

      <div className={styles.layout}>
        <nav className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className={styles.tabIcon}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === "studio" && (
            <Section
              title="Profil Studio"
              subtitle="Informații despre studio-ul tău"
            >
              <div className={styles.formGrid}>
                <Field label="Nume studio">
                  <input
                    className={styles.input}
                    value={settings.studioName}
                    onChange={(e) => setS("studioName")(e.target.value)}
                    placeholder="3D•Print Studio"
                  />
                </Field>
                <Field label="Monedă">
                  <select
                    className={styles.input}
                    value={settings.currency}
                    onChange={(e) => setS("currency")(e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Limbă">
                  <select
                    className={styles.input}
                    value={settings.language}
                    onChange={(e) => setS("language")(e.target.value)}
                  >
                    <option value="ro">Română</option>
                    <option value="en">English</option>
                  </select>
                </Field>
                <Field label="Temă">
                  <div className={styles.themeToggle}>
                    {["dark", "light"].map((t) => (
                      <button
                        key={t}
                        className={`${styles.themeBtn} ${settings.theme === t ? styles.themeBtnActive : ""}`}
                        onClick={() => setS("theme")(t)}
                      >
                        {t === "dark" ? "🌙 Întunecată" : "☀️ Luminoasă"}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </Section>
          )}

          {activeTab === "printers" && (
            <Section
              title="Imprimante"
              subtitle="Gestionează imprimantele din atelier"
              action={
                <button className={styles.addBtn} onClick={openAddPrinter}>
                  <PlusIcon /> Adaugă
                </button>
              }
            >
              {printers.length === 0 ? (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon}>🖨️</span>
                  <p>Nicio imprimantă adăugată încă.</p>
                  <button className={styles.addBtn} onClick={openAddPrinter}>
                    <PlusIcon /> Adaugă imprimantă
                  </button>
                </div>
              ) : (
                <div className={styles.printerList}>
                  {printers.map((p) => (
                    <div
                      key={p.id}
                      className={`${styles.printerRow} ${!p.active ? styles.printerInactive : ""}`}
                    >
                      <div className={styles.printerIcon}>🖨️</div>
                      <div className={styles.printerInfo}>
                        <div className={styles.printerName}>{p.name}</div>
                        {p.model && (
                          <div className={styles.printerModel}>{p.model}</div>
                        )}
                      </div>
                      <div className={styles.printerActions}>
                        <button
                          className={`${styles.statusPill} ${p.active ? styles.statusActive : styles.statusInactive}`}
                          onClick={() => togglePrinterActive(p.id)}
                        >
                          {p.active ? "Activă" : "Inactivă"}
                        </button>
                        <button
                          className={styles.iconBtn}
                          onClick={() => openEditPrinter(p)}
                        >
                          <EditIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {activeTab === "costs" && (
            <Section
              title="Costuri & Prețuri"
              subtitle="Setează parametrii pentru calculul costurilor"
            >
              <div className={styles.formGrid}>
                <Field
                  label={`Cost energie (${settings.currency}/oră)`}
                  hint="Costul unui kWh × puterea imprimantei"
                >
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.energyCostPerHour}
                    onChange={(e) =>
                      setS("energyCostPerHour")(Number(e.target.value))
                    }
                    placeholder="0.80"
                  />
                </Field>
                <Field
                  label="Adaos implicit (%)"
                  hint="Procentul adăugat automat la prețul de cost în comenzi"
                >
                  <div className={styles.inputWithSuffix}>
                    <input
                      className={styles.input}
                      type="number"
                      min="0"
                      max="1000"
                      value={settings.defaultMarkup}
                      onChange={(e) =>
                        setS("defaultMarkup")(Number(e.target.value))
                      }
                      placeholder="30"
                    />
                    <span className={styles.suffix}>%</span>
                  </div>
                </Field>
              </div>
              <div className={styles.infoBox}>
                <InfoIcon />
                <p>
                  Costul per gram se calculează automat din prețul filamentului
                  împărțit la greutatea totală.
                </p>
              </div>
            </Section>
          )}

          {activeTab === "alerts" && (
            <Section
              title="Alerte Stoc"
              subtitle="Configurează când să primești avertismente"
            >
              <div className={styles.formGrid}>
                <Field
                  label="Prag stoc scăzut (g)"
                  hint="Vei vedea avertismentul ⚠ când filamentul scade sub această valoare"
                >
                  <div className={styles.inputWithSuffix}>
                    <input
                      className={styles.input}
                      type="number"
                      min="0"
                      step="10"
                      value={settings.lowStockThreshold}
                      onChange={(e) =>
                        setS("lowStockThreshold")(Number(e.target.value))
                      }
                      placeholder="100"
                    />
                    <span className={styles.suffix}>g</span>
                  </div>
                </Field>
              </div>
              <div className={styles.previewBox}>
                <div className={styles.previewLabel}>Previzualizare</div>
                <div className={styles.previewAlert}>
                  <span>⚠</span>
                  <span>
                    Filament sub <strong>{settings.lowStockThreshold}g</strong>{" "}
                    — stoc scăzut!
                  </span>
                </div>
              </div>
            </Section>
          )}

          {activeTab === "data" && (
            <Section
              title="Export & Import"
              subtitle="Fă backup sau restaurează datele aplicației"
            >
              <div className={styles.dataCards}>
                <div className={styles.dataCard}>
                  <div
                    className={styles.dataCardIcon}
                    style={{
                      background: "rgba(92,106,196,0.1)",
                      color: "#5c6ac4",
                    }}
                  >
                    <DownloadIcon />
                  </div>
                  <div className={styles.dataCardInfo}>
                    <div className={styles.dataCardTitle}>Export date</div>
                    <div className={styles.dataCardDesc}>
                      Descarcă un fișier JSON cu toate datele din Supabase.
                    </div>
                  </div>
                  <button className={styles.exportBtn} onClick={handleExport}>
                    <DownloadIcon /> Exportă JSON
                  </button>
                </div>

                <div
                  className={styles.dataCard}
                  style={{ borderColor: "rgba(239,68,68,0.2)" }}
                >
                  <div
                    className={styles.dataCardIcon}
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      color: "#ef4444",
                    }}
                  >
                    <TrashIcon />
                  </div>
                  <div className={styles.dataCardInfo}>
                    <div className={styles.dataCardTitle}>Resetează datele</div>
                    <div className={styles.dataCardDesc}>
                      Șterge toate datele tale din Supabase. Ireversibil.
                    </div>
                  </div>
                  <button
                    className={styles.resetBtn}
                    onClick={() => setDeleteConfirm("all")}
                  >
                    Resetează tot
                  </button>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>

      {(printerModal === "add" || printerModal === "edit") && (
        <Modal
          title={
            printerModal === "add" ? "Adaugă imprimantă" : "Editează imprimantă"
          }
          onClose={() => setPrinterModal(null)}
        >
          <div className={styles.formGrid}>
            <Field label="Nume *">
              <input
                className={styles.input}
                value={printerForm.name}
                onChange={(e) =>
                  setPrinterForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Imprimanta 1, Ender 3..."
              />
            </Field>
            <Field label="Model">
              <input
                className={styles.input}
                value={printerForm.model}
                onChange={(e) =>
                  setPrinterForm((f) => ({ ...f, model: e.target.value }))
                }
                placeholder="Creality Ender 3 V2, Bambu X1C..."
              />
            </Field>
            <Field label="Status">
              <div className={styles.themeToggle}>
                <button
                  className={`${styles.themeBtn} ${printerForm.active ? styles.themeBtnActive : ""}`}
                  onClick={() =>
                    setPrinterForm((f) => ({ ...f, active: true }))
                  }
                >
                  ✅ Activă
                </button>
                <button
                  className={`${styles.themeBtn} ${!printerForm.active ? styles.themeBtnActive : ""}`}
                  onClick={() =>
                    setPrinterForm((f) => ({ ...f, active: false }))
                  }
                >
                  ⏸ Inactivă
                </button>
              </div>
            </Field>
          </div>
          <div className={styles.modalFooter}>
            {printerModal === "edit" && (
              <button
                className={styles.deleteBtn}
                onClick={() => setDeleteConfirm(currentPrinter.id)}
              >
                Șterge
              </button>
            )}
            <button
              className={styles.cancelBtn}
              onClick={() => setPrinterModal(null)}
            >
              Anulează
            </button>
            <button className={styles.saveBtnModal} onClick={savePrinter}>
              {printerModal === "add" ? "Adaugă" : "Salvează"}
            </button>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Confirmare" onClose={() => setDeleteConfirm(null)} small>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginBottom: 20,
            }}
          >
            {deleteConfirm === "all"
              ? "Ești sigur că vrei să ștergi TOATE datele? Această acțiune nu poate fi anulată."
              : "Ești sigur că vrei să ștergi această imprimantă?"}
          </p>
          <div className={styles.modalFooter}>
            <button
              className={styles.cancelBtn}
              onClick={() => setDeleteConfirm(null)}
            >
              Anulează
            </button>
            <button
              className={styles.deleteBtn}
              onClick={() => {
                if (deleteConfirm === "all") handleResetAll();
                else deletePrinter(deleteConfirm);
              }}
            >
              {deleteConfirm === "all" ? "Șterge tot" : "Șterge definitiv"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Section({ title, subtitle, children, action }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {subtitle && <p className={styles.sectionSub}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
      {hint && <p className={styles.fieldHint}>{hint}</p>}
    </div>
  );
}

function Modal({ title, children, onClose, small }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${small ? styles.modalSmall : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const EditIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const DownloadIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const TrashIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const InfoIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const BuildingIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 9h1v1H9z" />
    <path d="M14 9h1v1h-1z" />
    <path d="M9 14h1v1H9z" />
    <path d="M14 14h1v1h-1z" />
    <path d="M9 19v2" />
    <path d="M15 19v2" />
  </svg>
);
const PrinterIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);
const CoinsIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="M16.71 13.88L17 15l-1.12.29" />
  </svg>
);
const BellIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const DatabaseIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);
