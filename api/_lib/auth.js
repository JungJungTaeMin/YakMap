/* eslint-env node */

const crypto = require("crypto");

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 180;

function normalizeUserEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlJson(value) {
  return base64UrlEncode(JSON.stringify(value));
}

function getAuthSecret() {
  return process.env.AUTH_SESSION_SECRET;
}

function sign(value) {
  const secret = getAuthSecret();

  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is not configured.");
  }

  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createSignedToken(email, tokenType, ttlSeconds) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = {
    email: normalizeUserEmail(email),
    exp: issuedAt + ttlSeconds,
    iat: issuedAt,
    jti: crypto.randomBytes(16).toString("hex"),
    type: tokenType,
  };
  const encodedPayload = base64UrlJson(payload);
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function createAuthToken(email) {
  return createSignedToken(email, "access", SESSION_TTL_SECONDS);
}

function createRefreshToken(email) {
  return createSignedToken(email, "refresh", REFRESH_TTL_SECONDS);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getBearerToken(request) {
  const rawAuthorization = request.headers.authorization;
  const authorization = Array.isArray(rawAuthorization)
    ? rawAuthorization[0]
    : rawAuthorization;
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim() ?? "";
}

function verifySignedToken(token, tokenType) {
  try {
    const [encodedPayload, signature] = token.split(".");

    if (!encodedPayload || !signature) {
      return null;
    }

    const expectedSignature = sign(encodedPayload);
    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedSignatureBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
    ) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    const email = normalizeUserEmail(payload.email);
    const now = Math.floor(Date.now() / 1000);

    if (
      !email ||
      payload.type !== tokenType ||
      typeof payload.exp !== "number" ||
      payload.exp <= now
    ) {
      return null;
    }

    return {
      email,
    };
  } catch {
    return null;
  }
}

function verifyAuthToken(token) {
  return verifySignedToken(token, "access");
}

function verifyRefreshToken(token) {
  return verifySignedToken(token, "refresh");
}

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");

  return {
    password_hash: hash,
    password_salt: salt,
  };
}

function verifyPassword(password, salt, expectedHash) {
  const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
  const hashBuffer = Buffer.from(hash);
  const expectedHashBuffer = Buffer.from(expectedHash);

  return (
    hashBuffer.length === expectedHashBuffer.length &&
    crypto.timingSafeEqual(hashBuffer, expectedHashBuffer)
  );
}

module.exports = {
  createAuthToken,
  createPasswordHash,
  createRefreshToken,
  getBearerToken,
  hashToken,
  normalizeUserEmail,
  verifyAuthToken,
  verifyPassword,
  verifyRefreshToken,
};
