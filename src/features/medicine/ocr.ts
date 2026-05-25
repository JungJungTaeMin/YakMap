import * as FileSystem from "expo-file-system";

import {
  findMedicineCandidatesFromText,
  matchMedicineFromText,
} from "./medicineCatalog";

type VisionTextResponse = {
  medicineName?: string;
  text?: string;
};

async function readImageAsBase64(uri: string) {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

async function requestVisionText(base64Image: string) {
  const endpoint = process.env.EXPO_PUBLIC_OCR_ENDPOINT;

  if (!endpoint) {
    return process.env.EXPO_PUBLIC_OCR_MOCK_TEXT ?? "";
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    throw new Error("OCR request failed.");
  }

  const result = (await response.json()) as VisionTextResponse;
  return result.medicineName ?? result.text ?? "";
}

export async function identifyMedicineFromImage(uri: string) {
  const base64Image = await readImageAsBase64(uri);
  const fileNameText = decodeURIComponent(uri.split("/").pop() ?? "");
  const text = `${await requestVisionText(base64Image)} ${fileNameText}`;
  const medicine = matchMedicineFromText(text);
  const candidates = findMedicineCandidatesFromText(text);

  if (!medicine) {
    throw new Error("Medicine was not matched.");
  }

  return {
    candidates,
    medicine,
    text,
  };
}
