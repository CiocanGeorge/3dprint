import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AppShowcase } from '../components/AppShowcase';

const FEATURES = [
  {
    icon: '🧵',
    title: 'Stoc filamente',
    desc: 'Urmărește fiecare rolă — cantitate, culoare, brand. Alerte automate când stocul scade.',
  },
  {
    icon: '🖨️',
    title: 'Jurnal imprimări',
    desc: 'Înregistrează fiecare imprimare cu filamentul consumat, durata și statusul.',
  },
  {
    icon: '📦',
    title: 'Gestiune comenzi',
    desc: 'Comenzi de la clienți și furnizori într-un singur loc, cu statusuri și valori.',
  },
  {
    icon: '🧮',
    title: 'Calculator costuri',
    desc: 'Calculează instant prețul corect: filament + energie + manoperă + profit.',
  },
  {
    icon: '📊',
    title: 'Statistici',
    desc: 'Grafice clare despre consum, cheltuieli și venituri în timp.',
  },
  {
    icon: '☁️',
    title: 'Sincronizare cloud',
    desc: 'Datele tale sunt salvate în cloud. Accesezi de pe orice dispozitiv.',
  },
];

const PLANS = [
  {
    name: 'Free',
    price: '0',
    sub: 'pentru totdeauna',
    color: '#64748b',
    features: ['Până la 20 filamente', 'Până la 50 imprimări/lună', '1 imprimantă', 'Comenzi nelimitate'],
    cta: 'Începe gratuit',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '39',
    sub: 'RON / lună',
    color: '#1a1a2e',
    features: ['Filamente nelimitate', 'Imprimări nelimitate', 'Imprimante nelimitate', 'Export facturi PDF', 'Statistici avansate', 'Suport prioritar'],
    cta: 'Încearcă Pro',
    href: '/register',
    highlight: true,
  },
];

function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.15, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

export function LandingPage() {
  const [heroRef, heroIn] = useInView();
  const [featRef, featIn] = useInView();
  const [planRef, planIn] = useInView();

  return (
    <div style={s.page}>
      <Nav />

      {/* HERO */}
      <section ref={heroRef} style={s.hero}>
        <div style={s.heroNoise} />
        <div style={s.heroInner}>
          <div style={{ ...s.badge, opacity: heroIn ? 1 : 0, transform: heroIn ? 'none' : 'translateY(12px)', transition: 'all 0.5s ease' }}>
            <span style={s.badgeDot} />
            Construit pentru maker-i din România
          </div>
          <h1 style={{ ...s.heroTitle, opacity: heroIn ? 1 : 0, transform: heroIn ? 'none' : 'translateY(24px)', transition: 'all 0.65s ease 0.1s' }}>
            Controlul complet<br />
            <span style={s.heroAccent}>al studioului tău</span><br />
            de imprimare 3D.
          </h1>
          <p style={{ ...s.heroDesc, opacity: heroIn ? 1 : 0, transform: heroIn ? 'none' : 'translateY(20px)', transition: 'all 0.65s ease 0.2s' }}>
            Monogram Studio te ajută să gestionezi stocul de filamente, să urmărești imprimările,
            să calculezi costuri corecte și să ții evidența comenzilor — totul într-un singur loc.
          </p>
          <div style={{ ...s.heroBtns, opacity: heroIn ? 1 : 0, transform: heroIn ? 'none' : 'translateY(16px)', transition: 'all 0.65s ease 0.3s' }}>
            <Link to="/register" style={s.btnPrimary}>Începe gratuit →</Link>
            <Link to="/login" style={s.btnSecondary}>Am deja cont</Link>
          </div>
          <p style={{ ...s.heroNote, opacity: heroIn ? 1 : 0, transition: 'all 0.65s ease 0.4s' }}>
            Fără card de credit. Contul free nu expiră niciodată.
          </p>
        </div>

        {/* Floating filament cards */}
        <div style={{ ...s.heroCards, opacity: heroIn ? 1 : 0, transform: heroIn ? 'none' : 'translateX(30px)', transition: 'all 0.8s ease 0.2s' }}>
          <FilamentCard color="#e03e3e" brand="Bambu Lab" material="PLA" remaining={780} weight={1000} delay={0} />
          <FilamentCard color="#3b82f6" brand="eSUN" material="PETG" remaining={320} weight={1000} delay={0.1} />
          <FilamentCard color="#22c55e" brand="Prusament" material="PLA+" remaining={55} weight={1000} delay={0.2} low />
          <FilamentCard color="#f59e0b" brand="Fiberlogy" material="ABS" remaining={900} weight={1000} delay={0.3} />
        </div>
      </section>

      {/* FEATURES */}
      <section ref={featRef} style={s.features}>
        <div style={s.container}>
          <div style={s.sectionHead}>
            <h2 style={{ ...s.sectionTitle, opacity: featIn ? 1 : 0, transform: featIn ? 'none' : 'translateY(20px)', transition: 'all 0.6s ease' }}>
              Tot ce ai nevoie,<br />nimic în plus.
            </h2>
            <p style={{ ...s.sectionDesc, opacity: featIn ? 1 : 0, transform: featIn ? 'none' : 'translateY(16px)', transition: 'all 0.6s ease 0.1s' }}>
              Construit specific pentru maker-ii care imprimă la comandă și vor să știe exact cât costă fiecare piesă.
            </p>
          </div>
          <div style={s.featGrid}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} visible={featIn} delay={i * 0.07} />
            ))}
          </div>
        </div>
      </section>

      <AppShowcase />

      {/* PRICING */}
      <section ref={planRef} style={s.pricing}>
        <div style={s.container}>
          <div style={s.sectionHead}>
            <h2 style={{ ...s.sectionTitle, opacity: planIn ? 1 : 0, transform: planIn ? 'none' : 'translateY(20px)', transition: 'all 0.6s ease' }}>
              Prețuri simple,<br />fără surprize.
            </h2>
          </div>
          <div style={s.planGrid}>
            {PLANS.map((p, i) => (
              <PlanCard key={p.name} {...p} visible={planIn} delay={i * 0.12} />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerLogo}>
            <span style={s.footerMark}>M</span>
            <span style={s.footerBrand}>Monogram Studio</span>
          </div>
          <p style={s.footerDesc}>
            Aplicație de management pentru studiouri de imprimare 3D.<br />
            Construit cu ❤️ în România.
          </p>
          <div style={s.footerLinks}>
            <Link to="/login" style={s.footerLink}>Login</Link>
            <Link to="/register" style={s.footerLink}>Register</Link>
            <a href="mailto:contact@monogramstudio.ro" style={s.footerLink}>Contact</a>
          </div>
          <p style={s.footerCopy}>© {new Date().getFullYear()} Monogram Studio. Toate drepturile rezervate.</p>
        </div>
      </footer>
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <nav style={{ ...s.nav, ...(scrolled ? s.navScrolled : {}) }}>
      <div style={s.navInner}>
        <div style={s.navLogo}>
          <span style={s.navMark}>M</span>
          <span style={s.navBrand}>Monogram Studio</span>
        </div>
        <div style={s.navLinks}>
          <Link to="/login" style={s.navLink}>Login</Link>
          <Link to="/register" style={s.navCta}>Începe gratuit</Link>
        </div>
      </div>
    </nav>
  );
}

