import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODEL = 'gemini-2.5-flash';

export type ExtractedReceiptItem = {
  raw_text: string;
  quantity: number;
  unit: string;
};

const RECEIPT_EXTRACTION_PROMPT = `
You are parsing a grocery receipt image for a pantry inventory app.
Return ONLY valid JSON, with no markdown fences or explanatory text.
The JSON must be an array of objects with this exact shape:
[{"raw_text":"item name as printed or inferred","quantity":1,"unit":"pcs"}]

Rules:
- Include grocery, pantry, household food, and beverage line items only.
- Exclude prices, subtotal/tax/total/payment lines, store metadata, coupons, and loyalty messages.
- Use quantity from the receipt when visible; otherwise use 1.
- Use a short unit such as pcs, kg, g, lb, oz, l, ml, pack, bunch, dozen, can, bottle, or bag.
- If the unit is unclear, use pcs.
`.trim();

function getGeminiClient() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is required for receipt extraction.');
  }

  return new GoogleGenAI({ apiKey });
}

function stripJsonFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function coerceReceiptItems(value: unknown): ExtractedReceiptItem[] {
  if (!Array.isArray(value)) {
    throw new Error('Gemini receipt extraction response was not a JSON array.');
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Partial<Record<keyof ExtractedReceiptItem, unknown>>;
      const rawText = typeof candidate.raw_text === 'string' ? candidate.raw_text.trim() : '';
      const quantity = Number(candidate.quantity ?? 1);
      const unit = typeof candidate.unit === 'string' ? candidate.unit.trim() : 'pcs';

      if (!rawText) {
        return null;
      }

      return {
        raw_text: rawText,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        unit: unit || 'pcs',
      } satisfies ExtractedReceiptItem;
    })
    .filter((item): item is ExtractedReceiptItem => item !== null);
}

export async function extractItemsFromReceipt(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<ExtractedReceiptItem[]> {
  if (!mimeType.startsWith('image/')) {
    throw new Error('Receipt extraction requires an image MIME type.');
  }

  const result = await getGeminiClient().models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { text: RECEIPT_EXTRACTION_PROMPT },
          {
            inlineData: {
              data: imageBuffer.toString('base64'),
              mimeType,
            },
          },
        ],
      },
    ],
  });

  const responseText = stripJsonFence(result.text ?? '');

  try {
    return coerceReceiptItems(JSON.parse(responseText));
  } catch (error) {
    throw new Error(
      `Failed to parse Gemini receipt extraction JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
