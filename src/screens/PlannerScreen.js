import React, { useContext, useRef, useState } from "react";
import { Animated, FlatList, PanResponder, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/Card";
import { AppContext } from "../context/AppContext";
import { colors } from "../theme/colors";
import { dateIdeas } from "../utils/mockData";

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateOrFallback(value) {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

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
        {!!item.plannedFor && <Text style={styles.planDate}>Date: {item.plannedFor}</Text>}
      </Animated.View>
    </View>
  );
}

export default function PlannerScreen() {
  const { state, actions } = useContext(AppContext);
  const [customPlan, setCustomPlan] = useState("");
  const [planDate, setPlanDate] = useState("");
  const [pickerDate, setPickerDate] = useState(new Date());
  const [showPlanDatePicker, setShowPlanDatePicker] = useState(false);
  const [status, setStatus] = useState("");

  const sortedPlans = [...state.plans].sort((a, b) => {
    const aHas = typeof a.plannedForMs === "number";
    const bHas = typeof b.plannedForMs === "number";
    if (aHas && bHas) return a.plannedForMs - b.plannedForMs;
    if (aHas) return -1;
    if (bHas) return 1;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  const onPlanDateChange = (event, selectedDate) => {
    if (!event || event.type === "dismissed") {
      setShowPlanDatePicker(false);
      return;
    }
    if (!selectedDate) return;

    setPickerDate(selectedDate);
    setPlanDate(formatDate(selectedDate));
    setShowPlanDatePicker(false);
  };

  const addPlanWithDate = (title) => {
    const trimmed = title.trim();
    if (!trimmed) {
      setStatus("Plan title is required.");
      return;
    }
    if (!planDate) {
      setStatus("Plan date is required.");
      return;
    }

    actions.addPlan({ title: trimmed, plannedFor: planDate });
    setStatus("Plan saved.");
  };

  return (
    <View style={styles.container}>
      <Card title="Date Planner" subtitle="Pick random ideas or add your own.">
        <Pressable
          style={styles.datePickerBtn}
          onPress={() => {
            setPickerDate(planDate ? parseDateOrFallback(planDate) : new Date());
            setShowPlanDatePicker(true);
          }}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={styles.datePickerText}>{planDate || "Pick plan date"}</Text>
        </Pressable>
        {showPlanDatePicker && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="calendar"
            onChange={onPlanDateChange}
          />
        )}

        <FlatList
          data={dateIdeas}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable style={styles.idea} onPress={() => addPlanWithDate(item)}>
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
            const before = customPlan;
            addPlanWithDate(customPlan);
            if (before.trim() && planDate) setCustomPlan("");
          }}
        >
          <Text style={styles.btnText}>Save Plan</Text>
        </Pressable>
        {!!status && <Text style={styles.status}>{status}</Text>}
      </Card>

      <FlatList
        data={sortedPlans}
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
  datePickerBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  datePickerText: { color: colors.text, fontWeight: "700", flex: 1 },
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
  planDate: { marginTop: 4, color: colors.muted, fontSize: 12 },
  status: { marginTop: 8, color: colors.success, fontWeight: "700" },
  empty: { textAlign: "center", color: colors.muted }
});
