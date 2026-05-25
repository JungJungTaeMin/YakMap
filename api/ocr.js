/* eslint-env node */

const {
  handleOptions,
  readJson,
  sendJson,
  sendMethodNotAllowed,
} = require("./_lib/supabase");

module.exports = async function handler(request, response) {
  if (handleOptions(request, response)) {
    return;
  }

  if (request.method !== "POST") {
    sendMethodNotAllowed(response);
    return;
  }

  const endpoint = process.env.OCR_API_ENDPOINT;

  if (!endpoint) {
    sendJson(response, 503, { error: "OCR_API_ENDPOINT is not configured." });
    return;
  }

  try {
    const body = await readJson(request);
    const upstreamResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: body.image }),
    });

    if (!upstreamResponse.ok) {
      sendJson(response, upstreamResponse.status, { error: "OCR request failed." });
      return;
    }

    const payload = await upstreamResponse.json();
    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, 500, { error: error.message ?? "Unexpected server error." });
  }
};
