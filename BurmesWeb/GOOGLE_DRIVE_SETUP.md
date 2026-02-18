# Google Drive “Bucket” Setup (Apps Script)

## Overview

This setup makes **one Google Drive folder behave like a storage bucket** (owned by the product owner / burner account).

- No OAuth consent screen
- No “test users”
- No giving your credentials to anyone
- Your app uploads/deletes via a single Apps Script Web App endpoint

## Quick Setup (5 minutes)

### Step 1: Create the Drive folder

1. Go to Google Drive
2. Create a folder named **`Burmes&Co`**
3. Copy the folder ID from the URL:
   - `https://drive.google.com/drive/folders/FOLDER_ID`
     13n7dmf7Qs88zpXM0Uxp0NGT-Z8hgQJxN

### Step 2: Create the Apps Script Web App (the “bucket API”)

1. Go to `script.google.com` and create a new project
2. Name it `Burmes Drive Bucket`
3. Paste this code into `Code.gs` (**base64 JSON**, no multipart library needed):

```javascript
function doPost(e) {
  try {
    const expectedKey = PropertiesService.getScriptProperties().getProperty("BUCKET_KEY");
    const body = JSON.parse((e.postData && e.postData.contents) || "{}");

    const action = String(body.action || "").toLowerCase();
    const key = String(body.key || "");
    if (!expectedKey || key !== expectedKey) {
      return json_({ success: false, error: "Unauthorized" }, 401);
    }

    if (action === "delete") {
      const fileId = String(body.fileId || "");
      if (!fileId) return json_({ success: false, error: "Missing fileId" }, 400);
      DriveApp.getFileById(fileId).setTrashed(true);
      return json_({ success: true });
    }

    if (action === "upload") {
      const folderId = String(body.folderId || "");
      const fileName = String(body.fileName || ("product-" + Date.now() + ".jpg"));
      const mimeType = String(body.mimeType || "application/octet-stream");
      const base64 = String(body.base64 || "");

      if (!folderId) return json_({ success: false, error: "Missing folderId" }, 400);
      if (!base64) return json_({ success: false, error: "Missing base64" }, 400);

      const bytes = Utilities.base64Decode(base64);
      const blob = Utilities.newBlob(bytes, mimeType, fileName);

      const folder = DriveApp.getFolderById(folderId);
      const created = folder.createFile(blob);
      created.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      return json_({
        success: true,
        fileId: created.getId(),
        imageUrl: "https://drive.google.com/uc?export=view&id=" + created.getId(),
      });
    }

    return json_({ success: false, error: "Unsupported action" }, 400);
  } catch (err) {
    return json_({ success: false, error: String((err && err.message) || err) }, 500);
  }
}

function json_(obj, status) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
```

### Step 3: (Skip)

You don’t need any multipart parser library with this base64 approach.

### Step 4: Set Script Property (shared secret)

1. Apps Script → **Project Settings** → **Script Properties**
2. Add:
   - Key: `BUCKET_KEY`
   - Value: (generate a random secret, keep it private)

### Step 5: Deploy as Web App

1. **Deploy** → **New deployment** → **Web app**
2. **Execute as**: **Me**
3. **Who has access**: **Anyone** (or **Anyone with the link**)
4. Deploy and copy the Web App URL

### Step 6: Add Netlify env vars (CORS-safe proxy)

Browsers block direct requests to `script.google.com` due to CORS, so we proxy through **Netlify Functions** inside `BurmesWeb/`.

In **Netlify → Site settings → Environment variables**, add:

```env
DRIVE_SCRIPT_URL=YOUR_APPS_SCRIPT_WEB_APP_URL
DRIVE_BUCKET_KEY=YOUR_BUCKET_KEY
DRIVE_FOLDER_ID=YOUR_FOLDER_ID
```

### Step 7: Deploy BurmesWeb to Netlify

This repo now includes:
- `BurmesWeb/netlify.toml`
- `BurmesWeb/netlify/functions/drive-upload.js`
- `BurmesWeb/netlify/functions/drive-delete.js`

Netlify will deploy the app + functions together. The frontend calls:
- `/.netlify/functions/drive-upload`
- `/.netlify/functions/drive-delete`

### Step 8: Local dev note

If you want to test Netlify Functions locally, use Netlify CLI (`netlify dev`). Otherwise the functions only exist after deploying on Netlify.

```bash
npm start
```

## How it works in the app

- Upload: browser → Apps Script → Drive folder
- Delete: browser → Apps Script → Drive file trashed

## Features

✅ Automatic upload (no OAuth)  
✅ Progress indicator  
✅ Auto-public sharing  
✅ Auto-delete on listing delete  
✅ Folder organization

## Troubleshooting

### Unauthorized (401)

- Verify Apps Script **Script Property** `BUCKET_KEY` is set
- Verify `.env` `EXPO_PUBLIC_DRIVE_SCRIPT_KEY` matches it exactly
  
### Upload fails with “Missing folderId”

- Ensure `.env` has `EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID`
- Ensure you copied the folder ID from `drive/folders/<ID>`

### Upload fails

- Check browser console for detailed error
- Verify folder ID is correct in `.env`
- Make sure you're signed in to Google account with access to the folder

### Image not showing after upload

- Wait a few seconds for Google Drive to process
- Check that file was uploaded to correct folder
- Verify folder sharing settings allow public viewing

## Security Notes

- The Apps Script URL is public, so **protect it with the `BUCKET_KEY`**
- Don’t commit `.env`
- Files are made public-read so images render on the store

## Production Deployment

When deploying to production:

1. Add your production domain to OAuth credentials
2. Update `.env` with production values
3. Make sure "Burmes&Co" folder is shared publicly
4. Test upload functionality on production domain

## Need Help?

If you encounter issues:

1. Check browser console for errors
2. Verify all environment variables are set
3. Ensure Google Drive API is enabled
4. Check OAuth consent screen configuration

That's it! Your admin can now upload images directly from the interface. 🎉
