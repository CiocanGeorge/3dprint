import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import styles from "./FilamentPage.module.css";

const MATERIALS = [
  "PLA",
  "PETG",
  "ABS",
  "TPU",
  "ASA",
  "Resin",
  "Nylon",
  "PLA+",
  "CF-PLA",
  "Altul",
];

const EMPTY_FORM = {
  brand: "",
  material: "PLA",
  colorName: "",
  color: "#5c6ac4",
  weight: 1000,
  remaining: 1000,
  price: "",
  notes: "",
  purchaseDate: "",
};

// Mapează din Supabase (snake_case) → app (camelCase)
function fromDB(row) {
  return {
    id: row.id,
    brand: row.brand,
    material: row.material,
    colorName: row.color_name,
    color: row.color,
    weight: row.weight,
    remaining: row.remaining,
    price: row.price,
    notes: row.notes,
    purchaseDate: row.purchase_date,
    createdAt: row.created_at,
  };
}

// Mapează din app → Supabase
function toDB(form, userId) {
  return {
    user_id: userId,
    brand: form.brand,
    material: form.material,
    color_name: form.colorName,
    color: form.color,
    weight: Number(form.weight),
    remaining: Number(form.remaining),
    price: form.price ? Number(form.price) : null,
    notes: form.notes || null,
    purchase_date: form.purchaseDate || null,
  };
}

