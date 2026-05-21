import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { signInWithGoogleProfile } from "./authStore";

WebBrowser.maybeCompleteAuthSession();

type GoogleProfile = {
  email?: string;
  name?: string;
};

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

function getGoogleClientId() {
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
}

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

export async function signInWithGoogle() {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("Google 로그인 설정이 필요합니다.");
  }

  const redirectUri = AuthSession.makeRedirectUri();
  const authUrl =
    `${GOOGLE_AUTH_URL}?` +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "token",
      scope: "openid email profile",
    }).toString();

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
  if (result.type !== "success") {
    return false;
  }

  const tokenParams = new URLSearchParams(new URL(result.url).hash.replace(/^#/, ""));
  const accessToken = tokenParams.get("access_token");
  if (!accessToken) {
    throw new Error("Google 인증 토큰을 확인하지 못했습니다.");
  }

  const profile = await fetchGoogleProfile(accessToken);
  await signInWithGoogleProfile({
    email: profile.email ?? "",
    name: profile.name ?? "Google 사용자",
  });

  return true;
}
