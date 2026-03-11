import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import styles from "./PrintsPage.module.css";

const STATUSES = ["finalizat", "esuat", "in_curs"];
const STATUS_LABELS = {
  finalizat: "Finalizat",
  esuat: "Eșuat",
  in_curs: "În curs",
};
const STATUS_COLORS = { finalizat: "green", esuat: "red", in_curs: "blue" };

function fromDB(row) {
  return {
    id: row.id,
    name: row.name,
    printerId: row.printer_id || "",
    filamentEntries: row.filament_entries || [],
    durationMin: row.duration_min || 0,
    status: row.status,
    date: row.date,
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

function toDB(form, userId) {
  return {
    user_id: userId,
    name: form.name,
    printer_id: form.printerId || null,
    filament_entries: form.filamentEntries || [],
    duration_min: Number(form.durationMin) || 0,
    status: form.status,
    date: form.date,
    notes: form.notes || null,
  };
}

const EMPTY_FORM = {
  name: "",
  printerId: "",
  filamentEntries: [],
  durationMin: "",
  status: "finalizat",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

export function PrintsPage() {
  const { user } = useAuth();
  const [prints, setPrints] = useState([]);
  const [filaments, setFilaments] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modal, setModal] = useState(null);
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPrinter, setFilterPrinter] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Încarcă toate datele din Supabase
  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    Promise.all([
      supabase.from("prints").select("*").order("date", { ascending: false }),
      supabase
        .from("filaments")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("printers")
        .select("*")
        .order("created_at", { ascending: false }),
    ]).then(([printsRes, filamentsRes, printersRes]) => {
      if (!printsRes.error) setPrints(printsRes.data.map(fromDB));
      if (!filamentsRes.error)
        setFilaments(
          filamentsRes.data.map((f) => ({
            id: f.id,
            brand: f.brand,
            material: f.material,
            colorName: f.color_name,
            color: f.color,
            weight: f.weight,
            remaining: f.remaining,
          })),
        );
      if (!printersRes.error)
        setPrinters(
          printersRes.data.map((p) => ({
            id: p.id,
            name: p.name,
            model: p.model,
            active: p.active,
          })),
        );
      setLoadingData(false);
    });
  }, [user]);

  const filtered = prints
    .filter((p) => {
      const q = search.toLowerCase();
      return (
        (!q || p.name.toLowerCase().includes(q)) &&
        (!filterStatus || p.status === filterStatus) &&
        (!filterPrinter || p.printerId === filterPrinter)
      );
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalGrams = prints
    .filter((p) => p.status === "finalizat")
    .reduce(
      (s, p) =>
        s +
        (p.filamentEntries || []).reduce(
          (a, e) => a + (Number(e.grams) || 0),
          0,
        ),
      0,
    );
  const totalPrints = prints.filter((p) => p.status === "finalizat").length;
  const inProgress = prints.filter((p) => p.status === "in_curs").length;

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setCurrent(null);
    setModal("add");
  };
  const openEdit = (p) => {
    setForm({ ...p });
    setCurrent(p);
    setModal("edit");
  };

  // Actualizează remaining filament în Supabase
  const applyFilamentDelta = async (filamentId, delta) => {
    if (!filamentId || delta === 0) return;
    const fil = filaments.find((f) => f.id === filamentId);
    if (!fil) return;
    const newRemaining = Math.max(0, fil.remaining + delta);
    const { data } = await supabase
      .from("filaments")
      .update({ remaining: newRemaining })
      .eq("id", filamentId)
      .select()
      .single();
    if (data) {
      setFilaments((fs) =>
        fs.map((f) =>
          f.id === filamentId ? { ...f, remaining: data.remaining } : f,
        ),
      );
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    if (current) {
      // Restaurează gramele vechii imprimări dacă era finalizată
      if (current.status === "finalizat") {
        for (const e of current.filamentEntries || []) {
          await applyFilamentDelta(e.filamentId, +(Number(e.grams) || 0));
        }
      }
      // Scade gramele noii imprimări dacă e finalizată
      if (form.status === "finalizat") {
        for (const e of form.filamentEntries || []) {
          await applyFilamentDelta(e.filamentId, -(Number(e.grams) || 0));
        }
      }
      const { data, error } = await supabase
        .from("prints")
        .update(toDB(form, user.id))
        .eq("id", current.id)
        .select()
        .single();
      if (!error)
        setPrints((ps) =>
          ps.map((p) => (p.id === current.id ? fromDB(data) : p)),
        );
    } else {
      const { data, error } = await supabase
        .from("prints")
        .insert(toDB(form, user.id))
        .select()
        .single();
      if (!error) {
        setPrints((ps) => [fromDB(data), ...ps]);
        if (form.status === "finalizat") {
          for (const e of form.filamentEntries || []) {
            await applyFilamentDelta(e.filamentId, -(Number(e.grams) || 0));
          }
        }
      }
    }

    setSaving(false);
    setModal(null);
  };

  const handleDelete = async (id) => {
    const print = prints.find((p) => p.id === id);
    if (print?.status === "finalizat") {
      for (const e of print.filamentEntries || []) {
        await applyFilamentDelta(e.filamentId, +(Number(e.grams) || 0));
      }
    }
    await supabase.from("prints").delete().eq("id", id);
    setPrints((ps) => ps.filter((p) => p.id !== id));
    setDeleteConfirm(null);
    setModal(null);
  };

  const setF = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const getFilament = (id) => filaments.find((f) => f.id === id);
  const getPrinter = (id) => printers.find((p) => p.id === id);
  const activePrinters = printers.filter((p) => p.active);

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
          <h1 className={styles.title}>Imprimări</h1>
          <p className={styles.sub}>{prints.length} imprimări înregistrate</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <PlusIcon /> Adaugă imprimare
        </button>
      </div>

      <div className={styles.statsGrid}>
        <StatCard
          icon="✅"
          label="Finalizate"
          value={totalPrints}
          color="green"
        />
        <StatCard
          icon="⚖️"
          label="Filament consumat"
          value={`${totalGrams.toLocaleString()}g`}
          color="violet"
        />
        <StatCard
          icon="🖨️"
          label="În curs"
          value={inProgress}
          color={inProgress > 0 ? "blue" : "indigo"}
        />
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <SearchIcon />
          <input
            className={styles.search}
            placeholder="Caută imprimare..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Toate statusurile</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {printers.length > 0 && (
          <select
            className={styles.filterSelect}
            value={filterPrinter}
            onChange={(e) => setFilterPrinter(e.target.value)}
          >
            <option value="">Toate imprimantele</option>
            {printers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🖨️</div>
          <h3>
            {prints.length === 0
              ? "Nicio imprimare înregistrată"
              : "Niciun rezultat"}
          </h3>
          <p>
            {prints.length === 0
              ? "Adaugă prima ta imprimare."
              : "Încearcă altă căutare."}
          </p>
          {prints.length === 0 && (
            <button className={styles.addBtn} onClick={openAdd}>
              Adaugă imprimare
            </button>
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((pr) => {
            const printer = getPrinter(pr.printerId);
            const filEntries = pr.filamentEntries || [];
            const totalG = filEntries.reduce(
              (s, e) => s + (Number(e.grams) || 0),
              0,
            );
            const filNames = filEntries
              .map((e) => {
                const f = getFilament(e.filamentId);
                return f ? `${f.brand} ${f.material} · ${f.colorName}` : null;
              })
              .filter(Boolean);

            return (
              <div key={pr.id} className={styles.row}>
                <div className={styles.rowLeft}>
                  <div className={styles.rowIconWrap}>
                    {filEntries.length > 0 ? (
                      <div className={styles.colorDots}>
                        {filEntries.slice(0, 3).map((e, i) => {
                          const f = getFilament(e.filamentId);
                          return (
                            <div
                              key={i}
                              className={styles.colorDot}
                              style={{
                                background: f?.color || "#888",
                                zIndex: filEntries.length - i,
                              }}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        className={styles.rowIcon}
                        style={{ background: "var(--accent-soft)" }}
                      >
                        🖨️
                      </div>
                    )}
                  </div>
                  <div className={styles.rowInfo}>
                    <div className={styles.rowName}>{pr.name}</div>
                    <div className={styles.rowMeta}>
                      {filNames.length > 0
                        ? filNames.join(", ")
                        : "Fără filament"}
                      {totalG > 0 && ` · ${totalG}g`}
                      {pr.durationMin > 0 &&
                        ` · ${formatDuration(pr.durationMin)}`}
                      {printer && (
                        <span className={styles.printerTag}>
                          <PrinterMiniIcon /> {printer.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.rowRight}>
                  {totalG > 0 && (
                    <span className={styles.grams}>{totalG}g</span>
                  )}
                  <span
                    className={`${styles.statusBadge} ${styles["status_" + STATUS_COLORS[pr.status]]}`}
                  >
                    {STATUS_LABELS[pr.status]}
                  </span>
                  <span className={styles.rowDate}>
                    {new Date(pr.date).toLocaleDateString("ro-RO")}
                  </span>
                  <button
                    className={styles.editBtn}
                    onClick={() => openEdit(pr)}
                  >
                    <EditIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(modal === "add" || modal === "edit") && (
        <Modal
          title={modal === "add" ? "Adaugă imprimare" : "Editează imprimare"}
          onClose={() => setModal(null)}
        >
          <div className={styles.formGrid}>
            <Field label="Nume model *" wide>
              <input
                className={styles.input}
                value={form.name}
                onChange={(e) => setF("name")(e.target.value)}
                placeholder="Vaza decorativă, suport telefon..."
              />
            </Field>

            <Field label="Imprimantă">
              <select
                className={styles.input}
                value={form.printerId}
                onChange={(e) => setF("printerId")(e.target.value)}
              >
                <option value="">— Selectează —</option>
                {activePrinters.length > 0 ? (
                  activePrinters.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.model ? ` · ${p.model}` : ""}
                    </option>
                  ))
                ) : (
                  <option disabled>Nicio imprimantă activă</option>
                )}
              </select>
              {activePrinters.length === 0 && (
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    margin: "4px 0 0",
                  }}
                >
                  Adaugă imprimante din Setări → Imprimante
                </p>
              )}
            </Field>

            <Field label="Filamente folosite" wide>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(form.filamentEntries || []).map((entry, i) => {
                  const fil = filaments.find((f) => f.id === entry.filamentId);
                  return (
                    <div
                      key={i}
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: fil?.color || "#888",
                          flexShrink: 0,
                        }}
                      />
                      <select
                        className={styles.input}
                        style={{ flex: 2 }}
                        value={entry.filamentId}
                        onChange={(e) => {
                          const updated = [...form.filamentEntries];
                          updated[i] = {
                            ...updated[i],
                            filamentId: e.target.value,
                          };
                          setF("filamentEntries")(updated);
                        }}
                      >
                        <option value="">— Selectează —</option>
                        {filaments.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.brand} {f.material} · {f.colorName} (
                            {f.remaining ?? f.weight}g)
                          </option>
                        ))}
                      </select>
                      <input
                        className={styles.input}
                        type="number"
                        min="0"
                        placeholder="g"
                        style={{ flex: 1 }}
                        value={entry.grams}
                        onChange={(e) => {
                          const updated = [...form.filamentEntries];
                          updated[i] = { ...updated[i], grams: e.target.value };
                          setF("filamentEntries")(updated);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setF("filamentEntries")(
                            form.filamentEntries.filter((_, j) => j !== i),
                          )
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#ef4444",
                          fontSize: 18,
                          lineHeight: 1,
                          padding: "0 4px",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() =>
                    setF("filamentEntries")([
                      ...(form.filamentEntries || []),
                      { filamentId: "", grams: "" },
                    ])
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "none",
                    border: "1.5px dashed var(--border)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    width: "100%",
                  }}
                >
                  <PlusIcon /> Adaugă filament
                </button>
                {(form.filamentEntries || []).length > 0 && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      textAlign: "right",
                      marginTop: 2,
                    }}
                  >
                    Total:{" "}
                    <strong>
                      {(form.filamentEntries || []).reduce(
                        (s, e) => s + (Number(e.grams) || 0),
                        0,
                      )}
                      g
                    </strong>
                  </div>
                )}
              </div>
            </Field>

            <Field label="Durată (minute)">
              <input
                className={styles.input}
                type="number"
                min="0"
                value={form.durationMin}
                onChange={(e) => setF("durationMin")(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Status">
              <select
                className={styles.input}
                value={form.status}
                onChange={(e) => setF("status")(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Dată">
              <input
                className={styles.input}
                type="date"
                value={form.date}
                onChange={(e) => setF("date")(e.target.value)}
              />
            </Field>
            <Field label="Note" wide>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                value={form.notes}
                onChange={(e) => setF("notes")(e.target.value)}
                placeholder="Observații..."
                rows={3}
              />
            </Field>
          </div>
          <div className={styles.modalFooter}>
            {modal === "edit" && (
              <button
                className={styles.deleteBtn}
                onClick={() => setDeleteConfirm(current.id)}
              >
                Șterge
              </button>
            )}
            <button className={styles.cancelBtn} onClick={() => setModal(null)}>
              Anulează
            </button>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? "Se salvează..."
                : modal === "add"
                  ? "Adaugă"
                  : "Salvează"}
            </button>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal
          title="Confirmare ștergere"
          onClose={() => setDeleteConfirm(null)}
          small
        >
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginBottom: 20,
            }}
          >
            Ești sigur că vrei să ștergi această imprimare?
            {(() => {
              const p = prints.find((p) => p.id === deleteConfirm);
              const g = (p?.filamentEntries || []).reduce(
                (s, e) => s + (Number(e.grams) || 0),
                0,
              );
              return p?.status === "finalizat" && g > 0
                ? ` Gramele consumate (${g}g) vor fi restaurate în stocul filamentelor.`
                : null;
            })()}
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
              onClick={() => handleDelete(deleteConfirm)}
            >
              Șterge definitiv
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function formatDuration(min) {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60),
    m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
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

function Field({ label, children, wide }) {
  return (
    <div className={`${styles.field} ${wide ? styles.fieldWide : ""}`}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
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
const SearchIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
const PrinterMiniIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);
