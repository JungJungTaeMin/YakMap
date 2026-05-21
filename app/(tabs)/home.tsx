import { Calendar, Check, Circle, Clock, Pill, CircleAlert } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
  listMedicationSchedules,
  MedicationSchedule,
} from "../../src/features/medicine/scheduleStore";
import { getResponsiveLayout } from "../../src/styles/responsive";

const COLORS = {
  background: "#f8f6f2",
  coral: "#ff8178",
  coralPale: "#fff0ee",
  mint: "#9adbd2",
  mintPale: "#eaf8f5",
  text: "#2d2521",
  muted: "#8e847c",
  border: "#e7e1dc",
  white: "#ffffff",
};

const schedules = [
  { id: 1, name: "오메가3", time: "08:00", dose: 1, category: "일반약", initialTaken: true },
  { id: 2, name: "타이레놀정 500mg", time: "14:00", dose: 1, category: "일반약", initialTaken: false },
  { id: 3, name: "위장약", time: "19:00", dose: 1, category: "일반약", initialTaken: false },
];

const lowStockMedicines = [
  { id: 1, name: "오메가3", remaining: "6정", days: "2일" },
  { id: 2, name: "비타민D", remaining: "15정", days: "5일" },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const [savedSchedules, setSavedSchedules] = useState<MedicationSchedule[]>([]);
  const [takenIds, setTakenIds] = useState<(number | string)[]>(
    schedules.filter((item) => item.initialTaken).map((item) => item.id),
  );

  useFocusEffect(
    useCallback(() => {
      listMedicationSchedules()
        .then(setSavedSchedules)
        .catch(() => setSavedSchedules([]));
    }, []),
  );

  const displaySchedules = useMemo(
    () => [
      ...savedSchedules.flatMap((schedule) =>
        schedule.times.map((time, index) => ({
          id: `${schedule.id}-${time}-${index}`,
          name: schedule.medicine.name,
          time,
          dose: schedule.dose,
          category: schedule.medicine.category,
          initialTaken: false,
        })),
      ),
      ...schedules,
    ],
    [savedSchedules],
  );

  const nextSchedule = displaySchedules.find((item) => !takenIds.includes(item.id));

  const toggleTaken = (id: number | string) => {
    setTakenIds((current) =>
      current.includes(id)
        ? current.filter((currentId) => currentId !== id)
        : [...current, id],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, layout.centered]} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.greeting}>안녕하세요👋</Text>
          <Text style={styles.subtitle}>오늘도 건강한 하루 되세요</Text>

          <View style={styles.nextCard}>
            <View style={styles.nextHeader}>
              <View style={styles.nextLabelRow}>
                <Clock color={COLORS.coral} size={20} strokeWidth={2.4} />
                <Text style={styles.nextLabel}>다음 복용</Text>
              </View>
              <Text style={styles.nextTime}>{nextSchedule?.time ?? "14:00"}</Text>
            </View>

            <View style={styles.nextBody}>
              <View>
                <Text style={styles.nextName}>{nextSchedule?.name ?? "타이레놀정 500mg"}</Text>
                <Text style={styles.nextDose}>{nextSchedule?.dose ?? 1}정</Text>
              </View>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>{nextSchedule?.category ?? "일반약"}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>오늘의 복약 일정</Text>
          <Calendar color={COLORS.muted} size={28} strokeWidth={2.2} />
        </View>

        <View style={styles.scheduleList}>
          {displaySchedules.map((item) => {
            const isTaken = takenIds.includes(item.id);

            return (
              <Pressable
                key={item.id}
                onPress={() => toggleTaken(item.id)}
                style={[styles.scheduleCard, isTaken ? styles.scheduleCardTaken : null]}
              >
                <View
                  style={[
                    styles.scheduleIcon,
                    isTaken ? styles.scheduleIconTaken : styles.scheduleIconPending,
                  ]}
                >
                  <Pill color={isTaken ? COLORS.mint : COLORS.coral} size={32} strokeWidth={2.2} />
                </View>

                <View style={styles.scheduleTextBox}>
                  <Text style={[styles.scheduleName, isTaken ? styles.takenText : null]}>
                    {item.name}
                  </Text>
                  <Text style={styles.scheduleTime}>{item.time}</Text>
                </View>

                <View style={styles.checkBox}>
                  {isTaken ? (
                    <View style={styles.checkedCircle}>
                      <Check color={COLORS.white} size={23} strokeWidth={3} />
                    </View>
                  ) : (
                    <Circle color={COLORS.border} size={38} strokeWidth={1.8} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.lowStockHeader}>
          <CircleAlert color={COLORS.text} size={28} strokeWidth={2.3} />
          <Text style={styles.sectionTitle}>곧 떨어지는 약</Text>
        </View>

        <View style={styles.lowStockList}>
          {lowStockMedicines.map((item) => (
            <View key={item.id} style={styles.lowStockCard}>
              <View>
                <Text style={styles.lowStockName}>{item.name}</Text>
                <Text style={styles.lowStockAmount}>남은 수량: {item.remaining}</Text>
              </View>

              <View style={styles.lowStockDaysBox}>
                <Text style={styles.lowStockLabel}>남은 일수</Text>
                <Text style={styles.lowStockDays}>{item.days}</Text>
              </View>
            </View>
          ))}
        </View>
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
    paddingBottom: 32,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 34,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: COLORS.coral,
  },
  greeting: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 18,
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "500",
  },
  nextCard: {
    marginTop: 42,
    padding: 24,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    shadowColor: "#3b302a",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 17,
    elevation: 8,
  },
  nextHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  nextLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nextLabel: {
    color: COLORS.muted,
    fontSize: 18,
    fontWeight: "700",
  },
  nextTime: {
    color: COLORS.coral,
    fontSize: 36,
    fontWeight: "800",
  },
  nextBody: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 16,
  },
  nextName: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
  },
  nextDose: {
    marginTop: 18,
    color: COLORS.muted,
    fontSize: 22,
    fontWeight: "700",
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.mintPale,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 40,
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 31,
    fontWeight: "800",
  },
  scheduleList: {
    gap: 16,
    paddingHorizontal: 24,
  },
  scheduleCard: {
    minHeight: 106,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 22,
    backgroundColor: COLORS.white,
  },
  scheduleCardTaken: {
    borderColor: "#d5f1ec",
  },
  scheduleIcon: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 35,
  },
  scheduleIconTaken: {
    backgroundColor: COLORS.mintPale,
  },
  scheduleIconPending: {
    backgroundColor: COLORS.coralPale,
  },
  scheduleTextBox: {
    flex: 1,
    marginLeft: 24,
  },
  scheduleName: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "800",
  },
  takenText: {
    color: COLORS.muted,
    textDecorationLine: "line-through",
  },
  scheduleTime: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 21,
    fontWeight: "700",
  },
  checkBox: {
    width: 44,
    alignItems: "center",
  },
  checkedCircle: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: COLORS.mint,
  },
  lowStockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    marginTop: 40,
    marginBottom: 20,
  },
  lowStockList: {
    gap: 16,
    paddingHorizontal: 24,
  },
  lowStockCard: {
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: "#ffc9c4",
    borderRadius: 18,
    backgroundColor: COLORS.coralPale,
  },
  lowStockName: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "800",
  },
  lowStockAmount: {
    marginTop: 16,
    color: COLORS.muted,
    fontSize: 19,
    fontWeight: "700",
  },
  lowStockDaysBox: {
    alignItems: "flex-end",
  },
  lowStockLabel: {
    color: COLORS.muted,
    fontSize: 18,
    fontWeight: "700",
  },
  lowStockDays: {
    marginTop: 8,
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
  },
});
