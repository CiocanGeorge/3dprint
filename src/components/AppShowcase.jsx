import React, { useEffect, useRef, useState } from 'react';

const SLIDES = [
  { tag: 'Dashboard', title: 'O privire de ansamblu clară', desc: 'Vezi dintr-o privire stocul de filamente, alertele de stoc scăzut și cele mai recente activități.', color: '#5c6ac4', mock: 'overview' },
  { tag: 'Filamente', title: 'Stocul tău, mereu la zi', desc: 'Adaugă role noi, urmărește cantitatea rămasă și primești alerte când se apropie de zero.', color: '#e03e3e', mock: 'filaments' },
  { tag: 'Imprimări', title: 'Jurnal complet de imprimări', desc: 'Înregistrează fiecare job cu filamentul consumat, durata și statusul. Stocul se actualizează automat.', color: '#8a6bbf', mock: 'prints' },
  { tag: 'Comenzi', title: 'Comenzi clienți și furnizori', desc: 'Gestionează comenzile primite și aprovizionările. Urmărește statusul și valoarea fiecăreia.', color: '#f59e0b', mock: 'orders' },
  { tag: 'Calculator', title: 'Prețul corect, de fiecare dată', desc: 'Calculează costul real al oricărei imprimări — filament, energie, manoperă — și obții prețul recomandat.', color: '#22c55e', mock: 'calculator' },
];

const SLIDE_HEIGHT = 600;

export function AppShowcase() {
  const sectionRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [entering, setEntering] = useState(false);
  const prevIndex = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrolled = -rect.top;
      if (scrolled < 0) return;
      const totalScrollable = el.offsetHeight - window.innerHeight;
      if (scrolled > totalScrollable) return;
      const perSlide = totalScrollable / SLIDES.length;
      const idx = Math.min(Math.floor(scrolled / perSlide), SLIDES.length - 1);
      const prog = (scrolled % perSlide) / perSlide;
      setActiveIndex(idx);
      setProgress(prog);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (prevIndex.current !== activeIndex) {
      prevIndex.current = activeIndex;
      setEntering(true);
      const t = setTimeout(() => setEntering(false), 380);
      return () => clearTimeout(t);
    }
  }, [activeIndex]);

  const slide = SLIDES[activeIndex];

  return (
    <div ref={sectionRef} style={{ height: `calc(${SLIDES.length * SLIDE_HEIGHT}px + 100vh)`, position: 'relative' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '80px 40px 0', background: '#fff' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 12 }}>Cum funcționează</div>
        <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-1px', margin: 0, color: '#0f172a' }}>
          Tot ce ai nevoie,<br />într-o singură aplicație.
        </h2>
      </div>

      {/* Sticky panel */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', overflow: 'hidden' }}>
        {/* Blob */}
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: slide.color, filter: 'blur(140px)', opacity: 0.07, right: '-5%', top: '50%', transform: 'translateY(-50%)', transition: 'background 0.6s ease', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, width: '100%', padding: '0 40px', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 60, alignItems: 'center' }}>

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Dot nav */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {SLIDES.map((s, i) => (
                <button key={s.tag} onClick={() => {
                  const el = sectionRef.current;
                  if (!el) return;
                  const totalScrollable = el.offsetHeight - window.innerHeight;
                  const perSlide = totalScrollable / SLIDES.length;
                  window.scrollTo({ top: el.offsetTop + perSlide * i + 1, behavior: 'smooth' });
                }} style={{ width: i === activeIndex ? 20 : 8, height: 8, borderRadius: 99, background: i === activeIndex ? slide.color : '#e2e8f0', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease' }} />
              ))}
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: slide.color, opacity: entering ? 0 : 1, transform: entering ? 'translateY(10px)' : 'none', transition: 'all 0.35s ease' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: slide.color, display: 'inline-block' }} />
              {slide.tag}
            </div>

            <h3 style={{ fontSize: 'clamp(22px,2.5vw,34px)', fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1.2, color: '#0f172a', margin: 0, opacity: entering ? 0 : 1, transform: entering ? 'translateY(12px)' : 'none', transition: 'all 0.35s ease 0.04s' }}>
              {slide.title}
            </h3>

            <p style={{ fontSize: 15, lineHeight: 1.75, color: '#64748b', margin: 0, opacity: entering ? 0 : 1, transform: entering ? 'translateY(10px)' : 'none', transition: 'all 0.35s ease 0.08s' }}>
              {slide.desc}
            </p>

            <div>
              <div style={{ height: 2, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', borderRadius: 99, background: slide.color, width: `${progress * 100}%`, transition: 'width 0.1s linear, background 0.5s ease' }} />
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                <span style={{ color: slide.color, fontWeight: 700 }}>{activeIndex + 1}</span> / {SLIDES.length}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ opacity: entering ? 0 : 1, transform: entering ? 'translateY(16px) scale(0.98)' : 'none', transition: 'all 0.4s ease 0.05s' }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: `0 24px 80px ${slide.color}20, 0 4px 24px rgba(0,0,0,0.08)`, transition: 'box-shadow 0.6s ease' }}>
              <div style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 5 }}>
                {['#ef4444','#f59e0b','#22c55e'].map(c => <span key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />)}
                <div style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>monogramstudio.ro/dashboard</div>
              </div>
              <div style={{ height: 340, overflow: 'hidden', background: '#f8fafc' }}>
                <MockByName name={slide.mock} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockByName({ name }) {
  switch (name) {
    case 'overview':   return <MockOverview />;
    case 'filaments':  return <MockFilaments />;
    case 'prints':     return <MockPrints />;
    case 'orders':     return <MockOrders />;
    case 'calculator': return <MockCalculator />;
    default:           return null;
  }
}

