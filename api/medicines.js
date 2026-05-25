/* eslint-env node */

const {
  getSupabaseAdmin,
  handleOptions,
  readJson,
  sendJson,
  sendMethodNotAllowed,
} = require("./_lib/supabase");

function normalizeMedicine(item) {
  const id = item.id ?? item.itemSeq ?? item.ITEM_SEQ;
  const name = item.name ?? item.itemName ?? item.ITEM_NAME;
  const maker = item.maker ?? item.entpName ?? item.ENTP_NAME;
  const categoryText = item.category ?? item.etcOtcCode ?? item.ETC_OTC_CODE ?? "일반약";

  if (!id || !name || !maker) {
    return null;
  }

  return {
    id: String(id),
    name: String(name),
    maker: String(maker),
    category: String(categoryText).includes("전문") ? "전문약" : "일반약",
  };
}

function getExternalItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.items ?? payload.body?.items ?? payload.data ?? payload.results ?? [];
}

function dedupeMedicines(medicines) {
  return Array.from(new Map(medicines.map((medicine) => [medicine.id, medicine])).values());
}

async function searchDrugApi(query) {
  const endpoint = process.env.DRUG_API_ENDPOINT;

  if (!endpoint) {
    return [];
  }

  const url = new URL(endpoint);
  url.searchParams.set("query", query);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("Drug API request failed.");
  }

  const payload = await response.json();
  return dedupeMedicines(getExternalItems(payload).flatMap((item) => {
    const medicine = normalizeMedicine(item);
    return medicine ? [medicine] : [];
  }));
}

async function getMedicines(request, response, supabase) {
  const query = String(request.query?.query ?? "").trim();

  if (!query) {
    sendJson(response, 200, { medicines: [], source: "empty" });
    return;
  }

  const [nameResult, makerResult] = await Promise.all([
    supabase
      .from("medicines")
      .select("id,name,maker,category")
      .ilike("name", `%${query}%`)
      .limit(20),
    supabase
      .from("medicines")
      .select("id,name,maker,category")
      .ilike("maker", `%${query}%`)
      .limit(20),
  ]);

  if (nameResult.error) {
    throw nameResult.error;
  }

  if (makerResult.error) {
    throw makerResult.error;
  }

  const cachedMedicines = dedupeMedicines([
    ...(nameResult.data ?? []),
    ...(makerResult.data ?? []),
  ]);

  if (cachedMedicines.length > 0) {
    sendJson(response, 200, { medicines: cachedMedicines, source: "db" });
    return;
  }

  const externalMedicines = await searchDrugApi(query);

  if (externalMedicines.length > 0) {
    const { error: upsertError } = await supabase
      .from("medicines")
      .upsert(externalMedicines, { onConflict: "id" });

    if (upsertError) {
      throw upsertError;
    }
  }

  sendJson(response, 200, { medicines: externalMedicines, source: "external" });
}

async function saveMedicines(request, response, supabase) {
  const writeSecret = process.env.MEDICINE_WRITE_SECRET;
  const rawRequestSecret = request.headers["x-yakmap-api-key"];
  const requestSecret = Array.isArray(rawRequestSecret) ? rawRequestSecret[0] : rawRequestSecret;

  if (!writeSecret || requestSecret !== writeSecret) {
    sendJson(response, 401, { error: "Medicine cache write is not allowed." });
    return;
  }

  const body = await readJson(request);
  const medicines = dedupeMedicines(
    (Array.isArray(body.medicines) ? body.medicines : [body.medicine])
      .flatMap((item) => {
        const medicine = normalizeMedicine(item ?? {});
        return medicine ? [medicine] : [];
      }),
  );

  if (medicines.length === 0) {
    sendJson(response, 400, { error: "No valid medicines." });
    return;
  }

  const { error } = await supabase.from("medicines").upsert(medicines, {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }

  sendJson(response, 200, { medicines, source: "db" });
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
      await getMedicines(request, response, supabase);
      return;
    }

    if (request.method === "POST") {
      await saveMedicines(request, response, supabase);
      return;
    }

    sendMethodNotAllowed(response);
  } catch (error) {
    sendJson(response, 500, { error: error.message ?? "Unexpected server error." });
  }
};
