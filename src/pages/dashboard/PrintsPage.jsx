import React, { useState, useEffect } from 'react';
import styles from './PrintsPage.module.css';

const STORAGE_KEY_PRINTS   = 'ms_prints';
const STORAGE_KEY_FILAMENTS = 'ms_filaments';

const STATUSES = ['finalizat', 'esuat', 'in_curs'];
const STATUS_LABELS = { finalizat: 'Finalizat', esuat: 'Eșuat', in_curs: 'În curs' };
const STATUS_COLORS = { finalizat: 'green', esuat: 'red', in_curs: 'blue' };

function load(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function save(key, d) { localStorage.setItem(key, JSON.stringify(d)); }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

const EMPTY_FORM = {
  name: '', filamentId: '', gramsUsed: '', durationMin: '',
  status: 'finalizat', date: new Date().toISOString().slice(0, 10), notes: ''
};

export function PrintsPage() {
  const [prints, setPrints]     = useState(() => load(STORAGE_KEY_PRINTS));
  const [filaments]             = useState(() => load(STORAGE_KEY_FILAMENTS));
  const [modal, setModal]       = useState(null);
  const [current, setCurrent]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { save(STORAGE_KEY_PRINTS, prints); }, [prints]);

  const filtered = prints
    .filter(p => {
      const q = search.toLowerCase();
      return (!q || p.name.toLowerCase().includes(q))
        && (!filterStatus || p.status === filterStatus);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalGrams = prints.filter(p => p.status === 'finalizat')
    .reduce((s, p) => s + Number(p.gramsUsed || 0), 0);
  const totalPrints = prints.filter(p => p.status === 'finalizat').length;
  const inProgress  = prints.filter(p => p.status === 'in_curs').length;

  const openAdd  = () => { setForm(EMPTY_FORM); setCurrent(null); setModal('add'); };
  const openEdit = p => { setForm({ ...p }); setCurrent(p); setModal('edit'); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const entry = {
      ...form,
      gramsUsed: Number(form.gramsUsed) || 0,
      durationMin: Number(form.durationMin) || 0,
    };
    if (current) {
      setPrints(ps => ps.map(p => p.id === current.id ? { ...p, ...entry } : p));
      // update filament remaining if grams changed
    } else {
      const newPrint = { ...entry, id: uid(), createdAt: new Date().toISOString() };
      setPrints(ps => [...ps, newPrint]);
    }
    setModal(null);
  };

  const handleDelete = id => { setPrints(ps => ps.filter(p => p.id !== id)); setDeleteConfirm(null); setModal(null); };

  const setF = k => v => setForm(f => ({ ...f, [k]: v }));

  const getFilament = id => filaments.find(f => f.id === id);

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

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard icon="✅" label="Finalizate" value={totalPrints} color="green" />
        <StatCard icon="⚖️" label="Filament consumat" value={`${totalGrams.toLocaleString()}g`} color="violet" />
        <StatCard icon="🖨️" label="În curs" value={inProgress} color={inProgress > 0 ? 'blue' : 'indigo'} />
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <SearchIcon />
          <input className={styles.search} placeholder="Caută imprimare..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Toate statusurile</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🖨️</div>
          <h3>{prints.length === 0 ? 'Nicio imprimare înregistrată' : 'Niciun rezultat'}</h3>
          <p>{prints.length === 0 ? 'Adaugă prima ta imprimare.' : 'Încearcă altă căutare.'}</p>
          {prints.length === 0 && <button className={styles.addBtn} onClick={openAdd}>Adaugă imprimare</button>}
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(p => {
            const fil = getFilament(p.filamentId);
            return (
              <div key={p.id} className={styles.row}>
                <div className={styles.rowLeft}>
                  <div className={styles.rowIcon} style={{ background: fil?.color || 'var(--accent-soft)' }}>
                    🖨️
                  </div>
                  <div className={styles.rowInfo}>
                    <div className={styles.rowName}>{p.name}</div>
                    <div className={styles.rowMeta}>
                      {fil ? `${fil.brand} ${fil.material} · ${fil.colorName}` : 'Filament necunoscut'}
                      {p.durationMin > 0 && ` · ${formatDuration(p.durationMin)}`}
                    </div>
                  </div>
                </div>
                <div className={styles.rowRight}>
                  {p.gramsUsed > 0 && <span className={styles.grams}>{p.gramsUsed}g</span>}
                  <span className={`${styles.statusBadge} ${styles['status_' + STATUS_COLORS[p.status]]}`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                  <span className={styles.rowDate}>{new Date(p.date).toLocaleDateString('ro-RO')}</span>
                  <button className={styles.editBtn} onClick={() => openEdit(p)}><EditIcon /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal add/edit */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Adaugă imprimare' : 'Editează imprimare'} onClose={() => setModal(null)}>
          <div className={styles.formGrid}>
            <Field label="Nume model *" wide>
              <input className={styles.input} value={form.name} onChange={e => setF('name')(e.target.value)} placeholder="Vaza decorativă, suport telefon..." />
            </Field>
            <Field label="Filament folosit">
              <select className={styles.input} value={form.filamentId} onChange={e => setF('filamentId')(e.target.value)}>
                <option value="">— Selectează —</option>
                {filaments.map(f => (
                  <option key={f.id} value={f.id}>{f.brand} {f.material} · {f.colorName}</option>
                ))}
              </select>
            </Field>
            <Field label="Filament consumat (g)">
              <input className={styles.input} type="number" min="0" value={form.gramsUsed}
                onChange={e => setF('gramsUsed')(e.target.value)} placeholder="0" />
            </Field>
            <Field label="Durată (minute)">
              <input className={styles.input} type="number" min="0" value={form.durationMin}
                onChange={e => setF('durationMin')(e.target.value)} placeholder="0" />
            </Field>
            <Field label="Status">
              <select className={styles.input} value={form.status} onChange={e => setF('status')(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </Field>
            <Field label="Dată">
              <input className={styles.input} type="date" value={form.date} onChange={e => setF('date')(e.target.value)} />
            </Field>
            <Field label="Note" wide>
              <textarea className={`${styles.input} ${styles.textarea}`} value={form.notes}
                onChange={e => setF('notes')(e.target.value)} placeholder="Observații..." rows={3} />
            </Field>
          </div>
          <div className={styles.modalFooter}>
            {modal === 'edit' && (
              <button className={styles.deleteBtn} onClick={() => setDeleteConfirm(current.id)}>Șterge</button>
            )}
            <button className={styles.cancelBtn} onClick={() => setModal(null)}>Anulează</button>
            <button className={styles.saveBtn} onClick={handleSave}>
              {modal === 'add' ? 'Adaugă' : 'Salvează'}
            </button>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Confirmare ștergere" onClose={() => setDeleteConfirm(null)} small>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Ești sigur că vrei să ștergi această imprimare?
          </p>
          <div className={styles.modalFooter}>
            <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>Anulează</button>
            <button className={styles.deleteBtn} onClick={() => handleDelete(deleteConfirm)}>Șterge definitiv</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function formatDuration(min) {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    indigo: { bg: 'rgba(92,106,196,0.08)',  text: '#5c6ac4' },
    violet: { bg: 'rgba(138,107,191,0.08)', text: '#8a6bbf' },
    red:    { bg: 'rgba(220,38,38,0.08)',   text: '#dc2626' },
    green:  { bg: 'rgba(22,163,74,0.08)',   text: '#16a34a' },
    blue:   { bg: 'rgba(59,130,246,0.08)',  text: '#3b82f6' },
  };
  const c = colors[color] || colors.indigo;
  return (
    <div className={styles.statCard} style={{ '--stat-bg': c.bg, '--stat-text': c.text }}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function Field({ label, children, wide }) {
  return (
    <div className={`${styles.field} ${wide ? styles.fieldWide : ''}`}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, children, onClose, small }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${small ? styles.modalSmall : ''}`} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

const PlusIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const EditIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;