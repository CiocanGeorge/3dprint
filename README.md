# Monogram Studio — 3D Customizer

A production-ready monogram 3D customizer built with React + Three.js (no react-three-fiber).
Generates printable STL files from custom monogram letters and names.

---

## Folder Structure

```
monogram-customizer/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx                        # React entry point
    ├── App.jsx                         # Root: owns all state
    ├── App.module.css
    ├── index.css                       # CSS variables + global reset
    ├── components/
    │   ├── ControlPanel.jsx            # Left sidebar — pure controlled form
    │   ├── ControlPanel.module.css
    │   ├── MonogramScene.jsx           # Right canvas wrapper — dumb component
    │   └── MonogramScene.module.css
    ├── hooks/
    │   └── useSceneManager.js          # React ↔ Three.js bridge hook
    └── utils/
        └── SceneManager.js             # All Three.js logic — imperative class
```

---

## Installation

```bash
cd monogram-customizer
npm install
npm run dev
```

Open: http://localhost:5173

---

## Architecture Decisions

### 1. SceneManager is a plain class, not React state

Three.js is inherently imperative. Trying to map it to React state causes:
- Scene recreation on every render (GPU thrash)
- removeChild null errors (React reconciler conflicts with DOM mutations)
- Memory leaks from untracked resources

**Solution:** `SceneManager.js` owns the renderer, scene, camera, controls, and meshes
as class properties. React never touches these. It's created once on mount and destroyed
on unmount via `useEffect(() => ..., [])`.

### 2. Two separate useEffects in useSceneManager

```js
// Effect 1: mounts once, destroys once
useEffect(() => {
  manager = new SceneManager(canvas);
  return () => manager.dispose();
}, []);

// Effect 2: fires on param change, calls update
useEffect(() => {
  manager.updateGeometry(params);
}, [params]);
```

Separating these is critical. Combining them would recreate the scene on every param change.

### 3. Geometry is disposed before recreation

Every `_updateMonogram` / `_updateName` call runs `_disposeMesh(key)` first:
```js
mesh.geometry.dispose();
scene.remove(mesh);
```
Without this, every keystroke leaks a BufferGeometry on the GPU.

### 4. Materials are created once

Materials are initialized in `_initMaterials()` and reused across geometry updates.
Only geometries change — not materials. This avoids shader recompilation.

### 5. Fonts are loaded once and cached

FontLoader is async. We handle the race condition with a `_pendingUpdate` queue:
if `updateGeometry()` is called before fonts resolve, the params are stored and
replayed immediately after load completes.

### 6. STL export merges meshes with world transforms baked in

The STLExporter receives a Group of cloned geometries with `applyMatrix4(mesh.matrixWorld)`.
This ensures the exported file respects position offsets (monogram above name, name offset in Z).
Clones are disposed after export.

### 7. ResizeObserver instead of window resize

Using `ResizeObserver` on the canvas parent handles panel resizing correctly without
global event listeners. It's cleaned up in `dispose()`.

---

## Fonts

### Current setup (development / testing)
Loads two JSON fonts from Three.js's own examples CDN:
- **optimer_bold** → serif-style monogram letter  
- **helvetiker_regular** → clean name text

### For production: Use custom fonts

1. Find a TTF font (serif for monogram, script for name)
2. Convert to Three.js JSON at: **https://gero3.github.io/facetype.js/**
   - Settings: Reverse font direction ON
3. Place the `.json` files in `/public/fonts/`
4. Update `FONT_URLS` in `SceneManager.js`:
   ```js
   const FONT_URLS = {
     monogram: '/fonts/my-serif-bold.json',
     name:     '/fonts/my-script-regular.json',
   };
   ```

### Recommended free fonts
| Purpose | Font | Source |
|---------|------|--------|
| Monogram | Playfair Display Bold | Google Fonts |
| Name | Great Vibes | Google Fonts |
| Name | Dancing Script | Google Fonts |

---

## STL Export Notes

- Format: Binary STL (smaller than ASCII)
- Units: millimeters (matches slider values)
- Both meshes exported as separate shells in one file
- Compatible with Cura, PrusaSlicer, Chitubox

---

## Browser Support

Chrome 90+, Firefox 88+, Safari 15+, Edge 90+  
(WebGL 2 required)
