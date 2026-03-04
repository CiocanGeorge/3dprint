import React, { useState, useEffect } from 'react';
import styles from './OrdersPage.module.css';

const STORAGE_KEY = 'ms_orders';

const STATUSES = ['pending', 'confirmata', 'livrata', 'anulata'];
const STATUS_LABELS = { pending: 'În așteptare', confirmata: 'Confirmată', livrata: 'Livrată', anulata: 'Anulată' };
const STATUS_COLORS = { pending: 'orange', confirmata: 'blue', livrata: 'green', anulata: 'red' };

// 'supplier' = comandă filament de la furnizor
// 'client'   = comandă primită de la client
const TYPES = ['supplier', 'client'];
const TYPE_LABELS = { supplier: 'Furnizor', client: 'Client' };

function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function save(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function uid()   { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

const EMPTY_FORM = {
  type: 'supplier', counterparty: '', description: '',
  totalRON: '', status: 'pending',
  orderDate: new Date().toISOString().slice(0, 10),
  deliveryDate: '', notes: ''
};

export function OrdersPage() {
  const [orders, setOrders]       = useState(load);
  const [modal, setModal]         = useState(null);
  const [current, setCurrent]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType]     = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { save(orders); }, [orders]);

  const filtered = orders
    .filter(o => {
      const q = search.toLowerCase();
      return (!q || o.counterparty.toLowerCase().includes(q) || o.description.toLowerCase().includes(q))
        && (!filterStatus || o.status === filterStatus)
        && (!filterType   || o.type   === filterType);
    })
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  // Stats
  const totalSupplier = orders.filter(o => o.type === 'supplier').length;
  const totalClient   = orders.filter(o => o.type === 'client').length;
  const pending       = orders.filter(o => o.status === 'pending').length;
  const revenueRON    = orders
    .filter(o => o.type === 'client' && o.status === 'livrata')
    .reduce((s, o) => s + Number(o.totalRON || 0), 0);
  const spendRON      = orders
    .filter(o => o.type === 'supplier' && o.status === 'livrata')
    .reduce((s, o) => s + Number(o.totalRON || 0), 0);

  const openAdd  = (defaultType) => { setForm({ ...EMPTY_FORM, type: defaultType || 'supplier' }); setCurrent(null); setModal('add'); };
  const openEdit = o => { setForm({ ...o }); setCurrent(o); setModal('edit'); };

  const handleSave = () => {
    if (!form.counterparty.trim()) return;
    const entry = { ...form, totalRON: Number(form.totalRON) || 0 };
    if (current) {
      setOrders(os => os.map(o => o.id === current.id ? { ...o, ...entry } : o));
    } else {
      setOrders(os => [...os, { ...entry, id: uid(), createdAt: new Date().toISOString() }]);
    }
    setModal(null);
  };

  const handleDelete = id => { setOrders(os => os.filter(o => o.id !== id)); setDeleteConfirm(null); setModal(null); };
  const setF = k => v => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Comenzi</h1>
          <p className={styles.sub}>{orders.length} comenzi înregistrate</p>
        </div>
        <div className={styles.headerBtns}>
          <button className={`${styles.addBtn} ${styles.addBtnSecondary}`} onClick={() => openAdd('supplier')}>
            <PlusIcon /> Comandă filament
          </button>
          <button className={styles.addBtn} onClick={() => openAdd('client')}>
            <PlusIcon /> Comandă client
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard icon="📥" label="Comenzi furnizori" value={totalSupplier} color="indigo" />
        <StatCard icon="📤" label="Comenzi clienți"   value={totalClient}   color="violet" />
        <StatCard icon="⏳" label="În așteptare"       value={pending}       color={pending > 0 ? 'orange' : 'green'} />
        <StatCard icon="💰" label="Venituri livrate"   value={`${revenueRON.toLocaleString()} RON`} color="green" />
        <StatCard icon="🛒" label="Cheltuieli livrate" value={`${spendRON.toLocaleString()} RON`}   color="red" />
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <SearchIcon />
          <input className={styles.search} placeholder="Caută furnizor, client, descriere..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={styles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Toate tipurile</option>
          {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
        <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Toate statusurile</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📦</div>
          <h3>{orders.length === 0 ? 'Nicio comandă înregistrată' : 'Niciun rezultat'}</h3>
          <p>{orders.length === 0 ? 'Adaugă prima comandă.' : 'Încearcă altă căutare.'}</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(o => (
            <div key={o.id} className={styles.row}>
              <div className={styles.rowLeft}>
                <div className={`${styles.typeChip} ${styles['type_' + o.type]}`}>
                  {o.type === 'supplier' ? '📥' : '📤'} {TYPE_LABELS[o.type]}
                </div>
                <div className={styles.rowInfo}>
                  <div className={styles.rowName}>{o.counterparty}</div>
                  {o.description && <div className={styles.rowMeta}>{o.description}</div>}
                </div>
              </div>
              <div className={styles.rowRight}>
                {o.totalRON > 0 && <span className={styles.price}>{Number(o.totalRON).toLocaleString()} RON</span>}
                <span className={`${styles.statusBadge} ${styles['status_' + STATUS_COLORS[o.status]]}`}>
                  {STATUS_LABELS[o.status]}
                </span>
                <span className={styles.rowDate}>{new Date(o.orderDate).toLocaleDateString('ro-RO')}</span>
                <button className={styles.editBtn} onClick={() => openEdit(o)}><EditIcon /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal add/edit */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Adaugă comandă' : 'Editează comandă'} onClose={() => setModal(null)}>
          <div className={styles.formGrid}>
            <Field label="Tip comandă">
              <div className={styles.typeBtns}>
                {TYPES.map(t => (
                  <button key={t} type="button"
                    className={`${styles.typeBtn} ${form.type === t ? styles.typeBtnActive : ''}`}
                    onClick={() => setF('type')(t)}>
                    {t === 'supplier' ? '📥' : '📤'} {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={form.type === 'supplier' ? 'Furnizor *' : 'Client *'}>
              <input className={styles.input} value={form.counterparty}
                onChange={e => setF('counterparty')(e.target.value)}
                placeholder={form.type === 'supplier' ? 'Bambu Lab, eSUN, Fiberlogy...' : 'Nume client...'} />
            </Field>
            <Field label="Descriere" wide>
              <input className={styles.input} value={form.description}
                onChange={e => setF('description')(e.target.value)}
                placeholder={form.type === 'supplier' ? '2x PLA 1kg negru, 1x PETG...' : 'Suport telefon personalizat...'} />
            </Field>
            <Field label="Total (RON)">
              <input className={styles.input} type="number" min="0" step="0.01"
                value={form.totalRON} onChange={e => setF('totalRON')(e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Status">
              <select className={styles.input} value={form.status} onChange={e => setF('status')(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </Field>
            <Field label="Dată comandă">
              <input className={styles.input} type="date" value={form.orderDate} onChange={e => setF('orderDate')(e.target.value)} />
            </Field>
            <Field label="Dată livrare estimată">
              <input className={styles.input} type="date" value={form.deliveryDate} onChange={e => setF('deliveryDate')(e.target.value)} />
            </Field>
            <Field label="Note" wide>
              <textarea className={`${styles.input} ${styles.textarea}`} value={form.notes}
                onChange={e => setF('notes')(e.target.value)} placeholder="Link comandă, număr AWB..." rows={3} />
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
            Ești sigur că vrei să ștergi această comandă?
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

function StatCard({ icon, label, value, color }) {
  const colors = {
    indigo: { bg: 'rgba(92,106,196,0.08)',  text: '#5c6ac4' },
    violet: { bg: 'rgba(138,107,191,0.08)', text: '#8a6bbf' },
    red:    { bg: 'rgba(220,38,38,0.08)',   text: '#dc2626' },
    green:  { bg: 'rgba(22,163,74,0.08)',   text: '#16a34a' },
    blue:   { bg: 'rgba(59,130,246,0.08)',  text: '#3b82f6' },
    orange: { bg: 'rgba(234,88,12,0.08)',   text: '#ea580c' },
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