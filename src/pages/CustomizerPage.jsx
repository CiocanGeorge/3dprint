import React, { useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ControlPanel } from "../components/ControlPanel";
import { MonogramScene } from "../components/MonogramScene";
import styles from "./CustomizerPage.module.css";


const DEFAULT_PARAMS = {
  fullName:        'Miki',
  monogramLetter:  'M',
  monogramFontId:  'optimer_bold',
  nameFontId:      'helvetiker_regular',

  // Literă: 100mm înălțime, grosime 10mm (1cm)
  monogramSize:    100,
  monoScaleX:      1.0,
  monoScaleY:      1.0,
  monoScaleZ:      0.10,   // 100mm × 0.10 = 10mm grosime

  // Nume: dimensionat auto față de literă
  // nameScaleZ astfel că adâncimea numelui = 70% din 10mm = 7mm
  nameSize:        50,     // mai mare
  nameScaleX:      2.0,
  nameScaleY:      1.0,
  nameScaleZ:      0.2,   // adâncime insert = 7mm (70% din 10mm)

  nameOffsetX:     0,
  nameOffsetY:     0,
  nameOffsetZ:     4,
  letterSpacing:   -1,

  // Culori (folosite în scenă, nu mai apar în UI)
  monogramColor:   '#5c6ac4',
  nameColor:       '#8a6bbf',
};

export function CustomizerPage() {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const sceneActionsRef = useRef({});
  const navigate = useNavigate();

  const handleReady = useCallback((actions) => {
    sceneActionsRef.current = actions;
  }, []);
  const handleExport = useCallback((mode) => {
    sceneActionsRef.current.exportSTL?.(mode);
  }, []);
  const sceneParams = useMemo(() => ({ ...params }), [params]);

  return (
    <div className={styles.layout}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate("/")}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Înapoi
        </button>
        <span className={styles.topTitle}>Monogram 3D</span>
        <span />
      </div>
      <div className={styles.workspace}>
        <ControlPanel
          params={params}
          onChange={setParams}
          onExport={handleExport}
        />
        <main className={styles.viewport}>
          <MonogramScene params={sceneParams} onReady={handleReady} />
        </main>
      </div>
    </div>
  );
}
