import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { Medicine } from "./medicineCatalog";

const SCHEDULES_KEY = "yak-map:medication-schedules";
const NOTIFICATION_SETTINGS_KEY = "yak-map:medication-notifications-enabled";
const MEDICATION_NOTIFICATION_CHANNEL_ID = "medication-reminders";
const LOW_STOCK_THRESHOLD_DAYS = 3;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
  }),
});

export type MedicationSchedule = {
  id: string;
  medicine: Medicine;
  startDate: string;
  endDate: string;
  durationDays: number;
  frequency: number;
  dose: number;
  times: string[];
  remainingPills: number;
  totalPills: number;
  notificationIds: string[];
  lowStockAlertedAt?: string | null;
};

type SaveScheduleInput = {
  id?: string;
  medicine: Medicine;
  startDate: string;
  durationDays: number;
  frequency: number;
  dose: number;
  times: string[];
};

function addDays(dateText: string, days: number) {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function getLocalDateText(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createDateAtTime(dateText: string, timeText: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  const { hour, minute } = parseReminderTime(timeText);

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function parseReminderTime(timeText: string) {
  const [hour, minute] = timeText.split(":").map(Number);

  return { hour, minute };
}

async function ensureMedicationNotificationPermission() {
  if (Platform.OS === "web") {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  const finalStatus =
    existingStatus === "granted"
      ? existingStatus
      : (await Notifications.requestPermissionsAsync()).status;

  if (finalStatus !== "granted") {
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(MEDICATION_NOTIFICATION_CHANNEL_ID, {
      name: "복약 알림",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }

  return true;
}

async function cancelMedicationNotifications(notificationIds: string[] = []) {
  if (Platform.OS === "web") {
    return;
  }

  await Promise.all(
    notificationIds.map((notificationId) =>
      Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => undefined),
    ),
  );
}

async function scheduleMedicationNotifications(schedule: Omit<MedicationSchedule, "notificationIds">) {
  const notificationsEnabled = await getMedicationNotificationsEnabled();

  if (!notificationsEnabled) {
    return [];
  }

  const canNotify = await ensureMedicationNotificationPermission();

  if (!canNotify) {
    return [];
  }

  const notificationRequests = Array.from({ length: schedule.durationDays }).flatMap(
    (_, dayIndex) => {
      const dateText = addDays(schedule.startDate, dayIndex);

      return schedule.times
        .map((time) => ({ time, triggerDate: createDateAtTime(dateText, time) }))
        .filter(({ triggerDate }) => triggerDate.getTime() > Date.now());
    },
  );

  const notificationIds = await Promise.all(
    notificationRequests.map(({ time, triggerDate }) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: "복약 시간입니다",
          body: `${schedule.medicine.name} ${schedule.dose}정 복용할 시간입니다.`,
          data: {
            medicineId: schedule.medicine.id,
            scheduleId: schedule.id,
            time,
          },
        },
        trigger: {
          channelId: MEDICATION_NOTIFICATION_CHANNEL_ID,
          date: triggerDate,
        },
      }),
    ),
  );

  return notificationIds;
}

export function isMedicationScheduleActiveToday(schedule: MedicationSchedule, now = new Date()) {
  const todayText = getLocalDateText(now);

  return schedule.startDate <= todayText && todayText <= schedule.endDate;
}

function getRemainingDays(schedule: MedicationSchedule) {
  const dailyPills = schedule.frequency * schedule.dose;

  if (dailyPills <= 0) {
    return 0;
  }

  return Math.ceil(schedule.remainingPills / dailyPills);
}

async function presentLowStockAlert(schedule: MedicationSchedule) {
  const notificationsEnabled = await getMedicationNotificationsEnabled();

  if (!notificationsEnabled) {
    return;
  }

  if (Platform.OS === "web") {
    return;
  }

  const canNotify = await ensureMedicationNotificationPermission();

  if (!canNotify) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "약이 곧 떨어져요",
      body: `${schedule.medicine.name} 남은 수량이 ${schedule.remainingPills}정입니다.`,
      data: {
        medicineId: schedule.medicine.id,
        scheduleId: schedule.id,
        type: "low-stock",
      },
    },
    trigger: null,
  });
}

export async function listMedicationSchedules() {
  const raw = await AsyncStorage.getItem(SCHEDULES_KEY);
  return raw ? (JSON.parse(raw) as MedicationSchedule[]) : [];
}

