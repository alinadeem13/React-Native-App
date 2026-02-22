import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import HomeScreen from "../screens/HomeScreen";
import NotesScreen from "../screens/NotesScreen";
import MemoriesScreen from "../screens/MemoriesScreen";
import PlannerScreen from "../screens/PlannerScreen";
import ChallengesScreen from "../screens/ChallengesScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PartnerScreen from "../screens/PartnerScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();

const mapIcon = {
  Home: { active: "home", inactive: "home-outline" },
  Notes: { active: "create", inactive: "create-outline" },
  Memories: { active: "images", inactive: "images-outline" },
  Planner: { active: "calendar", inactive: "calendar-outline" },
  Challenges: { active: "trophy", inactive: "trophy-outline" },
  Partner: { active: "people", inactive: "people-outline" },
  Profile: { active: "person", inactive: "person-outline" }
};

const linking = {
  prefixes: ["loveverse://"],
  config: {
    screens: {
      Home: "home",
      Notes: "notes",
      Memories: "memories",
      Planner: "planner",
      Challenges: "challenges",
      Partner: "invite/:code?",
      Profile: "profile"
    }
  }
};

function ScrollableTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.barWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={styles.scrollContent}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key]?.options || {};
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const icon = mapIcon[route.name] || { active: "heart", inactive: "heart-outline" };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.item, focused && styles.itemFocused]}
            >
              <Ionicons
                name={focused ? icon.active : icon.inactive}
                size={18}
                color={focused ? colors.primary : colors.muted}
              />
              <Text style={[styles.label, focused && styles.labelFocused]}>{String(label)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function RootNavigator({ initialRouteName = "Home" }) {
  return (
    <NavigationContainer linking={linking}>
      <Tab.Navigator
        initialRouteName={initialRouteName}
        tabBar={(props) => <ScrollableTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Notes" component={NotesScreen} />
        <Tab.Screen name="Memories" component={MemoriesScreen} />
        <Tab.Screen name="Planner" component={PlannerScreen} />
        <Tab.Screen name="Challenges" component={ChallengesScreen} />
        <Tab.Screen name="Partner" component={PartnerScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    backgroundColor: "#fff",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: 8
  },
  scrollContent: {
    paddingHorizontal: 8,
    alignItems: "center"
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: "#fff"
  },
  itemFocused: {
    backgroundColor: "#ffe8ef"
  },
  label: {
    color: colors.muted,
    fontWeight: "700"
  },
  labelFocused: {
    color: colors.primary
  }
});
