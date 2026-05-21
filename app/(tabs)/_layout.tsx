import { Tabs } from "expo-router";
import { Home, MapPin, Pill, User } from "lucide-react-native";
import { useWindowDimensions } from "react-native";

import { getResponsiveLayout } from "../../src/styles/responsive";

const COLORS = {
  active: "#ff8178",
  inactive: "#8e847c",
  border: "#e7e1dc",
  white: "#ffffff",
};

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "700",
          marginTop: 3,
        },
        tabBarStyle: {
          ...layout.tabBar,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.white,
        },
        tabBarItemStyle: {
          gap: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "홈",
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size + 2} strokeWidth={2.4} />
          ),
        }}
      />
      <Tabs.Screen
        name="medicines"
        options={{
          title: "내 약",
          tabBarIcon: ({ color, size }) => (
            <Pill color={color} size={size + 2} strokeWidth={2.4} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "지도",
          tabBarIcon: ({ color, size }) => (
            <MapPin color={color} size={size + 2} strokeWidth={2.4} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "프로필",
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size + 2} strokeWidth={2.4} />
          ),
        }}
      />
    </Tabs>
  );
}
