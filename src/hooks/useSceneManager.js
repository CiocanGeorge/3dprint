import { useEffect, useRef } from 'react';
import { SceneManager } from '../utils/SceneManager';

export function useSceneManager(canvasRef, params) {
  const managerRef = useRef(null);

  // Effect 1: Mount/unmount — runs exactly once
  useEffect(() => {
    if (!canvasRef.current) return;
    const manager = new SceneManager(canvasRef.current);
    managerRef.current = manager;
    return () => { manager.dispose(); managerRef.current = null; };
  }, []); // eslint-disable-line

  // Effect 2: Param changes
  useEffect(() => {
    if (!managerRef.current) return;
    managerRef.current.updateGeometry(params);
  }, [params]);

  // Expune exportSTL cu modul
  const exportSTL = (mode = 'combined') => {
    managerRef.current?.exportSTL(mode);
  };

  return { exportSTL };
}
