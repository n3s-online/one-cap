import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import {
  TextGeometry,
  TextGeometryParameters,
} from "three/examples/jsm/geometries/TextGeometry";

interface BaseballCapProps {
  color?: string;
  letter?: string;
  letterColor?: string;
}

const BaseballCap: React.FC<BaseballCapProps> = ({
  color = "#ffffff",
  letter = "A",
  letterColor = "#ff0000",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [capInstance, setCapInstance] = useState<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    cap: THREE.Group | null;
    textMesh: THREE.Mesh | null;
    animate: () => void;
    setCapColor: (color: string) => void;
    createText: (letter: string, color: string) => void;
    cleanup: () => void;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setClearColor(0xf0f0f0);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(500, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Camera and controls setup
    camera.position.set(0, 0, 2);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Cap model and text mesh
    let cap: THREE.Group | null = null;
    let textMesh: THREE.Mesh | null = null;
    let font: THREE.Font | null = null;

    // Load font for 3D text
    const fontLoader = new FontLoader();
    fontLoader.load(
      "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json",
      (loadedFont) => {
        font = loadedFont;
        console.log("Font loaded successfully");
        // If letter is already specified and cap is loaded, create the text
        if (letter && cap) createText(letter, letterColor);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% of font loaded");
      },
      (error) => {
        console.error("An error occurred loading the font:", error);
      }
    );

    // Load the model
    const loadModel = () => {
      const loader = new GLTFLoader();
      const loadingManager = new THREE.LoadingManager();

      loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        console.log(
          `Loading file: ${url}. Loaded ${itemsLoaded}/${itemsTotal} files.`
        );
      };

      loader.load(
        "/models/baseball_cap.glb",
        (gltf) => {
          cap = gltf.scene;

          // Adjust model position and scale as needed
          cap.scale.set(1, 1, 1);
          cap.position.set(0, 0, 0);
          cap.rotation.set(0, 0, 0);

          // Enable shadows and store material reference
          cap.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              (child as THREE.Mesh).castShadow = true;
              (child as THREE.Mesh).receiveShadow = true;
              // Store the original material if needed
              const mesh = child as THREE.Mesh;
              if (Array.isArray(mesh.material)) {
                (child as any).originalMaterial = mesh.material.map((m) =>
                  m.clone()
                );
              } else {
                (child as any).originalMaterial = mesh.material.clone();
              }
            }
          });

          scene.add(cap);
          console.log("Model loaded successfully");

          // Apply initial color and text if provided
          if (color) setCapColor(color);
          if (letter && font) createText(letter, letterColor);
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        },
        (error) => {
          console.error("An error occurred loading the model:", error);
        }
      );
    };

    // Create 3D text on the cap
    const createText = (letter: string, color: string) => {
      if (!cap) {
        console.log("Cap not loaded yet, waiting...");
        setTimeout(() => createText(letter, color), 100);
        return;
      }

      if (!font) {
        console.log("Font not loaded yet, waiting...");
        setTimeout(() => createText(letter, color), 100);
        return;
      }

      // Remove previous text if it exists
      if (textMesh && cap) cap.remove(textMesh);

      // Create 3D text geometry
      const textGeometry = new TextGeometry(letter, {
        font: font,
        size: 0.05,
        height: 0.035, // this doesn't exist on the type but fixes the error
      } as TextGeometryParameters);

      // Center the text geometry
      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox
        ? textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x
        : 0;
      const textHeight = textGeometry.boundingBox
        ? textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y
        : 0;

      textGeometry.translate(-textWidth / 2, -textHeight / 2, 0);

      // Create material for the text
      const textMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        metalness: 0.3,
        roughness: 0.4,
      });

      // Create the text mesh
      textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.castShadow = true;

      // Position the text on the cap
      textMesh.position.set(0, 0.07, 0.025);
      textMesh.rotation.x = -Math.PI * (25 / 180); // Tilt back 25 degrees

      if (cap) cap.add(textMesh);
    };

    // Set cap color
    const setCapColor = (color: string) => {
      if (!cap) {
        console.log("Cap not loaded yet");
        return;
      }

      cap.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child !== textMesh) {
          // Create a new material with the desired color
          const newMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            roughness: 0.7,
            metalness: 0.1,
          });
          (child as THREE.Mesh).material = newMaterial;
        }
      });
    };

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (cap) {
        cap.rotation.y += 0.005;
      }
      controls.update();
      renderer.render(scene, camera);
    };

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;

      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    window.addEventListener("resize", handleResize);

    // Initialize
    loadModel();
    animate();

    // Cleanup function
    const cleanup = () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };

    // Store the instance for external control
    setCapInstance({
      scene,
      camera,
      renderer,
      controls,
      cap,
      textMesh,
      animate,
      setCapColor,
      createText,
      cleanup,
    });

    // Cleanup on component unmount
    return cleanup;
  }, []);

  // Apply prop changes
  useEffect(() => {
    if (capInstance && color) {
      capInstance.setCapColor(color);
    }
  }, [capInstance, color]);

  useEffect(() => {
    if (capInstance && letter) {
      capInstance.createText(letter, letterColor);
    }
  }, [capInstance, letter, letterColor]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
      }}
    />
  );
};

export default BaseballCap;
