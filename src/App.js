import React, { useContext, useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { AppProvider, AppContext } from "./context/AppContext";
import RootNavigator from "./navigation/RootNavigator";
import AuthScreen from "./screens/AuthScreen";
import PartnerOnboardingScreen from "./screens/PartnerOnboardingScreen";
import { colors } from "./theme/colors";
import { auth } from "./firebase/firebaseConfig";

function AuthedShell() {
  const { state, actions, hydrated } = useContext(AppContext);
  const [startOnPartner, setStartOnPartner] = useState(false);

  if (!hydrated) {
    return <View style={styles.safe} />;
  }

  const showOnboarding = !state.profile.onboardingSeen && !state.profile.coupleId;

  if (showOnboarding) {
    return (
      <PartnerOnboardingScreen
        onInviteNow={() => {
          actions.markPartnerOnboardingSeen();
          setStartOnPartner(true);
        }}
        onLater={() => {
          actions.markPartnerOnboardingSeen();
          setStartOnPartner(false);
        }}
      />
    );
  }

  return <RootNavigator initialRouteName={startOnPartner ? "Partner" : "Home"} />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      {checkingAuth ? (
        <View style={styles.safe} />
      ) : user ? (
        <AppProvider userId={user.uid}>
          <AuthedShell />
        </AppProvider>
      ) : (
        <AuthScreen />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }
});
