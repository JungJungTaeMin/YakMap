import { Link, router, useFocusEffect } from "expo-router";
import { Calendar, Clock, Edit3, Plus, Trash2, Pill } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  deleteMedicationSchedule,
  listMedicationSchedules,
  MedicationSchedule,
} from "../../src/features/medicine/scheduleStore";

const COLORS = {
  background: "#f8f6f2",
  coral: "#ff8178",
  coralSoft: "#ffd0cb",
  coralPale: "#fff0ee",
  mint: "#9adbd2",
  mintPale: "#eaf8f5",
  beige: "#efebe6",
  text: "#2d2521",
  muted: "#8e847c",
  border: "#e7e1dc",
  white: "#ffffff",
};

const medicines = [
  {
    id: 1,
    name: "오메가3",
    categories: ["일반약"],
    dose: "1일 1회, 1회 1캡슐",
    times: ["08:00"],
    period: "2026-04-01 ~ 2026-04-30",
    remaining: 22,
    total: 30,
    color: COLORS.mint,
  },
  {
    id: 2,
    name: "타이레놀정 500mg",
    categories: ["일반약"],
    dose: "1일 3회, 1회 1정",
    times: ["08:00", "14:00", "20:00"],
    period: "2026-04-20 ~ 2026-04-23",
    remaining: 6,
    total: 9,
    color: COLORS.coral,
  },
  {
    id: 3,
    name: "리피토정 10mg",
    categories: ["전문약", "일반병원"],
    dose: "1일 2회, 1회 1정",
    times: ["09:00", "19:00"],
    period: "2026-04-10 ~ 2026-04-30",
    remaining: 10,
    total: 20,
    color: COLORS.coralSoft,
  },
];

export default function MedicinesScreen() {
  const [savedSchedules, setSavedSchedules] = useState<MedicationSchedule[]>([]);

  useFocusEffect(
    useCallback(() => {
      listMedicationSchedules()
        .then(setSavedSchedules)
        .catch(() => setSavedSchedules([]));
    }, []),
  );

  const displayedMedicines = useMemo(
    () => [
      ...savedSchedules.map((schedule) => ({
        id: schedule.id,
        name: schedule.medicine.name,
        categories: [schedule.medicine.category],
        dose: `1일 ${schedule.frequency}회, 1회 ${schedule.dose}정`,
        times: schedule.times,
        period: `${schedule.startDate} ~ ${schedule.endDate}`,
        remaining: schedule.remainingPills,
        total: schedule.totalPills,
        color: schedule.medicine.category === "전문약" ? COLORS.coralSoft : COLORS.mint,
        scheduleId: schedule.id,
        medicineId: schedule.medicine.id,
        canManage: true,
      })),
      ...medicines.map((medicine) => ({ ...medicine, canManage: false })),
    ],
    [savedSchedules],
  );

  const deleteSchedule = async (id: string) => {
    await deleteMedicationSchedule(id);
    setSavedSchedules((current) => current.filter((schedule) => schedule.id !== id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>내 약 관리</Text>
            <Text style={styles.subtitle}>등록된 약 {displayedMedicines.length}개</Text>
          </View>

          <Link href="/medicine/add" asChild>
            <Pressable accessibilityLabel="약 추가하기" style={styles.addButton}>
              <Plus color={COLORS.white} size={36} strokeWidth={2.2} />
            </Pressable>
          </Link>
        </View>

        <View style={styles.list}>
          {displayedMedicines.map((medicine) => {
            const progress = medicine.remaining / medicine.total;

            return (
              <View key={medicine.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: medicine.color }]}>
                    <Pill color={COLORS.white} size={41} strokeWidth={2.2} />
                  </View>

                  <View style={styles.nameBox}>
                    <Text style={styles.name}>{medicine.name}</Text>
                    <View style={styles.tags}>
                      {medicine.categories.map((category) => (
                        <View
                          key={category}
                          style={[
                            styles.tag,
                            category === "전문약" ? styles.prescriptionTag : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.tagText,
                              category === "전문약" ? styles.prescriptionTagText : null,
                            ]}
                          >
                            {category}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {medicine.canManage ? (
                    <View style={styles.actions}>
                      <Pressable
                        accessibilityLabel={`${medicine.name} 수정`}
                        onPress={() =>
                          router.push({
                            pathname: "/medicine/add/schedule",
                            params: {
                              medicineId: medicine.medicineId,
                              scheduleId: medicine.scheduleId,
                            },
                          })
                        }
                        style={styles.actionButton}
                      >
                        <Edit3 color={COLORS.muted} size={24} strokeWidth={2.4} />
                      </Pressable>
                      <Pressable
                        accessibilityLabel={`${medicine.name} 삭제`}
                        onPress={() => deleteSchedule(medicine.scheduleId)}
                        style={styles.actionButton}
                      >
                        <Trash2 color={COLORS.muted} size={24} strokeWidth={2.4} />
                      </Pressable>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.dose}>{medicine.dose}</Text>

                <View style={styles.timeRow}>
                  {medicine.times.map((time) => (
                    <View key={time} style={styles.timePill}>
                      <Clock color={COLORS.muted} size={18} strokeWidth={2.4} />
                      <Text style={styles.timeText}>{time}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.periodRow}>
                  <Calendar color={COLORS.muted} size={22} strokeWidth={2.2} />
                  <Text style={styles.period}>{medicine.period}</Text>
                </View>

                <View style={styles.remainingHeader}>
                  <Text style={styles.remainingLabel}>남은 약</Text>
                  <Text style={styles.remainingValue}>
                    {medicine.remaining} / {medicine.total}정
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress * 100}%`,
                        backgroundColor: medicine.id === 2 ? COLORS.coral : COLORS.mint,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
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
    paddingHorizontal: 24,
    paddingTop: 58,
    paddingBottom: 34,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  title: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 22,
    color: COLORS.muted,
    fontSize: 24,
    fontWeight: "600",
  },
  addButton: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
    backgroundColor: COLORS.coral,
    shadowColor: "#3b302a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 7,
  },
  list: {
    gap: 24,
  },
  card: {
    padding: 22,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 26,
    backgroundColor: COLORS.white,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconCircle: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
  },
  nameBox: {
    flex: 1,
    marginLeft: 22,
    paddingRight: 8,
  },
  name: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 17,
    backgroundColor: COLORS.mintPale,
  },
  prescriptionTag: {
    backgroundColor: COLORS.coralPale,
  },
  tagText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  prescriptionTagText: {
    color: COLORS.coral,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 27,
    backgroundColor: COLORS.beige,
  },
  dose: {
    marginTop: 34,
    color: COLORS.muted,
    fontSize: 21,
    fontWeight: "700",
  },
  timeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 22,
  },
  timePill: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: COLORS.background,
  },
  timeText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 28,
  },
  period: {
    color: COLORS.muted,
    fontSize: 20,
    fontWeight: "700",
  },
  remainingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 30,
  },
  remainingLabel: {
    color: COLORS.muted,
    fontSize: 20,
    fontWeight: "700",
  },
  remainingValue: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "800",
  },
  progressTrack: {
    height: 12,
    overflow: "hidden",
    marginTop: 16,
    borderRadius: 6,
    backgroundColor: COLORS.beige,
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
});
