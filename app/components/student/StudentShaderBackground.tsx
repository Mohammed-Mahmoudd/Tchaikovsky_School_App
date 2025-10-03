import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function StudentShaderBackground() {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim1 = useRef(new Animated.Value(1)).current;
  const scaleAnim2 = useRef(new Animated.Value(1)).current;
  const scaleAnim3 = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Scale animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim1, {
          toValue: 1.3,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim1, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim2, {
          toValue: 1.5,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim2, {
          toValue: 0.8,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim3, {
          toValue: 1.2,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim3, {
          toValue: 0.9,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Opacity animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Main gradient background with darker theme colors */}
      <LinearGradient
        colors={['#000000', '#050a08', '#0f2419', '#1a3328', '#000000']}
        style={styles.mainGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Glassmorphism animated orbs */}
      <Animated.View
        style={[
          styles.glassOrb,
          styles.orb1,
          {
            transform: [
              { scale: scaleAnim1 },
              { rotate: rotateInterpolate },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(15, 36, 25, 0.4)', 'rgba(28, 70, 58, 0.3)']}
          style={styles.glassGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.glassBorder} />
      </Animated.View>

      <Animated.View
        style={[
          styles.glassOrb,
          styles.orb2,
          {
            transform: [
              { scale: scaleAnim2 },
              { rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['360deg', '0deg'],
              }) },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(26, 51, 40, 0.35)', 'rgba(15, 36, 25, 0.4)']}
          style={styles.glassGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.glassBorder} />
      </Animated.View>

      <Animated.View
        style={[
          styles.glassOrb,
          styles.orb3,
          {
            transform: [
              { scale: scaleAnim3 },
              { rotate: rotateInterpolate },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(20, 45, 35, 0.45)', 'rgba(10, 25, 18, 0.35)']}
          style={styles.glassGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.glassBorder} />
      </Animated.View>

      {/* Additional glassmorphism layers for depth */}
      <Animated.View
        style={[
          styles.glassLayer,
          styles.layer1,
          {
            transform: [{ scale: scaleAnim1 }],
            opacity: opacityAnim.interpolate({
              inputRange: [0.4, 0.8],
              outputRange: [0.1, 0.3],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)']}
          style={styles.layerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.glassLayer,
          styles.layer2,
          {
            transform: [{ scale: scaleAnim2 }],
            opacity: opacityAnim.interpolate({
              inputRange: [0.4, 0.8],
              outputRange: [0.05, 0.2],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.04)']}
          style={styles.layerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  mainGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  // Glassmorphism orb styles
  glassOrb: {
    position: 'absolute',
    borderRadius: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#1c463a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  orb1: {
    width: 400,
    height: 400,
    top: -100,
    right: -100,
  },
  orb2: {
    width: 300,
    height: 300,
    top: height * 0.3,
    left: -50,
  },
  orb3: {
    width: 350,
    height: 350,
    bottom: -50,
    right: -75,
  },
  glassGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 200,
  },
  glassBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  // Additional glass layers for depth
  glassLayer: {
    position: 'absolute',
    borderRadius: 150,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  layer1: {
    width: 300,
    height: 300,
    top: height * 0.2,
    right: width * 0.1,
  },
  layer2: {
    width: 250,
    height: 250,
    bottom: height * 0.2,
    left: width * 0.1,
  },
  layerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 150,
  },
  // Legacy styles (keeping for compatibility)
  gradientOrb: {
    position: 'absolute',
    borderRadius: 200,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 200,
  },
});
