import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { getSession } from "../src/features/auth/authStore";

export default function IndexScreen() {
  const [target, setTarget] = useState<"/login" | "/home" | null>(null);

  useEffect(() => {
    getSession()
      .then((session) => setTarget(session ? "/home" : "/login"))
      .catch(() => setTarget("/login"));
  }, []);

  if (!target) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#ff8178" size="large" />
      </View>
    );
  }

  return <Redirect href={target} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f6f2",
  },
});
