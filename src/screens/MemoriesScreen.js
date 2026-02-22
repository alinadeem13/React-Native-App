import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Card from "../components/Card";
import { AppContext } from "../context/AppContext";
import { colors } from "../theme/colors";

const categories = [
  "All",
  "Special",
  "Travel",
  "Food",
  "Milestone",
  "Funny",
  "Random",
];
const moods = ["Happy", "Romantic", "Grateful", "Wild", "Calm"];

function formatLongDate(dateText) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return dateText;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function monthLabel(dateText) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function getMonthCount(memories) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return memories.filter((memory) => {
    const d = new Date(memory.dateText);
    return d.getMonth() === month && d.getFullYear() === year;
  }).length;
}

export default function MemoriesScreen() {
  const { state, actions } = useContext(AppContext);
  const spin = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeMood, setActiveMood] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    text: "",
    type: "error",
  });
  const [newMemory, setNewMemory] = useState({
    title: "",
    details: "",
    category: "Special",
    mood: "Happy",
    dateText: new Date().toISOString().slice(0, 10),
  });

  const rotateY = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const showToast = (text, type = "error") => {
    setToast({ visible: true, text, type });
    toastAnim.setValue(0);

    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(() => setToast((prev) => ({ ...prev, visible: false })));
      }, 1700);
    });
  };

  const spinCard = () => {
    spin.setValue(0);
    Animated.timing(spin, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  };

  const filteredMemories = useMemo(
    () =>
      state.memories
        .filter((memory) =>
          activeCategory === "All" ? true : memory.category === activeCategory
        )
        .filter((memory) =>
          activeMood === "All" ? true : memory.mood === activeMood
        )
        .sort(
          (a, b) =>
            (b.dateMs || b.createdAt || 0) - (a.dateMs || a.createdAt || 0)
        ),
    [state.memories, activeCategory, activeMood]
  );

  const timelineData = useMemo(() => {
    const rows = [];
    let currentMonth = "";
    filteredMemories.forEach((memory) => {
      const label = monthLabel(memory.dateText);
      if (label !== currentMonth) {
        currentMonth = label;
        rows.push({ id: `month-${label}`, kind: "month", label });
      }
      rows.push({ id: memory.id, kind: "memory", memory });
    });
    return rows;
  }, [filteredMemories]);

  const onThisDay = useMemo(() => {
    const today = new Date();
    const month = today.getMonth();
    const day = today.getDate();
    return state.memories.find((memory) => {
      const date = new Date(memory.dateText);
      if (Number.isNaN(date.getTime())) return false;
      return date.getMonth() === month && date.getDate() === day;
    });
  }, [state.memories]);

  const reliveRandomMemory = () => {
    if (!state.memories.length) {
      showToast("No memories yet. Add your first one.");
      return;
    }
    const picked =
      state.memories[Math.floor(Math.random() * state.memories.length)];
    showToast(`Relive: ${picked.title}`, "success");
    spinCard();
  };

  const handleSaveMemory = () => {
    const result = actions.addMemory(newMemory);
    if (!result?.ok) {
      if (result?.reason === "invalid_date") {
        showToast("Use date format YYYY-MM-DD.");
      } else if (result?.reason === "title_required") {
        showToast("Memory title is required.");
      } else {
        showToast("Could not save memory.");
      }
      return;
    }

    setNewMemory({
      title: "",
      details: "",
      category: "Special",
      mood: "Happy",
      dateText: new Date().toISOString().slice(0, 10),
    });
    setShowAddModal(false);
    showToast("Memory saved to your love vault.", "success");
  };

  const toastBg = toast.type === "success" ? "#dff8ed" : "#ffe4e8";
  const toastColor = toast.type === "success" ? "#0f7d58" : "#b32746";

  return (
    <View style={styles.container}>
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
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name={
                toast.type === "success" ? "checkmark-circle" : "alert-circle"
              }
              size={17}
              color={toastColor}
            />
            <Text style={[styles.toastText, { color: toastColor }]}>
              {toast.text}
            </Text>
          </Animated.View>
        </View>
      )}

      <Card
        title="Memory Vault"
        subtitle="Build timeline, relive moments, and react together."
      >
        <View style={styles.quickRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{state.memories.length}</Text>
            <Text style={styles.metricLabel}>Total</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {getMonthCount(state.memories)}
            </Text>
            <Text style={styles.metricLabel}>This month</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {state.memories.filter((m) => m.reactions?.heart).length}
            </Text>
            <Text style={styles.metricLabel}>Loved</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.btn} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-circle" size={16} color="#fff" />
            <Text style={styles.btnText}>Add Memory</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={reliveRandomMemory}>
            <Ionicons name="shuffle" size={16} color={colors.primary} />
            <Text style={styles.secondaryBtnText}>Relive Random</Text>
          </Pressable>
        </View>
      </Card>

      {onThisDay ? (
        <Animated.View
          style={[styles.onThisDayCard, { transform: [{ rotateY }] }]}
        >
          <Text style={styles.onThisDayTitle}>On This Day</Text>
          <Text style={styles.onThisDayHeading}>{onThisDay.title}</Text>
          <Text style={styles.onThisDayBody}>
            {onThisDay.details || "No caption added yet."}
          </Text>
          <Text style={styles.onThisDayDate}>
            {formatLongDate(onThisDay.dateText)}
          </Text>
        </Animated.View>
      ) : (
        <Pressable style={styles.onThisDayCard} onPress={spinCard}>
          <Text style={styles.onThisDayTitle}>On This Day</Text>
          <Text style={styles.onThisDayBody}>
            No same-date memory yet. Tap to spin your timeline.
          </Text>
        </Pressable>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsWrap}
        contentContainerStyle={styles.chipsRow}
      >
        {categories.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[styles.chip, activeCategory === cat && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                activeCategory === cat && styles.chipTextActive,
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsWrap}
        contentContainerStyle={styles.chipsRow}
      >
        {["All", ...moods].map((mood) => (
          <Pressable
            key={mood}
            onPress={() => setActiveMood(mood)}
            style={[styles.chip, activeMood === mood && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                activeMood === mood && styles.chipTextActive,
              ]}
            >
              {mood === "All" ? "All Moods" : mood}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={timelineData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => {
          if (item.kind === "month") {
            return <Text style={styles.monthHeader}>{item.label}</Text>;
          }

          const memory = item.memory;
          return (
            <View style={styles.item}>
              <View style={styles.itemHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heading}>{memory.title}</Text>
                  <Text style={styles.metaText}>
                    {memory.category} | {memory.mood} |{" "}
                    {formatLongDate(memory.dateText)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => actions.deleteMemory(memory.id)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={17} color="#bc3150" />
                </Pressable>
              </View>
              <Text style={styles.body}>
                {memory.details || "No details added."}
              </Text>
              <View style={styles.reactRow}>
                <Pressable
                  style={styles.reactBtn}
                  onPress={() => actions.reactToMemory(memory.id, "heart")}
                >
                  <Text style={styles.reactText}>
                    HEART {memory.reactions?.heart || 0}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.reactBtn}
                  onPress={() => actions.reactToMemory(memory.id, "laugh")}
                >
                  <Text style={styles.reactText}>
                    LOL {memory.reactions?.laugh || 0}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.reactBtn}
                  onPress={() => actions.reactToMemory(memory.id, "wow")}
                >
                  <Text style={styles.reactText}>
                    FIRE {memory.reactions?.wow || 0}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              No memories match these filters.
            </Text>
            <Text style={styles.emptyBody}>
              Try another category/mood or add a new memory.
            </Text>
          </View>
        }
      />

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add A Memory</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={newMemory.title}
              onChangeText={(v) =>
                setNewMemory((prev) => ({ ...prev, title: v }))
              }
              placeholderTextColor="#9d7a87"
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="What happened?"
              multiline
              value={newMemory.details}
              onChangeText={(v) =>
                setNewMemory((prev) => ({ ...prev, details: v }))
              }
              placeholderTextColor="#9d7a87"
            />
            <TextInput
              style={styles.input}
              placeholder="Date YYYY-MM-DD"
              value={newMemory.dateText}
              onChangeText={(v) =>
                setNewMemory((prev) => ({ ...prev, dateText: v }))
              }
              placeholderTextColor="#9d7a87"
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.inlineScroll}
            >
              {categories
                .filter((c) => c !== "All")
                .map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.smallChip,
                      newMemory.category === cat && styles.smallChipActive,
                    ]}
                    onPress={() =>
                      setNewMemory((prev) => ({ ...prev, category: cat }))
                    }
                  >
                    <Text
                      style={[
                        styles.smallChipText,
                        newMemory.category === cat &&
                          styles.smallChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Mood</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.inlineScroll}
            >
              {moods.map((mood) => (
                <Pressable
                  key={mood}
                  style={[
                    styles.smallChip,
                    newMemory.mood === mood && styles.smallChipActive,
                  ]}
                  onPress={() => setNewMemory((prev) => ({ ...prev, mood }))}
                >
                  <Text
                    style={[
                      styles.smallChipText,
                      newMemory.mood === mood && styles.smallChipTextActive,
                    ]}
                  >
                    {mood}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalGhostBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalPrimaryBtn}
                onPress={handleSaveMemory}
              >
                <Text style={styles.modalPrimaryText}>Save Memory</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  toastOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  toastText: {
    fontWeight: "700",
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  metric: {
    flex: 1,
    backgroundColor: "#fff7f9",
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.primary,
  },
  metricLabel: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtn: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
    backgroundColor: "#fff",
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: colors.primary,
    fontWeight: "800",
  },
  btnText: { color: "white", fontWeight: "800" },
  onThisDayCard: {
    backgroundColor: "#ffedf4",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ffc5d7",
    padding: 14,
    marginBottom: 10,
  },
  onThisDayTitle: {
    fontWeight: "900",
    color: "#b72f5a",
    marginBottom: 6,
  },
  onThisDayHeading: {
    color: colors.text,
    fontWeight: "800",
    marginBottom: 4,
  },
  onThisDayBody: {
    color: colors.muted,
  },
  onThisDayDate: {
    color: "#9f3257",
    marginTop: 6,
    fontWeight: "700",
  },
  chipsWrap: {
    marginTop: 4,
    minHeight: 52,
  },
  chipsRow: {
    paddingVertical: 8,
    alignItems: "center",
    minHeight: 52,
    paddingRight: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 13,
    paddingVertical: 10,
    minHeight: 42,
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "#fff",
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: "#ffe7ef",
  },
  chipText: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 20,
  },
  chipTextActive: {
    color: colors.primary,
  },
  monthHeader: {
    marginTop: 8,
    marginBottom: 7,
    color: colors.primary,
    fontWeight: "900",
  },
  item: {
    backgroundColor: "#fff",
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  itemHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  deleteBtn: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffe4ea",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: { color: colors.text, fontWeight: "800", marginBottom: 6 },
  metaText: {
    color: "#975f72",
    fontSize: 12,
    fontWeight: "700",
  },
  body: { color: colors.muted, marginBottom: 8 },
  reactRow: {
    flexDirection: "row",
    gap: 8,
  },
  reactBtn: {
    backgroundColor: "#fff5f8",
    borderWidth: 1,
    borderColor: "#ffd4e1",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reactText: {
    fontWeight: "700",
    color: "#9d3c60",
  },
  emptyBox: {
    marginTop: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    padding: 16,
    alignItems: "center",
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: "800",
    marginBottom: 4,
  },
  emptyBody: {
    color: colors.muted,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(34, 10, 20, 0.48)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 26,
  },
  modalTitle: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    marginBottom: 10,
  },
  textarea: {
    minHeight: 74,
    textAlignVertical: "top",
  },
  fieldLabel: {
    color: colors.text,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 2,
  },
  inlineScroll: {
    marginBottom: 10,
  },
  smallChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  smallChipActive: {
    backgroundColor: "#ffe7ef",
    borderColor: colors.primary,
  },
  smallChipText: {
    color: colors.muted,
    fontWeight: "700",
  },
  smallChipTextActive: {
    color: colors.primary,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalGhostBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  modalGhostText: {
    color: colors.muted,
    fontWeight: "800",
  },
  modalPrimaryBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  modalPrimaryText: {
    color: "#fff",
    fontWeight: "800",
  },
});
