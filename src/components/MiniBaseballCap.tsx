import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import {
  TextGeometry,
  TextGeometryParameters,
} from "three/examples/jsm/geometries/TextGeometry";

interface MiniBaseballCapProps {
  color?: string;
  letter?: string;
  letterColor?: string;
  name?: string;
}

const MiniBaseballCap: React.FC<MiniBaseballCapProps> = ({
  color = "#ffffff",
  letter = "A",
  letterColor = "#ff0000",
  name = "Baseball Cap",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isFontLoaded, setIsFontLoaded] = useState(false);
  const capRef = useRef<THREE.Group | null>(null);
  const textMeshRef = useRef<THREE.Mesh | null>(null);
  const nameTextMeshRef = useRef<THREE.Mesh | null>(null);
  const fontRef = useRef<any>(null);
  const [isPipActive, setIsPipActive] = useState(false);
  const colorAnimationRef = useRef<{ id: number } | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    rendererRef.current = renderer;

    renderer.setSize(200, 200);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0xf5f5f5, 0.3);
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(500, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    camera.position.set(0, 0.05, 0.3);

    const fontLoader = new FontLoader();
    fontLoader.load(
      "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json",
      (loadedFont) => {
        fontRef.current = loadedFont;
        setIsFontLoaded(true);
        if (letter && capRef.current) createText(letter, letterColor);
        createNameText(name);
      },
      undefined,
      (error) => {
        console.error("An error occurred loading the font:", error);
      }
    );

    const loadModel = () => {
      const loader = new GLTFLoader();
      loader.load(
        "/models/baseball_cap.glb",
        (gltf) => {
          const cap = gltf.scene;
          capRef.current = cap;

          cap.scale.set(1, 1, 1);
          cap.position.set(0, 0, 0);
          cap.rotation.set(0, 0, 0);

          cap.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              (child as THREE.Mesh).castShadow = true;
              (child as THREE.Mesh).receiveShadow = true;
            }
          });

          scene.add(cap);
          setIsModelLoaded(true);

          if (color) setCapColor(color);
          if (letter && fontRef.current) createText(letter, letterColor);
          if (fontRef.current) createNameText(name);
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the model:", error);
        }
      );
    };

    const createText = (letter: string, color: string) => {
      if (!capRef.current || !fontRef.current) return;

      if (textMeshRef.current && capRef.current)
        capRef.current.remove(textMeshRef.current);

      const textGeometry = new TextGeometry(letter, {
        font: fontRef.current,
        size: 0.05,
        height: 0.035,
      } as TextGeometryParameters);

      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox
        ? textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x
        : 0;
      const textHeight = textGeometry.boundingBox
        ? textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y
        : 0;

      textGeometry.translate(-textWidth / 2, -textHeight / 2, 0);

      const textMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        metalness: 0.3,
        roughness: 0.4,
      });

      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMeshRef.current = textMesh;
      textMesh.castShadow = true;

      textMesh.position.set(0, 0.07, 0.025);
      textMesh.rotation.x = -Math.PI * (25 / 180);

      if (capRef.current) capRef.current.add(textMesh);
    };

    const createNameText = (capName: string) => {
      if (!fontRef.current) return;

      if (nameTextMeshRef.current) {
        scene.remove(nameTextMeshRef.current);
        nameTextMeshRef.current = null;
      }

      // Calculate the available width in the scene
      // For a perspective camera with FOV 75 at z=0.3, we can estimate the visible width
      const visibleWidth = 0.4; // Approximate visible width at z=0.3
      const padding = visibleWidth * 0.1; // 10% padding on each side
      const maxTextWidth = visibleWidth - padding * 2; // Available width for text

      // Start with a reasonable size and adjust if needed
      let fontSize = 0.05;
      let textGeometry = new TextGeometry(capName, {
        font: fontRef.current,
        size: fontSize,
        height: 0.005,
      } as TextGeometryParameters);

      // Compute bounding box to get text width
      textGeometry.computeBoundingBox();
      let textWidth = textGeometry.boundingBox
        ? textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x
        : 0;

      // If text is too wide, scale it down to fit
      if (textWidth > maxTextWidth) {
        const scale = maxTextWidth / textWidth;
        fontSize *= scale;

        // Recreate geometry with adjusted size
        textGeometry = new TextGeometry(capName, {
          font: fontRef.current,
          size: fontSize,
          height: 0.005,
        } as TextGeometryParameters);

        textGeometry.computeBoundingBox();
        textWidth = textGeometry.boundingBox
          ? textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x
          : 0;
      }

      const textHeight = textGeometry.boundingBox
        ? textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y
        : 0;

      // Center horizontally and position at the top of the scene
      textGeometry.translate(-textWidth / 2, 0, 0);

      const nameMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xffffff),
        transparent: true,
        opacity: 0.7,
        metalness: 0.1,
        roughness: 0.8,
      });

      const nameMesh = new THREE.Mesh(textGeometry, nameMaterial);
      nameTextMeshRef.current = nameMesh;

      // Position at the top of the scene
      nameMesh.position.set(0, 0.2, -0.05);

      scene.add(nameMesh);

      updateNameTextColor(color);
    };

    const updateNameTextColor = (capColor: string) => {
      if (!nameTextMeshRef.current) return;

      const material = nameTextMeshRef.current
        .material as THREE.MeshStandardMaterial;
      material.color = new THREE.Color(capColor);
      material.opacity = 0.7;
    };

    const setCapColor = (color: string) => {
      if (!capRef.current) return;

      const calculateComplementaryColor = (hexColor: string): string => {
        const hex = hexColor.replace("#", "");

        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);

        r = 255 - r;
        g = 255 - g;
        b = 255 - b;

        return `#${r.toString(16).padStart(2, "0")}${g
          .toString(16)
          .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      };

      const complementaryColor = calculateComplementaryColor(color);
      const targetColor = new THREE.Color(complementaryColor);

      const currentColor = scene.background
        ? (scene.background as THREE.Color).clone()
        : new THREE.Color("#000000");

      if (colorAnimationRef.current) {
        cancelAnimationFrame(colorAnimationRef.current.id);
        colorAnimationRef.current = null;
      }

      const duration = 800;
      const startTime = performance.now();

      const animateBackgroundColor = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const r =
          currentColor.r + (targetColor.r - currentColor.r) * easeProgress;
        const g =
          currentColor.g + (targetColor.g - currentColor.g) * easeProgress;
        const b =
          currentColor.b + (targetColor.b - currentColor.b) * easeProgress;

        scene.background = new THREE.Color(r, g, b);

        if (progress < 1) {
          colorAnimationRef.current = {
            id: requestAnimationFrame(animateBackgroundColor),
          };
        } else {
          colorAnimationRef.current = null;
        }
      };

      colorAnimationRef.current = {
        id: requestAnimationFrame(animateBackgroundColor),
      };

      capRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child !== textMeshRef.current) {
          const newMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            roughness: 0.7,
            metalness: 0.1,
          });
          (child as THREE.Mesh).material = newMaterial;
        }
      });

      updateNameTextColor(color);
    };

    const animate = () => {
      requestAnimationFrame(animate);
      if (capRef.current) {
        capRef.current.rotation.y += 0.01;
      }
      renderer.render(scene, camera);
    };

    loadModel();
    animate();

    window.miniCapFunctions = {
      setCapColor,
      createText,
      createNameText,
    };

    return () => {
      if (colorAnimationRef.current) {
        cancelAnimationFrame(colorAnimationRef.current.id);
        colorAnimationRef.current = null;
      }

      if (document.pictureInPictureElement && videoRef.current) {
        document.exitPictureInPicture().catch((err) => {
          console.error("Error exiting PiP on unmount:", err);
        });
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      delete window.miniCapFunctions;
      renderer.dispose();
      if (
        containerRef.current &&
        containerRef.current.contains(renderer.domElement)
      ) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!videoRef.current || !rendererRef.current) return;

      if (document.hidden && !isPipActive) {
        try {
          if (document.pictureInPictureEnabled) {
            if (!mediaStreamRef.current) {
              const canvas = rendererRef.current.domElement;
              mediaStreamRef.current = canvas.captureStream(30);
              videoRef.current.srcObject = mediaStreamRef.current;
              await videoRef.current.play();
            }

            if (!document.pictureInPictureElement) {
              await videoRef.current.requestPictureInPicture();
              setIsPipActive(true);
            }
          }
        } catch (error) {
          console.error("Failed to enter Picture-in-Picture mode:", error);
        }
      } else if (!document.hidden && isPipActive) {
        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          }
          setIsPipActive(false);
        } catch (error) {
          console.error("Failed to exit Picture-in-Picture mode:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPipActive]);

  useEffect(() => {
    if (isModelLoaded && window.miniCapFunctions) {
      window.miniCapFunctions.setCapColor(color);
    }
  }, [color, isModelLoaded]);

  useEffect(() => {
    if (isModelLoaded && isFontLoaded && window.miniCapFunctions) {
      window.miniCapFunctions.createText(letter, letterColor);
    }
  }, [letter, letterColor, isModelLoaded, isFontLoaded]);

  useEffect(() => {
    if (isFontLoaded && window.miniCapFunctions) {
      window.miniCapFunctions.createNameText(name);
    }
  }, [name, isFontLoaded]);

  return (
    <>
      <div
        ref={containerRef}
        style={{
          width: "200px",
          height: "200px",
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 10,
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      />
      <video
        ref={videoRef}
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
        }}
        muted
        playsInline
      />
    </>
  );
};

declare global {
  interface Window {
    miniCapFunctions?: {
      setCapColor: (color: string) => void;
      createText: (letter: string, color: string) => void;
      createNameText: (name: string) => void;
    };
  }
}

export default MiniBaseballCap;
