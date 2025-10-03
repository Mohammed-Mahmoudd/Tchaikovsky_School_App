import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, Animated } from "react-native";

const { width, height } = Dimensions.get("window");

export default function StudentBackground() {
  // Animation values for floating orbs and glassmorphism effects
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;
  const orb3 = useRef(new Animated.Value(0)).current;
  const glassOrb1 = useRef(new Animated.Value(0)).current;
  const glassOrb2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create wave animations
    const createWaveAnimation = (
      animatedValue: Animated.Value,
      duration: number
    ) => {
      return Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        })
      );
    };

    // Create floating animations
    const createFloatingAnimation = (
      animatedValue: Animated.Value,
      duration: number
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Start all animations
    createWaveAnimation(wave1, 8000).start();
    createWaveAnimation(wave2, 12000).start();
    createWaveAnimation(wave3, 6000).start();
    createFloatingAnimation(orb1, 4000).start();
    createFloatingAnimation(orb2, 6000).start();
    createFloatingAnimation(orb3, 5000).start();
    createFloatingAnimation(glassOrb1, 7000).start();
    createFloatingAnimation(glassOrb2, 9000).start();
  }, []);

  // Transform animations
  const wave1Transform = {
    transform: [
      {
        translateX: wave1.interpolate({
          inputRange: [0, 1],
          outputRange: [-width * 0.5, width * 0.5],
        }),
      },
    ],
  };

  const wave2Transform = {
    transform: [
      {
        translateY: wave2.interpolate({
          inputRange: [0, 1],
          outputRange: [-height * 0.3, height * 0.3],
        }),
      },
    ],
  };

  const orb1Transform = {
    transform: [
      {
        translateY: orb1.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -40],
        }),
      },
      {
        scale: orb1.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.2, 1],
        }),
      },
    ],
  };

  const orb2Transform = {
    transform: [
      {
        translateY: orb2.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 30],
        }),
      },
      {
        scale: orb2.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 0.8, 1],
        }),
      },
    ],
  };

  const orb3Transform = {
    transform: [
      {
        translateY: orb3.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -25],
        }),
      },
      {
        scale: orb3.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.3, 1],
        }),
      },
    ],
  };

  const glassOrb1Transform = {
    transform: [
      {
        translateY: glassOrb1.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -35],
        }),
      },
      {
        scale: glassOrb1.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.1, 1],
        }),
      },
    ],
  };

  const glassOrb2Transform = {
    transform: [
      {
        translateY: glassOrb2.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 20],
        }),
      },
      {
        scale: glassOrb2.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 0.9, 1],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      {/* Base gradient background */}
      <View style={styles.gradient} />
      
      {/* Additional gradient layers for depth */}
      <View style={styles.gradientLayer1} />
      <View style={styles.gradientLayer2} />
      <View style={styles.gradientLayer3} />

      {/* Animated wave layers */}
      <Animated.View style={[styles.wave, styles.wave1, wave1Transform]} />
      <Animated.View style={[styles.wave, styles.wave2, wave2Transform]} />
      <Animated.View style={[styles.wave, styles.wave3]} />

      {/* Floating orbs with glow effects */}
      <Animated.View style={[styles.orb, styles.orb1, orb1Transform]} />
      <Animated.View style={[styles.orb, styles.orb2, orb2Transform]} />
      <Animated.View style={[styles.orb, styles.orb3, orb3Transform]} />

      {/* Glassmorphism orbs */}
      <Animated.View style={[styles.glassOrb, styles.glassOrb1, glassOrb1Transform]} />
      <Animated.View style={[styles.glassOrb, styles.glassOrb2, glassOrb2Transform]} />

      {/* Sparkle effects */}
      <View style={[styles.sparkle, styles.sparkle1]} />
      <View style={[styles.sparkle, styles.sparkle2]} />
      <View style={[styles.sparkle, styles.sparkle3]} />
      <View style={[styles.sparkle, styles.sparkle4]} />
      <View style={[styles.sparkle, styles.sparkle5]} />
      <View style={[styles.sparkle, styles.sparkle6]} />

      {/* Glassmorphism overlay for depth */}
      <View style={styles.glassOverlay} />
      
      {/* Final overlay for depth */}
      <View style={styles.overlay} />
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
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
    // Create a radial gradient effect using shadow like login screen
    shadowColor: "#1c463a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
  },
  gradientLayer1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(28, 70, 58, 0.1)",
    borderRadius: width * 2,
    transform: [{ scale: 1.5 }],
  },
  gradientLayer2: {
    position: "absolute",
    top: height * 0.3,
    left: -width * 0.5,
    width: width * 2,
    height: height * 0.8,
    backgroundColor: "rgba(28, 70, 58, 0.05)",
    borderRadius: width,
  },
  gradientLayer3: {
    position: "absolute",
    top: height * 0.6,
    right: -width * 0.3,
    width: width * 1.5,
    height: height * 0.6,
    backgroundColor: "rgba(28, 70, 58, 0.03)",
    borderRadius: width * 0.8,
  },
  // Animated wave layers
  wave: {
    position: "absolute",
    borderRadius: 1000,
    backgroundColor: "rgba(28, 70, 58, 0.1)",
  },
  wave1: {
    width: width * 2,
    height: width * 0.5,
    top: height * 0.2,
    left: -width * 0.5,
    backgroundColor: "rgba(28, 70, 58, 0.05)",
  },
  wave2: {
    width: width * 1.5,
    height: width * 0.8,
    top: height * 0.6,
    left: -width * 0.25,
    backgroundColor: "rgba(28, 70, 58, 0.08)",
  },
  wave3: {
    width: width * 1.8,
    height: width * 0.6,
    top: height * 0.8,
    left: -width * 0.4,
    backgroundColor: "rgba(28, 70, 58, 0.03)",
  },
  // Floating orbs with glow effects
  orb: {
    position: "absolute",
    borderRadius: 1000,
    backgroundColor: "rgba(28, 70, 58, 0.2)",
    shadowColor: "#1c463a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 15,
  },
  orb1: {
    width: 150,
    height: 150,
    top: height * 0.15,
    left: width * 0.1,
    backgroundColor: "rgba(28, 70, 58, 0.25)",
  },
  orb2: {
    width: 100,
    height: 100,
    top: height * 0.5,
    right: width * 0.15,
    backgroundColor: "rgba(28, 70, 58, 0.18)",
  },
  orb3: {
    width: 120,
    height: 120,
    top: height * 0.75,
    left: width * 0.2,
    backgroundColor: "rgba(28, 70, 58, 0.22)",
  },
  // Sparkle effects
  sparkle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  sparkle1: {
    top: height * 0.25,
    left: width * 0.8,
  },
  sparkle2: {
    top: height * 0.45,
    left: width * 0.3,
  },
  sparkle3: {
    top: height * 0.65,
    right: width * 0.25,
  },
  sparkle4: {
    top: height * 0.35,
    right: width * 0.1,
  },
  sparkle5: {
    top: height * 0.55,
    left: width * 0.15,
  },
  sparkle6: {
    top: height * 0.75,
    right: width * 0.35,
  },
  // Glassmorphism orbs
  glassOrb: {
    position: "absolute",
    borderRadius: 1000,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  glassOrb1: {
    width: 180,
    height: 180,
    top: height * 0.25,
    right: width * 0.1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  glassOrb2: {
    width: 140,
    height: 140,
    top: height * 0.65,
    left: width * 0.05,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  glassOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    pointerEvents: "none",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    pointerEvents: "none",
  },
});
