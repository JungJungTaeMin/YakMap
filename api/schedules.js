/* eslint-env node */

const {
  getBearerToken,
  verifyAuthToken,
} = require("./_lib/auth");
const {
  getSupabaseAdmin,
  handleOptions,
  readJson,
  sendJson,
  sendMethodNotAllowed,
} = require("./_lib/supabase");

function normalizeSchedule(value) {
  if (!value || typeof value !== "object" || !value.id) {
    return null;
  }

  return value;
}

function normalizeUserEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

async function authorizeScheduleAccess(request, response, userEmail) {
  const authToken = getBearerToken(request);

  if (!authToken) {
    sendJson(response, 401, { error: "Auth token is required." });
    return false;
  }

  const session = verifyAuthToken(authToken);
  const verifiedEmail = normalizeUserEmail(session?.email);

  if (!verifiedEmail || verifiedEmail !== userEmail) {
    sendJson(response, 403, { error: "Auth token does not match userEmail." });
    return false;
  }

  return true;
}

async function listSchedules(request, response, supabase) {
  const userEmail = normalizeUserEmail(request.query?.userEmail);

  if (!userEmail) {
    sendJson(response, 400, { error: "userEmail is required." });
    return;
  }

  if (!(await authorizeScheduleAccess(request, response, userEmail))) {
    return;
  }

  const { data, error } = await supabase
    .from("medication_schedules")
    .select("payload")
    .eq("user_email", userEmail)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  sendJson(response, 200, { schedules: data.map((row) => row.payload) });
}

async function upsertSchedule(request, response, supabase) {
  const body = await readJson(request);
  const userEmail = normalizeUserEmail(body.userEmail);
  const schedule = normalizeSchedule(body.schedule);

  if (!userEmail || !schedule) {
    sendJson(response, 400, { error: "userEmail and schedule are required." });
    return;
  }

  if (!(await authorizeScheduleAccess(request, response, userEmail))) {
    return;
  }

  const { error } = await supabase.from("medication_schedules").upsert(
    {
      id: schedule.id,
      user_email: userEmail,
      payload: schedule,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_email,id" },
  );

  if (error) {
    throw error;
  }

  sendJson(response, 200, { schedule });
}

async function deleteSchedule(request, response, supabase) {
  const body = await readJson(request);
  const userEmail = normalizeUserEmail(body.userEmail ?? request.query?.userEmail);
  const id = String(body.id ?? request.query?.id ?? "").trim();

  if (!userEmail || !id) {
    sendJson(response, 400, { error: "userEmail and id are required." });
    return;
  }

  if (!(await authorizeScheduleAccess(request, response, userEmail))) {
    return;
  }

  const { error } = await supabase
    .from("medication_schedules")
    .delete()
    .eq("user_email", userEmail)
    .eq("id", id);

  if (error) {
    throw error;
  }

  sendJson(response, 200, { id });
}

module.exports = async function handler(request, response) {
  if (handleOptions(request, response)) {
    return;
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    sendJson(response, 503, { error: "Supabase environment variables are not configured." });
    return;
  }

  try {
    if (request.method === "GET") {
      await listSchedules(request, response, supabase);
      return;
    }

    if (request.method === "POST" || request.method === "PUT") {
      await upsertSchedule(request, response, supabase);
      return;
    }

    if (request.method === "DELETE") {
      await deleteSchedule(request, response, supabase);
      return;
    }

    sendMethodNotAllowed(response);
  } catch (error) {
    sendJson(response, 500, { error: error.message ?? "Unexpected server error." });
  }
};
