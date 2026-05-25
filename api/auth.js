/* eslint-env node */

const {
  createAuthToken,
  createPasswordHash,
  createRefreshToken,
  hashToken,
  normalizeUserEmail,
  verifyPassword,
  verifyRefreshToken,
} = require("./_lib/auth");
const {
  getSupabaseAdmin,
  handleOptions,
  readJson,
  sendJson,
  sendMethodNotAllowed,
} = require("./_lib/supabase");

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 24 * 30 * 1000;
const REFRESH_TOKEN_TTL_MS = 60 * 60 * 24 * 180 * 1000;

async function createSessionPayload(email, supabase) {
  const refreshToken = createRefreshToken(email);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();

  const { error } = await supabase.from("app_refresh_tokens").insert({
    expires_at: expiresAt,
    token_hash: hashToken(refreshToken),
    user_email: email,
  });

  if (error) {
    throw error;
  }

  return {
    authToken: createAuthToken(email),
    authTokenExpiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString(),
    refreshToken,
  };
}

async function getGoogleProfile(accessToken) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function signUpWithEmail(body, response, supabase) {
  const email = normalizeUserEmail(body.email);
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");

  if (!email || !name || !PASSWORD_PATTERN.test(password)) {
    sendJson(response, 400, { error: "Signup information is invalid." });
    return;
  }

  const passwordFields = createPasswordHash(password);
  const { error } = await supabase.from("app_users").insert({
    email,
    name,
    provider: "email",
    ...passwordFields,
  });

  if (error) {
    sendJson(response, error.code === "23505" ? 409 : 500, {
      error: error.code === "23505" ? "Email already exists." : error.message,
    });
    return;
  }

  sendJson(response, 200, await createSessionPayload(email, supabase));
}

async function signInWithEmail(body, response, supabase) {
  const email = normalizeUserEmail(body.email);
  const password = String(body.password ?? "");

  if (!email || !password) {
    sendJson(response, 400, { error: "Email and password are required." });
    return;
  }

  const { data: user, error } = await supabase
    .from("app_users")
    .select("email,password_hash,password_salt,provider")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (
    !user ||
    !user.password_hash ||
    !user.password_salt ||
    !verifyPassword(password, user.password_salt, user.password_hash)
  ) {
    sendJson(response, 401, { error: "Invalid email or password." });
    return;
  }

  sendJson(response, 200, await createSessionPayload(email, supabase));
}

async function signInWithGoogle(body, response, supabase) {
  const accessToken = String(body.accessToken ?? "").trim();

  if (!accessToken) {
    sendJson(response, 400, { error: "Google access token is required." });
    return;
  }

  const profile = await getGoogleProfile(accessToken);
  const email = normalizeUserEmail(profile?.email);
  const name = String(profile?.name ?? "Google 사용자").trim();

  if (!email || !name) {
    sendJson(response, 401, { error: "Google account is invalid." });
    return;
  }

  const { data: existingUser, error: selectError } = await supabase
    .from("app_users")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  const { error } = existingUser
    ? await supabase
        .from("app_users")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("email", email)
    : await supabase.from("app_users").insert({ email, name, provider: "google" });

  if (error) {
    throw error;
  }

  sendJson(response, 200, { ...(await createSessionPayload(email, supabase)), email, name });
}

async function refreshSession(body, response, supabase) {
  const refreshToken = String(body.refreshToken ?? "");
  const session = verifyRefreshToken(refreshToken);

  if (!session) {
    sendJson(response, 401, { error: "Refresh token is invalid." });
    return;
  }

  const { data: refreshTokenRow, error } = await supabase
    .from("app_refresh_tokens")
    .select("user_email,expires_at")
    .eq("token_hash", hashToken(refreshToken))
    .eq("user_email", session.email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!refreshTokenRow || new Date(refreshTokenRow.expires_at).getTime() <= Date.now()) {
    sendJson(response, 401, { error: "Refresh token is invalid." });
    return;
  }

  const { data: user, error: userError } = await supabase
    .from("app_users")
    .select("email")
    .eq("email", session.email)
    .maybeSingle();

  if (userError) {
    throw userError;
  }

  if (!user) {
    sendJson(response, 401, { error: "User is not registered." });
    return;
  }

  const nextSession = await createSessionPayload(session.email, supabase);
  const { error: deleteError } = await supabase
    .from("app_refresh_tokens")
    .delete()
    .eq("token_hash", hashToken(refreshToken));

  if (deleteError) {
    await supabase
      .from("app_refresh_tokens")
      .delete()
      .eq("token_hash", hashToken(nextSession.refreshToken));
    throw deleteError;
  }

  sendJson(response, 200, nextSession);
}

async function signOutSession(body, response, supabase) {
  const refreshToken = String(body.refreshToken ?? "");

  if (refreshToken) {
    const { error } = await supabase
      .from("app_refresh_tokens")
      .delete()
      .eq("token_hash", hashToken(refreshToken));

    if (error) {
      throw error;
    }
  }

  sendJson(response, 200, { signedOut: true });
}

module.exports = async function handler(request, response) {
  if (handleOptions(request, response)) {
    return;
  }

  if (request.method !== "POST") {
    sendMethodNotAllowed(response);
    return;
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    sendJson(response, 503, { error: "Supabase environment variables are not configured." });
    return;
  }

  try {
    const body = await readJson(request);

    if (body.action === "signup") {
      await signUpWithEmail(body, response, supabase);
      return;
    }

    if (body.action === "signin") {
      await signInWithEmail(body, response, supabase);
      return;
    }

    if (body.action === "google") {
      await signInWithGoogle(body, response, supabase);
      return;
    }

    if (body.action === "refresh") {
      await refreshSession(body, response, supabase);
      return;
    }

    if (body.action === "signout") {
      await signOutSession(body, response, supabase);
      return;
    }

    sendJson(response, 400, { error: "Unsupported auth action." });
  } catch (error) {
    sendJson(response, 500, { error: error.message ?? "Unexpected server error." });
  }
};
