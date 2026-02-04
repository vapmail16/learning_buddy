# Extraction Service API

The extraction service is a separate **Python** HTTP service that performs OCR, table detection, and highlight detection on images (and optionally PDFs). The backend calls it after a file is uploaded and merges the result into the session notes.

## Service contract

- **Base URL:** Configured via `EXTRACTION_SERVICE_URL` in the backend (e.g. `http://localhost:5001`).
- **Protocol:** HTTP; the backend sends the file and receives structured JSON.

### POST /extract

- **Request:** `multipart/form-data` with a single field `file` (image or PDF).
- **Supported types:** Images (e.g. `image/png`, `image/jpeg`), and optionally `application/pdf`.
- **Response (200):** JSON body with the same shape as the notes `PUT` body:
  ```json
  {
    "content": "string or null",
    "table_data": [] or null,
    "highlights": [] or null
  }
  ```
  - `content`: Plain text extracted via OCR (e.g. Tesseract).
  - `table_data`: Array of table structures (e.g. `[{ "rows": [["cell", "cell"], ...] }]`).
  - `highlights`: Array of highlighted text or regions (e.g. `[{ "text": "...", "confidence": 0.9 }]`).

- **Errors:**
  - `400`: Missing or invalid file (e.g. unsupported type).
  - `500`: Extraction failed (e.g. OCR error).

## Backend integration

1. After a successful upload (file saved, DB record created), the backend **POSTs** the same file to `EXTRACTION_SERVICE_URL/extract`.
2. If `EXTRACTION_SERVICE_URL` is not set, the backend **skips** extraction and does not update notes.
3. If the extraction call succeeds, the backend **merges** the result into the session note (e.g. appends `content`, merges `table_data` and `highlights`) via the existing notes repository.
4. If the extraction call fails or times out, the backend still returns `201` for the upload; the note is left unchanged (or previous state).

## Implementation notes

- **OCR:** Tesseract (e.g. `pytesseract`) for images; for PDFs, render pages to images then OCR (e.g. `pdf2image` + poppler).
- **Tables:** Simple heuristics (e.g. line/contour detection, grid detection) to produce a JSON grid; initially may return `[]`.
- **Highlights:** Heuristic (e.g. colour/contrast difference from background) or placeholder; initially may return `[]`.
