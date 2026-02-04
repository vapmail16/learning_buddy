const fs = require('fs');
const path = require('path');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const EXTRACTION_TIMEOUT_MS = 60000;

/**
 * Extract text from file using OpenAI Vision (images) or pdf-parse (PDFs).
 * Returns { content, table_data, highlights } or null on failure.
 * @param {string} absoluteFilePath - Absolute path to the uploaded file
 * @param {string} mimeType - e.g. image/png or application/pdf
 * @param {string} _originalFilename - Unused, kept for API compatibility
 * @returns {Promise<{ content?: string | null, table_data?: array | null, highlights?: array | null } | null>}
 */
async function extractFromFile(absoluteFilePath, mimeType, _originalFilename) {
  if (!OPENAI_API_KEY) return null;
  const isImage = (mimeType || '').startsWith('image/');
  const isPdf = (mimeType || '').toLowerCase() === 'application/pdf';
  if (!isImage && !isPdf) return null;

  const buffer = fs.readFileSync(absoluteFilePath);

  if (isPdf) {
    try {
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      const content = (result?.text || '').trim();
      if (!content) return null;
      return { content, table_data: null, highlights: null };
    } catch {
      return null;
    }
  }

  if (isImage) {
    try {
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      const OpenAI = require('openai').default;
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), EXTRACTION_TIMEOUT_MS);
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all text from this image. If the image contains one or more tables, also extract each table as structured data.
Preserve structure (paragraphs, lists) in the text where possible.

Respond with a single JSON object only, no other text. Use this exact shape:
{
  "content": "extracted plain text here (use \\n for newlines). If there are tables, you may omit their raw text from content or include a short summary.",
  "tables": [ { "rows": [ ["Header1", "Header2"], ["Cell1", "Cell2"] ] } ]
}
- "content": string, always present (can be empty string if image is only tables).
- "tables": array of table objects; each has "rows" which is an array of rows, each row an array of cell strings. If no tables, use [].`,
              },
              {
                type: 'image_url',
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }, { signal: controller.signal });
      clearTimeout(timeout);
      const raw = completion?.choices?.[0]?.message?.content?.trim();
      if (!raw) return null;
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return { content: raw, table_data: null, highlights: null };
      }
      const content = (parsed.content != null ? String(parsed.content) : '').trim();
      const table_data = Array.isArray(parsed.tables)
        ? parsed.tables
            .filter((t) => t && Array.isArray(t.rows))
            .map((t) => ({ rows: t.rows.map((row) => (Array.isArray(row) ? row.map((c) => String(c ?? '')) : [])) }))
        : null;
      const hasContent = content || (table_data && table_data.length);
      if (!hasContent) return null;
      return { content: content || null, table_data: table_data && table_data.length ? table_data : null, highlights: null };
    } catch {
      return null;
    }
  }

  return null;
}

module.exports = { extractFromFile };
