import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Dimensions, Animated } from "react-native";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Sphere,
  MeshDistortMaterial,
} from "@react-three/drei";
import * as THREE from "three";

const { width, height } = Dimensions.get("window");

interface AdminBackgroundProps {
  style?: any;
}

// 3D Sphere component for the background
function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      // Animate the sphere rotation
      const animate = () => {
        if (meshRef.current) {
          meshRef.current.rotation.x += 0.005;
          meshRef.current.rotation.y += 0.01;
        }
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, []);

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} position={[0, 0, 0]}>
      <MeshDistortMaterial
        color="#1c463a"
        attach="material"
        distort={0.3}
        speed={2}
        roughness={0.1}
        metalness={0.8}
      />
    </Sphere>
  );
}

// Fallback 2D implementation for better compatibility
function FallbackBackground() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.fallbackContainer}>
      {/* Base gradient layers */}
      <View style={styles.baseGradient} />

      {/* Animated orbs */}
      <Animated.View
        style={[
          styles.orb1,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { rotate: rotateInterpolate }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.orb2,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.7],
            }),
            transform: [
              { scale: scaleAnim },
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "-360deg"],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.orb3,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
            transform: [
              { scale: scaleAnim },
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "180deg"],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

export default function AdminBackground({ style }: AdminBackgroundProps) {
  // Try to use 3D background, fallback to 2D if needed
  const use3D = false; // Set to true when expo-three is fully configured

  if (use3D) {
    return (
      <View style={[styles.container, style]}>
        <Canvas style={styles.canvas} camera={{ position: [0, 0, 5], fov: 60 }}>
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight
            position={[-10, -10, -5]}
            intensity={0.5}
            color="#1c463a"
          />
          <AnimatedSphere />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <FallbackBackground />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  canvas: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  baseGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
    opacity: 0.9,
  },
  orb1: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: "rgba(28, 70, 58, 0.15)",
    top: -width * 0.2,
    left: -width * 0.1,
    shadowColor: "#1c463a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
  },
  orb2: {
    position: "absolute",
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: "rgba(134, 134, 134, 0.1)",
    bottom: -width * 0.1,
    right: -width * 0.1,
    shadowColor: "#868686",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
  },
  orb3: {
    position: "absolute",
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    top: height * 0.3,
    right: width * 0.1,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
});
