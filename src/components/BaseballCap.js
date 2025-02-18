import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";

export class BaseballCap {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.textMesh = null;
    this.cap = null;
    this.setupScene();
    this.loadModel();
    this.animate();
  }

  setupScene() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0xf0f0f0);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Camera and controls setup
    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Handle window resize
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  loadModel() {
    const loader = new GLTFLoader();

    // Add loading manager to track progress
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      console.log(
        `Loading file: ${url}. Loaded ${itemsLoaded}/${itemsTotal} files.`
      );
    };

    loader.load(
      "/models/baseball_cap.glb",
      (gltf) => {
        this.cap = gltf.scene;

        // Adjust model position and scale as needed
        this.cap.scale.set(1, 1, 1);
        this.cap.position.set(0, 0, 0);
        this.cap.rotation.set(0, 0, 0);

        // Enable shadows and store material reference
        this.cap.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            // Store the original material if needed
            child.originalMaterial = child.material.clone();
          }
        });

        this.scene.add(this.cap);
        console.log("Model loaded successfully");
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("An error occurred loading the model:", error);
      }
    );
  }

  createText(letter, color) {
    if (!this.cap) {
      console.log("Cap not loaded yet, waiting...");
      setTimeout(() => this.createText(letter, color), 100);
      return;
    }

    const loader = new FontLoader();

    loader.load(
      "/node_modules/three/examples/fonts/helvetiker_bold.typeface.json",
      (font) => {
        const textGeometry = new TextGeometry(letter, {
          font: font,
          size: 0.05,
          height: 0.035,
        });

        if (this.textMesh) this.cap.remove(this.textMesh);

        const textMaterial = new THREE.MeshPhongMaterial({ color });
        this.textMesh = new THREE.Mesh(textGeometry, textMaterial);

        // Center the text
        textGeometry.computeBoundingBox();
        const textWidth =
          textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        const textHeight =
          textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;

        // Position text and rotate it backwards 15 degrees
        this.textMesh.position.set(-textWidth / 2, 0.05, 0.035);
        this.textMesh.rotation.x = -Math.PI * (25 / 180); // Convert 15 degrees to radians
        this.cap.add(this.textMesh);
      }
    );
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    if (this.cap) {
      this.cap.rotation.y += 0.0;
    }
    if (this.controls) {
      this.controls.update();
    }
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setCapColor(color) {
    if (!this.cap) {
      console.log("Cap not loaded yet");
      return;
    }

    this.cap.traverse((child) => {
      if (child.isMesh && child !== this.textMesh) {
        // Create a new material with the desired color
        const newMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          roughness: 0.7,
          metalness: 0.1,
        });
        child.material = newMaterial;
      }
    });
  }
}
