import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

// Dimensiuni placuta (in mm, scala 1:1)
const W = 85;
const H = 25;
const DEPTH = 3;
const CORNER_R = 2;
const EU_BAND_W = 10;
const TEXT_DEPTH = 0.3;
const NAME_DEPTH = 0.3;

export class LicensePlateScene {
  constructor(canvas) {
    this._canvas = canvas;
    this._meshes = {};
    this._font = null;
    this._plateText = "AB-123-CD";
    this._nameText = "YOUR NAME";
    this._countryText = "F";
    this._animFrame = null;

    this._initRenderer();
    this._initScene();
    this._initLights();
    this._initCamera();
    this._initControls();
    this._loadFont();
    this._animate();
  }

  _initRenderer() {
    this._renderer = new THREE.WebGLRenderer({
      canvas: this._canvas,
      antialias: true,
      alpha: true,
    });
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.2;
    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  _resize() {
    const w = this._canvas.clientWidth;
    const h = this._canvas.clientHeight;
    this._renderer.setSize(w, h, false);
    if (this._camera) {
      this._camera.aspect = w / h;
      this._camera.updateProjectionMatrix();
    }
  }

  _initScene() {
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x1a1a2e);
  }

  _initLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this._scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(50, 80, 60);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    this._scene.add(key);

