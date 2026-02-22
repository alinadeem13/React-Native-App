import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { saveProfile } from "../firebase/services";
import { colors } from "../theme/colors";

function mapAuthError(errorCode) {
  const code = errorCode || "";

  if (code.includes("invalid-email")) return "Please enter a valid email address.";
  if (code.includes("missing-password")) return "Password is required.";
  if (code.includes("invalid-credential")) return "Email or password is incorrect.";
  if (code.includes("wrong-password")) return "Wrong password. Please try again.";
  if (code.includes("user-not-found")) return "No account found for this email.";
  if (code.includes("email-already-in-use")) return "This email is already registered.";
  if (code.includes("weak-password")) return "Password should be at least 6 characters.";
  if (code.includes("too-many-requests")) return "Too many attempts. Please try again later.";
  if (code.includes("network-request-failed")) return "Network error. Check your internet connection.";

  return "Something went wrong. Please try again.";
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

export default function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [yourName, setYourName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [anniversary, setAnniversary] = useState("");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: "", type: "error" });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef(null);

  const isSignup = mode === "signup";

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const showToast = (message, type = "error") => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    setToast({ visible: true, message, type });

    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true
    }).start();

    hideTimerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true
      }).start(() => setToast((prev) => ({ ...prev, visible: false })));
    }, 2400);
  };

  const submit = async () => {
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      showToast("Please enter email and password.", "error");
      return;
    }

    if (isSignup) {
      if (!yourName.trim() || !partnerName.trim() || !anniversary.trim()) {
        showToast("Please fill name, partner name, and together-since date.", "error");
        return;
      }

      if (!isValidDate(anniversary)) {
        showToast("Together-since date should be in YYYY-MM-DD format.", "error");
        return;
      }

      if (password !== confirmPassword) {
        showToast("Password and confirm password must match.", "error");
        return;
      }
    }

    try {
      setLoading(true);

      if (isSignup) {
        const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        await saveProfile(credential.user.uid, {
          yourName: yourName.trim(),
          partnerName: partnerName.trim(),
          anniversary: anniversary.trim()
        });
        showToast("Account created successfully.", "success");
      } else {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
        showToast("Login successful.", "success");
      }
    } catch (error) {
      showToast(mapAuthError(error?.code), "error");
    } finally {
      setLoading(false);
    }
  };

  const toastBg = toast.type === "success" ? "#ddf9ef" : "#ffe1e5";
  const toastColor = toast.type === "success" ? "#157f5b" : "#b32746";
  const toastIcon = toast.type === "success" ? "checkmark-circle" : "alert-circle";

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      {toast.visible && (
        <View style={styles.toastOverlay} pointerEvents="none">
          <Animated.View
            style={[
              styles.toast,
              {
                backgroundColor: toastBg,
                opacity: toastAnim,
                transform: [
                  {
                    translateY: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-16, 0]
                    })
                  }
                ]
              }
            ]}
          >
            <Ionicons name={toastIcon} size={16} color={toastColor} />
            <Text style={[styles.toastText, { color: toastColor }]}>{toast.message}</Text>
          </Animated.View>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.logoRow}>
          <Ionicons name="heart" size={28} color={colors.primary} />
          <Text style={styles.brand}>LoveVerse</Text>
        </View>

        <Text style={styles.title}>{isSignup ? "Create account" : "Welcome back"}</Text>
        <Text style={styles.subtitle}>
          {isSignup
            ? "Create a private space for your memories."
            : "Sign in to continue your story."}
        </Text>

        <View style={styles.switchRow}>
          <Pressable
            style={[styles.switchBtn, mode === "login" && styles.switchBtnActive, loading && styles.disabledBtn]}
            onPress={() => setMode("login")}
            disabled={loading}
          >
            <Text style={[styles.switchText, mode === "login" && styles.switchTextActive]}>Login</Text>
          </Pressable>
          <Pressable
            style={[styles.switchBtn, mode === "signup" && styles.switchBtnActive, loading && styles.disabledBtn]}
            onPress={() => setMode("signup")}
            disabled={loading}
          >
            <Text style={[styles.switchText, mode === "signup" && styles.switchTextActive]}>Sign up</Text>
          </Pressable>
        </View>

        {isSignup && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              value={yourName}
              onChangeText={setYourName}
            />
            <TextInput
              style={styles.input}
              placeholder="Partner name"
              value={partnerName}
              onChangeText={setPartnerName}
            />
            <TextInput
              style={styles.input}
              placeholder="Together since (YYYY-MM-DD)"
              value={anniversary}
              onChangeText={setAnniversary}
              autoCapitalize="none"
            />
          </>
        )}

        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
        />

        {isSignup && (
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        )}

        <Pressable
          style={[styles.primaryBtn, loading && styles.disabledBtn]}
          onPress={submit}
          disabled={loading}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? "Please wait..." : isSignup ? "Create Account" : "Login"}
          </Text>
        </Pressable>

        <Text style={styles.socialTitle}>Social sign-in</Text>
        <View style={styles.socialRow}>
          <Pressable
            style={[styles.socialBtn, loading && styles.disabledBtn]}
            onPress={() => showToast("Google sign-in wiring is next.", "error")}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={18} color={colors.text} />
            <Text style={styles.socialText}>Google</Text>
          </Pressable>

          <Pressable
            style={[styles.socialBtn, loading && styles.disabledBtn]}
            onPress={() => showToast("Apple sign-in needs iOS + Apple setup.", "error")}
            disabled={loading}
          >
            <Ionicons name="logo-apple" size={18} color={colors.text} />
            <Text style={styles.socialText}>Apple</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: colors.bg
  },
  toastOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "88%",
    borderWidth: 1,
    borderColor: "#f1c7cf"
  },
  toastText: {
    flex: 1,
    fontWeight: "700"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  brand: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
    marginTop: 10
  },
  subtitle: {
    color: colors.muted,
    marginTop: 4,
    marginBottom: 12
  },
  switchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  switchBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#fff"
  },
  switchBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  switchText: {
    color: colors.text,
    fontWeight: "700"
  },
  switchTextActive: {
    color: "#fff"
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 8
  },
  primaryBtn: {
    marginTop: 4,
    backgroundColor: colors.primary,
    borderRadius: 999,
    alignItems: "center",
    paddingVertical: 12
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "800"
  },
  socialTitle: {
    marginTop: 14,
    marginBottom: 8,
    color: colors.muted,
    fontWeight: "700"
  },
  socialRow: {
    flexDirection: "row",
    gap: 8
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingVertical: 10
  },
  socialText: {
    color: colors.text,
    fontWeight: "700"
  },
  disabledBtn: {
    opacity: 0.55
  }
});
