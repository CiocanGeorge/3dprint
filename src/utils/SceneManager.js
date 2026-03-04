import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { ADDITION, SUBTRACTION, Evaluator, Brush } from "three-bvh-csg";

// ─── Font catalog ─────────────────────────────────────────────────────────────
export const FONTS = {
  monogram: [
    {
      id: "optimer_bold",
      label: "Optimer Bold",
      url: "https://threejs.org/examples/fonts/optimer_bold.typeface.json",
    },
    {
      id: "optimer_regular",
      label: "Optimer Regular",
      url: "https://threejs.org/examples/fonts/optimer_regular.typeface.json",
    },
    {
      id: "gentilis_bold",
      label: "Gentilis Bold",
      url: "https://threejs.org/examples/fonts/gentilis_bold.typeface.json",
    },
    {
      id: "gentilis_regular",
      label: "Gentilis Regular",
      url: "https://threejs.org/examples/fonts/gentilis_regular.typeface.json",
    },
    {
      id: "helvetiker_bold",
      label: "Helvetiker Bold",
      url: "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json",
    },
    {
      id: "helvetiker_regular",
      label: "Helvetiker Regular",
      url: "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    },
    {
      id: "droid_serif_bold",
      label: "Droid Serif Bold",
      url: "https://threejs.org/examples/fonts/droid/droid_serif_bold.typeface.json",
    },
    {
      id: "droid_serif_regular",
      label: "Droid Serif Regular",
      url: "https://threejs.org/examples/fonts/droid/droid_serif_regular.typeface.json",
    },
    {
      id: "droid_sans_bold",
      label: "Droid Sans Bold",
      url: "https://threejs.org/examples/fonts/droid/droid_sans_bold.typeface.json",
    },
    {
      id: "droid_sans_regular",
      label: "Droid Sans Regular",
      url: "https://threejs.org/examples/fonts/droid/droid_sans_regular.typeface.json",
    },
  ],
  name: [
    {
      id: "helvetiker_regular",
      label: "Helvetiker Regular",
      url: "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    },
    {
      id: "helvetiker_bold",
      label: "Helvetiker Bold",
      url: "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json",
    },
    {
      id: "gentilis_regular",
      label: "Gentilis Regular",
      url: "https://threejs.org/examples/fonts/gentilis_regular.typeface.json",
    },
    {
      id: "gentilis_bold",
      label: "Gentilis Bold",
      url: "https://threejs.org/examples/fonts/gentilis_bold.typeface.json",
    },
    {
      id: "optimer_regular",
      label: "Optimer Regular",
      url: "https://threejs.org/examples/fonts/optimer_regular.typeface.json",
    },
    {
      id: "optimer_bold",
      label: "Optimer Bold",
      url: "https://threejs.org/examples/fonts/optimer_bold.typeface.json",
    },
    {
      id: "droid_sans_regular",
      label: "Droid Sans Regular",
      url: "https://threejs.org/examples/fonts/droid/droid_sans_regular.typeface.json",
    },
    {
      id: "droid_sans_bold",
      label: "Droid Sans Bold",
      url: "https://threejs.org/examples/fonts/droid/droid_sans_bold.typeface.json",
    },
    {
      id: "droid_serif_regular",
      label: "Droid Serif Regular",
      url: "https://threejs.org/examples/fonts/droid/droid_serif_regular.typeface.json",
    },
    {
      id: "droid_serif_bold",
      label: "Droid Serif Bold",
      url: "https://threejs.org/examples/fonts/droid/droid_serif_bold.typeface.json",
    },
  ],
};

const MAT = {
  monogram: { color: 0x5c6ac4, roughness: 0.15, metalness: 0.75 },
  name: { color: 0x8a6bbf, roughness: 0.1, metalness: 0.8 },
};

export class SceneManager {
  constructor(canvas) {
    this._canvas = canvas;
    this._disposed = false;
    this._animFrameId = null;
    this._fontCache = {}; // url → THREE.Font
    this._meshes = { monogram: null, name: null };
    this._currentParams = null; // pentru race condition guard

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initLights();
    this._initControls();
    this._initMaterials();
    this._startLoop();
  }

  // ─── Init ────────────────────────────────────────────────────────────────────

  _initRenderer() {
    this._renderer = new THREE.WebGLRenderer({
      canvas: this._canvas,
      antialias: true,
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(this._canvas.clientWidth, this._canvas.clientHeight);
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.2;
    this._resizeObserver = new ResizeObserver(() => this._handleResize());
    this._resizeObserver.observe(this._canvas.parentElement || this._canvas);
  }

  _initScene() {
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0xf5f3f0);
    const grid = new THREE.GridHelper(200, 40, 0xdedad5, 0xe8e4df);
    grid.position.y = -50;
    this._scene.add(grid);
  }

  _initCamera() {
    const { clientWidth: w, clientHeight: h } = this._canvas;
    this._camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
    this._camera.position.set(0, 0, 180);
    this._camera.lookAt(0, 0, 0);
  }

  _initLights() {
    this._scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(60, 80, 60);
    const fill = new THREE.DirectionalLight(0xe8eeff, 0.5);
    fill.position.set(-60, 20, -40);
    const rim = new THREE.DirectionalLight(0xb8c0ff, 0.4);
    rim.position.set(0, -30, -80);
    this._scene.add(key, fill, rim);
  }

  _initControls() {
    this._controls = new OrbitControls(this._camera, this._canvas);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.06;
    this._controls.minDistance = 10;
    this._controls.maxDistance = 600;
    this._controls.autoRotate = false;
  }

  _initMaterials() {
    this._materials = {
      monogram: new THREE.MeshStandardMaterial(MAT.monogram),
      name: new THREE.MeshStandardMaterial(MAT.name),
    };
  }

  _startLoop() {
    const tick = () => {
      if (this._disposed) return;
      this._animFrameId = requestAnimationFrame(tick);
      this._controls.update();
      this._renderer.render(this._scene, this._camera);
    };
    tick();
  }

  // ─── Font loading — lazy, cached per URL ────────────────────────────────────

  _loadFont(url) {
    if (this._fontCache[url]) return Promise.resolve(this._fontCache[url]);
    return new Promise((resolve, reject) => {
      new FontLoader().load(
        url,
        (font) => {
          this._fontCache[url] = font;
          resolve(font);
        },
        undefined,
        (err) => reject(err),
      );
    });
  }

  _getFontUrl(role, fontId) {
    const list = FONTS[role];
    const entry = list.find((f) => f.id === fontId) ?? list[0];
    return entry.url;
  }

  // ─── Public update API ───────────────────────────────────────────────────────

  async updateGeometry(params) {
    // Setăm params curent — dacă vine un update nou cât așteptăm fontul, abandonăm pe cel vechi
    this._currentParams = params;

    this._materials.monogram.color.set(params.monogramColor ?? "#5c6ac4");
    this._materials.name.color.set(params.nameColor ?? "#8a6bbf");

    const {
      monogramLetter,
      monogramSize,
      monoScaleX,
      monoScaleY,
      monoScaleZ,
      monogramFontId,
      fullName,
      nameSize,
      nameScaleX,
      nameScaleY,
      nameScaleZ,
      nameFontId,
      nameOffsetX,
      nameOffsetY,
      nameOffsetZ,
      letterSpacing,
    } = params;

    const monoUrl = this._getFontUrl("monogram", monogramFontId);
    const nameUrl = this._getFontUrl("name", nameFontId);

    let monoFont, nameFont;
    try {
      [monoFont, nameFont] = await Promise.all([
        this._loadFont(monoUrl),
        this._loadFont(nameUrl),
      ]);
    } catch (e) {
      console.error("Font load failed:", e);
      return;
    }

    // Race condition guard — dacă params s-a schimbat cât încărcam, renunțăm
    if (this._currentParams !== params) return;

    this._buildMonogram(
      monogramLetter,
      monogramSize,
      monoScaleX,
      monoScaleY,
      monoScaleZ,
      monoFont,
    );
    this._buildName(
      fullName,
      nameSize,
      nameScaleX,
      nameScaleY,
      nameScaleZ,
      nameFont,
      letterSpacing ?? 0,
    );
    this._alignComposition(
      nameOffsetX ?? 0,
      nameOffsetY ?? 0,
      nameOffsetZ ?? 0,
    );
  }

  // ─── Geometry ────────────────────────────────────────────────────────────────

  _buildMonogram(letter, size, sx, sy, sz, font) {
    this._disposeMesh("monogram");
    if (!letter?.trim()) return;

    const geo = new TextGeometry(letter.trim()[0].toUpperCase(), {
      font,
      size,
      depth: size,
      curveSegments: 20,
      bevelEnabled: true,
      bevelThickness: size * 0.04,
      bevelSize: size * 0.01,
      bevelSegments: 6,
    });
    geo.computeBoundingBox();
    geo.center();

    const mesh = new THREE.Mesh(geo, this._materials.monogram);
    mesh.name = "monogram";
    mesh.scale.set(sx, sy, sz);
    this._meshes.monogram = mesh;
    this._scene.add(mesh);
  }

  /**
   * Construiește textul cu spacing controlat între litere.
   *
   * Cum funcționează:
   * - Fiecare caracter → TextGeometry separat
   * - Le poziționăm manual pe X cu: lățime_literă + letterSpacing
   * - letterSpacing = 0  → spațiere normală
   * - letterSpacing < 0  → litere mai apropiate / lipite / suprapuse
   * - Toate geometriile sunt merge-uite într-un singur BufferGeometry
   *   → un singur mesh solid, fără artefacte la export STL
   */
  _buildName(text, size, sx, sy, sz, font, letterSpacing) {
    this._disposeMesh("name");
    if (!text?.trim()) return;

    const chars = text.trim().split("");
    const depth = size;
    const letterGeos = [];
    let cursorX = 0;

    for (const char of chars) {
      if (char === " ") {
        // Spațiu = avanasăm cursorul cu 40% din size
        cursorX += size * 0.4 + letterSpacing;
        continue;
      }

      const geo = new TextGeometry(char, {
        font,
        size,
        depth,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: depth * 0.04,
        bevelSize: size * 0.02,
        bevelSegments: 4,
      });

      geo.computeBoundingBox();
      const minX = geo.boundingBox.min.x;
      const charW = geo.boundingBox.max.x - minX;

      // Eliminăm offset-ul stânga al literei și o plasăm la cursorX
      geo.translate(cursorX - minX, 0, 0);

      letterGeos.push(geo);

      // Avansăm cursorul — letterSpacing negativ = litere lipite
      cursorX += charW + letterSpacing;
    }

    if (!letterGeos.length) return;

    // Merge într-un singur geometry
    const merged = mergeGeometries(letterGeos, false);
    letterGeos.forEach((g) => g.dispose());

    if (!merged) return;

    // Centrăm textul complet
    merged.computeBoundingBox();
    merged.center();

    const mesh = new THREE.Mesh(merged, this._materials.name);
    mesh.name = "name";
    mesh.scale.set(sx, sy, sz);
    this._meshes.name = mesh;
    this._scene.add(mesh);
  }

  // ─── Positioning ─────────────────────────────────────────────────────────────

  _alignComposition(offsetX, offsetY, offsetZ) {
    const { monogram, name } = this._meshes;
    if (!monogram && !name) return;

    if (monogram) monogram.position.set(0, 0, 0);

    if (monogram && name) {
      monogram.updateMatrixWorld(true);
      name.updateMatrixWorld(true);

      // Bounding box în world space (include scale aplicat)
      const monoBox = new THREE.Box3().setFromObject(monogram);
      const nameBox = new THREE.Box3().setFromObject(name);

      const monoDepth = monoBox.max.z - monoBox.min.z; // grosimea reală a literei (mm)
      const nameDepth = nameBox.max.z - nameBox.min.z; // grosimea reală a numelui (mm)

      // Auto-fit X: dacă numele e mai lat decât 85% din literă, îl scalăm
      const monoW = monoBox.max.x - monoBox.min.x;
      const nameW = nameBox.max.x - nameBox.min.x;
      const maxW = monoW * 0.85;
      if (nameW > maxW) {
        const fit = maxW / nameW;
        name.scale.x *= fit;
        name.scale.y *= fit;
      }

      // Y: centrat vertical pe literă, ușor jos (8% din înălțime)
      const monoH = monoBox.max.y - monoBox.min.y;
      const baseY = -monoH * 0.08;

      // Z: numele încastrat — fața numelui aliniată cu fața literei
      // fața literei = monoBox.max.z
      // vrem ca fața numelui (nameBox.max.z) să fie la monoBox.max.z
      // deci: name.position.z = monoBox.max.z - nameBox.max.z
      const baseZ = monoBox.max.z - nameBox.max.z;

      name.position.set(offsetX, baseY + offsetY, baseZ + offsetZ);
    } else if (name) {
      name.position.set(offsetX, offsetY, offsetZ);
    }
  }

  // ─── Export ──────────────────────────────────────────────────────────────────

  _download(buffer, filename) {
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), {
      href: url,
      download: filename,
    }).click();
    URL.revokeObjectURL(url);
  }

  _bakeGeometry(mesh) {
    mesh.updateMatrixWorld(true);
    const geo = mesh.geometry.clone();
    geo.applyMatrix4(mesh.matrixWorld);
    return geo;
  }

  exportSTL(mode = "combined") {
    const exporter = new STLExporter();

    const exportSingle = (geo, filename) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(geo));
      const buf = exporter.parse(g, { binary: true });
      geo.dispose();
      this._download(buf, filename);
    };

    if (mode === "combined") {
      // ─── combined: neschimbat ─────────────────────────────────────────────
      const group = new THREE.Group();
      const geos = [];
      Object.values(this._meshes).forEach((mesh) => {
        if (!mesh) return;
        const geo = this._bakeGeometry(mesh);
        geos.push(geo);
        group.add(new THREE.Mesh(geo));
      });
      if (!group.children.length) {
        alert("Nimic de exportat.");
        return;
      }
      const buf = exporter.parse(group, { binary: true });
      geos.forEach((g) => g.dispose());
      this._download(buf, "monogram_combined.stl");
    } else if (mode === "letter") {
      // ─── letter: neschimbat ───────────────────────────────────────────────
      if (!this._meshes.monogram) {
        alert("Nu există literă.");
        return;
      }
      exportSingle(
        this._bakeGeometry(this._meshes.monogram),
        "monogram_litera.stl",
      );
    } else if (mode === "name_only") {
      // ─── name_only: neschimbat ────────────────────────────────────────────
      if (!this._meshes.name) {
        alert("Nu există nume.");
        return;
      }
      exportSingle(this._bakeGeometry(this._meshes.name), "monogram_nume.stl");
    } else if (mode === "letter_with_slot") {
      // ─── letter_with_slot: litera cu slot adânc parțial ──────────────────
      const { monogram: monoMesh, name: nameMesh } = this._meshes;
      if (!monoMesh || !nameMesh) {
        alert("Trebuie să existe atât litera cât și numele.");
        return;
      }

      // 1. Calculăm adâncimea literei
      monoMesh.updateMatrixWorld(true);
      nameMesh.updateMatrixWorld(true);

      const monoBox = new THREE.Box3().setFromObject(monoMesh);
      const monoDepth = monoBox.max.z - monoBox.min.z; // adâncimea totală a literei

      // 2. Construim brush-ul pentru literă (geometria originală cu world transform)
      const monoGeo = this._bakeGeometry(monoMesh);
      const monoBrush = new Brush(monoGeo);
      monoBrush.updateMatrixWorld(true);

      // 3. Construim brush-ul pentru slot — numele scalat pe Z la 60% din adâncimea literei
      //    și poziționat să intre din față (Z max al literei)
      const nameGeo = this._bakeGeometry(nameMesh);
      nameGeo.computeBoundingBox();
      const nameBox = nameGeo.boundingBox;
      const nameDepth = nameBox.max.z - nameBox.min.z;
      const slotDepth = monoDepth * 0.6; // slot = 60% din adâncimea literei

      // Scalăm geometria numelui pe Z să aibă exact slotDepth + 1mm toleranță
      const scaleZ = (slotDepth + 1) / nameDepth;
      // Toleranță X/Y de 0.3mm pentru fit ușor
      const scaleTol =
        1.0 +
        0.3 /
          Math.max(
            nameBox.max.x - nameBox.min.x,
            nameBox.max.y - nameBox.min.y,
          );

      const pos = nameGeo.attributes.position;
      nameGeo.computeBoundingBox();
      const center = new THREE.Vector3();
      nameGeo.boundingBox.getCenter(center);

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i),
          y = pos.getY(i),
          z = pos.getZ(i);
        pos.setXYZ(
          i,
          center.x + (x - center.x) * scaleTol,
          center.y + (y - center.y) * scaleTol,
          center.z + (z - center.z) * scaleZ,
        );
      }
      pos.needsUpdate = true;
      nameGeo.computeVertexNormals();
      nameGeo.computeBoundingBox();

      // Repoziționăm slotul: față aliniată cu fața literei (Z max al literei)
      // astfel încât slotul intră din față și se oprește la 40% din adâncime
      const slotCenter = new THREE.Vector3();
      nameGeo.boundingBox.getCenter(slotCenter);
      const slotHalfDepth =
        (nameGeo.boundingBox.max.z - nameGeo.boundingBox.min.z) / 2;

      // Z față literă − slotHalfDepth = centrul slotului astfel că fața lui = fața literei
      const targetZ = monoBox.max.z - slotHalfDepth;
      nameGeo.translate(0, 0, targetZ - slotCenter.z);

      const nameBrush = new Brush(nameGeo);
      nameBrush.updateMatrixWorld(true);

      // 4. CSG subtract: litera − slot
      const evaluator = new Evaluator();
      let resultMesh;
      try {
        resultMesh = evaluator.evaluate(monoBrush, nameBrush, SUBTRACTION);
      } catch (e) {
        console.error("CSG subtraction failed:", e);
        alert("Eroare la generarea slot-ului. Încearcă cu forme mai simple.");
        monoGeo.dispose();
        nameGeo.dispose();
        return;
      }

      // 5. Export literă cu slot
      const resultGeo = resultMesh.geometry.clone();
      exportSingle(resultGeo, "monogram_litera_cu_slot.stl");

      // 6. Export numele separat (pentru a fi printat și încastrat)
      exportSingle(this._bakeGeometry(nameMesh), "monogram_nume_insert.stl");

      monoGeo.dispose();
      nameGeo.dispose();
    }
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────────

  _disposeMesh(key) {
    const m = this._meshes[key];
    if (!m) return;
    m.geometry.dispose();
    this._scene.remove(m);
    this._meshes[key] = null;
  }

  _handleResize() {
    if (this._disposed) return;
    const parent = this._canvas.parentElement;
    if (!parent) return;
    this._camera.aspect = parent.clientWidth / parent.clientHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(parent.clientWidth, parent.clientHeight);
  }

  dispose() {
    this._disposed = true;
    if (this._animFrameId !== null) cancelAnimationFrame(this._animFrameId);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    this._disposeMesh("monogram");
    this._disposeMesh("name");
    Object.values(this._materials).forEach((m) => m.dispose());
    this._controls.dispose();
    this._renderer.dispose();
  }
}
