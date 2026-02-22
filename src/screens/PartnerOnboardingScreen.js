import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function PartnerOnboardingScreen({ onInviteNow, onLater }) {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Ionicons name="people" size={36} color={colors.primary} />
        <Text style={styles.title}>Invite Your Partner</Text>
        <Text style={styles.text}>
          This is optional now. You can invite your partner now, or do it later from Profile/Partner section.
        </Text>

        <Pressable style={styles.primaryBtn} onPress={onInviteNow}>
          <Text style={styles.primaryBtnText}>Invite Partner Now</Text>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={onLater}>
          <Text style={styles.secondaryBtnText}>Do This Later</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    padding: 16
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 18,
    alignItems: "center"
  },
  title: {
    marginTop: 10,
    fontSize: 24,
    color: colors.text,
    fontWeight: "900"
  },
  text: {
    marginTop: 8,
    color: colors.muted,
    textAlign: "center"
  },
  primaryBtn: {
    marginTop: 16,
    width: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center"
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800"
  },
  secondaryBtn: {
    marginTop: 10,
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center"
  },
  secondaryBtnText: {
    color: colors.text,
    fontWeight: "800"
  }
});
