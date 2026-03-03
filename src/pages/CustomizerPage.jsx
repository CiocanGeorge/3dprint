import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ControlPanel }  from '../components/ControlPanel';
import { MonogramScene } from '../components/MonogramScene';
import styles from './CustomizerPage.module.css';

const DEFAULT_PARAMS = {
  fullName:        'Alexandra',
  monogramLetter:  'A',
  monogramFontId:  'optimer_bold',
  nameFontId:      'helvetiker_regular',
  monogramSize:    40,
  monoScaleX:      1.0,
  monoScaleY:      1.0,
  monoScaleZ:      0.15,
  nameSize:        7,
  nameScaleX:      1.0,
  nameScaleY:      1.0,
  nameScaleZ:      0.15,
  nameOffsetX:     0,
  nameOffsetY:     0,
  nameOffsetZ:     0,
  letterSpacing:   -1,
};

export function CustomizerPage() {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const sceneActionsRef     = useRef({});
  const navigate            = useNavigate();

  const handleReady  = useCallback(actions => { sceneActionsRef.current = actions; }, []);
  const handleExport = useCallback(mode    => { sceneActionsRef.current.exportSTL?.(mode); }, []);
  const sceneParams  = useMemo(() => ({ ...params }), [params]);

  return (
    <div className={styles.layout}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Înapoi
        </button>
        <span className={styles.topTitle}>Monogram 3D</span>
        <span />
      </div>
      <div className={styles.workspace}>
        <ControlPanel params={params} onChange={setParams} onExport={handleExport} />
        <main className={styles.viewport}>
          <MonogramScene params={sceneParams} onReady={handleReady} />
        </main>
      </div>
    </div>
  );
}
