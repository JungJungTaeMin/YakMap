/* eslint-env node */

const { createClient } = require("@supabase/supabase-js");

let supabaseAdmin = null;

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
}

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function sendMethodNotAllowed(response) {
  response.setHeader("Allow", "GET,POST,PUT,DELETE,OPTIONS");
  sendJson(response, 405, { error: "Method not allowed." });
}

async function readJson(request) {
  if (typeof request.body === "string") {
    return request.body ? JSON.parse(request.body) : {};
  }

  if (Buffer.isBuffer(request.body)) {
    const rawBody = request.body.toString("utf8");
    return rawBody ? JSON.parse(rawBody) : {};
  }

  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

function handleOptions(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return true;
  }

  return false;
}

module.exports = {
  getSupabaseAdmin,
  handleOptions,
  readJson,
  sendJson,
  sendMethodNotAllowed,
};
