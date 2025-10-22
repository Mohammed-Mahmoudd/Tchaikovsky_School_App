import React from "react";
import { View, StyleSheet } from "react-native";

export default function StudentBackground() {
  return (
    <View style={styles.container}>
      {/* Simple gradient background */}
      <View style={styles.gradient} />
      
      {/* Simple orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />
      
      {/* Subtle accent layer */}
      <View style={styles.accentLayer} />
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
  },
  accentLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(28, 70, 58, 0.03)",
    pointerEvents: "none",
  },
  // Simple orbs
  orb: {
    position: "absolute",
    borderRadius: 1000,
    backgroundColor: "rgba(28, 70, 58, 0.08)",
    pointerEvents: "none",
  },
  orb1: {
    width: 120,
    height: 120,
    top: "15%",
    left: "10%",
  },
  orb2: {
    width: 80,
    height: 80,
    top: "60%",
    right: "15%",
  },
  orb3: {
    width: 100,
    height: 100,
    top: "80%",
    left: "20%",
  },
});
