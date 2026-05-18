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

export function findMedicineById(id?: string) {
  return frequentMedicines.find((medicine) => medicine.id === id) ?? frequentMedicines[0];
}

export function matchMedicineFromText(text: string) {
  const normalizedText = text.replace(/\s/g, "").toLowerCase();

  return frequentMedicines.find((medicine) =>
    normalizedText.includes(medicine.name.replace(/\s/g, "").toLowerCase()),
  );
}

export function medicineToParams(medicine: Medicine) {
  return {
    medicineId: medicine.id,
  };
}
