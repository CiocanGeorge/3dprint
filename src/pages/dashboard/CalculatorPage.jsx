// src/pages/Calculator/CalculatorPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import styles from './CalculatorPage.module.css';

// ─── G-code parser ────────────────────────────────────────────────────────────
function parseGcode(text) {
  const result = { filamentMm: null, printTimeSec: null };
  const filamentMatch = text.match(/filament used \[mm\]\s*=\s*([\d.]+)/i)
    || text.match(/;\s*filament used\s*=\s*([\d.]+)mm/i);
  if (filamentMatch) result.filamentMm = parseFloat(filamentMatch[1]);

  const timeMatch = text.match(/estimated printing time.*?=\s*(.*)/i)
    || text.match(/;\s*estimated printing time\s*=\s*(.*)/i);
  if (timeMatch) {
    const t = timeMatch[1];
    let sec = 0;
    const h = t.match(/(\d+)h/); if (h) sec += parseInt(h[1]) * 3600;
    const m = t.match(/(\d+)m/); if (m) sec += parseInt(m[1]) * 60;
    const s = t.match(/(\d+)s/); if (s) sec += parseInt(s[1]);
    if (sec > 0) result.printTimeSec = sec;
  }
  return result;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULTS = {
  jobName: '',
  filamentId: '',
  filamentGrams: '',
  printTimeHours: '',
  printTimeMinutes: '',
  // Electricity
  electricityEnabled: true,
  printerPower: 200,
  energyPrice: 0.8,
  // Labor
  laborEnabled: false,
  prepTime: 15,
  prepRate: 50,
  postTime: 10,
  postRate: 50,
  // Machine depreciation
  machineEnabled: false,
  printerPrice: 3000,
  depreciationYears: 3,
  dailyUsage: 8,
  maintenancePct: 10,
  // Other costs
  otherCosts: [],
  // Markup & tax
  markupPct: 30,
  vatPct: 0,
};

const OTHER_COST_EMPTY = { label: '', amount: '' };

export function CalculatorPage() {
  const { user } = useAuth();
  const [filaments, setFilaments] = useState([]);
  const [settings, setSettings] = useState({ energyCostPerHour: 0.8, defaultMarkup: 30, currency: 'RON' });
  const [form, setForm] = useState(DEFAULTS);
  const [gcodeLoading, setGcodeLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('filaments').select('*').order('brand'),
      supabase.from('settings').select('*').eq('user_id', user.id).single(),
    ]).then(([filRes, setRes]) => {
      if (!filRes.error) setFilaments(filRes.data.map(f => ({
        id: f.id, brand: f.brand, material: f.material,
        colorName: f.color_name, color: f.color,
        weight: f.weight, price: f.price, remaining: f.remaining,
      })));
      if (!setRes.error && setRes.data) {
        const s = setRes.data;
        setSettings({ energyCostPerHour: s.energy_cost_per_hour, defaultMarkup: s.default_markup, currency: s.currency });
        setForm(f => ({ ...f, energyPrice: s.energy_cost_per_hour, markupPct: s.default_markup }));
      }
    });
  }, [user]);

  const setF = k => v => setForm(f => ({ ...f, [k]: v }));
  const fil = filaments.find(f => f.id === form.filamentId);

  // G-code upload
  const handleGcode = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    setGcodeLoading(true);
    const reader = new FileReader();
    reader.onload = ev => {
      const data = parseGcode(ev.target.result);
      if (data.filamentMm && fil) {
        // Convert mm to grams: density PLA ~1.24 g/cm³, d=1.75mm
        const vol = Math.PI * Math.pow(0.875, 2) * (data.filamentMm / 10);
        const grams = (vol * 1.24).toFixed(1);
        setF('filamentGrams')(grams);
      }
      if (data.printTimeSec) {
        setF('printTimeHours')(Math.floor(data.printTimeSec / 3600).toString());
        setF('printTimeMinutes')(Math.floor((data.printTimeSec % 3600) / 60).toString());
      }
      setGcodeLoading(false);
    };
    reader.readAsText(file);
  }, [fil]);

  // ─── Calculations ───────────────────────────────────────────────────────────
  const gramsNum = Number(form.filamentGrams) || 0;
  const hoursNum = Number(form.printTimeHours) || 0;
  const minsNum  = Number(form.printTimeMinutes) || 0;
  const totalHours = hoursNum + minsNum / 60;

  const costPerGram = fil?.price && fil?.weight ? fil.price / fil.weight : 0;
  const filamentCost = costPerGram * gramsNum;

  const electricityCost = form.electricityEnabled
    ? totalHours * (Number(form.printerPower) / 1000) * Number(form.energyPrice)
    : 0;

  const laborCost = form.laborEnabled
    ? ((Number(form.prepTime) / 60) * Number(form.prepRate)) + ((Number(form.postTime) / 60) * Number(form.postRate))
    : 0;

  const machineCost = form.machineEnabled
    ? (() => {
        const depreciationPerHour = Number(form.printerPrice) / (Number(form.depreciationYears) * 365 * Number(form.dailyUsage));
        const maintenancePerHour = (Number(form.printerPrice) * (Number(form.maintenancePct) / 100)) / (365 * Number(form.dailyUsage));
        return (depreciationPerHour + maintenancePerHour) * totalHours;
      })()
    : 0;

  const otherTotal = form.otherCosts.reduce((s, c) => s + (Number(c.amount) || 0), 0);

  const baseCost = filamentCost + electricityCost + laborCost + machineCost + otherTotal;
  const markupAmount = baseCost * (Number(form.markupPct) / 100);
  const subtotal = baseCost + markupAmount;
  const vatAmount = subtotal * (Number(form.vatPct) / 100);
  const finalPrice = subtotal + vatAmount;

  const hasResult = baseCost > 0;
  const cur = settings.currency;
  const fmt = n => n.toFixed(2);

  const addOtherCost = () => setForm(f => ({ ...f, otherCosts: [...f.otherCosts, { ...OTHER_COST_EMPTY, id: Date.now() }] }));
  const updateOtherCost = (id, key, val) => setForm(f => ({ ...f, otherCosts: f.otherCosts.map(c => c.id === id ? { ...c, [key]: val } : c) }));
  const removeOtherCost = id => setForm(f => ({ ...f, otherCosts: f.otherCosts.filter(c => c.id !== id) }));

  const reset = () => setForm({ ...DEFAULTS, energyPrice: settings.energyCostPerHour, markupPct: settings.defaultMarkup });

  // Breakdown for chart
  const parts = [
    { label: 'Filament', value: filamentCost, color: '#5c6ac4' },
    { label: 'Energie', value: electricityCost, color: '#f59e0b' },
    { label: 'Manoperă', value: laborCost, color: '#8a6bbf' },
    { label: 'Imprimantă', value: machineCost, color: '#3b82f6' },
    { label: 'Alte costuri', value: otherTotal, color: '#64748b' },
    { label: 'Profit', value: markupAmount, color: '#22c55e' },
  ].filter(p => p.value > 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Calculator Costuri</h1>
          <p className={styles.sub}>Calculează prețul corect pentru orice imprimare</p>
        </div>
        <button className={styles.resetBtn} onClick={reset}>↺ Resetează</button>
      </div>

      <div className={styles.layout}>
        {/* ── LEFT COLUMN ── */}
        <div className={styles.leftCol}>

          {/* Job name */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>📋 Informații job</div>
            <Field label="Nume job / model">
              <input className={styles.input} value={form.jobName} onChange={e => setF('jobName')(e.target.value)} placeholder="Vază decorativă, suport telefon..." />
            </Field>
          </div>

          {/* G-code upload */}
          {/* <div className={styles.card}>
            <div className={styles.cardTitle}>📄 Import G-code <span className={styles.optBadge}>opțional</span></div>
            <p className={styles.cardDesc}>Încarcă un fișier .gcode pentru a completa automat gramele și durata.</p>
            <label className={styles.gcodeLabel}>
              {gcodeLoading ? '⏳ Se procesează...' : '⬆ Selectează fișier .gcode'}
              <input type="file" accept=".gcode,.gco" style={{ display: 'none' }} onChange={handleGcode} disabled={gcodeLoading} />
            </label>
          </div> */}

          {/* Print parameters */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>🖨️ Parametri imprimare</div>
            <div className={styles.formGrid}>
              <Field label="Durată — ore">
                <div className={styles.inputSuffix}>
                  <input className={styles.input} type="number" min="0" value={form.printTimeHours} onChange={e => setF('printTimeHours')(e.target.value)} placeholder="0" />
                  <span className={styles.suffix}>h</span>
                </div>
              </Field>
              <Field label="Durată — minute">
                <div className={styles.inputSuffix}>
                  <input className={styles.input} type="number" min="0" max="59" value={form.printTimeMinutes} onChange={e => setF('printTimeMinutes')(e.target.value)} placeholder="0" />
                  <span className={styles.suffix}>min</span>
                </div>
              </Field>
            </div>
          </div>

          {/* Filament */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>🧵 Cost filament</div>
            <div className={styles.formGrid}>
              <Field label="Filament" wide>
                <select className={styles.input} value={form.filamentId} onChange={e => setF('filamentId')(e.target.value)}>
                  <option value="">— Selectează din stoc —</option>
                  {filaments.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.brand} {f.material} · {f.colorName} {f.price ? `(${(f.price / f.weight).toFixed(3)} ${cur}/g)` : '(fără preț)'}
                    </option>
                  ))}
                </select>
                {fil && !fil.price && <p className={styles.warn}>⚠ Filamentul nu are preț setat.</p>}
                {fil && fil.price && (
                  <div className={styles.filInfo}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: fil.color || '#888', flexShrink: 0 }} />
                    <span>{fmt(fil.price / fil.weight)} {cur}/gram · {fil.remaining}g rămase</span>
                  </div>
                )}
              </Field>
              <Field label="Grame folosite">
                <div className={styles.inputSuffix}>
                  <input className={styles.input} type="number" min="0" step="0.1" value={form.filamentGrams} onChange={e => setF('filamentGrams')(e.target.value)} placeholder="0" />
                  <span className={styles.suffix}>g</span>
                </div>
              </Field>
            </div>
          </div>

          {/* Electricity */}
          <CollapsibleSection
            title="⚡ Cost energie electrică"
            enabled={form.electricityEnabled}
            onToggle={() => setF('electricityEnabled')(!form.electricityEnabled)}
            cost={electricityCost}
            cur={cur}
            fmt={fmt}
          >
            <div className={styles.formGrid}>
              <Field label={`Putere imprimantă`}>
                <div className={styles.inputSuffix}>
                  <input className={styles.input} type="number" min="0" value={form.printerPower} onChange={e => setF('printerPower')(e.target.value)} placeholder="200" />
                  <span className={styles.suffix}>W</span>
                </div>
              </Field>
              <Field label={`Cost energie (${cur}/kWh)`}>
                <div className={styles.inputSuffix}>
                  <input className={styles.input} type="number" min="0" step="0.01" value={form.energyPrice} onChange={e => setF('energyPrice')(e.target.value)} placeholder="0.80" />
                  <span className={styles.suffix}>{cur}</span>
                </div>
              </Field>
            </div>
          </CollapsibleSection>

          {/* Labor */}
          <CollapsibleSection
            title="🔧 Cost manoperă"
            enabled={form.laborEnabled}
            onToggle={() => setF('laborEnabled')(!form.laborEnabled)}
            cost={laborCost}
            cur={cur}
            fmt={fmt}
          >
            <div className={styles.formGrid}>
              <Field label="Timp pregătire (min)">
                <div className={styles.inputSuffix}>
                  <input className={styles.input} type="number" min="0" value={form.prepTime} onChange={e => setF('prepTime')(e.target.value)} />
                  <span className={styles.suffix}>min</span>
                </div>
              </Field>
              <Field label={`Tarif pregătire (${cur}/h)`}>
                <div className={styles.inputSuffix}>
                  <input className={styles.input} type="number" min="0" value={form.prepRate} onChange={e => setF('prepRate')(e.target.value)} />
                  <span className={styles.suffix}>{cur}</span>
                </div>
              </Field>
              <Field label="Timp post-procesare (min)">
                <div className={styles.inputSuffix}>
                  <input className={styles.input} type="number" min="0" value={form.postTime} onChange={e => setF('postTime')(e.target.value)} />
                  <span className={styles.suffix}>min</span>
                </div>
              </Field>
              <Field label={`Tarif post-procesare (${cur}/h)`}>
                <div className={styles.inputSuffix}>
                  <input className={styles.input} type="number" min="0" value={form.postRate} onChange={e => setF('postRate')(e.target.value)} />
                  <span className={styles.suffix}>{cur}</span>
                </div>
              </Field>
            </div>
          </CollapsibleSection>

          {/* Machine depreciation */}
          <CollapsibleSection
            title="🏭 Depreciere imprimantă"
            enabled={form.machineEnabled}
            onToggle={() => setF('machineEnabled')(!form.machineEnabled)}
            cost={machineCost}
            cur={cur}
            fmt={fmt}
          >
            <div className={styles.formGrid}>
              <Field label={`Preț imprimantă (${cur})`}>
                <div className={styles.inputSuffix}>
                  <input className={styles.input} type="number" min="0" value={form.printerPrice} onChange={e => setF('printerPrice')(e.target.value)} />
                  <span className={styles.suffix}>{cur}</span>
                </div>
              </Field>
              <Field label="Ani amortizare">
                <div className={styles.inputSuffix}>
                  <input className={styles.input} type="number" min="1" value={form.depreciationYears} onChange={e => setF('depreciationYears')(e.target.value)} />
                  <span className={styles.suffix}>ani</span>
                </div>
              </Field>
              <Field label="Utilizare zilnică (h/zi)">
                <div className={styles.inputSuffix}>
                  <input className={styles.input} type="number" min="1" max="24" value={form.dailyUsage} onChange={e => setF('dailyUsage')(e.target.value)} />
                  <span className={styles.suffix}>h</span>
                </div>
              </Field>
              <Field label="Mentenanță anuală (%)">
                <div className={styles.inputSuffix}>
                  <input className={styles.input} type="number" min="0" max="100" value={form.maintenancePct} onChange={e => setF('maintenancePct')(e.target.value)} />
                  <span className={styles.suffix}>%</span>
                </div>
              </Field>
            </div>
          </CollapsibleSection>

          {/* Other costs */}
          <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <div className={styles.cardTitle}>➕ Alte costuri</div>
              {otherTotal > 0 && <span className={styles.costBadge}>{fmt(otherTotal)} {cur}</span>}
            </div>
            {form.otherCosts.map(c => (
              <div key={c.id} className={styles.otherRow}>
                <input className={styles.input} value={c.label} onChange={e => updateOtherCost(c.id, 'label', e.target.value)} placeholder="Denumire cost..." style={{ flex: 2 }} />
                <div className={styles.inputSuffix} style={{ flex: 1 }}>
                  <input className={styles.input} type="number" min="0" step="0.01" value={c.amount} onChange={e => updateOtherCost(c.id, 'amount', e.target.value)} placeholder="0.00" />
                  <span className={styles.suffix}>{cur}</span>
                </div>
                <button className={styles.removeBtn} onClick={() => removeOtherCost(c.id)}>×</button>
              </div>
            ))}
            <button className={styles.addCostBtn} onClick={addOtherCost}>+ Adaugă cost</button>
          </div>
        </div>

        {/* ── RIGHT COLUMN — RESULT ── */}
        <div className={styles.rightCol}>
          <div className={styles.resultCard}>
            <div className={styles.resultTitle}>Sumar costuri</div>

            {/* Cost breakdown rows */}
            <div className={styles.costRows}>
              <CostRow label="🧵 Filament" value={filamentCost} cur={cur} fmt={fmt} active={filamentCost > 0} color="#5c6ac4" />
              <CostRow label="⚡ Energie" value={electricityCost} cur={cur} fmt={fmt} active={electricityCost > 0} color="#f59e0b" />
              <CostRow label="🔧 Manoperă" value={laborCost} cur={cur} fmt={fmt} active={laborCost > 0} color="#8a6bbf" />
              <CostRow label="🏭 Imprimantă" value={machineCost} cur={cur} fmt={fmt} active={machineCost > 0} color="#3b82f6" />
              <CostRow label="➕ Alte costuri" value={otherTotal} cur={cur} fmt={fmt} active={otherTotal > 0} color="#64748b" />

              <div className={styles.separator} />
              <div className={styles.totalRow}>
                <span>Cost de producție</span>
                <span>{fmt(baseCost)} {cur}</span>
              </div>
            </div>

            {/* Markup & VAT */}
            <div className={styles.markupSection}>
              <Field label={`Adaos profit (%)`}>
                <div className={styles.inputSuffix}>
                  <input className={styles.input} type="number" min="0" max="1000" value={form.markupPct} onChange={e => setF('markupPct')(e.target.value)} />
                  <span className={styles.suffix}>%</span>
                </div>
              </Field>
              <div className={styles.markupRow}>
                <span>Profit</span>
                <span style={{ color: '#22c55e', fontWeight: 600 }}>+{fmt(markupAmount)} {cur}</span>
              </div>

              <Field label="TVA (%)">
                <div className={styles.inputSuffix}>
                  <input className={styles.input} type="number" min="0" max="100" value={form.vatPct} onChange={e => setF('vatPct')(e.target.value)} placeholder="0" />
                  <span className={styles.suffix}>%</span>
                </div>
              </Field>
              {vatAmount > 0 && (
                <div className={styles.markupRow}>
                  <span>TVA ({form.vatPct}%)</span>
                  <span>+{fmt(vatAmount)} {cur}</span>
                </div>
              )}
            </div>

            {/* Final price */}
            <div className={`${styles.priceBox} ${!hasResult ? styles.priceBoxEmpty : ''}`}>
              <div className={styles.priceLabel}>Preț de vânzare recomandat</div>
              <div className={styles.priceValue}>{hasResult ? `${fmt(finalPrice)} ${cur}` : '—'}</div>
              {hasResult && <div className={styles.priceSub}>din care profit net: <strong>{fmt(markupAmount)} {cur}</strong></div>}
            </div>

            {/* Visual bar chart */}
            {hasResult && parts.length > 0 && (
              <>
                <div className={styles.barChart}>
                  {parts.map(p => (
                    <div key={p.label} className={styles.barSegment}
                      style={{ width: `${(p.value / finalPrice) * 100}%`, background: p.color }}
                      title={`${p.label}: ${fmt(p.value)} ${cur}`} />
                  ))}
                </div>
                <div className={styles.legend}>
                  {parts.map(p => (
                    <div key={p.label} className={styles.legendItem}>
                      <div className={styles.legendDot} style={{ background: p.color }} />
                      <span>{p.label}</span>
                      <span className={styles.legendPct}>{Math.round((p.value / finalPrice) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!hasResult && (
              <p className={styles.emptyHint}>Completează câmpurile din stânga pentru a vedea rezultatul.</p>
            )}

            {/* Per gram price */}
            {hasResult && gramsNum > 0 && (
              <div className={styles.perGram}>
                <span>Preț per gram</span>
                <span className={styles.perGramVal}>{fmt(finalPrice / gramsNum)} {cur}/g</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CollapsibleSection({ title, enabled, onToggle, cost, cur, fmt, children }) {
  return (
    <div className={`${styles.card} ${!enabled ? styles.cardDisabled : ''}`}>
      <div className={styles.cardTitleRow}>
        <div className={styles.cardTitle}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {enabled && cost > 0 && <span className={styles.costBadge}>{fmt(cost)} {cur}</span>}
          <button className={`${styles.toggle} ${enabled ? styles.toggleOn : ''}`} onClick={onToggle}>
            <span className={styles.toggleKnob} />
          </button>
        </div>
      </div>
      {enabled && <div className={styles.collapsibleBody}>{children}</div>}
    </div>
  );
}

function CostRow({ label, value, cur, fmt, active, color }) {
  return (
    <div className={styles.costRow} style={{ opacity: active ? 1 : 0.35 }}>
      <div className={styles.costRowLeft}>
        <div className={styles.costDot} style={{ background: color }} />
        <span>{label}</span>
      </div>
      <span className={styles.costRowVal}>{fmt(value)} {cur}</span>
    </div>
  );
}

function Field({ label, children, wide }) {
  return (
    <div className={`${styles.field} ${wide ? styles.fieldWide : ''}`}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  );
}