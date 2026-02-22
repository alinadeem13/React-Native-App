import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

const AnimatedIonicon = Animated.createAnimatedComponent(Ionicons);

export default function PulseHeart() {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.15, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, [anim]);

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ scale: anim }] }}>
        <AnimatedIonicon name="heart" size={56} color={colors.primary} />
      </Animated.View>
      <Text style={styles.caption}>Live Love Pulse</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  caption: { marginTop: 6, color: colors.muted, fontWeight: "600" }
});
