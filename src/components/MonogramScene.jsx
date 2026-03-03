import React, { useRef, useEffect } from 'react';
import { useSceneManager } from '../hooks/useSceneManager';
import styles from './MonogramScene.module.css';

export function MonogramScene({ params, onReady }) {
  const canvasRef = useRef(null);
  const { exportSTL, setSlotPreview } = useSceneManager(canvasRef, params);

  useEffect(() => {
    if (typeof onReady === 'function') {
      onReady({ exportSTL, setSlotPreview });
    }
  }, [exportSTL, setSlotPreview]); // eslint-disable-line

  return (
    <div className={styles.viewport}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.hint}>Drag to orbit · Scroll to zoom</div>
      <div className={styles.badge}>REAL-TIME PREVIEW</div>
    </div>
  );
}