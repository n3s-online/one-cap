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
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [capInstance, setCapInstance] = useState<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls | null;
    cap: THREE.Group | null;
    textMesh: THREE.Mesh | null;
    animate: () => void;
    setCapColor: (color: string) => void;
    createText: (letter: string, color: string) => void;
    cleanup: () => void;
  } | null>(null);

  // Add a state to track if the model is loaded
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isFontLoaded, setIsFontLoaded] = useState(false);
  // Add a ref to store the current background color animation
  const colorAnimationRef = useRef<{ id: number } | null>(null);
  // Add a ref to store the current cap color animation
  const capColorAnimationRef = useRef<{ id: number } | null>(null);
  // Add state to track if PiP is active
  const [isPipActive, setIsPipActive] = useState(false);

  // Handle visibility change to activate/deactivate PiP
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!videoRef.current || !capInstance?.renderer) return;

      if (document.hidden && !isPipActive) {
        try {
          // Start PiP when tab becomes hidden
          if (document.pictureInPictureEnabled) {
            // Make sure we have a media stream from the canvas
            if (!mediaStreamRef.current) {
              const canvas = capInstance.renderer.domElement;
              mediaStreamRef.current = canvas.captureStream(30); // 30 FPS
              videoRef.current.srcObject = mediaStreamRef.current;
              await videoRef.current.play();
            }

            // Request Picture-in-Picture
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
          // Exit PiP when tab becomes visible again
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
  }, [isPipActive, capInstance]);

  // Clean up PiP when component unmounts
  useEffect(() => {
    return () => {
      if (document.pictureInPictureElement && videoRef.current) {
        document.exitPictureInPicture().catch((err) => {
          console.error("Error exiting PiP on unmount:", err);
        });
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(500, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Camera setup
    camera.position.set(0, 0, 0.75);

    // Initialize OrbitControls for user interaction
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.minDistance = 0.5;
    controls.maxDistance = 2;
    controls.update();

    // Cap model and text mesh
    let cap: THREE.Group | null = null;
    let textMesh: THREE.Mesh | null = null;
    let font: any = null;

    // Load font for 3D text
    const fontLoader = new FontLoader();
    fontLoader.load(
      "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json",
      (loadedFont) => {
        font = loadedFont;
        console.log("Font loaded successfully");
        setIsFontLoaded(true);
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
          setIsModelLoaded(true);

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
        return;
      }

      if (!font) {
        console.log("Font not loaded yet, waiting...");
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

    // Set cap color with animation
    const setCapColor = (color: string) => {
      if (!cap) {
        console.log("Cap not loaded yet");
        return;
      }

      // Calculate complementary color for the background
      const calculateComplementaryColor = (hexColor: string): string => {
        // Remove # if present
        const hex = hexColor.replace("#", "");

        // Convert to RGB
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);

        // Calculate complementary color (255 - rgb values)
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;

        // Convert back to hex
        return `#${r.toString(16).padStart(2, "0")}${g
          .toString(16)
          .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      };

      // Get complementary color
      const complementaryColor = calculateComplementaryColor(color);
      const targetColor = new THREE.Color(complementaryColor);

      // Get current background color
      const currentColor = scene.background
        ? (scene.background as THREE.Color).clone()
        : new THREE.Color("#000000");

      // Cancel any ongoing animation
      if (colorAnimationRef.current) {
        cancelAnimationFrame(colorAnimationRef.current.id);
        colorAnimationRef.current = null;
      }

      // Animation duration in milliseconds
      const duration = 800;
      const startTime = performance.now();

      // Animation function
      const animateBackgroundColor = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease function (cubic ease-out)
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // Interpolate color
        const r =
          currentColor.r + (targetColor.r - currentColor.r) * easeProgress;
        const g =
          currentColor.g + (targetColor.g - currentColor.g) * easeProgress;
        const b =
          currentColor.b + (targetColor.b - currentColor.b) * easeProgress;

        // Apply interpolated color
        scene.background = new THREE.Color(r, g, b);

        // Continue animation if not complete
        if (progress < 1) {
          colorAnimationRef.current = {
            id: requestAnimationFrame(animateBackgroundColor),
          };
        } else {
          colorAnimationRef.current = null;
        }
      };

      // Start animation
      colorAnimationRef.current = {
        id: requestAnimationFrame(animateBackgroundColor),
      };

      // Animate cap color change
      const targetCapColor = new THREE.Color(color);

      // Cancel any ongoing cap color animation
      if (capColorAnimationRef.current) {
        cancelAnimationFrame(capColorAnimationRef.current.id);
        capColorAnimationRef.current = null;
      }

      // Store current materials and their colors
      const meshes: { mesh: THREE.Mesh; currentColor: THREE.Color }[] = [];

      cap.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child !== textMesh) {
          const mesh = child as THREE.Mesh;
          const material = mesh.material as THREE.MeshStandardMaterial;

          // Store current color if it exists
          if (material && material.color) {
            meshes.push({
              mesh,
              currentColor: material.color.clone(),
            });
          }
        }
      });

      // Animation function for cap color
      const animateCapColor = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease function (cubic ease-out)
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // Update each mesh material color
        meshes.forEach(({ mesh, currentColor }) => {
          const material = mesh.material as THREE.MeshStandardMaterial;

          // Interpolate color
          const r =
            currentColor.r + (targetCapColor.r - currentColor.r) * easeProgress;
          const g =
            currentColor.g + (targetCapColor.g - currentColor.g) * easeProgress;
          const b =
            currentColor.b + (targetCapColor.b - currentColor.b) * easeProgress;

          // Apply interpolated color
          material.color.setRGB(r, g, b);
        });

        // Continue animation if not complete
        if (progress < 1) {
          capColorAnimationRef.current = {
            id: requestAnimationFrame(animateCapColor),
          };
        } else {
          // Set final materials when animation completes
          if (cap) {
            cap.traverse((child) => {
              if ((child as THREE.Mesh).isMesh && child !== textMesh) {
                // Create a new material with the desired color
                const newMaterial = new THREE.MeshStandardMaterial({
                  color: targetCapColor,
                  roughness: 0.7,
                  metalness: 0.1,
                });
                (child as THREE.Mesh).material = newMaterial;
              }
            });
          }

          capColorAnimationRef.current = null;
        }
      };

      // Start cap color animation
      capColorAnimationRef.current = {
        id: requestAnimationFrame(animateCapColor),
      };
    };

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (cap && !controls.autoRotate) {
        // Only auto-rotate if controls.autoRotate is false
        cap.rotation.y += 0.015;
      }
      // Update controls
      controls.update();
      renderer.render(scene, camera);
    };

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Initialize
    loadModel();
    animate();

    // Cleanup function
    const cleanup = () => {
      // Cancel any ongoing color animation
      if (colorAnimationRef.current) {
        cancelAnimationFrame(colorAnimationRef.current.id);
        colorAnimationRef.current = null;
      }

      // Cancel any ongoing cap color animation
      if (capColorAnimationRef.current) {
        cancelAnimationFrame(capColorAnimationRef.current.id);
        capColorAnimationRef.current = null;
      }

      // Stop media stream if it exists
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Exit PiP if active
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(console.error);
      }

      window.removeEventListener("resize", handleResize);
      if (controls) controls.dispose();
      renderer.dispose();

      // Remove all event listeners
      if (containerRef.current) {
        const clone = containerRef.current.cloneNode(true);
        if (containerRef.current.parentNode) {
          containerRef.current.parentNode.replaceChild(
            clone,
            containerRef.current
          );
        }
      }
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
    if (capInstance && color && isModelLoaded) {
      capInstance.setCapColor(color);
    }
  }, [capInstance, color, isModelLoaded]);

  useEffect(() => {
    if (capInstance && letter && isModelLoaded && isFontLoaded) {
      capInstance.createText(letter, letterColor);
    }
  }, [capInstance, letter, letterColor, isModelLoaded, isFontLoaded]);

  return (
    <>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
      {/* Hidden video element for Picture-in-Picture */}
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

export default BaseballCap;