function Sidebar({ active }) {
  return (
    <div style={{ width: 110, background: '#0f172a', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
      <div style={{ marginBottom: 14, paddingLeft: 4 }}>
        <span style={{ width: 24, height: 24, background: '#5c6ac4', borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>3D</span>
      </div>
      {['Overview','Filamente','Imprimări','Comenzi','Calculator','Setări'].map(item => (
        <div key={item} style={{ fontSize: 9.5, color: item === active ? '#fff' : 'rgba(255,255,255,0.35)', background: item === active ? 'rgba(255,255,255,0.1)' : 'transparent', fontWeight: item === active ? 600 : 400, padding: '6px 8px', borderRadius: 7 }}>{item}</div>
      ))}
    </div>
  );
}

function Shell({ active, children }) {
  return (
    <div style={{ display: 'flex', height: '100%', background: '#f8fafc' }}>
      <Sidebar active={active} />
      <div style={{ flex: 1, padding: '16px 18px', overflowY: 'hidden' }}>{children}</div>
    </div>
  );
}

const SC = ({ v, label, color }) => (
  <div style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', border: '1px solid #f1f5f9' }}>
    <div style={{ fontSize: 15, fontWeight: 800, color }}>{v}</div>
    <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{label}</div>
  </div>
);

const MRow = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#fff', borderRadius: 8, marginBottom: 6, border: '1px solid #f1f5f9' }}>{children}</div>
);

const MBar = ({ pct, color, low }) => (
  <div style={{ height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
    <div style={{ width: `${pct}%`, height: '100%', background: low ? '#ef4444' : color, borderRadius: 99 }} />
  </div>
);

const Pill = ({ status }) => {
  const map = { finalizat: ['#dcfce7','#16a34a','Finalizat'], in_curs: ['#dbeafe','#2563eb','În curs'], confirmata: ['#dbeafe','#2563eb','Confirmată'], livrata: ['#dcfce7','#16a34a','Livrată'], pending: ['#fef3c7','#d97706','Așteptare'] };
  const [bg, text, label] = map[status] || map.pending;
  return <div style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: bg, color: text, whiteSpace: 'nowrap' }}>{label}</div>;
};

function MockOverview() {
  return (
    <Shell active="Overview">
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Bună ziua, Alex 👋</div>
      <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 14 }}>Iată ce se întâmplă cu stocul tău</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        <SC v="12" label="Total role" color="#5c6ac4" />
        <SC v="8.4kg" label="Disponibil" color="#8a6bbf" />
        <SC v="2" label="Stoc scăzut" color="#ef4444" />
        <SC v="5" label="Branduri" color="#3b82f6" />
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Filamente recente</div>
      {[{ brand: 'Bambu Lab', mat: 'PLA', color: '#e03e3e', pct: 78 }, { brand: 'eSUN', mat: 'PETG', color: '#3b82f6', pct: 32 }, { brand: 'Prusament', mat: 'PLA+', color: '#22c55e', pct: 5, low: true }].map(f => (
        <MRow key={f.brand}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 600 }}>{f.brand} · {f.mat}</div>
            <MBar pct={f.pct} color={f.color} low={f.low} />
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: f.low ? '#ef4444' : '#94a3b8' }}>{f.pct}%</div>
        </MRow>
      ))}
    </Shell>
  );
}

