import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const USERS_KEY = "yak-map:users";
const SESSION_KEY = "yak-map:session";
const EMAIL_VERIFICATION_KEY = "yak-map:email-verifications";

export type AuthSession = {
  email: string;
  fcmToken: string | null;
};

type StoredUser = {
  email: string;
  name: string;
  passwordHash?: string;
  passwordSalt?: string;
  provider?: "email" | "google";
  emailVerified?: boolean;
  verificationEmailSentAt?: string;
  fcmToken: string | null;
};

type EmailVerification = {
  email: string;
  tokenHash: string;
  sentAt: string;
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
      if (user.provider === "google" || (user.passwordHash && user.passwordSalt)) {
        return {
          ...user,
          provider: user.provider ?? "email",
          emailVerified: user.provider === "google" ? true : user.emailVerified ?? false,
        } as StoredUser;
      }

      needsMigration = true;
      const passwordSalt = await createPasswordSalt();
      const passwordHash = await hashPassword(user.password ?? "", passwordSalt);

      return {
        email: user.email,
        name: user.name,
        passwordHash,
        passwordSalt,
        provider: "email" as const,
        emailVerified: false,
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

async function readEmailVerifications() {
  const raw = await AsyncStorage.getItem(EMAIL_VERIFICATION_KEY);
  return raw ? (JSON.parse(raw) as EmailVerification[]) : [];
}

async function writeEmailVerifications(verifications: EmailVerification[]) {
  await AsyncStorage.setItem(EMAIL_VERIFICATION_KEY, JSON.stringify(verifications));
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

async function createVerificationToken() {
  const bytes = await Crypto.getRandomBytesAsync(24);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sendVerificationEmail(email: string) {
  const token = await createVerificationToken();
  const tokenHash = await hashPassword(token, email);
  const sentAt = new Date().toISOString();
  const verifications = await readEmailVerifications();
  const nextVerifications = [
    { email, tokenHash, sentAt },
    ...verifications.filter((verification) => verification.email !== email),
  ];

  await writeEmailVerifications(nextVerifications);

  const endpoint = process.env.EXPO_PUBLIC_EMAIL_VERIFICATION_ENDPOINT;
  if (!endpoint) {
    return sentAt;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, token }),
  });

  if (!response.ok) {
    throw new Error("인증 메일 발송에 실패했습니다.");
  }

  return sentAt;
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
    throw new Error("이미 가입된 이메일입니다. 로그인해 주세요.");
  }

  const fcmToken = await refreshFcmToken();
  const passwordSalt = await createPasswordSalt();
  const passwordHash = await hashPassword(input.password, passwordSalt);
  const verificationEmailSentAt = await sendVerificationEmail(email);

  users.push({
    email,
    name,
    passwordHash,
    passwordSalt,
    provider: "email",
    emailVerified: false,
    verificationEmailSentAt,
    fcmToken,
  });
  await writeUsers(users);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ email, fcmToken }));

  return { verificationEmailSentAt };
}

export async function signInWithEmail(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  const users = await readUsers();
  const matchingUser = users.find((candidate) => candidate.email === email);
  const passwordHash = matchingUser?.passwordSalt
    ? await hashPassword(password, matchingUser.passwordSalt)
    : "";
  const user = users.find(
    (candidate) =>
      candidate.email === email &&
      candidate.provider !== "google" &&
      candidate.passwordHash === passwordHash,
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

export async function signInWithGoogleProfile(input: {
  email: string;
  name: string;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  if (!validateEmail(email) || !name) {
    throw new Error("Google 계정 정보를 확인하세요.");
  }

  const users = await readUsers();
  const fcmToken = await refreshFcmToken();
  const existingUser = users.find((user) => user.email === email);
  const nextUser: StoredUser = existingUser
    ? { ...existingUser, name, provider: "google", emailVerified: true, fcmToken }
    : { email, name, provider: "google", emailVerified: true, fcmToken };
  const nextUsers = existingUser
    ? users.map((user) => (user.email === email ? nextUser : user))
    : [...users, nextUser];

  await writeUsers(nextUsers);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ email, fcmToken }));
}

export async function getSession() {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}

export async function signOut() {
  const session = await getSession();

  if (session) {
    const users = await readUsers();
    const nextUsers = users.map((user) =>
      user.email === session.email ? { ...user, fcmToken: null } : user,
    );

    await writeUsers(nextUsers);
  }

  await AsyncStorage.removeItem(SESSION_KEY);
}
