import {
  Bell,
  ChevronRight,
  LogOut,
  Moon,
  Shield,
  User,
} from "lucide-react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import {
  AuthProfile,
  getCurrentUserProfile,
  signOut,
} from "../../src/features/auth/authStore";
import {
  getMedicationNotificationsEnabled,
  listMedicationSchedules,
  setMedicationNotificationsEnabled,
} from "../../src/features/medicine/scheduleStore";
import { getResponsiveLayout } from "../../src/styles/responsive";

const COLORS = {
  background: "#f8f6f2",
  coral: "#ff8178",
  beige: "#efebe6",
  text: "#2d2521",
  muted: "#8e847c",
  border: "#e7e1dc",
  white: "#ffffff",
};

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [medicineCount, setMedicineCount] = useState(0);

  useEffect(() => {
    getMedicationNotificationsEnabled()
      .then(setNotificationsEnabled)
      .catch(() => setNotificationsEnabled(true));

    getCurrentUserProfile()
      .then((currentProfile) => {
        if (!currentProfile) {
          router.replace("/login");
          return;
        }

        setProfile(currentProfile);
      })
      .catch(() => router.replace("/login"));

    listMedicationSchedules()
      .then((schedules) => setMedicineCount(schedules.length))
      .catch(() => setMedicineCount(0));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const toggleNotifications = async () => {
    const nextEnabled = !notificationsEnabled;
    setNotificationsEnabled(nextEnabled);

    try {
      await setMedicationNotificationsEnabled(nextEnabled);
    } catch {
      setNotificationsEnabled(!nextEnabled);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, layout.content]} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <User color={COLORS.coral} size={72} strokeWidth={2.2} />
          </View>
          <Text style={styles.name}>{profile?.name ?? "사용자"}</Text>
          <Text style={styles.email}>{profile?.email ?? ""}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumberCoral}>{medicineCount}</Text>
            <Text style={styles.statLabel}>등록된 약</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>복용 일수</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>95%</Text>
            <Text style={styles.statLabel}>복약 순응도</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>계정</Text>
        <View style={styles.menuGroup}>
          <Pressable style={styles.menuRow}>
            <View style={styles.menuIconBox}>
              <User color={COLORS.muted} size={31} strokeWidth={2.3} />
            </View>
            <Text style={styles.menuText}>프로필 수정</Text>
            <ChevronRight color={COLORS.muted} size={30} strokeWidth={2.4} />
          </Pressable>

          <View style={styles.rowDivider} />

          <View style={styles.menuRow}>
            <View style={styles.menuIconBox}>
              <Bell color={COLORS.muted} size={31} strokeWidth={2.3} />
            </View>
            <Text style={styles.menuText}>알림 설정</Text>
            <Pressable
              accessibilityLabel="알림 설정 전환"
              onPress={toggleNotifications}
              style={[
                styles.switchTrack,
                notificationsEnabled ? styles.switchTrackOn : null,
              ]}
            >
              <View
                style={[
                  styles.switchThumb,
                  notificationsEnabled ? styles.switchThumbOn : null,
                ]}
              />
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>설정</Text>
        <View style={styles.menuGroup}>
          <View style={styles.menuRow}>
            <View style={styles.menuIconBox}>
              <Moon color={COLORS.muted} size={31} strokeWidth={2.3} />
            </View>
            <Text style={styles.menuText}>다크 모드</Text>
            <Pressable
              accessibilityLabel="다크 모드 전환"
              onPress={() => setDarkModeEnabled((current) => !current)}
              style={[
                styles.switchTrack,
                darkModeEnabled ? styles.switchTrackOn : null,
              ]}
            >
              <View
                style={[
                  styles.switchThumb,
                  darkModeEnabled ? styles.switchThumbOn : null,
                ]}
              />
            </Pressable>
          </View>

          <View style={styles.rowDivider} />

          <Pressable style={styles.menuRow}>
            <View style={styles.menuIconBox}>
              <Shield color={COLORS.muted} size={31} strokeWidth={2.3} />
            </View>
            <Text style={styles.menuText}>개인정보 보호</Text>
            <ChevronRight color={COLORS.muted} size={30} strokeWidth={2.4} />
          </Pressable>
        </View>

        <Pressable onPress={handleSignOut} style={styles.logoutButton}>
          <LogOut color={COLORS.coral} size={30} strokeWidth={2.4} />
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 34,
  },
  hero: {
    alignItems: "center",
    minHeight: 430,
    paddingTop: 78,
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
    backgroundColor: COLORS.coral,
  },
  avatar: {
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 75,
    backgroundColor: "#fff7f5",
    shadowColor: "#3b302a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  name: {
    marginTop: 42,
    color: COLORS.white,
    fontSize: 32,
    fontWeight: "800",
  },
  email: {
    marginTop: 20,
    color: COLORS.white,
    fontSize: 21,
    fontWeight: "600",
  },
  statsCard: {
    minHeight: 132,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: -66,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    shadowColor: "#3b302a",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumberCoral: {
    color: COLORS.coral,
    fontSize: 35,
    fontWeight: "800",
  },
  statNumber: {
    color: COLORS.text,
    fontSize: 35,
    fontWeight: "800",
  },
  statLabel: {
    marginTop: 18,
    color: COLORS.muted,
    fontSize: 18,
    fontWeight: "700",
  },
  statDivider: {
    width: 1,
    height: 72,
    backgroundColor: COLORS.border,
  },
  sectionTitle: {
    marginHorizontal: 32,
    marginTop: 50,
    marginBottom: 22,
    color: COLORS.muted,
    fontSize: 24,
    fontWeight: "800",
  },
  menuGroup: {
    overflow: "hidden",
    marginHorizontal: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 24,
    backgroundColor: COLORS.white,
  },
  menuRow: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 28,
  },
  menuIconBox: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 31,
    backgroundColor: COLORS.beige,
  },
  menuText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "800",
  },
  rowDivider: {
    height: 1,
    marginLeft: 108,
    backgroundColor: COLORS.border,
  },
  switchTrack: {
    width: 82,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 5,
    borderRadius: 24,
    backgroundColor: COLORS.beige,
  },
  switchTrackOn: {
    backgroundColor: COLORS.coral,
  },
  switchThumb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    shadowColor: "#3b302a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  switchThumbOn: {
    alignSelf: "flex-end",
  },
  logoutButton: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginHorizontal: 24,
    marginTop: 34,
    borderWidth: 1.5,
    borderColor: COLORS.coral,
    borderRadius: 18,
    backgroundColor: COLORS.white,
  },
  logoutText: {
    color: COLORS.coral,
    fontSize: 22,
    fontWeight: "800",
  },
});
