# Mug & Marker Admin Tool (Local)

This is a **local** admin tool for editing Mug & Marker JSON content.

It supports **Worksheets**, **Recipes**, and **Comics**.

## What it does
- Load an existing JSON file (array of items)
- Edit items in a simple UI
- Export a new JSON file to download
- Export an upload manifest (list of referenced image/PDF paths)

## What it does NOT do
- It cannot upload to your server.
- It cannot modify files on your server.
- It does not provide login/authentication.

## How to use
1. Open `admin.html` in a browser (Chrome/Edge recommended).
2. Select the dataset (Worksheets / Recipes / Comics).
3. Click **Load JSON** and choose the corresponding file:
   - `worksheets.json`
   - `recipes.json`
   - `comics.json`
4. Edit items.
5. Click **Export JSON** and replace your website's `/data/<file>.json` with the exported one.
6. (Optional) Click **Export Manifest** for a folder-by-folder checklist of referenced files.

## JSON expectations
### Worksheets
- id (string, unique)
- title (string)
- image (thumbnail URL used in archive)
- images (array of image URLs)
- description (string)
- tags (array or comma-separated string)
- files (array of `{label, url}`)

### Recipes
- id, title, image
- alt (optional)
- tags (optional)
- ingredients (array of strings)
- instructions (string)

### Comics
- id, title, image
- alt (optional)
- description (optional)
