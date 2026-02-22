import React, { useContext, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { signOut } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import Card from "../components/Card";
import { AppContext } from "../context/AppContext";
import { auth } from "../firebase/firebaseConfig";
import { colors } from "../theme/colors";

export default function ProfileScreen() {
  const { state, actions } = useContext(AppContext);
  const navigation = useNavigation();
  const [yourName, setYourName] = useState(state.profile.yourName);
  const [partnerName, setPartnerName] = useState(state.profile.partnerName);
  const [anniversary, setAnniversary] = useState(state.profile.anniversary);
  const [status, setStatus] = useState("");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card title="Profile" subtitle="Personalize everything for your wife.">
        <TextInput
          style={styles.input}
          value={yourName}
          onChangeText={setYourName}
          placeholder="Your name"
        />
        <TextInput
          style={styles.input}
          value={partnerName}
          onChangeText={setPartnerName}
          placeholder="Partner name"
        />
        <TextInput
          style={styles.input}
          value={anniversary}
          onChangeText={setAnniversary}
          placeholder="YYYY-MM-DD"
        />

        <Pressable
          style={styles.btn}
          onPress={() => {
            actions.updateProfile({ yourName, partnerName, anniversary });
            setStatus("Saved successfully.");
          }}
        >
          <Text style={styles.btnText}>Save Profile</Text>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={() => navigation.navigate("Partner")}>
          <Text style={styles.secondaryBtnText}>Invite/Add Partner</Text>
        </Pressable>

        <Pressable style={styles.logoutBtn} onPress={() => signOut(auth)}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        {!!status && <Text style={styles.status}>{status}</Text>}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.bg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 8,
  },
  btn: {
    marginTop: 6,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "800" },
  secondaryBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "#fff"
  },
  secondaryBtnText: { color: colors.text, fontWeight: "800" },
  logoutBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "#fff"
  },
  logoutText: { color: colors.text, fontWeight: "800" },
  status: { marginTop: 8, color: colors.success, fontWeight: "700" }
});