export function FilamentPage() {
  const { user } = useAuth();
  const [filaments, setFilaments] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modal, setModal] = useState(null);
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filterMat, setFilterMat] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Încarcă filamentele din Supabase
  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    supabase
      .from("filaments")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setFilaments(data.map(fromDB));
        setLoadingData(false);
      });
  }, [user]);

  const filtered = filaments
    .filter((f) => {
      const q = search.toLowerCase();
      return (
        (!q ||
          f.brand.toLowerCase().includes(q) ||
          f.colorName.toLowerCase().includes(q) ||
          f.material.toLowerCase().includes(q)) &&
        (!filterMat || f.material === filterMat)
      );
    })
    .sort((a, b) => {
      if (sortBy === "date")
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "remaining") return a.remaining - b.remaining;
      if (sortBy === "brand") return a.brand.localeCompare(b.brand);
      return 0;
    });

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setCurrent(null);
    setModal("add");
  };
  const openEdit = (f) => {
    setForm({ ...f });
    setCurrent(f);
    setModal("edit");
  };
  const openView = (f) => {
    setCurrent(f);
    setModal("view");
  };

  const handleSave = async () => {
    if (!form.brand.trim() || !form.colorName.trim()) return;
    setSaving(true);
    if (current) {
      const { data, error } = await supabase
        .from("filaments")
        .update(toDB(form, user.id))
        .eq("id", current.id)
        .select()
        .single();
      if (!error)
        setFilaments((fs) =>
          fs.map((f) => (f.id === current.id ? fromDB(data) : f)),
        );
    } else {
      const { data, error } = await supabase
        .from("filaments")
        .insert(toDB(form, user.id))
        .select()
        .single();
      if (!error) setFilaments((fs) => [fromDB(data), ...fs]);
    }
    setSaving(false);
    setModal(null);
  };

  const handleDelete = async (id) => {
    await supabase.from("filaments").delete().eq("id", id);
    setFilaments((fs) => fs.filter((f) => f.id !== id));
    setDeleteConfirm(null);
    setModal(null);
  };

  const updateRemaining = async (id, delta) => {
    const f = filaments.find((f) => f.id === id);
    if (!f) return;
    const newRemaining = Math.max(0, Math.min(f.weight, f.remaining + delta));
    const { data, error } = await supabase
      .from("filaments")
      .update({ remaining: newRemaining })
      .eq("id", id)
      .select()
      .single();
    if (!error)
      setFilaments((fs) => fs.map((f) => (f.id === id ? fromDB(data) : f)));
  };

  const setF = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

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
          <h1 className={styles.title}>Stoc Filamente</h1>
          <p className={styles.sub}>{filaments.length} role înregistrate</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <PlusIcon /> Adaugă rolă
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <SearchIcon />
          <input
            className={styles.search}
            placeholder="Caută brand, culoare..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterMat}
          onChange={(e) => setFilterMat(e.target.value)}
        >
          <option value="">Toate materialele</option>
          {MATERIALS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date">Sortează: Dată</option>
          <option value="remaining">Sortează: Cantitate</option>
          <option value="brand">Sortează: Brand</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🧵</div>
          <h3>
            {filaments.length === 0
              ? "Nu ai niciun filament înregistrat"
              : "Niciun rezultat"}
          </h3>
          <p>
            {filaments.length === 0
              ? "Adaugă prima rolă de filament din stocul tău."
              : "Încearcă altă căutare."}
          </p>
          {filaments.length === 0 && (
            <button className={styles.addBtn} onClick={openAdd}>
              Adaugă rolă
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((f) => (
            <FilamentCard
              key={f.id}
              f={f}
              onEdit={() => openEdit(f)}
              onView={() => openView(f)}
              onAdd={() => updateRemaining(f.id, 10)}
              onSub={() => updateRemaining(f.id, -10)}
            />
          ))}
        </div>
      )}

      {(modal === "add" || modal === "edit") && (
        <Modal
          title={modal === "add" ? "Adaugă rolă nouă" : "Editează rolă"}
          onClose={() => setModal(null)}
        >
          <div className={styles.formGrid}>
            <Field label="Brand *">
              <input
                className={styles.input}
                value={form.brand}
                onChange={(e) => setF("brand")(e.target.value)}
                placeholder="Bambu Lab, Prusa, eSUN..."
              />
            </Field>
            <Field label="Material">
              <select
                className={styles.input}
                value={form.material}
                onChange={(e) => setF("material")(e.target.value)}
              >
                {MATERIALS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Culoare *">
              <input
                className={styles.input}
                value={form.colorName}
                onChange={(e) => setF("colorName")(e.target.value)}
                placeholder="Roșu Aprins, Galaxy Black..."
              />
            </Field>
            <Field label="Cod culoare">
              <div className={styles.colorRow}>
                <input
                  type="color"
                  className={styles.colorPicker}
                  value={form.color}
                  onChange={(e) => setF("color")(e.target.value)}
                />
                <input
                  className={styles.input}
                  value={form.color}
                  onChange={(e) => setF("color")(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </Field>
            <Field label="Greutate totală (g)">
              <input
                className={styles.input}
                type="number"
                min="0"
                value={form.weight}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setF("weight")(v);
                  setF("remaining")(v);
                }}
              />
            </Field>
            <Field label="Cantitate rămasă (g)">
              <input
                className={styles.input}
                type="number"
                min="0"
                max={form.weight}
                value={form.remaining}
                onChange={(e) => setF("remaining")(e.target.value)}
              />
            </Field>
            <Field label="Preț (RON)">
              <input
                className={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setF("price")(e.target.value)}
                placeholder="89.99"
              />
            </Field>
            <Field label="Dată achiziție">
              <input
                className={styles.input}
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setF("purchaseDate")(e.target.value)}
              />
            </Field>
            <Field label="Note" wide>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                value={form.notes}
                onChange={(e) => setF("notes")(e.target.value)}
                placeholder="Observații, link magazin..."
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
            Ești sigur că vrei să ștergi această rolă? Acțiunea nu poate fi
            anulată.
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

function FilamentCard({ f, onEdit, onView, onAdd, onSub }) {
  const pct = Math.min(100, (f.remaining / f.weight) * 100);
  const isLow = f.remaining < 100;
  return (
    <div
      className={`${styles.card} ${isLow ? styles.cardLow : ""}`}
      onClick={onView}
    >
      <div className={styles.cardHeader}>
        <div
          className={styles.cardColor}
          style={{ background: f.color || "#888" }}
        />
        <div className={styles.cardMeta}>
          <div className={styles.cardBrand}>{f.brand}</div>
          <div className={styles.cardSub}>
            {f.material} · {f.colorName}
          </div>
        </div>
        <button
          className={styles.editBtn}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <EditIcon />
        </button>
      </div>
      <div className={styles.cardProgress}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${pct}%`,
              background: isLow ? "#ef4444" : f.color || "var(--accent)",
            }}
          />
        </div>
        <div className={styles.progressLabel}>
          <span className={isLow ? styles.lowText : ""}>{f.remaining}g</span>
          <span className={styles.totalText}>/ {f.weight}g</span>
        </div>
      </div>
      <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
        <button className={styles.qtyBtn} onClick={onSub}>
          −10g
        </button>
        <span className={styles.qtyPct}>{Math.round(pct)}%</span>
        <button className={styles.qtyBtn} onClick={onAdd}>
          +10g
        </button>
      </div>
      {isLow && <div className={styles.lowBadge}>⚠ Stoc scăzut</div>}
      {f.price && <div className={styles.priceBadge}>{f.price} RON</div>}
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
