import React, { useContext, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/Card";
import PulseHeart from "../components/PulseHeart";
import { AppContext } from "../context/AppContext";
import { colors } from "../theme/colors";
import { funnyReasons } from "../utils/mockData";

function timeStats(anniv, nowMs) {
  const start = new Date(`${anniv}T00:00:00`).getTime();
  const diff = Math.max(0, nowMs - start);

  const totalSeconds = Math.floor(diff / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hoursTotal = Math.floor(totalMinutes / 60);
  const hours = hoursTotal % 24;
  const days = Math.floor(hoursTotal / 24);
  const years = Math.floor(days / 365.25);

  return { years, days, hours, totalMinutes, totalSeconds };
}

function parseDateOrFallback(value) {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function HomeScreen() {
  const { state, actions } = useContext(AppContext);
  const [idx, setIdx] = useState(0);
  const [msg, setMsg] = useState("Tap reveal to get a new reason.");
  const [dateStatus, setDateStatus] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(parseDateOrFallback(state.profile.anniversary));
  const [section, setSection] = useState("highlights");
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    setPickerDate(parseDateOrFallback(state.profile.anniversary));
  }, [state.profile.anniversary]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => timeStats(state.profile.anniversary, nowMs), [state.profile.anniversary, nowMs]);

  const challengeScore = useMemo(
    () => state.challenges.filter((c) => c.done).reduce((sum, c) => sum + c.points, 0),
    [state.challenges]
  );

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (!selectedDate) return;

    setPickerDate(selectedDate);
    const formatted = formatDate(selectedDate);
    actions.updateProfile({ anniversary: formatted });
    setDateStatus(`Together-since updated: ${formatted}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>LoveVerse</Text>
      <Text style={styles.sub}>{state.profile.yourName} + {state.profile.partnerName}</Text>

      <Card>
        <PulseHeart />
      </Card>

      <Card title="Together Since">
        <View style={styles.togetherTop}>
          <Text style={styles.currentDate}>{state.profile.anniversary}</Text>
          <Pressable style={styles.iconBtn} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="calendar"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {!!dateStatus && <Text style={styles.status}>{dateStatus}</Text>}

        <View style={styles.row}>
          <View style={styles.box}><Text style={styles.num}>{stats.years}</Text><Text style={styles.label}>Years</Text></View>
          <View style={styles.box}><Text style={styles.num}>{stats.days}</Text><Text style={styles.label}>Days</Text></View>
          <View style={styles.box}><Text style={styles.num}>{stats.hours}</Text><Text style={styles.label}>Hours</Text></View>
        </View>

        <View style={styles.row}>
          <View style={styles.box}><Text style={styles.num}>{stats.totalMinutes}</Text><Text style={styles.label}>Total Minutes</Text></View>
          <View style={styles.box}><Text style={styles.num}>{stats.totalSeconds}</Text><Text style={styles.label}>Total Seconds</Text></View>
        </View>
      </Card>

      <Card title="Reason Generator" subtitle="One click. One smile.">
        <Pressable
          style={styles.btn}
          onPress={() => {
            const next = idx + 1;
            setIdx(next);
            setMsg(funnyReasons[next % funnyReasons.length]);
          }}
        >
          <Text style={styles.btnText}>Reveal Reason</Text>
        </Pressable>
        <Text style={styles.msg}>{msg}</Text>
      </Card>

      <Card title="Sections" subtitle="Switch between quick insights.">
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabBtn, section === "highlights" && styles.tabBtnActive]}
            onPress={() => setSection("highlights")}
          >
            <Text style={[styles.tabText, section === "highlights" && styles.tabTextActive]}>Highlights</Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, section === "plans" && styles.tabBtnActive]}
            onPress={() => setSection("plans")}
          >
            <Text style={[styles.tabText, section === "plans" && styles.tabTextActive]}>Plans</Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, section === "challenges" && styles.tabBtnActive]}
            onPress={() => setSection("challenges")}
          >
            <Text style={[styles.tabText, section === "challenges" && styles.tabTextActive]}>Challenges</Text>
          </Pressable>
        </View>

        {section === "highlights" && (
          <View style={styles.sectionBody}>
            <Text style={styles.sectionLine}>Notes saved: {state.notes.length}</Text>
            <Text style={styles.sectionLine}>Memories stored: {state.memories.length}</Text>
            <Text style={styles.sectionLine}>Plans created: {state.plans.length}</Text>
          </View>
        )}

        {section === "plans" && (
          <View style={styles.sectionBody}>
            <Text style={styles.sectionLine}>Latest plans:</Text>
            {state.plans.slice(0, 3).map((p) => (
              <Text key={p.id} style={styles.sectionLine}>• {p.title}</Text>
            ))}
            {state.plans.length === 0 && <Text style={styles.sectionLine}>No plans yet. Add one in Planner tab.</Text>}
          </View>
        )}

        {section === "challenges" && (
          <View style={styles.sectionBody}>
            <Text style={styles.sectionLine}>Current score: {challengeScore}</Text>
            <Text style={styles.sectionLine}>Completed: {state.challenges.filter((c) => c.done).length}</Text>
            <Text style={styles.sectionLine}>Pending: {state.challenges.filter((c) => !c.done).length}</Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.bg },
  title: { fontSize: 32, fontWeight: "900", color: colors.text },
  sub: { color: colors.muted, marginBottom: 10 },
  togetherTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  currentDate: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff"
  },
  status: { marginTop: 8, color: colors.success, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  box: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff8f4",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10
  },
  num: { fontSize: 20, fontWeight: "800", color: colors.primary },
  label: { color: colors.muted },
  btn: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 999, alignItems: "center" },
  btnText: { color: "white", fontWeight: "800" },
  msg: { marginTop: 10, color: colors.text, fontWeight: "700" },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  tabBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#fff"
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  tabText: { color: colors.text, fontWeight: "700" },
  tabTextActive: { color: "white" },
  sectionBody: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#fff"
  },
  sectionLine: { color: colors.text, marginBottom: 4 }
});