function MockFilaments() {
  return (
    <Shell active="Filamente">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div><div style={{ fontSize: 13, fontWeight: 700 }}>Stoc Filamente</div><div style={{ fontSize: 9, color: '#94a3b8' }}>12 role</div></div>
        <div style={{ background: '#0f172a', color: '#fff', fontSize: 9, fontWeight: 600, padding: '5px 10px', borderRadius: 7 }}>+ Adaugă</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { brand: 'Bambu Lab', mat: 'PLA', colorName: 'Fire Red', color: '#e03e3e', rem: 780, w: 1000, price: 89 },
          { brand: 'eSUN', mat: 'PETG', colorName: 'Ocean Blue', color: '#3b82f6', rem: 320, w: 1000, price: 65 },
          { brand: 'Prusament', mat: 'PLA+', colorName: 'Galaxy Green', color: '#22c55e', rem: 55, w: 1000, price: 110, low: true },
          { brand: 'Fiberlogy', mat: 'ABS', colorName: 'Solar Yellow', color: '#f59e0b', rem: 900, w: 1000, price: 72 },
        ].map(f => (
          <div key={f.brand} style={{ background: '#fff', border: `1px solid ${f.low ? '#fecaca' : '#f1f5f9'}`, borderRadius: 10, padding: '10px 12px', position: 'relative' }}>
            {f.low && <div style={{ position: 'absolute', top: -7, right: 8, background: '#fef2f2', color: '#ef4444', fontSize: 8, fontWeight: 600, padding: '2px 7px', borderRadius: 99, border: '1px solid #fecaca' }}>⚠</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: f.color }} />
              <div><div style={{ fontSize: 10, fontWeight: 700 }}>{f.brand}</div><div style={{ fontSize: 9, color: '#94a3b8' }}>{f.mat} · {f.colorName}</div></div>
            </div>
            <MBar pct={(f.rem / f.w) * 100} color={f.color} low={f.low} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: f.low ? '#ef4444' : '#0f172a' }}>{f.rem}g</span>
              <span style={{ fontSize: 9, color: '#94a3b8' }}>{f.price} RON</span>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function MockPrints() {
  return (
    <Shell active="Imprimări">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div><div style={{ fontSize: 13, fontWeight: 700 }}>Imprimări</div><div style={{ fontSize: 9, color: '#94a3b8' }}>24 înregistrate</div></div>
        <div style={{ background: '#0f172a', color: '#fff', fontSize: 9, fontWeight: 600, padding: '5px 10px', borderRadius: 7 }}>+ Adaugă</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
        <SC v="21" label="Finalizate" color="#22c55e" /><SC v="1.2kg" label="Consumat" color="#8a6bbf" /><SC v="3" label="În curs" color="#3b82f6" />
      </div>
      {[
        { name: 'Vază decorativă', mat: 'PLA Roșu', g: 48, dur: '2h 15min', status: 'finalizat', color: '#e03e3e' },
        { name: 'Suport telefon', mat: 'PETG Albastru', g: 22, dur: '55min', status: 'finalizat', color: '#3b82f6' },
        { name: 'Cutie componente', mat: 'PLA+ Verde', g: 95, dur: '4h', status: 'in_curs', color: '#22c55e' },
      ].map(p => (
        <MRow key={p.name}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 10, fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 9, color: '#94a3b8' }}>{p.mat} · {p.g}g · {p.dur}</div></div>
          <Pill status={p.status} />
        </MRow>
      ))}
    </Shell>
  );
}

