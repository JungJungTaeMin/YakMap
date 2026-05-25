import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export type MedicineCategory = "일반약" | "전문약";

export type Medicine = {
  id: string;
  name: string;
  maker: string;
  category: MedicineCategory;
};

export const frequentMedicines: Medicine[] = [
  {
    id: "tylenol-500",
    name: "타이레놀정 500mg",
    maker: "한국존슨앤드존슨",
    category: "일반약",
  },
  {
    id: "geborin",
    name: "게보린",
    maker: "삼진제약",
    category: "일반약",
  },
  {
    id: "lipitor",
    name: "리피토정",
    maker: "한국화이자제약",
    category: "전문약",
  },
  {
    id: "crestor",
    name: "크레스토정",
    maker: "한국아스트라제네카",
    category: "전문약",
  },
];

const MEDICINE_CACHE_KEY = "medicine_cache";
const MEDICINE_API_ENDPOINT = process.env.EXPO_PUBLIC_MEDICINE_API_ENDPOINT;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

type ExternalMedicineItem = Partial<{
  id: string;
  itemSeq: string;
  ITEM_SEQ: string;
  name: string;
  itemName: string;
  ITEM_NAME: string;
  maker: string;
  entpName: string;
  ENTP_NAME: string;
  category: string;
  etcOtcCode: string;
  ETC_OTC_CODE: string;
}>;

type ExternalMedicineResponse =
  | ExternalMedicineItem[]
  | {
      items?: ExternalMedicineItem[];
      body?: {
        items?: ExternalMedicineItem[];
      };
      data?: ExternalMedicineItem[];
      results?: ExternalMedicineItem[];
    };

function dedupeMedicines(medicines: Medicine[]) {
  return Array.from(
    new Map(medicines.map((medicine) => [medicine.id, medicine])).values(),
  );
}

function getApiUrl(path: string) {
  if (!API_BASE_URL && Platform.OS !== "web") {
    return null;
  }

  return `${API_BASE_URL}${path}`;
}

export function findMedicineById(id?: string) {
  return frequentMedicines.find((medicine) => medicine.id === id) ?? frequentMedicines[0];
}

export async function listCachedMedicines() {
  const raw = await AsyncStorage.getItem(MEDICINE_CACHE_KEY);
  return raw ? (JSON.parse(raw) as Medicine[]) : [];
}

export async function saveMedicineToCache(medicine: Medicine) {
  const cachedMedicines = await listCachedMedicines();
  const nextMedicines = dedupeMedicines([medicine, ...cachedMedicines]);

  await AsyncStorage.setItem(MEDICINE_CACHE_KEY, JSON.stringify(nextMedicines));
  return nextMedicines;
}

export async function saveMedicinesToCache(medicines: Medicine[]) {
  const cachedMedicines = await listCachedMedicines();
  const nextMedicines = dedupeMedicines([...medicines, ...cachedMedicines]);

  await AsyncStorage.setItem(MEDICINE_CACHE_KEY, JSON.stringify(nextMedicines));
  return nextMedicines;
}

export function searchMedicineCache(query: string, cachedMedicines: Medicine[]) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return cachedMedicines;
  }

  return cachedMedicines.filter(
    (medicine) =>
      medicine.name.toLowerCase().includes(normalizedQuery) ||
      medicine.maker.toLowerCase().includes(normalizedQuery),
  );
}

export function mergeMedicines(...medicineGroups: Medicine[][]) {
  return dedupeMedicines(medicineGroups.flat());
}

function normalizeExternalMedicine(item: ExternalMedicineItem): Medicine | null {
  const id = item.id ?? item.itemSeq ?? item.ITEM_SEQ;
  const name = item.name ?? item.itemName ?? item.ITEM_NAME;
  const maker = item.maker ?? item.entpName ?? item.ENTP_NAME;
  const categoryText = item.category ?? item.etcOtcCode ?? item.ETC_OTC_CODE ?? "일반약";

  if (!id || !name || !maker) {
    return null;
  }

  return {
    id: String(id),
    name: String(name),
    maker: String(maker),
    category: String(categoryText).includes("전문") ? "전문약" : "일반약",
  };
}

function getExternalMedicineItems(response: ExternalMedicineResponse) {
  if (Array.isArray(response)) {
    return response;
  }

  return response.items ?? response.body?.items ?? response.data ?? response.results ?? [];
}

export async function searchExternalMedicines(query: string) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const serverApiUrl = getApiUrl(`/api/medicines?query=${encodeURIComponent(normalizedQuery)}`);

  if (serverApiUrl) {
    try {
      const serverResponse = await fetch(serverApiUrl);

      if (serverResponse.ok) {
        const payload = (await serverResponse.json()) as { medicines?: Medicine[] };
        return dedupeMedicines(payload.medicines ?? []);
      }
    } catch {
      // Fall through to the direct API endpoint when the server API is unavailable.
    }
  }

  if (!MEDICINE_API_ENDPOINT) {
    return [];
  }

  const url = new URL(MEDICINE_API_ENDPOINT);
  url.searchParams.set("query", normalizedQuery);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("의약품 API 호출에 실패했습니다.");
  }

  const result = (await response.json()) as ExternalMedicineResponse;
  return dedupeMedicines(
    getExternalMedicineItems(result).flatMap((item) => {
      const medicine = normalizeExternalMedicine(item);
      return medicine ? [medicine] : [];
    }),
  );
}

export function matchMedicineFromText(text: string) {
  const normalizedText = text.replace(/\s/g, "").toLowerCase();

  return frequentMedicines.find((medicine) =>
    normalizedText.includes(medicine.name.replace(/\s/g, "").toLowerCase()),
  );
}

export function findMedicineCandidatesFromText(text: string) {
  const normalizedText = text.replace(/\s/g, "").toLowerCase();

  return frequentMedicines.filter((medicine) =>
    normalizedText.includes(medicine.name.replace(/\s/g, "").toLowerCase()) ||
    normalizedText.includes(medicine.id.replace(/-/g, "").toLowerCase()),
  );
}

export function medicineToParams(medicine: Medicine) {
  return {
    category: medicine.category,
    maker: medicine.maker,
    medicineId: medicine.id,
    medicineName: medicine.name,
  };
}
