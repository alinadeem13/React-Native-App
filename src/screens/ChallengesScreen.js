import React, { useContext, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Card from "../components/Card";
import { AppContext } from "../context/AppContext";
import { colors } from "../theme/colors";

export default function ChallengesScreen() {
  const { state, actions } = useContext(AppContext);

  const score = useMemo(
    () => state.challenges.filter((c) => c.done).reduce((acc, curr) => acc + curr.points, 0),
    [state.challenges]
  );

  return (
    <View style={styles.container}>
      <Card title="Fun Challenges" subtitle="Complete together, collect points.">
        <Text style={styles.score}>Couple Score: {score}</Text>
      </Card>

      <FlatList
        data={state.challenges}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.item, item.done && styles.doneItem]}
            onPress={() => actions.toggleChallenge(item.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc}>{item.description}</Text>
            </View>
            <Text style={styles.points}>{item.points} pts</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  score: { color: colors.success, fontWeight: "800", fontSize: 16 },
  item: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  doneItem: {
    backgroundColor: "#ecfff8"
  },
  title: { color: colors.text, fontWeight: "800" },
  desc: { color: colors.muted, marginTop: 4 },
  points: { color: colors.primary, fontWeight: "800" }
});
