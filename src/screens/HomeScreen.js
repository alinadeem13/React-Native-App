import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Card from "../components/Card";
import PulseHeart from "../components/PulseHeart";
import { AppContext } from "../context/AppContext";
import { colors } from "../theme/colors";
import { dateIdeas, funnyReasons } from "../utils/mockData";

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

function startOfDayMs(dateOrMs) {
  const date = new Date(dateOrMs);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function isValidMs(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function collectActivityDaySet(state) {
  const days = new Set();

  state.notes.forEach((note) => {
    if (isValidMs(note.createdAt)) days.add(startOfDayMs(note.createdAt));
  });

  state.memories.forEach((memory) => {
    if (isValidMs(memory.createdAt)) days.add(startOfDayMs(memory.createdAt));
    else if (isValidMs(memory.dateMs)) days.add(startOfDayMs(memory.dateMs));
  });

  state.plans.forEach((plan) => {
    if (isValidMs(plan.createdAt)) days.add(startOfDayMs(plan.createdAt));
  });

  state.challenges.forEach((challenge) => {
    if (challenge.done && isValidMs(challenge.completedAt)) {
      days.add(startOfDayMs(challenge.completedAt));
    }
  });

  return days;
}

function computeStreak(daySet) {
  let streak = 0;
  let cursor = startOfDayMs(Date.now());

  while (daySet.has(cursor)) {
    streak += 1;
    cursor -= 24 * 60 * 60 * 1000;
  }

  return streak;
}

function getDeltaCount(items, getTs) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return items.filter((item) => {
    const ts = getTs(item);
    return isValidMs(ts) && ts >= cutoff;
  }).length;
}

export default function HomeScreen() {
  const { state, actions } = useContext(AppContext);
  const navigation = useNavigation();

  const [idx, setIdx] = useState(0);
  const [msg, setMsg] = useState("Tap reveal to get a new reason.");
  const [toast, setToast] = useState({
    visible: false,
    text: "",
    type: "success",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(
    parseDateOrFallback(state.profile.anniversary)
  );
  const [nowMs, setNowMs] = useState(Date.now());
  const [quickNote, setQuickNote] = useState("");
  const [quickPlanTitle, setQuickPlanTitle] = useState("");
  const [quickPlanDate, setQuickPlanDate] = useState("");
  const [showQuickPlanPicker, setShowQuickPlanPicker] = useState(false);
  const [quickPlanPickerDate, setQuickPlanPickerDate] = useState(new Date());

  useEffect(() => {
    setPickerDate(parseDateOrFallback(state.profile.anniversary));
  }, [state.profile.anniversary]);

  useEffect(() => {
    if (showDatePicker || showQuickPlanPicker) return undefined;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [showDatePicker, showQuickPlanPicker]);

  const showToast = (text, type = "success") => {
    setToast({ visible: true, text, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 1800);
  };

  const stats = useMemo(
    () => timeStats(state.profile.anniversary, nowMs),
    [state.profile.anniversary, nowMs]
  );

  const challengeScore = useMemo(
    () =>
      state.challenges
        .filter((c) => c.done)
        .reduce((sum, c) => sum + c.points, 0),
    [state.challenges]
  );

  const activityDaySet = useMemo(() => collectActivityDaySet(state), [state]);
  const streak = useMemo(() => computeStreak(activityDaySet), [activityDaySet]);

  const dailyIdea = useMemo(() => {
    const dayIndex = Math.floor(startOfDayMs(nowMs) / (24 * 60 * 60 * 1000));
    return dateIdeas[dayIndex % dateIdeas.length];
  }, [nowMs]);

  const pendingChallenge = useMemo(
    () => state.challenges.find((c) => !c.done) || null,
    [state.challenges]
  );

  const weeklyStats = useMemo(
    () => ({
      notes: getDeltaCount(state.notes, (n) => n.createdAt),
      memories: getDeltaCount(state.memories, (m) => m.createdAt || m.dateMs),
      plans: getDeltaCount(state.plans, (p) => p.createdAt),
      challenges: getDeltaCount(state.challenges, (c) => c.completedAt),
    }),
    [state.notes, state.memories, state.plans, state.challenges]
  );

  const upcomingPlan = useMemo(() => {
    const today = startOfDayMs(Date.now());
    return (
      state.plans
        .filter(
          (plan) => isValidMs(plan.plannedForMs) && plan.plannedForMs >= today
        )
        .sort((a, b) => a.plannedForMs - b.plannedForMs)[0] || null
    );
  }, [state.plans]);

  const activityFeed = useMemo(() => {
    const items = [];

    state.notes.forEach((note) => {
      if (isValidMs(note.createdAt)) {
        items.push({
          id: `note-${note.id}`,
          ts: note.createdAt,
          text: `Saved a note: ${note.text}`,
        });
      }
    });

    state.memories.forEach((memory) => {
      const ts = memory.createdAt || memory.dateMs;
      if (isValidMs(ts)) {
        items.push({
          id: `memory-${memory.id}`,
          ts,
          text: `Added memory: ${memory.title}`,
        });
      }
    });

    state.plans.forEach((plan) => {
      if (isValidMs(plan.createdAt)) {
        items.push({
          id: `plan-${plan.id}`,
          ts: plan.createdAt,
          text: `Planned: ${plan.title}`,
        });
      }
    });

    state.challenges
      .filter((c) => c.done && isValidMs(c.completedAt))
      .forEach((c) => {
        items.push({
          id: `challenge-${c.id}`,
          ts: c.completedAt,
          text: `Completed challenge: ${c.title}`,
        });
      });

    return items.sort((a, b) => b.ts - a.ts).slice(0, 5);
  }, [state.notes, state.memories, state.plans, state.challenges]);

  const todayKey = formatDate(new Date());
  const moodLog = state.profile.moodLog || {};
  const todayMood = moodLog[todayKey] || null;

  const onDateChange = (event, selectedDate) => {
    if (!event || event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }

    if (!selectedDate) return;

    setPickerDate(selectedDate);
    const formatted = formatDate(selectedDate);
    actions.updateProfile({ anniversary: formatted });
    setShowDatePicker(false);
    showToast(`Together-since updated: ${formatted}`);
  };

  const saveMood = (mood) => {
    actions.updateProfile({
      moodLog: {
        ...moodLog,
        [todayKey]: mood,
      },
    });
    showToast(`Today's vibe set to ${mood}.`);
  };

  const addQuickNote = () => {
    const trimmed = quickNote.trim();
    if (!trimmed) {
      showToast("Write a note first.", "error");
      return;
    }
    actions.addNote(trimmed);
    setQuickNote("");
    showToast("Quick note saved.");
  };

  const addQuickPlan = () => {
    const title = quickPlanTitle.trim();
    if (!title) {
      showToast("Plan title is required.", "error");
      return;
    }

    if (!quickPlanDate) {
      showToast("Plan date is required.", "error");
      return;
    }

    if (Number.isNaN(new Date(`${quickPlanDate}T00:00:00`).getTime())) {
      showToast("Use plan date in YYYY-MM-DD format.", "error");
      return;
    }

    actions.addPlan({ title, plannedFor: quickPlanDate || null });
    setQuickPlanTitle("");
    setQuickPlanDate("");
    showToast("Plan saved.");
  };

  const onQuickPlanDateChange = (event, selectedDate) => {
    if (!event || event.type === "dismissed") {
      setShowQuickPlanPicker(false);
      return;
    }
    if (!selectedDate) return;

    setQuickPlanPickerDate(selectedDate);
    setQuickPlanDate(formatDate(selectedDate));
    setShowQuickPlanPicker(false);
  };

  const saveDailyIdea = () => {
    actions.addPlan({ title: dailyIdea, plannedFor: todayKey });
    showToast("Today's idea saved to plans.");
  };

  const addChallengeToNote = () => {
    if (!pendingChallenge) {
      showToast("No pending challenge right now.", "error");
      return;
    }
    actions.addNote(`Challenge pick: ${pendingChallenge.title}`);
    showToast("Challenge added to notes.");
  };

  const daysUntilPlan =
    upcomingPlan && isValidMs(upcomingPlan.plannedForMs)
      ? Math.ceil(
          (upcomingPlan.plannedForMs - startOfDayMs(Date.now())) /
            (24 * 60 * 60 * 1000)
        )
      : null;

  return (
    <View style={styles.screen}>
      {toast.visible && (
        <View style={styles.toastOverlay} pointerEvents="none">
          <View
            style={[styles.toast, toast.type === "error" && styles.toastError]}
          >
            <Text
              style={[
                styles.toastText,
                toast.type === "error" && styles.toastTextError,
              ]}
            >
              {toast.text}
            </Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>LoveVerse</Text>
        <Text style={styles.sub}>
          {state.profile.yourName} + {state.profile.partnerName}
        </Text>

      <Card>
        <PulseHeart />
      </Card>

      <Card title="Together Since">
        <View style={styles.togetherTop}>
          <Text style={styles.currentDate}>{state.profile.anniversary}</Text>
          <Pressable
            style={styles.iconBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.primary}
            />
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

        <View style={styles.row}>
          <View style={styles.box}>
            <Text style={styles.num}>{stats.years}</Text>
            <Text style={styles.label}>Years</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.num}>{stats.days}</Text>
            <Text style={styles.label}>Days</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.num}>{stats.hours}</Text>
            <Text style={styles.label}>Hours</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.box}>
            <Text style={styles.num}>{stats.totalMinutes}</Text>
            <Text style={styles.label}>Total Minutes</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.num}>{stats.totalSeconds}</Text>
            <Text style={styles.label}>Total Seconds</Text>
          </View>
        </View>
      </Card>

      <Card title="Today For Us" subtitle="One smart pick every day.">
        <View style={styles.todayBox}>
          <Text style={styles.todayIdea}>{dailyIdea}</Text>
          <Text style={styles.todayHint}>
            {pendingChallenge
              ? `Bonus challenge: ${pendingChallenge.title}`
              : "All challenges completed today."}
          </Text>
        </View>
        <View style={styles.actionRow}>
          <Pressable style={styles.btn} onPress={saveDailyIdea}>
            <Text style={styles.btnText}>Save As Plan</Text>
          </Pressable>
          <Pressable style={styles.ghostBtn} onPress={addChallengeToNote}>
            <Text style={styles.ghostBtnText}>Save Challenge</Text>
          </Pressable>
        </View>
      </Card>

      <Card title="Love Streak" subtitle="Keep momentum daily.">
        <View style={styles.streakTop}>
          <Text style={styles.streakValue}>{streak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
        <Text style={styles.sectionLine}>Score: {challengeScore}</Text>
        <Text style={styles.sectionLine}>
          Completed challenges: {state.challenges.filter((c) => c.done).length}
        </Text>
      </Card>

      <Card title="Quick Add" subtitle="Fast actions without leaving Home.">
        <TextInput
          style={styles.input}
          placeholder="Write a quick love note"
          value={quickNote}
          onChangeText={setQuickNote}
        />
        <Pressable style={styles.btn} onPress={addQuickNote}>
          <Text style={styles.btnText}>Save Note</Text>
        </Pressable>

        <View style={styles.divider} />

        <TextInput
          style={styles.input}
          placeholder="Plan title"
          value={quickPlanTitle}
          onChangeText={setQuickPlanTitle}
        />
        <Pressable
          style={styles.datePickerBtn}
          onPress={() => {
            setQuickPlanPickerDate(
              quickPlanDate ? parseDateOrFallback(quickPlanDate) : new Date()
            );
            setShowQuickPlanPicker(true);
          }}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={styles.datePickerText}>
            {quickPlanDate ? quickPlanDate : "Pick plan date"}
          </Text>
          {!!quickPlanDate && (
            <Pressable
              onPress={() => setQuickPlanDate("")}
              hitSlop={8}
              style={styles.clearDateBtn}
            >
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          )}
        </Pressable>
        {showQuickPlanPicker && (
          <DateTimePicker
            value={quickPlanPickerDate}
            mode="date"
            display="calendar"
            onChange={onQuickPlanDateChange}
          />
        )}
        <Pressable style={styles.btn} onPress={addQuickPlan}>
          <Text style={styles.btnText}>Save Plan</Text>
        </Pressable>

        <Pressable
          style={styles.openMemoriesBtn}
          onPress={() => navigation.navigate("Memories")}
        >
          <Text style={styles.openMemoriesText}>All Memories</Text>
        </Pressable>
      </Card>

      <Card title="Mood Check-in" subtitle="Pick today's vibe.">
        <View style={styles.moodRow}>
          {["Happy", "Romantic", "Calm", "Wild"].map((mood) => (
            <Pressable
              key={mood}
              style={[
                styles.moodChip,
                todayMood === mood && styles.moodChipActive,
              ]}
              onPress={() => saveMood(mood)}
            >
              <Text
                style={[
                  styles.moodText,
                  todayMood === mood && styles.moodTextActive,
                ]}
              >
                {mood}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionLine}>
          Today: {todayMood || "Not selected"}
        </Text>
      </Card>

      <Card title="Upcoming Reminder" subtitle="Your next planned date.">
        {upcomingPlan ? (
          <View style={styles.sectionBody}>
            <Text style={styles.sectionLine}>{upcomingPlan.title}</Text>
            <Text style={styles.sectionLine}>
              Date: {upcomingPlan.plannedFor}
            </Text>
            <Text style={styles.sectionLine}>
              Countdown:{" "}
              {daysUntilPlan === 0 ? "Today" : `${daysUntilPlan} day(s)`}
            </Text>
          </View>
        ) : (
          <Text style={styles.sectionLine}>
            No scheduled plan yet. Add one with date in Quick Add.
          </Text>
        )}
      </Card>

      <Card title="Couple Stats" subtitle="Live totals + weekly growth.">
        <View style={styles.row}>
          <View style={styles.box}>
            <Text style={styles.num}>{state.notes.length}</Text>
            <Text style={styles.label}>Notes</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.num}>{state.memories.length}</Text>
            <Text style={styles.label}>Memories</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.num}>{state.plans.length}</Text>
            <Text style={styles.label}>Plans</Text>
          </View>
        </View>
        <View style={styles.sectionBody}>
          <Text style={styles.sectionLine}>
            Last 7 days: +{weeklyStats.notes} notes
          </Text>
          <Text style={styles.sectionLine}>
            Last 7 days: +{weeklyStats.memories} memories
          </Text>
          <Text style={styles.sectionLine}>
            Last 7 days: +{weeklyStats.plans} plans
          </Text>
          <Text style={styles.sectionLine}>
            Last 7 days: +{weeklyStats.challenges} challenges done
          </Text>
        </View>
      </Card>

      <Card title="Recent Activity" subtitle="Your latest shared actions.">
        <View style={styles.sectionBody}>
          {activityFeed.length === 0 && (
            <Text style={styles.sectionLine}>No activity yet.</Text>
          )}
          {activityFeed.map((item) => (
            <Text key={item.id} style={styles.sectionLine}>
              - {item.text}
            </Text>
          ))}
        </View>
      </Card>

        <Card title="Reason Generator" subtitle="One click, one smile.">
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 16, backgroundColor: colors.bg },
  toastOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  toast: {
    backgroundColor: "#dcf8ea",
    borderColor: "#9dd7bb",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "88%",
  },
  toastError: {
    backgroundColor: "#ffe4e8",
    borderColor: "#f0b6c1",
  },
  toastText: {
    color: "#1f7a56",
    fontWeight: "700",
    textAlign: "center",
  },
  toastTextError: {
    color: "#a93a52",
  },
  title: { fontSize: 32, fontWeight: "900", color: colors.text },
  sub: { color: colors.muted, marginBottom: 10 },
  togetherTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currentDate: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  box: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff8f4",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
  },
  num: { fontSize: 20, fontWeight: "800", color: colors.primary },
  label: { color: colors.muted },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "800" },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    flex: 1,
    backgroundColor: "#fff",
  },
  ghostBtnText: { color: colors.text, fontWeight: "800" },
  msg: { marginTop: 10, color: colors.text, fontWeight: "700" },
  sectionBody: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#fff",
  },
  sectionLine: { color: colors.text, marginBottom: 4 },
  todayBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  todayIdea: {
    color: colors.text,
    fontWeight: "800",
    marginBottom: 4,
  },
  todayHint: {
    color: colors.muted,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  streakTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    marginBottom: 6,
  },
  streakValue: {
    fontSize: 34,
    lineHeight: 36,
    color: colors.primary,
    fontWeight: "900",
  },
  streakLabel: {
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 8,
  },
  datePickerBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  datePickerText: {
    flex: 1,
    color: colors.text,
    fontWeight: "700",
  },
  clearDateBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  moodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  moodChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  moodChipActive: {
    backgroundColor: "#ffe7ef",
    borderColor: colors.primary,
  },
  moodText: {
    color: colors.muted,
    fontWeight: "700",
  },
  moodTextActive: {
    color: colors.primary,
  },
  openMemoriesBtn: {
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  openMemoriesText: {
    color: colors.text,
    fontWeight: "800",
  },
});