    const fill = new THREE.DirectionalLight(0x8888ff, 0.4);
    fill.position.set(-50, 20, -30);
    this._scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.3);
    rim.position.set(0, -30, -60);
    this._scene.add(rim);
  }

  _initCamera() {
    this._camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    this._camera.position.set(0, 20, 80);
    this._camera.lookAt(0, 0, 0);
  }

  _initControls() {
    this._controls = new OrbitControls(this._camera, this._canvas);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.08;
    this._controls.minDistance = 30;
    this._controls.maxDistance = 200;
    this._controls.maxPolarAngle = Math.PI * 0.75;
  }

  _loadFont() {
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json",
      (font) => {
        this._font = font;
        this._buildPlate();
      }
    );
  }

  _buildRoundedBox(w, h, d, r) {
    // Approximare rounded box cu ChamferGeometry manual
    const shape = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);

    const extrudeSettings = {
      depth: d,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.3,
      bevelSegments: 3,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  _buildPlate() {
    // Curăță meshuri vechi
    Object.values(this._meshes).forEach((m) => {
      if (m) {
        this._scene.remove(m);
        m.geometry?.dispose();
      }
    });
    this._meshes = {};

    const baseZ = -DEPTH / 2;

    // --- 1. CORP (rama neagra) ---
    const corpGeo = this._buildRoundedBox(W, H, DEPTH, CORNER_R);
    corpGeo.translate(0, 0, baseZ);
    const corpMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.3,
      metalness: 0.1,
    });
    const corp = new THREE.Mesh(corpGeo, corpMat);
    corp.castShadow = true;
    this._scene.add(corp);
    this._meshes.corp = corp;

    // --- 2. FUNDAL ALB (plăcuța număr) ---
    const fundalShape = new THREE.Shape();
    const fx = -W / 2 + EU_BAND_W + 1;
    const fy = -H / 2 + 5;
    const fw = W - EU_BAND_W - 2;
    const fh = H - 7;
    const fr = 1;
    fundalShape.moveTo(fx + fr, fy);
    fundalShape.lineTo(fx + fw - fr, fy);
    fundalShape.quadraticCurveTo(fx + fw, fy, fx + fw, fy + fr);
    fundalShape.lineTo(fx + fw, fy + fh - fr);
    fundalShape.quadraticCurveTo(fx + fw, fy + fh, fx + fw - fr, fy + fh);
    fundalShape.lineTo(fx + fr, fy + fh);
    fundalShape.quadraticCurveTo(fx, fy + fh, fx, fy + fh - fr);
    fundalShape.lineTo(fx, fy + fr);
    fundalShape.quadraticCurveTo(fx, fy, fx + fr, fy);

    const fundalGeo = new THREE.ExtrudeGeometry(fundalShape, {
      depth: 0.5,
      bevelEnabled: false,
    });
    fundalGeo.translate(0, 0, baseZ + DEPTH);
    const fundalMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f0,
      roughness: 0.8,
      metalness: 0,
    });
    const fundal = new THREE.Mesh(fundalGeo, fundalMat);
    this._scene.add(fundal);
    this._meshes.fundal = fundal;

    // --- 3. BANDA EU (albastru) ---
    const bandShape = new THREE.Shape();
    const bx = -W / 2 + 1;
    const by = -H / 2 + 5;
    const bw = EU_BAND_W - 0.5;
    const bh = H - 7;
    const br = 1;
    bandShape.moveTo(bx + br, by);
    bandShape.lineTo(bx + bw - br, by);
    bandShape.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
    bandShape.lineTo(bx + bw, by + bh - br);
    bandShape.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
    bandShape.lineTo(bx + br, by + bh);
    bandShape.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
    bandShape.lineTo(bx, by + br);
    bandShape.quadraticCurveTo(bx, by, bx + br, by);

    const bandGeo = new THREE.ExtrudeGeometry(bandShape, {
      depth: 0.5,
      bevelEnabled: false,
    });
    bandGeo.translate(0, 0, baseZ + DEPTH);
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0x003399,
      roughness: 0.5,
      metalness: 0.1,
    });
    const banda = new THREE.Mesh(bandGeo, bandMat);
    this._scene.add(banda);
    this._meshes.banda = banda;

    if (this._font) {
      this._buildTexts();
    }
  }

  _buildTexts() {
    // Curăță textele vechi
    ["numar", "tara", "nume"].forEach((key) => {
      if (this._meshes[key]) {
        this._scene.remove(this._meshes[key]);
        this._meshes[key].geometry?.dispose();
        delete this._meshes[key];
      }
    });

    const baseZ = DEPTH / 2;

    // --- TEXT NUMĂR ---
    if (this._plateText) {
      const numGeo = new TextGeometry(this._plateText, {
        font: this._font,
        size: 6,
        height: TEXT_DEPTH,
        curveSegments: 8,
        bevelEnabled: false,
                depth: 1,
      });
      numGeo.computeBoundingBox();
      const numW = numGeo.boundingBox.max.x - numGeo.boundingBox.min.x;
      const numH = numGeo.boundingBox.max.y - numGeo.boundingBox.min.y;
      // Centrat pe zona alba (dreapta de banda EU)
      const numCenterX = (-W / 2 + EU_BAND_W + W / 2) / 2 + EU_BAND_W / 2 - 3;
      numGeo.translate(
        numCenterX - numW / 2,
        -numH / 2 + 1,
        baseZ
      );
      const numMat = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.3,
        metalness: 0.1,
      });
      const numar = new THREE.Mesh(numGeo, numMat);
      this._scene.add(numar);
      this._meshes.numar = numar;
    }

    // --- TEXT ȚARĂ ---
    if (this._countryText) {
      const taraGeo = new TextGeometry(this._countryText, {
        font: this._font,
        size: 4,
        height: TEXT_DEPTH,
        curveSegments: 8,
        bevelEnabled: false,        
        depth: 1,
      });
      taraGeo.computeBoundingBox();
      const taraW = taraGeo.boundingBox.max.x - taraGeo.boundingBox.min.x;
      const taraH = taraGeo.boundingBox.max.y - taraGeo.boundingBox.min.y;
      const bandCenterX = -W / 2 + 1 + (EU_BAND_W - 1) / 2;
      taraGeo.translate(
        bandCenterX - taraW / 2+0.5,
        -taraH / 4 ,
        baseZ
      );
      const taraMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.4,
        metalness: 0,
      });
      const tara = new THREE.Mesh(taraGeo, taraMat);
      this._scene.add(tara);
      this._meshes.tara = tara;
    }

    // --- TEXT NUME (jos pe corp negru) ---
    if (this._nameText) {
      const numeGeo = new TextGeometry(this._nameText, {
        font: this._font,
        size: 3,
        height: NAME_DEPTH,
        curveSegments: 8,
        bevelEnabled: false,
        depth: 1,
      });
      numeGeo.computeBoundingBox();
      const numeW = numeGeo.boundingBox.max.x - numeGeo.boundingBox.min.x;
      numeGeo.translate(
        -numeW / 2,
        -H / 2 + 1,
        DEPTH / 2
      );
      const numeMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.4,
        metalness: 0,
      });
      const nume = new THREE.Mesh(numeGeo, numeMat);
      this._scene.add(nume);
      this._meshes.nume = nume;
    }
  }

  updateText(plateText, nameText, countryText) {
    this._plateText = plateText.toUpperCase();
    this._nameText = nameText.toUpperCase();
    this._countryText = countryText.toUpperCase();
    if (this._font) this._buildTexts();
  }

  _animate() {
    this._animFrame = requestAnimationFrame(() => this._animate());
    this._controls.update();
    this._renderer.render(this._scene, this._camera);
  }

  // Export un singur mesh ca STL binary
  _exportMesh(mesh, filename) {
    const exporter = new STLExporter();
    const scene = new THREE.Scene();
    const clone = mesh.clone();
    scene.add(clone);
    const stl = exporter.parse(scene, { binary: true });
    const blob = new Blob([stl], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportAll() {
    const parts = [
      { key: "corp", filename: "placa_corp.stl" },
      { key: "fundal", filename: "placa_fundal_alb.stl" },
      { key: "banda", filename: "placa_banda_eu.stl" },
      { key: "numar", filename: "placa_numar.stl" },
      { key: "tara", filename: "placa_tara.stl" },
      { key: "nume", filename: "placa_nume.stl" },
    ];
    parts.forEach(({ key, filename }) => {
      if (this._meshes[key]) this._exportMesh(this._meshes[key], filename);
    });
  }

  exportCombined() {
    const exporter = new STLExporter();
    const scene = new THREE.Scene();
    Object.values(this._meshes).forEach((m) => {
      if (m) scene.add(m.clone());
    });
    const stl = exporter.parse(scene, { binary: true });
    const blob = new Blob([stl], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "placa_completa.stl";
    a.click();
    URL.revokeObjectURL(url);
  }

  destroy() {
    cancelAnimationFrame(this._animFrame);
    this._controls.dispose();
    this._renderer.dispose();
    window.removeEventListener("resize", () => this._resize());
  }
}