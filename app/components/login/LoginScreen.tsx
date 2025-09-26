import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Animated,
  Alert,
} from "react-native";
import { useAuth } from "./AuthContext";
import ShaderBackground from "./ShaderBackground";

const { width, height } = Dimensions.get("window");

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const orbAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating orb animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(orbAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (!success) {
        Alert.alert(
          "Login Failed",
          "Invalid credentials. Please check your email and password and try again.\n\nNote: Students can use their own email, father's email, or mother's email to login."
        );
      }
      // Success is handled by the AuthContext - user will be redirected automatically
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Connection Error",
        "Unable to connect to the server. Please check your internet connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const orbTransform = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  return (
    <View style={styles.container}>
      {/* Base Background */}
      <View style={styles.backgroundGradient} />

      {/* Shader Gradient Background */}
      <ShaderBackground style={styles.shaderBackground} />

      {/* Floating Orb Effect - positioned around logo area */}
      <Animated.View
        style={[
          styles.orbContainer,
          {
            transform: [{ translateY: orbTransform }],
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.orb} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Header */}
          <Animated.View
            style={[
              styles.welcomeHeader,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <View style={styles.welcomeUnderline} />
          </Animated.View>

          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.logoWrapper}>
              <View style={styles.logoGlow} />
              <Image
                source={require("../../../assets/appLogo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.schoolName}>Tchaikovsky School</Text>
            <Text style={styles.subtitle}>Excellence in Musical Education</Text>
            <View style={styles.decorativeDots}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </Animated.View>

          {/* Login Form */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Sign In</Text>
              <Text style={styles.formSubtitle}>
                Enter your credentials to continue
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="rgba(255,255,255,0.6)"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Keep me logged in checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setKeepLoggedIn(!keepLoggedIn)}
            >
              <View
                style={[
                  styles.checkbox,
                  keepLoggedIn && styles.checkboxChecked,
                ]}
              >
                {keepLoggedIn && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>Keep me logged in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <View style={styles.loginButtonGradient}>
                <Text style={styles.loginButtonText}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerDivider} />
            <Text style={styles.footerText}>
              Don't have an account?{" "}
              <Text style={styles.signUpText}>Contact Us</Text>
            </Text>
            <View style={styles.brandingFooter}>
              <Text style={styles.brandingText}>
                Powered by Tchaikovsky School
              </Text>
              <Text style={styles.versionText}>v1.0.0</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#000000",
    // Create a radial gradient effect using multiple overlays
    shadowColor: "#1c463a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 100,
  },
  orbContainer: {
    position: "absolute",
    top: height * 0.15,
    left: width * 0.5 - 100,
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    zIndex: 1,
  },
  orb: {
    flex: 1,
    borderRadius: 100,
    backgroundColor: "rgba(28, 70, 58, 0.4)",
    opacity: 0.7,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
  },
  shaderBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  keyboardContainer: {
    flex: 1,
    zIndex: 2,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40, // Reduced since we removed status bar
    paddingBottom: 40,
  },
  welcomeHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "300",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 2,
    textAlign: "center",
  },
  welcomeUnderline: {
    width: 60,
    height: 2,
    backgroundColor: "#1c463a",
    marginTop: 8,
    borderRadius: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20, // Reduced since we removed status bar
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70, // Perfect circle (50% of width/height)
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    position: "relative",
  },
  logoGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(28,70,58,0.1)",
    top: -10,
    left: -10,
  },
  decorativeDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45, // Make the logo itself circular too
  },
  schoolName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    fontStyle: "italic",
    letterSpacing: 0.5,
  },
  formContainer: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  formHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    letterSpacing: 1,
  },
  formSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    height: 58,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#ffffff",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    paddingVertical: 5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
  },
  checkmark: {
    color: "#1c463a",
    fontSize: 14,
    fontWeight: "bold",
  },
  checkboxText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "500",
  },
  loginButton: {
    height: 58,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
  },
  loginButtonText: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#1c463a",
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: "center",
    marginTop: 40,
  },
  footerDivider: {
    width: 100,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 20,
  },
  brandingFooter: {
    alignItems: "center",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  brandingText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 4,
  },
  versionText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "300",
  },
  footerText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  signUpText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});
