import React, { useContext, useEffect, useState } from "react";
import { Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { AppContext } from "../context/AppContext";
import Card from "../components/Card";
import { buildInviteLinks } from "../config/links";
import { colors } from "../theme/colors";

function toErrorMessage(error) {
  if (!error) return "Something went wrong.";
  return error.message || String(error);
}

export default function PartnerScreen() {
  const { state, actions } = useContext(AppContext);
  const route = useRoute();
  const [inviteCode, setInviteCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const codeFromLink = route?.params?.code;
    if (typeof codeFromLink === "string" && codeFromLink.trim()) {
      setInviteCode(codeFromLink.trim().toUpperCase());
      setStatus("Invite code detected from link. Tap Join to connect.");
    }
  }, [route?.params?.code]);

  const linked = !!state.profile.coupleId;

  const generateInvite = async () => {
    try {
      setLoading(true);
      const code = await actions.createInviteCode();
      setGeneratedCode(code);
      setStatus("Invite code generated. Share it with your partner.");
    } catch (error) {
      setStatus(toErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const shareInvite = async () => {
    if (!generatedCode) return;

    const links = buildInviteLinks(generatedCode);

    await Share.share({
      message: [
        `Join me on LoveVerse. Invite code: ${links.code}`,
        `Open invite link: ${links.webInviteLink}`,
        `Direct app link: ${links.appDeepLink}`,
        `Download APK: ${links.apkDownloadLink}`
      ].join("\n")
    });
  };

  const joinWithCode = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setStatus("Enter invite code first.");
      return;
    }

    try {
      setLoading(true);
      await actions.joinByInviteCode(code);
      setInviteCode("");
      setStatus("Partner linked successfully.");
    } catch (error) {
      setStatus(toErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card title="Partner Link" subtitle="Connect your partner account to create a shared love space.">
        {linked ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Connected</Text>
            <Text style={styles.muted}>Couple ID: {state.profile.coupleId}</Text>
            <Text style={styles.muted}>
              Partner: {state.partner?.yourName || state.profile.partnerUserId || "Linked"}
            </Text>
          </View>
        ) : (
          <>
            <Pressable style={[styles.btn, loading && styles.disabled]} disabled={loading} onPress={generateInvite}>
              <Text style={styles.btnText}>Generate Invite Code</Text>
            </Pressable>

            {!!generatedCode && (
              <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>Your invite code</Text>
                <Text style={styles.codeValue}>{generatedCode}</Text>
                <Pressable style={styles.outlineBtn} onPress={shareInvite}>
                  <Text style={styles.outlineBtnText}>Share Invite</Text>
                </Pressable>
              </View>
            )}

            <TextInput
              style={styles.input}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              placeholder="Enter partner invite code"
            />
            <Pressable style={[styles.btn, loading && styles.disabled]} disabled={loading} onPress={joinWithCode}>
              <Text style={styles.btnText}>Join Partner By Code</Text>
            </Pressable>
          </>
        )}

        {!!status && <Text style={styles.status}>{status}</Text>}
      </Card>

      <Card title="How It Works">
        <Text style={styles.step}>1. One partner generates an invite code.</Text>
        <Text style={styles.step}>2. Share code via chat/link.</Text>
        <Text style={styles.step}>3. Other partner opens link or enters code in app.</Text>
        <Text style={styles.step}>4. Accounts get linked as one couple.</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: "center",
    marginBottom: 10
  },
  btnText: { color: "#fff", fontWeight: "800" },
  disabled: { opacity: 0.55 },
  codeBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 10
  },
  codeLabel: { color: colors.muted, marginBottom: 4 },
  codeValue: { color: colors.text, fontWeight: "900", fontSize: 20, marginBottom: 10 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 9,
    alignItems: "center"
  },
  outlineBtnText: { color: colors.text, fontWeight: "800" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 10
  },
  status: { marginTop: 8, color: colors.success, fontWeight: "700" },
  infoBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12
  },
  infoText: { color: colors.primary, fontWeight: "900", marginBottom: 4 },
  muted: { color: colors.muted },
  step: { color: colors.text, marginBottom: 6 }
});
