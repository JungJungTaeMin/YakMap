import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

import {
  findMedicineCandidatesFromText,
  matchMedicineFromText,
} from "./medicineCatalog";

type VisionTextResponse = {
  medicineName?: string;
  text?: string;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

function getApiUrl(path: string) {
  if (!API_BASE_URL && Platform.OS !== "web") {
    return null;
  }

  return `${API_BASE_URL}${path}`;
}

async function readImageAsBase64(uri: string) {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

async function requestVisionText(base64Image: string) {
  const serverEndpoint = getApiUrl("/api/ocr");

  if (serverEndpoint) {
    try {
      const response = await fetch(serverEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (response.ok) {
        const result = (await response.json()) as VisionTextResponse;
        return result.medicineName ?? result.text ?? "";
      }
    } catch {
      // Fall through to the direct OCR endpoint or mock text.
    }
  }

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
