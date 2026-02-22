import React, { useContext, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Card from "../components/Card";
import { AppContext } from "../context/AppContext";
import { colors } from "../theme/colors";

export default function NotesScreen() {
  const { state, actions } = useContext(AppContext);
  const [text, setText] = useState("");

  return (
    <View style={styles.container}>
      <Card title="Love Notes" subtitle="Write quick messages and keep them forever.">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write a note..."
          style={styles.input}
          multiline
        />
        <Pressable
          style={styles.btn}
          onPress={() => {
            actions.addNote(text);
            setText("");
          }}
        >
          <Text style={styles.btnText}>Save Note</Text>
        </Pressable>
      </Card>

      <FlatList
        data={state.notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.noteRow}>
            <Text style={styles.noteText}>{item.text}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notes yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 10,
    textAlignVertical: "top"
  },
  btn: { marginTop: 10, backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 11, alignItems: "center" },
  btnText: { color: "white", fontWeight: "800" },
  noteRow: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8
  },
  noteText: { color: colors.text, fontWeight: "600" },
  time: { marginTop: 6, color: colors.muted, fontSize: 12 },
  empty: { textAlign: "center", color: colors.muted, marginTop: 20 }
});
