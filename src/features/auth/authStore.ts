import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const USERS_KEY = "yak-map:users";
const SESSION_KEY = "yak-map:session";

export type AuthSession = {
  email: string;
  fcmToken: string | null;
};

type StoredUser = {
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  fcmToken: string | null;
};

type LegacyStoredUser = Partial<StoredUser> & {
  email: string;
  name: string;
  password?: string;
  fcmToken: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

async function readUsers() {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (!raw) {
    return [];
  }

  const parsedUsers = JSON.parse(raw) as LegacyStoredUser[];
  let needsMigration = false;

  const users = await Promise.all(
    parsedUsers.map(async (user) => {
      if (user.passwordHash && user.passwordSalt) {
        return user as StoredUser;
      }

      needsMigration = true;
      const passwordSalt = await createPasswordSalt();
      const passwordHash = await hashPassword(user.password ?? "", passwordSalt);

      return {
        email: user.email,
        name: user.name,
        passwordHash,
        passwordSalt,
        fcmToken: user.fcmToken ?? null,
      };
    }),
  );

  if (needsMigration) {
    await writeUsers(users);
  }

  return users;
}

async function writeUsers(users: StoredUser[]) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function validateEmail(email: string) {
  return EMAIL_PATTERN.test(email.trim());
}

export function validatePassword(password: string) {
  return PASSWORD_PATTERN.test(password);
}

async function createPasswordSalt() {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string, salt: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`,
  );
}

export async function refreshFcmToken() {
  if (Platform.OS === "web") {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  const finalStatus =
    existingStatus === "granted"
      ? existingStatus
      : (await Notifications.requestPermissionsAsync()).status;

  if (finalStatus !== "granted") {
    return null;
  }

  try {
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    if (deviceToken.data) {
      return String(deviceToken.data);
    }
  } catch {
    // Fall through to Expo push token when a native FCM/APNs token is unavailable.
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  try {
    const token = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return token.data;
  } catch {
    return null;
  }
}

export async function signUpWithEmail(input: {
  email: string;
  name: string;
  password: string;
  passwordConfirm: string;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  if (!name || !validateEmail(email) || !validatePassword(input.password)) {
    throw new Error("회원가입 정보를 확인하세요.");
  }

  if (input.password !== input.passwordConfirm) {
    throw new Error("비밀번호가 일치하지 않습니다.");
  }

  const users = await readUsers();
  if (users.some((user) => user.email === email)) {
    throw new Error("이미 가입된 이메일입니다.");
  }

  const fcmToken = await refreshFcmToken();
  const passwordSalt = await createPasswordSalt();
  const passwordHash = await hashPassword(input.password, passwordSalt);

  users.push({ email, name, passwordHash, passwordSalt, fcmToken });
  await writeUsers(users);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ email, fcmToken }));
}

export async function signInWithEmail(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  const users = await readUsers();
  const matchingUser = users.find((candidate) => candidate.email === email);
  const passwordHash = matchingUser
    ? await hashPassword(password, matchingUser.passwordSalt)
    : "";
  const user = users.find(
    (candidate) => candidate.email === email && candidate.passwordHash === passwordHash,
  );

  if (!user) {
    throw new Error("이메일 또는 비밀번호를 확인하세요.");
  }

  const fcmToken = await refreshFcmToken();
  const updatedUsers = users.map((candidate) =>
    candidate.email === email ? { ...candidate, fcmToken } : candidate,
  );

  await writeUsers(updatedUsers);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ email, fcmToken }));
}

export async function getSession() {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}
