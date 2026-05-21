import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import { signInWithGoogleProfile } from "./authStore";

WebBrowser.maybeCompleteAuthSession();

type GoogleProfile = {
  email?: string;
  name?: string;
};

async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Google 계정 정보를 가져오지 못했습니다.");
  }

  return (await response.json()) as GoogleProfile;
}

export function useGoogleAuth() {
  const hasGoogleConfig = Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  );
  const [, , promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
      "missing-google-client-id.apps.googleusercontent.com",
    scopes: ["openid", "email", "profile"],
  });

  const signInWithGoogle = async () => {
    if (!hasGoogleConfig) {
      throw new Error("Google 로그인 설정이 필요합니다.");
    }

    const result = await promptAsync();
    if (result.type !== "success") {
      return false;
    }

    const accessToken = result.authentication?.accessToken;
    if (!accessToken) {
      throw new Error("Google 인증 토큰을 확인하지 못했습니다.");
    }

    const profile = await fetchGoogleProfile(accessToken);
    await signInWithGoogleProfile({
      email: profile.email ?? "",
      name: profile.name ?? "Google 사용자",
    });

    return true;
  };

  return {
    signInWithGoogle,
  };
}