function FilamentCard({ color, brand, material, remaining, weight, delay, low }) {
  const pct = Math.round((remaining / weight) * 100);
  return (
    <div style={{ ...s.filCard, animationDelay: `${delay}s` }}>
      <div style={{ ...s.filDot, background: color }} />
      <div style={s.filInfo}>
        <div style={s.filBrand}>{brand} <span style={s.filMat}>{material}</span></div>
        <div style={s.filBar}>
          <div style={{ ...s.filFill, width: `${pct}%`, background: low ? '#ef4444' : color }} />
        </div>
        <div style={s.filMeta}>
          <span style={low ? { color: '#ef4444', fontWeight: 600 } : {}}>{remaining}g</span>
          <span style={s.filPct}>{pct}%</span>
        </div>
      </div>
      {low && <span style={s.lowBadge}>⚠ Scăzut</span>}
    </div>
  );
}

function FeatureCard({ icon, title, desc, visible, delay }) {
  return (
    <div style={{ ...s.featCard, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: `all 0.55s ease ${delay}s` }}>
      <div style={s.featIcon}>{icon}</div>
      <h3 style={s.featTitle}>{title}</h3>
      <p style={s.featDesc}>{desc}</p>
    </div>
  );
}

function PlanCard({ name, price, sub, color, features, cta, href, highlight, visible, delay }) {
  return (
    <div style={{
      ...s.planCard,
      ...(highlight ? s.planHighlight : {}),
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(24px)',
      transition: `all 0.6s ease ${delay}s`,
    }}>
      {highlight && <div style={s.planBadge}>Popular</div>}
      <div style={s.planName}>{name}</div>
      <div style={s.planPrice}>
        <span style={s.planAmount}>{price}</span>
        <span style={s.planSub}> {sub}</span>
      </div>
      <ul style={s.planFeatures}>
        {features.map(f => (
          <li key={f} style={s.planFeature}>
            <span style={{ ...s.planCheck, color: highlight ? '#1a1a2e' : '#22c55e' }}>✓</span> {f}
          </li>
        ))}
      </ul>
      <Link to={href} style={{ ...s.planCta, ...(highlight ? s.planCtaHighlight : {}) }}>
        {cta}
      </Link>
    </div>
  );
}

