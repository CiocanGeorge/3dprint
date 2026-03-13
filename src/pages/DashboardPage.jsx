import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  NavLink,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { OverviewPage } from "./dashboard/OverviewPage";
import { FilamentPage } from "./dashboard/FilamentPage";
import styles from "./DashboardPage.module.css";
import { PrintsPage } from "./dashboard/PrintsPage";
import { OrdersPage } from "./dashboard/OrdersPage";
import { SettingsPage } from "./dashboard/SettingsPage";
import { CalculatorPage } from "./dashboard/CalculatorPage";

// ─── Icons ────────────────────────────────────────────────────────────────────
const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
);
const SpoolIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
    <line x1="12" y1="3" x2="12" y2="9" /><line x1="12" y1="15" x2="12" y2="21" />
    <line x1="3" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="21" y2="12" />
  </svg>
);
const PrintIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);
const BoxIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const CalcIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="10" y2="10" />
    <line x1="14" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="10" y2="14" />
    <line x1="14" y1="14" x2="16" y2="14" /><line x1="8" y1="18" x2="16" y2="18" />
  </svg>
);
const GearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const ChevronIcon = ({ flipped }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    style={{ transform: flipped ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: "/dashboard",            label: "Overview",   icon: <GridIcon />,  bottomNav: true  },
  { to: "/dashboard/filament",   label: "Filament",   icon: <SpoolIcon />, bottomNav: true  },
  { to: "/dashboard/prints",     label: "Imprimări",  icon: <PrintIcon />, bottomNav: true  },
  { to: "/dashboard/orders",     label: "Comenzi",    icon: <BoxIcon />,   bottomNav: true  },
  { to: "/dashboard/calculator", label: "Calculator", icon: <CalcIcon />,  bottomNav: false },
  { to: "/dashboard/settings",   label: "Setări",     icon: <GearIcon />,  bottomNav: false },
];

// ─── Hook: window width ────────────────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const width = useWindowWidth();
  const isMobile = width < 768;

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMobile && drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, drawerOpen]);

  if (isMobile) {
    return (
      <div className={styles.layoutMobile}>
        {/* Mobile top bar */}
        <header className={styles.mobileHeader}>
          <button className={styles.menuBtn} onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </button>
          <div className={styles.mobileBrand} onClick={() => navigate("/")}>
            <span className={styles.brandMark}>3D</span>
            <span className={styles.mobileBrandTitle}>3D•Print Studio</span>
          </div>
          <div className={styles.mobileHeaderRight}>
            <div className={styles.mobileAvatar}>{user?.initials}</div>
          </div>
        </header>

        {/* Drawer overlay */}
        {drawerOpen && (
          <div className={styles.drawerOverlay} onClick={() => setDrawerOpen(false)} />
        )}

        {/* Drawer */}
        <div className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ""}`}>
          <div className={styles.drawerTop}>
            <div className={styles.drawerBrand} onClick={() => navigate("/")}>
              <span className={styles.brandMark}>3D</span>
              <div className={styles.brandText}>
                <div className={styles.brandTitle}>3D•Print Studio</div>
                <div className={styles.brandSub}>Studio</div>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </button>
          </div>

          <nav className={styles.drawerNav}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
                }
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className={styles.drawerBottom}>
            <div className={styles.userCard}>
              <div className={styles.userAvatar}>{user?.initials}</div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user?.name}</div>
                <div className={styles.userEmail}>{user?.email}</div>
              </div>
            </div>
            <button
              className={styles.logoutBtn}
              onClick={() => { logout(); navigate("/"); }}
            >
              <LogoutIcon /> Deconectare
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className={styles.mobileMain}>
          <Routes>
            <Route index element={<OverviewPage />} />
            <Route path="filament" element={<FilamentPage />} />
            <Route path="prints" element={<PrintsPage title="Imprimări" />} />
            <Route path="orders" element={<OrdersPage title="Comenzi" />} />
            <Route path="calculator" element={<CalculatorPage title="Calculator" />} />
            <Route path="settings" element={<SettingsPage title="Setări" />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        {/* Bottom navigation bar */}
        <nav className={styles.bottomNav}>
          {NAV_ITEMS.filter(i => i.bottomNav).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ""}`
              }
            >
              <span className={styles.bottomNavIcon}>{item.icon}</span>
              <span className={styles.bottomNavLabel}>{item.label}</span>
            </NavLink>
          ))}
          {/* More button — opens drawer for Calculator + Setări */}
          <button
            className={`${styles.bottomNavItem} ${styles.bottomNavBtn}`}
            onClick={() => setDrawerOpen(true)}
          >
            <span className={styles.bottomNavIcon}><MenuIcon /></span>
            <span className={styles.bottomNavLabel}>Mai mult</span>
          </button>
        </nav>
      </div>
    );
  }

  // ── Desktop layout ──────────────────────────────────────────────────────────
  return (
    <div className={`${styles.layout} ${collapsed ? styles.collapsed : ""}`}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.brand} onClick={() => navigate("/")} title="Acasă">
            <span className={styles.brandMark}>3D</span>
            {!collapsed && (
              <div className={styles.brandText}>
                <div className={styles.brandTitle}>3D•Print Studio</div>
                <div className={styles.brandSub}>Studio</div>
              </div>
            )}
          </div>
          <button className={styles.collapseBtn} onClick={() => setCollapsed(c => !c)}>
            <ChevronIcon flipped={collapsed} />
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ""} ${item.soon ? styles.navItemSoon : ""}`
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!collapsed && (
                <span className={styles.navLabel}>
                  {item.label}
                  {item.soon && <span className={styles.soonBadge}>Soon</span>}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.userCard} onClick={() => navigate("/profile")}>
            <div className={styles.userAvatar}>{user?.initials}</div>
            {!collapsed && (
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user?.name}</div>
                <div className={styles.userEmail}>{user?.email}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              className={styles.logoutBtn}
              onClick={() => { logout(); navigate("/"); }}
            >
              <LogoutIcon /> Deconectare
            </button>
          )}
        </div>
      </aside>

      <main className={styles.main}>
        <Routes>
          <Route index element={<OverviewPage />} />
          <Route path="filament" element={<FilamentPage />} />
          <Route path="prints" element={<PrintsPage title="Imprimări" />} />
          <Route path="orders" element={<OrdersPage title="Comenzi" />} />
          <Route path="calculator" element={<CalculatorPage title="Calculator" />} />
          <Route path="settings" element={<SettingsPage title="Setări" />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function ComingSoon({ title }) {
  return (
    <div className={styles.comingSoon}>
      <div className={styles.comingSoonIcon}>🚧</div>
      <h2>{title}</h2>
      <p>Această secțiune va fi disponibilă în curând.</p>
    </div>
  );
}