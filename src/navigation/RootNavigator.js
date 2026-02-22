import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
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

export default function RootNavigator({ initialRouteName = "Home" }) {
  return (
    <NavigationContainer linking={linking}>
      <Tab.Navigator
        initialRouteName={initialRouteName}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopColor: colors.border,
            paddingTop: 8,
            height: 68
          },
          tabBarIcon: ({ color, focused, size }) => {
            const icon = mapIcon[route.name] || { active: "heart", inactive: "heart-outline" };
            return <Ionicons name={focused ? icon.active : icon.inactive} size={size ?? 20} color={color} />;
          }
        })}
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
