exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
        body: "",
      };
    }

    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const scriptUrl = process.env.DRIVE_SCRIPT_URL;
    const bucketKey = process.env.DRIVE_BUCKET_KEY;

    if (!scriptUrl || !bucketKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: "Missing Netlify env vars: DRIVE_SCRIPT_URL / DRIVE_BUCKET_KEY",
        }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { fileId } = body;
    if (!fileId) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing fileId" }) };
    }

    const payload = { action: "delete", key: bucketKey, fileId };
    const r = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await r.json().catch(() => null);
    if (!r.ok || !json?.success) {
      return {
        statusCode: 502,
        body: JSON.stringify({ success: false, error: json?.error || `Drive script failed (${r.status})` }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: e?.message || "Delete failed" }) };
  }
};

