import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function Card({ title, subtitle, children }) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 4 },
  subtitle: { color: colors.muted, marginBottom: 10 }
});
