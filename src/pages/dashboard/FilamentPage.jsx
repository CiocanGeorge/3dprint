import React, { useState, useEffect } from "react";
import styles from "./FilamentPage.module.css";

const STORAGE_KEY = "ms_filaments";
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
const WEIGHTS = [250, 500, 1000, 2000];

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function save(d) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

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

export function FilamentPage() {
  const [filaments, setFilaments] = useState(load);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'view'
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filterMat, setFilterMat] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    save(filaments);
  }, [filaments]);

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
      if (sortBy === "remaining")
        return (a.remaining ?? a.weight) - (b.remaining ?? b.weight);
      if (sortBy === "brand") return a.brand.localeCompare(b.brand);
      return 0;
    });

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setCurrent(null);
    setModal("add");
  };
  const openEdit = (f) => {
    setForm({ ...f, remaining: f.remaining ?? f.weight });
    setCurrent(f);
    setModal("edit");
  };
  const openView = (f) => {
    setCurrent(f);
    setModal("view");
  };

  const handleSave = () => {
    if (!form.brand.trim() || !form.colorName.trim()) return;
    if (current) {
      setFilaments((fs) =>
        fs.map((f) => (f.id === current.id ? { ...f, ...form } : f)),
      );
    } else {
      setFilaments((fs) => [
        ...fs,
        {
          ...form,
          id: uid(),
          weight: Number(form.weight),
          remaining: Number(form.remaining ?? form.weight),
          price: form.price ? Number(form.price) : null,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setModal(null);
  };

  const handleDelete = (id) => {
    setFilaments((fs) => fs.filter((f) => f.id !== id));
    setDeleteConfirm(null);
    setModal(null);
  };

  const updateRemaining = (id, delta) => {
    setFilaments((fs) =>
      fs.map((f) =>
        f.id === id
          ? {
              ...f,
              remaining: Math.max(
                0,
                Math.min(f.weight, (f.remaining ?? f.weight) + delta),
              ),
            }
          : f,
      ),
    );
  };

  const setF = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

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

      {/* Filters */}
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

      {/* Grid */}
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

      {/* Modal add/edit */}
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
                step="1000"
                value={form.weight}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setF("weight")(val);
                  setF("remaining")(val);
                }}
                placeholder="ex: 1000, 5000, 10000..."
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
            <button className={styles.saveBtn} onClick={handleSave}>
              {modal === "add" ? "Adaugă" : "Salvează"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
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
  const remaining = f.remaining ?? f.weight;
  const pct = Math.min(100, (remaining / f.weight) * 100);
  const isLow = remaining < 100;

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
          <span className={isLow ? styles.lowText : ""}>{remaining}g</span>
          <span className={styles.totalText}>/ {f.weight}g</span>
        </div>
      </div>

      <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
        <button className={styles.qtyBtn} onClick={onSub} title="-10g">
          −10g
        </button>
        <span className={styles.qtyPct}>{Math.round(pct)}%</span>
        <button className={styles.qtyBtn} onClick={onAdd} title="+10g">
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
