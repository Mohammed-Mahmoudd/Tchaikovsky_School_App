import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ShaderBackgroundProps {
  style?: any;
}

const { width, height } = Dimensions.get("window");

export default function ShaderBackground({ style }: ShaderBackgroundProps) {
  const animatedValue1 = useRef(new Animated.Value(0)).current;
  const animatedValue2 = useRef(new Animated.Value(0)).current;
  const animatedValue3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (
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

    const animation1 = createAnimation(animatedValue1, 4000);
    const animation2 = createAnimation(animatedValue2, 6000);
    const animation3 = createAnimation(animatedValue3, 8000);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, []);

  const translateX1 = animatedValue1.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.2, width * 0.2],
  });

  const translateY1 = animatedValue1.interpolate({
    inputRange: [0, 1],
    outputRange: [-height * 0.1, height * 0.1],
  });

  const translateX2 = animatedValue2.interpolate({
    inputRange: [0, 1],
    outputRange: [width * 0.1, -width * 0.1],
  });

  const translateY2 = animatedValue2.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.05, -height * 0.05],
  });

  const translateX3 = animatedValue3.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.15, width * 0.15],
  });

  const translateY3 = animatedValue3.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.08, -height * 0.08],
  });

  const opacity1 = animatedValue1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  const opacity2 = animatedValue2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.5, 0.2],
  });

  const opacity3 = animatedValue3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.4, 0.1],
  });

  return (
    <View style={[styles.container, style]}>
      {/* Base gradient background */}
      <LinearGradient
        colors={["#000000", "#1c463a", "#000000"]}
        style={styles.baseGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated floating orbs */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb1,
          {
            transform: [
              { translateX: translateX1 },
              { translateY: translateY1 },
            ],
            opacity: opacity1,
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.4)",
            "rgba(28,70,58,0.6)",
            "rgba(255,255,255,0.2)",
          ]}
          style={styles.orbGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.orb,
          styles.orb2,
          {
            transform: [
              { translateX: translateX2 },
              { translateY: translateY2 },
            ],
            opacity: opacity2,
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(28,70,58,0.5)",
            "rgba(134,134,134,0.4)",
            "rgba(28,70,58,0.3)",
          ]}
          style={styles.orbGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.orb,
          styles.orb3,
          {
            transform: [
              { translateX: translateX3 },
              { translateY: translateY3 },
            ],
            opacity: opacity3,
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(134,134,134,0.3)",
            "rgba(255,255,255,0.3)",
            "rgba(28,70,58,0.4)",
          ]}
          style={styles.orbGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  baseGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  orb: {
    position: "absolute",
    borderRadius: 100,
  },
  orb1: {
    width: 200,
    height: 200,
    top: "20%",
    left: "10%",
  },
  orb2: {
    width: 150,
    height: 150,
    top: "60%",
    right: "15%",
  },
  orb3: {
    width: 180,
    height: 180,
    top: "40%",
    left: "60%",
  },
  orbGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
  },
});
