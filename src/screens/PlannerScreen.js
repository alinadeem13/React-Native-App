import React, { useContext, useRef, useState } from "react";
import { Animated, FlatList, PanResponder, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Card from "../components/Card";
import { AppContext } from "../context/AppContext";
import { colors } from "../theme/colors";
import { dateIdeas } from "../utils/mockData";

function SwipePlanItem({ item, onDelete }) {
  const maxSwipe = 120;
  const deleteThreshold = 88;
  const translateX = useRef(new Animated.Value(0)).current;
  const [isDeleting, setIsDeleting] = useState(false);

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 22
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 8,
      onPanResponderMove: (_, gesture) => {
        if (isDeleting) return;
        let next = gesture.dx;
        if (next > 0) next = 0;
        if (next < -maxSwipe) next = -maxSwipe;
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        if (isDeleting) return;
        if (gesture.dx <= -deleteThreshold) {
          setIsDeleting(true);
          Animated.timing(translateX, {
            toValue: -420,
            duration: 180,
            useNativeDriver: true
          }).start(() => onDelete(item.id));
          return;
        }
        resetPosition();
      }
    })
  ).current;

  return (
    <View style={styles.swipeWrap}>
      <View style={styles.deleteLayer}>
        <Text style={styles.deleteText}>Delete</Text>
      </View>

      <Animated.View style={[styles.planItem, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <Text style={styles.planText}>{item.title}</Text>
      </Animated.View>
    </View>
  );
}

export default function PlannerScreen() {
  const { state, actions } = useContext(AppContext);
  const [customPlan, setCustomPlan] = useState("");

  return (
    <View style={styles.container}>
      <Card title="Date Planner" subtitle="Pick random ideas or add your own.">
        <FlatList
          data={dateIdeas}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable style={styles.idea} onPress={() => actions.addPlan(item)}>
              <Text style={styles.ideaText}>+ {item}</Text>
            </Pressable>
          )}
          scrollEnabled={false}
        />
      </Card>

      <Card title="Custom Plan">
        <TextInput
          style={styles.input}
          placeholder="Add your date plan"
          value={customPlan}
          onChangeText={setCustomPlan}
        />
        <Pressable
          style={styles.btn}
          onPress={() => {
            actions.addPlan(customPlan);
            setCustomPlan("");
          }}
        >
          <Text style={styles.btnText}>Save Plan</Text>
        </Pressable>
      </Card>

      <FlatList
        data={state.plans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SwipePlanItem item={item} onDelete={actions.deletePlan} />}
        ListEmptyComponent={<Text style={styles.empty}>No plans yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  idea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff"
  },
  ideaText: { color: colors.text, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 10
  },
  btn: { marginTop: 10, backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 11, alignItems: "center" },
  btnText: { color: "white", fontWeight: "800" },
  swipeWrap: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden"
  },
  deleteLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffdfe0",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 16
  },
  deleteText: { color: "#d9344e", fontWeight: "900", fontSize: 14 },
  planItem: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12
  },
  planText: { color: colors.text, fontWeight: "600" },
  empty: { textAlign: "center", color: colors.muted }
});