function MockDashboard() {
  return (
    <div style={s.mock}>
      {/* Mock sidebar */}
      <div style={s.mockSidebar}>
        <div style={s.mockLogo}><span style={s.mockLogoMark}>M</span></div>
        {['Overview','Filamente','Imprimări','Comenzi','Calculator','Setări'].map((item, i) => (
          <div key={item} style={{ ...s.mockNavItem, ...(i === 0 ? s.mockNavActive : {}) }}>{item}</div>
        ))}
      </div>
      {/* Mock content */}
      <div style={s.mockContent}>
        <div style={s.mockHeader}>
          <div style={s.mockTitle}>Bună ziua, Alex 👋</div>
          <div style={s.mockSub}>Iată ce se întâmplă cu stocul tău</div>
        </div>
        <div style={s.mockStats}>
          {[
            { label: 'Total role', value: '12', color: '#5c6ac4' },
            { label: 'Grame disponibile', value: '8.4kg', color: '#8a6bbf' },
            { label: 'Stoc scăzut', value: '2', color: '#ef4444' },
            { label: 'Branduri', value: '5', color: '#3b82f6' },
          ].map(stat => (
            <div key={stat.label} style={s.mockStat}>
              <div style={{ ...s.mockStatVal, color: stat.color }}>{stat.value}</div>
              <div style={s.mockStatLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
        <div style={s.mockCards}>
          {[
            { brand: 'Bambu Lab', mat: 'PLA', color: '#e03e3e', pct: 78 },
            { brand: 'eSUN', mat: 'PETG', color: '#3b82f6', pct: 32 },
            { brand: 'Prusament', mat: 'PLA+', color: '#22c55e', pct: 5, low: true },
          ].map(f => (
            <div key={f.brand} style={s.mockCard}>
              <div style={{ ...s.mockCardDot, background: f.color }} />
              <div style={s.mockCardInfo}>
                <div style={s.mockCardBrand}>{f.brand} · {f.mat}</div>
                <div style={s.mockCardBar}>
                  <div style={{ width: `${f.pct}%`, height: '100%', background: f.low ? '#ef4444' : f.color, borderRadius: 99 }} />
                </div>
              </div>
              <div style={{ ...s.mockCardPct, color: f.low ? '#ef4444' : '#64748b' }}>{f.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: { fontFamily: "'DM Sans', 'Outfit', sans-serif", background: '#fafafa', color: '#0f172a', minHeight: '100vh', overflowX: 'clip' },

  // NAV
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 40px', transition: 'all 0.3s ease' },
  navScrolled: { background: 'rgba(250,250,250,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 20px rgba(0,0,0,0.06)' },
  navInner: { maxWidth: 1100, margin: '0 auto', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10 },
  navMark: { width: 32, height: 32, background: '#0f172a', color: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 },
  navBrand: { fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 12 },
  navLink: { fontSize: 14, color: '#64748b', textDecoration: 'none', padding: '8px 12px', borderRadius: 8, transition: 'color 0.2s' },
  navCta: { fontSize: 14, background: '#0f172a', color: '#fff', textDecoration: 'none', padding: '9px 20px', borderRadius: 10, fontWeight: 600, transition: 'opacity 0.2s' },

  // HERO
  hero: { minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 40px 80px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, #ffffff 0%, #f1f5f9 100%)' },
  heroNoise: { position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")', opacity: 0.4, pointerEvents: 'none' },
  heroInner: { maxWidth: 560, position: 'relative', zIndex: 1 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 99, padding: '6px 14px', fontSize: 12, fontWeight: 500, color: '#475569', marginBottom: 28 },
  badgeDot: { width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' },
  heroTitle: { fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px', margin: '0 0 24px', color: '#0f172a' },
  heroAccent: { color: '#5c6ac4' },
  heroDesc: { fontSize: 17, lineHeight: 1.7, color: '#64748b', margin: '0 0 36px', maxWidth: 460 },
  heroBtns: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  btnPrimary: { background: '#0f172a', color: '#fff', textDecoration: 'none', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, transition: 'transform 0.2s, opacity 0.2s', display: 'inline-block' },
  btnSecondary: { background: 'transparent', color: '#0f172a', textDecoration: 'none', padding: '14px 24px', borderRadius: 12, fontWeight: 600, fontSize: 15, border: '1.5px solid #e2e8f0', display: 'inline-block' },
  heroNote: { fontSize: 12, color: '#94a3b8', marginTop: 16 },

  // Floating cards
  heroCards: { position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 12, width: 280 },
  filCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', animation: 'float 3s ease-in-out infinite', position: 'relative' },
  filDot: { width: 14, height: 14, borderRadius: '50%', flexShrink: 0 },
  filInfo: { flex: 1, minWidth: 0 },
  filBrand: { fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 6 },
  filMat: { color: '#94a3b8', fontWeight: 400 },
  filBar: { height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 4 },
  filFill: { height: '100%', borderRadius: 99, transition: 'width 0.3s' },
  filMeta: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' },
  filPct: { fontWeight: 600 },
  lowBadge: { position: 'absolute', top: -8, right: 10, background: '#fef2f2', color: '#ef4444', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, border: '1px solid #fecaca' },

  // FEATURES
  features: { padding: '100px 40px', background: '#fff' },
  container: { maxWidth: 1100, margin: '0 auto' },
  sectionHead: { textAlign: 'center', marginBottom: 60 },
  sectionTitle: { fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.15, margin: '0 0 16px' },
  sectionDesc: { fontSize: 16, color: '#64748b', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 },
  featGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 },
  featCard: { background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: 16, padding: '28px', transition: 'all 0.3s ease' },
  featIcon: { fontSize: 28, marginBottom: 16 },
  featTitle: { fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: '#0f172a' },
  featDesc: { fontSize: 14, color: '#64748b', lineHeight: 1.65, margin: 0 },

  // MOCK
  mockSection: { padding: '0 40px 100px', background: '#fff' },
  mockWrap: { maxWidth: 900, margin: '0 auto', borderRadius: 20, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 20px 80px rgba(0,0,0,0.1)' },
  mock: { display: 'flex', background: '#f8fafc', minHeight: 420 },
  mockSidebar: { width: 160, background: '#0f172a', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
  mockLogo: { marginBottom: 20, paddingLeft: 4 },
  mockLogoMark: { width: 28, height: 28, background: '#5c6ac4', borderRadius: 7, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 },
  mockNavItem: { fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '7px 10px', borderRadius: 8, cursor: 'default' },
  mockNavActive: { background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600 },
  mockContent: { flex: 1, padding: '24px 28px' },
  mockHeader: { marginBottom: 20 },
  mockTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a' },
  mockSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  mockStats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 },
  mockStat: { background: '#fff', borderRadius: 10, padding: '12px 14px', border: '1px solid #f1f5f9' },
  mockStatVal: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  mockStatLabel: { fontSize: 10, color: '#94a3b8' },
  mockCards: { display: 'flex', flexDirection: 'column', gap: 8 },
  mockCard: { background: '#fff', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #f1f5f9' },
  mockCardDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  mockCardInfo: { flex: 1 },
  mockCardBrand: { fontSize: 11, fontWeight: 600, color: '#0f172a', marginBottom: 5 },
  mockCardBar: { height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' },
  mockCardPct: { fontSize: 11, fontWeight: 600, minWidth: 32, textAlign: 'right' },

  // PRICING
  pricing: { padding: '100px 40px', background: '#fafafa' },
  planGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, maxWidth: 700, margin: '0 auto' },
  planCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '32px', position: 'relative' },
  planHighlight: { background: '#0f172a', border: '1px solid #0f172a' },
  planBadge: { position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#5c6ac4', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99, letterSpacing: '0.5px' },
  planName: { fontSize: 13, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 16 },
  planPrice: { marginBottom: 28 },
  planAmount: { fontSize: 44, fontWeight: 800, letterSpacing: '-2px', color: 'inherit' },
  planSub: { fontSize: 14, color: '#94a3b8' },
  planFeatures: { listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 },
  planFeature: { fontSize: 14, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 },
  planCheck: { fontWeight: 700, fontSize: 14 },
  planCta: { display: 'block', textAlign: 'center', background: '#f1f5f9', color: '#0f172a', textDecoration: 'none', padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 14, transition: 'opacity 0.2s' },
  planCtaHighlight: { background: '#5c6ac4', color: '#fff' },

  // FOOTER
  footer: { background: '#0f172a', color: '#fff', padding: '60px 40px' },
  footerInner: { maxWidth: 1100, margin: '0 auto', textAlign: 'center' },
  footerLogo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  footerMark: { width: 36, height: 36, background: '#5c6ac4', borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 },
  footerBrand: { fontWeight: 700, fontSize: 18 },
  footerDesc: { fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 28px' },
  footerLinks: { display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32 },
  footerLink: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' },
  footerCopy: { fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 },
};

// Inject animation keyframes
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }
  `;
  document.head.appendChild(style);
}
