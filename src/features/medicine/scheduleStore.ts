import AsyncStorage from "@react-native-async-storage/async-storage";

import { Medicine } from "./medicineCatalog";

const SCHEDULES_KEY = "yak-map:medication-schedules";

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

export async function listMedicationSchedules() {
  const raw = await AsyncStorage.getItem(SCHEDULES_KEY);
  return raw ? (JSON.parse(raw) as MedicationSchedule[]) : [];
}

export async function getMedicationSchedule(id: string) {
  const schedules = await listMedicationSchedules();
  return schedules.find((schedule) => schedule.id === id);
}

export async function saveMedicationSchedule(input: SaveScheduleInput) {
  const schedules = await listMedicationSchedules();
  const totalPills = input.durationDays * input.frequency * input.dose;
  const schedule: MedicationSchedule = {
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

  const nextSchedules = input.id
    ? schedules.map((item) => (item.id === input.id ? schedule : item))
    : [schedule, ...schedules];

  await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(nextSchedules));
  return schedule;
}

export async function deleteMedicationSchedule(id: string) {
  const schedules = await listMedicationSchedules();
  const nextSchedules = schedules.filter((schedule) => schedule.id !== id);
  await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(nextSchedules));
}
