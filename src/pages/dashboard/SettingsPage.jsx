import React, { useState, useEffect } from 'react';
import styles from './SettingsPage.module.css';

const STORAGE_KEY_SETTINGS  = 'ms_settings';
const STORAGE_KEY_PRINTERS  = 'ms_printers';

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || 'null') || DEFAULT_SETTINGS; }
  catch { return DEFAULT_SETTINGS; }
}
function loadPrinters() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_PRINTERS) || '[]'); }
  catch { return []; }
}
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

const DEFAULT_SETTINGS = {
  studioName: 'Monogram Studio',
  currency: 'RON',
  lowStockThreshold: 100,
  energyCostPerHour: 0.8,
  defaultMarkup: 30,
  theme: 'dark',
  language: 'ro',
};

const CURRENCIES = ['RON', 'EUR', 'USD', 'GBP'];
const PRINTER_EMPTY = { name: '', model: '', active: true };

export function SettingsPage() {
  const [settings, setSettings] = useState(loadSettings);
  const [printers, setPrinters] = useState(loadPrinters);
  const [activeTab, setActiveTab] = useState('studio');
  const [printerModal, setPrinterModal] = useState(null); // null | 'add' | 'edit'
  const [printerForm, setPrinterForm] = useState(PRINTER_EMPTY);
  const [currentPrinter, setCurrentPrinter] = useState(null);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PRINTERS, JSON.stringify(printers)); }, [printers]);

  const setS = k => v => setSettings(s => ({ ...s, [k]: v }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const openAddPrinter  = () => { setPrinterForm(PRINTER_EMPTY); setCurrentPrinter(null); setPrinterModal('add'); };
  const openEditPrinter = p  => { setPrinterForm({ ...p }); setCurrentPrinter(p); setPrinterModal('edit'); };

  const savePrinter = () => {
    if (!printerForm.name.trim()) return;
    if (currentPrinter) {
      setPrinters(ps => ps.map(p => p.id === currentPrinter.id ? { ...p, ...printerForm } : p));
    } else {
      setPrinters(ps => [...ps, { ...printerForm, id: uid(), createdAt: new Date().toISOString() }]);
    }
    setPrinterModal(null);
  };

  const deletePrinter = id => {
    setPrinters(ps => ps.filter(p => p.id !== id));
    setDeleteConfirm(null);
    setPrinterModal(null);
  };

  const togglePrinterActive = id => {
    setPrinters(ps => ps.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  // Export all data
  const handleExport = () => {
    const data = {
      settings,
      printers,
      filaments: JSON.parse(localStorage.getItem('ms_filaments') || '[]'),
      prints:    JSON.parse(localStorage.getItem('ms_prints')    || '[]'),
      orders:    JSON.parse(localStorage.getItem('ms_orders')    || '[]'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `monogram-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Import data
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.settings)  { localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data.settings)); setSettings(data.settings); }
        if (data.printers)  { localStorage.setItem(STORAGE_KEY_PRINTERS, JSON.stringify(data.printers)); setPrinters(data.printers); }
        if (data.filaments) localStorage.setItem('ms_filaments', JSON.stringify(data.filaments));
        if (data.prints)    localStorage.setItem('ms_prints',    JSON.stringify(data.prints));
        if (data.orders)    localStorage.setItem('ms_orders',    JSON.stringify(data.orders));
        alert('Date importate cu succes! Reîncarcă pagina pentru a vedea modificările.');
      } catch { alert('Fișier invalid.'); }
    };
    reader.readAsText(file);
  };

  const TABS = [
    { id: 'studio',    label: 'Studio',     icon: <BuildingIcon /> },
    { id: 'printers',  label: 'Imprimante', icon: <PrinterIcon /> },
    { id: 'costs',     label: 'Costuri',    icon: <CoinsIcon /> },
    { id: 'alerts',    label: 'Alerte',     icon: <BellIcon /> },
    { id: 'data',      label: 'Date',       icon: <DatabaseIcon /> },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Setări</h1>
          <p className={styles.sub}>Configurează aplicația după preferințele tale</p>
        </div>
        <button className={`${styles.saveBtn} ${saved ? styles.saveBtnSuccess : ''}`} onClick={handleSave}>
          {saved ? <><CheckIcon /> Salvat</> : 'Salvează modificările'}
        </button>
      </div>

      <div className={styles.layout}>
        {/* Tabs sidebar */}
        <nav className={styles.tabs}>
          {TABS.map(t => (
            <button key={t.id}
              className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.id)}>
              <span className={styles.tabIcon}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className={styles.content}>

          {/* STUDIO */}
          {activeTab === 'studio' && (
            <Section title="Profil Studio" subtitle="Informații despre studio-ul tău">
              <div className={styles.formGrid}>
                <Field label="Nume studio">
                  <input className={styles.input} value={settings.studioName}
                    onChange={e => setS('studioName')(e.target.value)} placeholder="Monogram Studio" />
                </Field>
                <Field label="Monedă">
                  <select className={styles.input} value={settings.currency} onChange={e => setS('currency')(e.target.value)}>
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Limbă">
                  <select className={styles.input} value={settings.language} onChange={e => setS('language')(e.target.value)}>
                    <option value="ro">Română</option>
                    <option value="en">English</option>
                  </select>
                </Field>
                <Field label="Temă">
                  <div className={styles.themeToggle}>
                    {['dark', 'light'].map(t => (
                      <button key={t}
                        className={`${styles.themeBtn} ${settings.theme === t ? styles.themeBtnActive : ''}`}
                        onClick={() => setS('theme')(t)}>
                        {t === 'dark' ? '🌙 Întunecată' : '☀️ Luminoasă'}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </Section>
          )}

          {/* PRINTERS */}
          {activeTab === 'printers' && (
            <Section title="Imprimante" subtitle="Gestionează imprimantele din atelier"
              action={<button className={styles.addBtn} onClick={openAddPrinter}><PlusIcon /> Adaugă</button>}>
              {printers.length === 0 ? (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon}>🖨️</span>
                  <p>Nicio imprimantă adăugată încă.</p>
                  <button className={styles.addBtn} onClick={openAddPrinter}><PlusIcon /> Adaugă imprimantă</button>
                </div>
              ) : (
                <div className={styles.printerList}>
                  {printers.map(p => (
                    <div key={p.id} className={`${styles.printerRow} ${!p.active ? styles.printerInactive : ''}`}>
                      <div className={styles.printerIcon}>🖨️</div>
                      <div className={styles.printerInfo}>
                        <div className={styles.printerName}>{p.name}</div>
                        {p.model && <div className={styles.printerModel}>{p.model}</div>}
                      </div>
                      <div className={styles.printerActions}>
                        <button
                          className={`${styles.statusPill} ${p.active ? styles.statusActive : styles.statusInactive}`}
                          onClick={() => togglePrinterActive(p.id)}>
                          {p.active ? 'Activă' : 'Inactivă'}
                        </button>
                        <button className={styles.iconBtn} onClick={() => openEditPrinter(p)}><EditIcon /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* COSTS */}
          {activeTab === 'costs' && (
            <Section title="Costuri & Prețuri" subtitle="Setează parametrii pentru calculul costurilor">
              <div className={styles.formGrid}>
                <Field label={`Cost energie (${settings.currency}/oră)`} hint="Costul unui kWh × puterea imprimantei">
                  <input className={styles.input} type="number" min="0" step="0.01"
                    value={settings.energyCostPerHour}
                    onChange={e => setS('energyCostPerHour')(Number(e.target.value))}
                    placeholder="0.80" />
                </Field>
                <Field label="Adaos implicit (%)" hint="Procentul adăugat automat la prețul de cost în comenzi">
                  <div className={styles.inputWithSuffix}>
                    <input className={styles.input} type="number" min="0" max="1000"
                      value={settings.defaultMarkup}
                      onChange={e => setS('defaultMarkup')(Number(e.target.value))}
                      placeholder="30" />
                    <span className={styles.suffix}>%</span>
                  </div>
                </Field>
              </div>
              <div className={styles.infoBox}>
                <InfoIcon />
                <p>Costul per gram se calculează automat din prețul filamentului împărțit la greutatea totală. Aceste setări sunt folosite pentru estimarea prețului în comenzi.</p>
              </div>
            </Section>
          )}

          {/* ALERTS */}
          {activeTab === 'alerts' && (
            <Section title="Alerte Stoc" subtitle="Configurează când să primești avertismente">
              <div className={styles.formGrid}>
                <Field label="Prag stoc scăzut (g)" hint="Vei vedea avertismentul ⚠ când filamentul scade sub această valoare">
                  <div className={styles.inputWithSuffix}>
                    <input className={styles.input} type="number" min="0" step="10"
                      value={settings.lowStockThreshold}
                      onChange={e => setS('lowStockThreshold')(Number(e.target.value))}
                      placeholder="100" />
                    <span className={styles.suffix}>g</span>
                  </div>
                </Field>
              </div>
              <div className={styles.previewBox}>
                <div className={styles.previewLabel}>Previzualizare</div>
                <div className={styles.previewAlert}>
                  <span>⚠</span>
                  <span>Filament sub <strong>{settings.lowStockThreshold}g</strong> — stoc scăzut!</span>
                </div>
              </div>
            </Section>
          )}

          {/* DATA */}
          {activeTab === 'data' && (
            <Section title="Export & Import" subtitle="Fă backup sau restaurează datele aplicației">
              <div className={styles.dataCards}>
                <div className={styles.dataCard}>
                  <div className={styles.dataCardIcon} style={{ background: 'rgba(92,106,196,0.1)', color: '#5c6ac4' }}>
                    <DownloadIcon />
                  </div>
                  <div className={styles.dataCardInfo}>
                    <div className={styles.dataCardTitle}>Export date</div>
                    <div className={styles.dataCardDesc}>Descarcă un fișier JSON cu toate datele: filamente, imprimări, comenzi și setări.</div>
                  </div>
                  <button className={styles.exportBtn} onClick={handleExport}>
                    <DownloadIcon /> Exportă JSON
                  </button>
                </div>

                <div className={styles.dataCard}>
                  <div className={styles.dataCardIcon} style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>
                    <UploadIcon />
                  </div>
                  <div className={styles.dataCardInfo}>
                    <div className={styles.dataCardTitle}>Import date</div>
                    <div className={styles.dataCardDesc}>Restaurează datele dintr-un backup anterior. Datele existente vor fi suprascrise.</div>
                  </div>
                  <label className={styles.importBtn}>
                    <UploadIcon /> Importă JSON
                    <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
                  </label>
                </div>

                <div className={styles.dataCard} style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                  <div className={styles.dataCardIcon} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                    <TrashIcon />
                  </div>
                  <div className={styles.dataCardInfo}>
                    <div className={styles.dataCardTitle}>Resetează datele</div>
                    <div className={styles.dataCardDesc}>Șterge toate datele din aplicație. Această acțiune este ireversibilă.</div>
                  </div>
                  <button className={styles.resetBtn} onClick={() => setDeleteConfirm('all')}>
                    Resetează tot
                  </button>
                </div>
              </div>
            </Section>
          )}

        </div>
      </div>

      {/* Printer modal */}
      {(printerModal === 'add' || printerModal === 'edit') && (
        <Modal title={printerModal === 'add' ? 'Adaugă imprimantă' : 'Editează imprimantă'}
          onClose={() => setPrinterModal(null)}>
          <div className={styles.formGrid}>
            <Field label="Nume *">
              <input className={styles.input} value={printerForm.name}
                onChange={e => setPrinterForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Imprimanta 1, Ender 3..." />
            </Field>
            <Field label="Model">
              <input className={styles.input} value={printerForm.model}
                onChange={e => setPrinterForm(f => ({ ...f, model: e.target.value }))}
                placeholder="Creality Ender 3 V2, Bambu X1C..." />
            </Field>
            <Field label="Status">
              <div className={styles.themeToggle}>
                <button className={`${styles.themeBtn} ${printerForm.active ? styles.themeBtnActive : ''}`}
                  onClick={() => setPrinterForm(f => ({ ...f, active: true }))}>✅ Activă</button>
                <button className={`${styles.themeBtn} ${!printerForm.active ? styles.themeBtnActive : ''}`}
                  onClick={() => setPrinterForm(f => ({ ...f, active: false }))}>⏸ Inactivă</button>
              </div>
            </Field>
          </div>
          <div className={styles.modalFooter}>
            {printerModal === 'edit' && (
              <button className={styles.deleteBtn} onClick={() => setDeleteConfirm(currentPrinter.id)}>Șterge</button>
            )}
            <button className={styles.cancelBtn} onClick={() => setPrinterModal(null)}>Anulează</button>
            <button className={styles.saveBtnModal} onClick={savePrinter}>
              {printerModal === 'add' ? 'Adaugă' : 'Salvează'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal title="Confirmare" onClose={() => setDeleteConfirm(null)} small>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            {deleteConfirm === 'all'
              ? 'Ești sigur că vrei să ștergi TOATE datele? Această acțiune nu poate fi anulată.'
              : 'Ești sigur că vrei să ștergi această imprimantă?'}
          </p>
          <div className={styles.modalFooter}>
            <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>Anulează</button>
            <button className={styles.deleteBtn} onClick={() => {
              if (deleteConfirm === 'all') {
                ['ms_settings','ms_printers','ms_filaments','ms_prints','ms_orders'].forEach(k => localStorage.removeItem(k));
                window.location.reload();
              } else {
                deletePrinter(deleteConfirm);
              }
            }}>
              {deleteConfirm === 'all' ? 'Șterge tot' : 'Șterge definitiv'}
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

// Icons
const PlusIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const EditIcon     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const CheckIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const DownloadIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const UploadIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const TrashIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const InfoIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const BuildingIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h1v1H9z"/><path d="M14 9h1v1h-1z"/><path d="M9 14h1v1H9z"/><path d="M14 14h1v1h-1z"/><path d="M9 19v2"/><path d="M15 19v2"/></svg>;
const PrinterIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
const CoinsIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="M16.71 13.88L17 15l-1.12.29"/></svg>;
const BellIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const DatabaseIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;
