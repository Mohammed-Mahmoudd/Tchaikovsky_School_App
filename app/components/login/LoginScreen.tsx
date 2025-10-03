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
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.contentContainer}>
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
              <Text style={styles.subtitle}>
                Excellence in Musical Education
              </Text>
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
  scrollContentContainer: {
    flexGrow: 1,
    minHeight: height,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: width * 0.05, // 5% of screen width
    paddingVertical: height * 0.02, // 2% of screen height
    justifyContent: "space-between",
    minHeight: height * 0.9, // Ensure minimum height for proper spacing
  },
  welcomeHeader: {
    alignItems: "center",
    marginBottom: height * 0.015, // 1.5% of screen height
  },
  welcomeText: {
    fontSize: height * 0.025, // 2.5% of screen height
    fontWeight: "300",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 1,
    textAlign: "center",
  },
  welcomeUnderline: {
    width: width * 0.12, // 12% of screen width
    height: 2,
    backgroundColor: "#1c463a",
    marginTop: height * 0.008, // 0.8% of screen height
    borderRadius: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: height * 0.02, // 2% of screen height
    marginTop: height * 0.01, // 1% of screen height
  },
  logoWrapper: {
    width: Math.min(140, width * 0.35), // Responsive but max 140px
    height: Math.min(140, width * 0.35),
    borderRadius: Math.min(70, width * 0.175), // Perfect circle
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.025, // 2.5% of screen height
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
    width: Math.min(160, width * 0.4), // Responsive but max 160px
    height: Math.min(160, width * 0.4),
    borderRadius: Math.min(80, width * 0.2),
    backgroundColor: "rgba(28,70,58,0.1)",
    top: -10,
    left: -10,
  },
  decorativeDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: height * 0.015, // 1.5% of screen height
    gap: width * 0.02, // 2% of screen width
  },
  dot: {
    width: Math.max(4, width * 0.015), // Responsive but min 4px
    height: Math.max(4, width * 0.015),
    borderRadius: Math.max(2, width * 0.0075),
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  logo: {
    width: Math.min(90, width * 0.225), // Responsive but max 90px
    height: Math.min(90, width * 0.225),
    borderRadius: Math.min(45, width * 0.1125), // Perfect circle
  },
  schoolName: {
    fontSize: height * 0.032, // 3.2% of screen height
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: height * 0.008, // 0.8% of screen height
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: height * 0.018, // 1.8% of screen height
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    fontStyle: "italic",
    letterSpacing: 0.3,
  },
  formContainer: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: height * 0.02, // 2% of screen height
    padding: width * 0.05, // 5% of screen width
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginVertical: height * 0.01, // 1% of screen height
  },
  formHeader: {
    alignItems: "center",
    marginBottom: height * 0.02, // 2% of screen height
  },
  formTitle: {
    fontSize: height * 0.028, // 2.8% of screen height
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: height * 0.008, // 0.8% of screen height
    letterSpacing: 0.5,
  },
  formSubtitle: {
    fontSize: height * 0.016, // 1.6% of screen height
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  inputContainer: {
    marginBottom: height * 0.015, // 1.5% of screen height
  },
  inputLabel: {
    fontSize: height * 0.016, // 1.6% of screen height
    color: "#ffffff",
    marginBottom: height * 0.008, // 0.8% of screen height
    fontWeight: "500",
  },
  input: {
    height: height * 0.06, // 6% of screen height
    backgroundColor: "transparent",
    borderRadius: height * 0.015, // 1.5% of screen height
    paddingHorizontal: width * 0.05, // 5% of screen width
    fontSize: height * 0.016, // 1.6% of screen height
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.02, // 2% of screen height
    paddingVertical: height * 0.005, // 0.5% of screen height
  },
  checkbox: {
    width: height * 0.025, // 2.5% of screen height
    height: height * 0.025,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginRight: width * 0.03, // 3% of screen width
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
  },
  checkmark: {
    color: "#1c463a",
    fontSize: height * 0.014, // 1.4% of screen height
    fontWeight: "bold",
  },
  checkboxText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: height * 0.016, // 1.6% of screen height
    fontWeight: "500",
  },
  loginButton: {
    height: height * 0.06, // 6% of screen height
    borderRadius: height * 0.015, // 1.5% of screen height
    overflow: "hidden",
    marginBottom: height * 0.015, // 1.5% of screen height
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
    borderRadius: height * 0.015, // 1.5% of screen height
  },
  loginButtonText: {
    fontSize: height * 0.02, // 2% of screen height
    fontWeight: "bold",
    color: "#1c463a",
    letterSpacing: 0.3,
  },
  footer: {
    alignItems: "center",
    marginTop: height * 0.015, // 1.5% of screen height
  },
  footerDivider: {
    width: width * 0.25, // 25% of screen width
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: height * 0.015, // 1.5% of screen height
  },
  brandingFooter: {
    alignItems: "center",
    marginTop: height * 0.01, // 1% of screen height
    paddingTop: height * 0.01, // 1% of screen height
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  brandingText: {
    fontSize: height * 0.012, // 1.2% of screen height
    color: "rgba(255,255,255,0.5)",
    marginBottom: height * 0.004, // 0.4% of screen height
  },
  versionText: {
    fontSize: height * 0.01, // 1% of screen height
    color: "rgba(255,255,255,0.3)",
    fontWeight: "300",
  },
  footerText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: height * 0.014, // 1.4% of screen height
  },
  signUpText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});
