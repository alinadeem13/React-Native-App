import React, { useContext, useRef } from "react";
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Card from "../components/Card";
import { AppContext } from "../context/AppContext";
import { colors } from "../theme/colors";

export default function MemoriesScreen() {
  const { state } = useContext(AppContext);
  const spin = useRef(new Animated.Value(0)).current;

  const spinCard = () => {
    spin.setValue(0);
    Animated.timing(spin, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  };

  const rotateY = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"]
  });

  return (
    <View style={styles.container}>
      <Card title="Memory Gallery" subtitle="Tap spin and read your story moments.">
        <Pressable style={styles.btn} onPress={spinCard}>
          <Text style={styles.btnText}>Spin Memory Card</Text>
        </Pressable>
      </Card>

      <Animated.View style={{ transform: [{ rotateY }] }}>
        <FlatList
          data={state.memories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.heading}>{item.title}</Text>
              <Text style={styles.body}>{item.details}</Text>
            </View>
          )}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  btn: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 11, alignItems: "center" },
  btnText: { color: "white", fontWeight: "800" },
  item: {
    backgroundColor: "#fff",
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8
  },
  heading: { color: colors.text, fontWeight: "800", marginBottom: 6 },
  body: { color: colors.muted }
});
