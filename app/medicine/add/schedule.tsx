import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Calendar, Clock, Pill, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  findMedicineById,
  Medicine,
  MedicineCategory,
} from "../../../src/features/medicine/medicineCatalog";
import {
  getMedicationSchedule,
  saveMedicationSchedule,
} from "../../../src/features/medicine/scheduleStore";
import { getResponsiveLayout } from "../../../src/styles/responsive";

const COLORS = {
  background: "#f8f6f2",
  coral: "#ff8178",
  coralPale: "#fff0ee",
  mint: "#bfe8df",
  mintPale: "#eef8f4",
  beige: "#efebe6",
  text: "#2d2521",
  muted: "#8e847c",
  border: "#e7e1dc",
  white: "#ffffff",
};

const frequencyOptions = [1, 2, 3, 4];
const doseOptions = [1, 2, 3, 4];
const timeOptions = [
  { label: "아침 8시", value: "08:00" },
  { label: "점심 12시", value: "12:00" },
  { label: "저녁 6시", value: "18:00" },
  { label: "밤 10시", value: "22:00" },
];

function isValidDateText(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isValidDurationText(value: string) {
  const duration = Number(value.trim());
  return /^\d+$/.test(value.trim()) && Number.isSafeInteger(duration) && duration > 0;
}

function getParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function MedicineScheduleScreen() {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const params = useLocalSearchParams<{
    category?: MedicineCategory;
    maker?: string;
    medicineId?: string;
    medicineName?: string;
    scheduleId?: string;
  }>();
  const scheduleId = getParamValue(params.scheduleId);
  const medicineId = getParamValue(params.medicineId);
  const medicineName = getParamValue(params.medicineName);
  const maker = getParamValue(params.maker);
  const category = getParamValue(params.category);
  const medicine: Medicine =
    medicineId && medicineName && maker && category
      ? {
          id: medicineId,
          name: medicineName,
          maker,
          category,
        }
      : findMedicineById(medicineId);
  const [startDate, setStartDate] = useState("");
  const [durationDays, setDurationDays] = useState("7");
  const [frequency, setFrequency] = useState(3);
  const [dose, setDose] = useState(1);
  const [customTime, setCustomTime] = useState("");
  const [selectedTimes, setSelectedTimes] = useState(["08:00", "14:00", "20:00"]);
  const [isSaving, setIsSaving] = useState(false);
  const isStartDateValid = isValidDateText(startDate);
  const isDurationValid = isValidDurationText(durationDays);
  const canComplete =
    selectedTimes.length === frequency && isStartDateValid && isDurationValid && !isSaving;

  useEffect(() => {
    if (!scheduleId) {
      return;
    }

    getMedicationSchedule(scheduleId).then((schedule) => {
      if (!schedule) {
        return;
      }

      setStartDate(schedule.startDate);
      setDurationDays(String(schedule.durationDays));
      setFrequency(schedule.frequency);
      setDose(schedule.dose);
      setSelectedTimes(schedule.times);
    });
  }, [scheduleId]);

  const summary = useMemo(
    () => [
      `${durationDays || "0"}일간 하루 ${frequency}회, 1회 ${dose}정 복용`,
      `총 ${(Number(durationDays) || 0) * frequency * dose}정 준비 필요`,
      `복용 시간: ${selectedTimes.join(", ")}`,
    ],
    [dose, durationDays, frequency, selectedTimes],
  );

  const toggleTime = (value: string) => {
    setSelectedTimes((current) =>
      current.includes(value)
        ? current.filter((time) => time !== value)
        : current.length >= frequency
          ? current
        : [...current, value],
    );
  };

  const selectFrequency = (value: number) => {
    setFrequency(value);
    setSelectedTimes((current) => current.slice(0, value));
  };

  const addCustomTime = () => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(customTime.trim())) {
      return;
    }

    setSelectedTimes((current) =>
      current.includes(customTime.trim()) || current.length >= frequency
        ? current
        : [...current, customTime.trim()],
    );
    setCustomTime("");
  };

  const completeSchedule = async () => {
    if (!canComplete) {
      return;
    }

    setIsSaving(true);

    try {
      await saveMedicationSchedule({
        id: scheduleId,
        medicine,
        startDate: startDate.trim(),
        durationDays: Number(durationDays),
        frequency,
        dose,
        times: selectedTimes,
      });
      router.replace("/medicines");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, layout.header]}>
        <Pressable
          accessibilityLabel="뒤로가기"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft color={COLORS.text} size={30} strokeWidth={2.4} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>약 추가하기</Text>
          <Text style={styles.headerSubtitle}>복용 일정을 설정하세요</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, layout.content]} showsVerticalScrollIndicator={false}>
        <View style={styles.medicineCard}>
          <View>
            <Text style={styles.medicineName}>{medicine.name}</Text>
            <Text style={styles.maker}>{medicine.maker}</Text>
          </View>
          <View
            style={[
              styles.categoryBadge,
              medicine.category === "전문약" ? styles.prescriptionBadge : null,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                medicine.category === "전문약" ? styles.prescriptionText : null,
              ]}
            >
              {medicine.category}
            </Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <Calendar color={COLORS.coral} size={28} strokeWidth={2.4} />
            <Text style={styles.fieldLabel}>복용 시작일</Text>
          </View>
          <TextInput
            onChangeText={setStartDate}
            placeholder="2026-04-20"
            placeholderTextColor={COLORS.muted}
            style={styles.dateInput}
            value={startDate}
          />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <Clock color={COLORS.coral} size={28} strokeWidth={2.4} />
            <Text style={styles.fieldLabel}>복용 기간</Text>
          </View>
          <View style={styles.durationRow}>
            <TextInput
              keyboardType="number-pad"
              onChangeText={setDurationDays}
              placeholder="7"
              placeholderTextColor={COLORS.muted}
              style={styles.durationInput}
              value={durationDays}
            />
            <Text style={styles.durationUnit}>일</Text>
          </View>
        </View>

        <View style={styles.optionGroup}>
          <View style={styles.fieldLabelRow}>
            <Pill color={COLORS.coral} size={28} strokeWidth={2.4} />
            <Text style={styles.fieldLabel}>하루 복용 횟수</Text>
          </View>
          <View style={styles.segmentRow}>
            {frequencyOptions.map((option) => (
              <Pressable
                key={option}
                onPress={() => selectFrequency(option)}
                style={[styles.segment, frequency === option ? styles.segmentActive : null]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    frequency === option ? styles.segmentTextActive : null,
                  ]}
                >
                  {option}회
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.optionGroup}>
          <View style={styles.fieldLabelRow}>
            <Pill color={COLORS.coral} size={28} strokeWidth={2.4} />
            <Text style={styles.fieldLabel}>1회 복용량</Text>
          </View>
          <View style={styles.segmentRow}>
            {doseOptions.map((option) => (
              <Pressable
                key={option}
                onPress={() => setDose(option)}
                style={[styles.segment, dose === option ? styles.segmentActive : null]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    dose === option ? styles.segmentTextActive : null,
                  ]}
                >
                  {option}정
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.optionGroup}>
          <View style={styles.fieldLabelRow}>
            <Clock color={COLORS.coral} size={28} strokeWidth={2.4} />
            <Text style={styles.fieldLabel}>
              복용 시간 ({selectedTimes.length}/{frequency}개 선택)
            </Text>
          </View>

          <View style={styles.timeOptionRow}>
            {timeOptions.map((option) => {
              const selected = selectedTimes.includes(option.value);

              return (
                <Pressable
                  key={option.value}
                  onPress={() => toggleTime(option.value)}
                  style={[styles.timeOption, selected ? styles.timeOptionActive : null]}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      selected ? styles.timeOptionTextActive : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.customTimeRow}>
            <TextInput
              keyboardType="numbers-and-punctuation"
              onChangeText={setCustomTime}
              placeholder="14:00"
              placeholderTextColor={COLORS.muted}
              style={styles.customTimeInput}
              value={customTime}
            />
            <Pressable
              disabled={selectedTimes.length >= frequency}
              onPress={addCustomTime}
              style={[
                styles.addTimeButton,
                selectedTimes.length >= frequency ? styles.addTimeButtonDisabled : null,
              ]}
            >
              <Text style={styles.addTimeText}>추가</Text>
            </Pressable>
          </View>

          <View style={styles.selectedTimeRow}>
            {selectedTimes.map((time) => (
              <View key={time} style={styles.selectedTimeChip}>
                <Clock color={COLORS.coral} size={19} strokeWidth={2.3} />
                <Text style={styles.selectedTimeText}>{time}</Text>
                <Pressable
                  accessibilityLabel={`${time} 삭제`}
                  onPress={() =>
                    setSelectedTimes((current) =>
                      current.filter((selectedTime) => selectedTime !== time),
                    )
                  }
                  style={styles.removeTimeButton}
                >
                  <X color={COLORS.coral} size={17} strokeWidth={2.8} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>복용 요약</Text>
          {summary.map((line) => (
            <Text key={line} style={styles.summaryText}>
              • {line}
            </Text>
          ))}
          {!canComplete ? (
            <Text style={styles.validationText}>
              • 시작일, 복용 기간, 복용 시간을 확인하세요
            </Text>
          ) : null}
        </View>

        <Pressable
          disabled={!canComplete}
          onPress={completeSchedule}
          style={[styles.completeButton, !canComplete ? styles.completeButtonDisabled : null]}
        >
          <Text style={styles.completeButtonText}>
            {isSaving ? "등록 중" : "약 등록 완료"}
          </Text>
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
  header: {
    minHeight: 132,
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    backgroundColor: COLORS.beige,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "800",
  },
  headerSubtitle: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 20,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 46,
  },
  medicineCard: {
    minHeight: 144,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
    padding: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 22,
    backgroundColor: COLORS.white,
  },
  medicineName: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
  },
  maker: {
    marginTop: 18,
    color: COLORS.muted,
    fontSize: 20,
    fontWeight: "700",
  },
  categoryBadge: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.mintPale,
  },
  prescriptionBadge: {
    backgroundColor: COLORS.coralPale,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  prescriptionText: {
    color: COLORS.coral,
  },
  fieldGroup: {
    marginTop: 34,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  fieldLabel: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "800",
  },
  dateInput: {
    minHeight: 74,
    marginTop: 20,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "700",
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
    marginTop: 20,
  },
  durationInput: {
    flex: 1,
    minHeight: 74,
    paddingHorizontal: 28,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
  },
  durationUnit: {
    width: 44,
    color: COLORS.muted,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  optionGroup: {
    marginTop: 34,
  },
  segmentRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  segment: {
    flex: 1,
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: COLORS.beige,
  },
  segmentActive: {
    backgroundColor: COLORS.coral,
  },
  segmentText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: COLORS.white,
  },
  timeOptionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 20,
  },
  timeOption: {
    minHeight: 55,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 19,
    borderRadius: 22,
    backgroundColor: COLORS.beige,
  },
  timeOptionActive: {
    backgroundColor: COLORS.coral,
  },
  timeOptionText: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "800",
  },
  timeOptionTextActive: {
    color: COLORS.white,
  },
  customTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 18,
  },
  customTimeInput: {
    flex: 1,
    minHeight: 64,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "700",
  },
  addTimeButton: {
    width: 96,
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    backgroundColor: COLORS.mint,
  },
  addTimeButtonDisabled: {
    opacity: 0.45,
  },
  addTimeText: {
    color: COLORS.muted,
    fontSize: 23,
    fontWeight: "800",
  },
  selectedTimeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 18,
  },
  selectedTimeChip: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: COLORS.coralPale,
  },
  selectedTimeText: {
    color: COLORS.coral,
    fontSize: 20,
    fontWeight: "800",
  },
  removeTimeButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryBox: {
    marginTop: 36,
    padding: 26,
    borderWidth: 1.5,
    borderColor: "#d6f0ea",
    borderRadius: 20,
    backgroundColor: COLORS.mintPale,
  },
  summaryTitle: {
    marginBottom: 18,
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "800",
  },
  summaryText: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 29,
  },
  validationText: {
    marginTop: 8,
    color: COLORS.coral,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 29,
  },
  completeButton: {
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 34,
    borderRadius: 18,
    backgroundColor: COLORS.coral,
    shadowColor: "#3b302a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  completeButtonDisabled: {
    backgroundColor: "#ffb9b2",
  },
  completeButtonText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "800",
  },
});