export async function getMedicationNotificationsEnabled() {
  const raw = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  return raw ? JSON.parse(raw) === true : true;
}

export async function setMedicationNotificationsEnabled(enabled: boolean) {
  const schedules = await listMedicationSchedules();
  await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(enabled));

  if (!enabled) {
    await Promise.all(
      schedules.map((schedule) => cancelMedicationNotifications(schedule.notificationIds)),
    );

    const nextSchedules = schedules.map((schedule) => ({
      ...schedule,
      notificationIds: [],
    }));

    await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(nextSchedules));
    return enabled;
  }

  const nextSchedules = await Promise.all(
    schedules.map(async (schedule) => {
      await cancelMedicationNotifications(schedule.notificationIds);
      const notificationIds = await scheduleMedicationNotifications(schedule);

      return {
        ...schedule,
        notificationIds,
      };
    }),
  );

  await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(nextSchedules));
  return enabled;
}

export async function getMedicationSchedule(id: string) {
  const schedules = await listMedicationSchedules();
  return schedules.find((schedule) => schedule.id === id);
}

export async function saveMedicationSchedule(input: SaveScheduleInput) {
  const schedules = await listMedicationSchedules();
  const existingSchedule = input.id
    ? schedules.find((schedule) => schedule.id === input.id)
    : undefined;
  const totalPills = input.durationDays * input.frequency * input.dose;
  const scheduleWithoutNotifications: Omit<MedicationSchedule, "notificationIds"> = {
    id: input.id ?? `${input.medicine.id}-${Date.now()}`,
    medicine: input.medicine,
    startDate: input.startDate,
    endDate: addDays(input.startDate, input.durationDays - 1),
    durationDays: input.durationDays,
    frequency: input.frequency,
    dose: input.dose,
    times: input.times,
    remainingPills: totalPills,
    totalPills,
  };
  await cancelMedicationNotifications(existingSchedule?.notificationIds);

  const notificationIds = await scheduleMedicationNotifications(scheduleWithoutNotifications);
  const schedule: MedicationSchedule = {
    ...scheduleWithoutNotifications,
    notificationIds,
    lowStockAlertedAt: existingSchedule?.lowStockAlertedAt ?? null,
  };

  const nextSchedules = input.id
    ? schedules.map((item) => (item.id === input.id ? schedule : item))
    : [schedule, ...schedules];

  await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(nextSchedules));
  return schedule;
}

export async function deleteMedicationSchedule(id: string) {
  const schedules = await listMedicationSchedules();
  const schedule = schedules.find((item) => item.id === id);
  await cancelMedicationNotifications(schedule?.notificationIds);

  const nextSchedules = schedules.filter((schedule) => schedule.id !== id);
  await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(nextSchedules));
}

export async function updateMedicationRemainingPills(id: string, amount: number) {
  const schedules = await listMedicationSchedules();
  let updatedSchedule: MedicationSchedule | undefined;

  const nextSchedules = schedules.map((schedule) => {
    if (schedule.id !== id) {
      return schedule;
    }

    const nextRemainingPills = Math.min(
      schedule.totalPills,
      Math.max(0, schedule.remainingPills + amount),
    );
    const candidateSchedule = {
      ...schedule,
      remainingPills: nextRemainingPills,
    };
    const remainingDays = getRemainingDays(candidateSchedule);

    updatedSchedule = {
      ...candidateSchedule,
      lowStockAlertedAt:
        remainingDays <= LOW_STOCK_THRESHOLD_DAYS
          ? candidateSchedule.lowStockAlertedAt ?? new Date().toISOString()
          : null,
    };

    return updatedSchedule;
  });

  await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(nextSchedules));

  if (
    updatedSchedule &&
    getRemainingDays(updatedSchedule) <= LOW_STOCK_THRESHOLD_DAYS &&
    !schedules.find((schedule) => schedule.id === id)?.lowStockAlertedAt
  ) {
    await presentLowStockAlert(updatedSchedule);
  }

  return updatedSchedule;
}

export function getLowStockMedicationSchedules(schedules: MedicationSchedule[]) {
  return schedules
    .map((schedule) => ({
      ...schedule,
      remainingDays: getRemainingDays(schedule),
    }))
    .filter((schedule) => schedule.remainingDays <= LOW_STOCK_THRESHOLD_DAYS)
    .sort((left, right) => left.remainingDays - right.remainingDays);
}