function MockOrders() {
  return (
    <Shell active="Comenzi">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div><div style={{ fontSize: 13, fontWeight: 700 }}>Comenzi</div><div style={{ fontSize: 9, color: '#94a3b8' }}>18 comenzi</div></div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ background: '#f1f5f9', color: '#0f172a', fontSize: 9, fontWeight: 600, padding: '5px 10px', borderRadius: 7 }}>+ Filament</div>
          <div style={{ background: '#0f172a', color: '#fff', fontSize: 9, fontWeight: 600, padding: '5px 10px', borderRadius: 7 }}>+ Client</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 14 }}>
        <SC v="7" label="Furnizori" color="#5c6ac4" /><SC v="11" label="Clienți" color="#8a6bbf" /><SC v="3" label="Așteptare" color="#f59e0b" /><SC v="1240" label="Venituri" color="#22c55e" /><SC v="890" label="Cheltuieli" color="#ef4444" />
      </div>
      {[
        { type: '📥', name: 'Bambu Lab', desc: '2× PLA 1kg', val: 178, status: 'livrata' },
        { type: '📤', name: 'Ion Popescu', desc: 'Suport birou', val: 85, status: 'confirmata' },
        { type: '📤', name: 'Maria Ionescu', desc: 'Figurine joc', val: 220, status: 'pending' },
      ].map(o => (
        <MRow key={o.name}>
          <span style={{ fontSize: 12 }}>{o.type}</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 10, fontWeight: 600 }}>{o.name}</div><div style={{ fontSize: 9, color: '#94a3b8' }}>{o.desc}</div></div>
          <div style={{ fontSize: 10, fontWeight: 700, marginRight: 6 }}>{o.val} RON</div>
          <Pill status={o.status} />
        </MRow>
      ))}
    </Shell>
  );
}

function MockCalculator() {
  return (
    <Shell active="Calculator">
      <div style={{ marginBottom: 14 }}><div style={{ fontSize: 13, fontWeight: 700 }}>Calculator Costuri</div><div style={{ fontSize: 9, color: '#94a3b8' }}>Calculează prețul corect</div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { icon: '🧵', label: 'Filament', rows: [['Bambu Lab PLA Roșu', ''], ['Grame folosite', '48g']] },
            { icon: '⚡', label: 'Energie', rows: [['Durată', '135 min'], ['Cost/oră', '0.80 RON']] },
            { icon: '🔧', label: 'Manoperă', rows: [['Timp', '20 min'], ['Tarif', '50 RON/h']] },
          ].map(sec => (
            <div key={sec.label} style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>{sec.icon} {sec.label}</div>
              {sec.rows.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
                  <span style={{ color: '#94a3b8' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ background: '#0f172a', borderRadius: 10, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '1px' }}>REZULTAT</div>
          {[['🧵', '4.27'], ['⚡', '1.80'], ['🔧', '16.67']].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
              <span style={{ color: 'rgba(255,255,255,0.45)' }}>{l}</span><span style={{ color: '#fff', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8, marginTop: 2 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>Cost total</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>22.74 RON</div>
          </div>
          <div style={{ background: '#5c6ac4', borderRadius: 8, padding: '10px 6px', textAlign: 'center', marginTop: 4 }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>Preț recomandat</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>29.56</div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)' }}>RON</div>
          </div>
        </div>
      </div>
    </Shell>
  );
}