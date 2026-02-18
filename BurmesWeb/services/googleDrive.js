/**
 * Google Drive “bucket” integration via Google Apps Script.
 *
 * Why Apps Script?
 * - No OAuth consent / “test users”
 * - Runs as the Drive owner (product owner / burner account)
 * - Your app calls a simple HTTPS endpoint to upload/delete files in a folder
 *
 * Uses Netlify Functions to avoid browser CORS to script.google.com.
 */

const UPLOAD_FN = "/.netlify/functions/drive-upload";
const DELETE_FN = "/.netlify/functions/drive-delete";

export const uploadImageToDrive = async (file, onProgress) => {
  if (typeof window === "undefined") throw new Error("Upload only works in browser");
  if (!file) throw new Error("No file provided");

  // Read file as base64 (no multipart parsing needed in Apps Script)
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onprogress = (e) => {
      if (!onProgress) return;
      if (!e.lengthComputable) return;
      onProgress((e.loaded / e.total) * 100);
    };
    reader.onload = () => {
      const result = reader.result; // data:<mime>;base64,XXXX
      const str = typeof result === "string" ? result : "";
      const idx = str.indexOf("base64,");
      if (idx === -1) {
        reject(new Error("Invalid file encoding"));
        return;
      }
      resolve(str.slice(idx + "base64,".length));
    };
    reader.readAsDataURL(file);
  });

  const payload = {
    base64,
    fileName: file.name || `product-${Date.now()}.jpg`,
    mimeType: file.type || "application/octet-stream",
  };

  const res = await fetch(UPLOAD_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let json = null;
  try {
    json = await res.json();
  } catch (_) {
    // ignore
  }

  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Upload failed (${res.status})`);
  }

  if (onProgress) onProgress(100);
  return {
    fileId: json.fileId,
    // Prefer Apps Script URL, otherwise build a thumbnail URL that
    // browsers will happily display as an image.
    imageUrl: json.imageUrl || `https://drive.google.com/thumbnail?id=${json.fileId}&sz=w1000`,
  };
};

export const deleteFileFromDrive = async (fileId) => {
  if (!fileId) throw new Error("Missing fileId");

  const res = await fetch(DELETE_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId }),
  });

  let json = null;
  try {
    json = await res.json();
  } catch (_) {
    // ignore
  }

  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Delete failed (${res.status})`);
  }
  return true;
};

/**
 * Extract file ID from Google Drive URL
 */
export const extractDriveFileId = (url) => {
  if (!url) return null;
  if (typeof url !== "string") return null;
  
  if (!url.includes("/") && !url.includes("?")) return url;
  
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  
  return null;
};

/**
 * Convert Google Drive file ID to direct image URL
 */
export const getDriveImageUrl = (fileIdOrUrl) => {
  const fileId = extractDriveFileId(fileIdOrUrl);
  if (!fileId) return null;
  // Use thumbnail endpoint instead of `uc?export=view` to avoid
  // some browsers blocking opaque cross-site responses.
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
};
