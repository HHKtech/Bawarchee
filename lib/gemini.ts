import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODEL = 'gemini-2.5-flash';

export type ExtractedReceiptItem = {
  raw_text: string;
  quantity: number;
  unit: string;
};

export type RecipeGenerationParams = {
  selectedItems: Array<{ item_name: string; quantity: number; unit: string }>;
  fullInventory?: Array<{ item_name: string; quantity: number; unit: string }> | null;
  profile: {
    dietary_restrictions?: string[] | null;
    allergies?: string | null;
    cuisine_preference?: string[] | null;
    cooking_skill?: string | null;
    household_size?: number | null;
  };
  exclusions?: string[];
};

export type GeneratedRecipe = {
  title: string;
  ingredients_used: Array<{ item_name: string; quantity: number; unit: string }>;
  steps: string[];
  est_time_minutes: number;
  est_calories: number;
  serves: number;
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

  const client = getGeminiClient();
  const result = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType,
        },
      },
      {
        text: RECEIPT_EXTRACTION_PROMPT,
      },
    ],
  });

  const responseText = stripJsonFence(result.text || '');

  try {
    return coerceReceiptItems(JSON.parse(responseText));
  } catch (error) {
    throw new Error(
      `Failed to parse Gemini receipt extraction JSON: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}

export async function generateRecipesFromInventory(
  params: RecipeGenerationParams
): Promise<GeneratedRecipe[]> {
  const { selectedItems, fullInventory, profile, exclusions } = params;

  const client = getGeminiClient();

  const prompt = `
You are Bawarchee, a personalized AI culinary assistant. Your task is to generate 2 to 3 detailed recipe suggestions customized to the user's preferences, scaled to their household size, and utilizing their available ingredients.

Input Details:
- SELECTED INGREDIENTS (ingredients the user wants to cook with right now):
${selectedItems.map((item) => `  * ${item.item_name}: ${item.quantity} ${item.unit}`).join('\n')}

- OTHER AVAILABLE INGREDIENTS IN THE PANTRY (you can use these as minor additions or staples like oil, salt, spices, or secondary ingredients, but prioritize using the selected ingredients above):
${fullInventory && fullInventory.length > 0
  ? fullInventory.map((item) => `  * ${item.item_name}: ${item.quantity} ${item.unit}`).join('\n')
  : '  * None'}

- USER DIETARY PROFILE:
  * Dietary Restrictions: ${profile.dietary_restrictions?.join(', ') || 'None'}
  * Allergies: ${profile.allergies || 'None'}
  * Cuisine Preferences: ${profile.cuisine_preference?.join(', ') || 'None'}
  * Cooking Skill Level: ${profile.cooking_skill || 'beginner'}
  * Household Size: ${profile.household_size || 1} people (Scale all recipe ingredients and portion sizes to serve exactly this number of people).

- INGREDIENT EXCLUSIONS (Do NOT use these ingredients under any circumstance):
${exclusions && exclusions.length > 0 ? exclusions.map(e => `  * ${e}`).join('\n') : '  * None'}

Output Requirements:
Return ONLY a valid JSON array of recipe suggestions matching the schema below. Do NOT write any code blocks, markdown wrapper fences (like \`\`\`json), or conversational text. The response must parse directly as JSON.

Each recipe object in the JSON array must have this structure:
{
  "title": "A descriptive, appetizing recipe name",
  "ingredients_used": [
    {
      "item_name": "name of ingredient",
      "quantity": 2,
      "unit": "pcs/g/ml/etc"
    }
  ],
  "steps": [
    "Step 1 instruction.",
    "Step 2 instruction."
  ],
  "est_time_minutes": 35,
  "est_calories": 520,
  "serves": ${profile.household_size || 1}
}

Constraints:
1. Ensure the recipes are safe (no allergens listed above).
2. Follow dietary restrictions (e.g., if vegetarian, do not suggest meat/fish).
3. Scale all quantities to the household size of ${profile.household_size || 1} people.
4. Keep the cooking steps matching a skill level of ${profile.cooking_skill || 'beginner'}.
5. Do not include ingredients that are excluded.
6. The JSON array must have strictly escaped characters. If you include line breaks or newlines in the steps or instructions, represent them strictly as escaped "\\n" and never as literal unescaped line breaks.
`.trim();

  const result = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        text: prompt,
      },
    ],
    config: {
      responseMimeType: 'application/json',
    }
  });

  const responseText = stripJsonFence(result.text || '');

  try {
    const parsed = JSON.parse(responseText);
    if (!Array.isArray(parsed)) {
      throw new Error('Gemini response is not an array.');
    }
    return parsed.map((recipe: any) => {
      return {
        title: String(recipe.title || 'Tasty Recipe'),
        ingredients_used: Array.isArray(recipe.ingredients_used)
          ? recipe.ingredients_used.map((i: any) => ({
              item_name: String(i.item_name || ''),
              quantity: Number(i.quantity ?? 1),
              unit: String(i.unit || 'pcs'),
            }))
          : [],
        steps: Array.isArray(recipe.steps) ? recipe.steps.map(String) : [],
        est_time_minutes: Number(recipe.est_time_minutes || 20),
        est_calories: Number(recipe.est_calories || 300),
        serves: Number(recipe.serves || profile.household_size || 1),
      };
    }) satisfies GeneratedRecipe[];
  } catch (error) {
    console.error('Error parsing recipe generation response:', error);
    throw new Error('Failed to generate valid recipe suggestions from AI.');
  }
}

export type ChatHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatRefinementParams = {
  history: ChatHistoryMessage[];
  latestMessage: string;
  recipes: any[];
  profile: {
    dietary_restrictions?: string[] | null;
    allergies?: string | null;
    cuisine_preference?: string[] | null;
    cooking_skill?: string | null;
    household_size?: number | null;
  };
  exclusions: string[];
  selectedItems: Array<{ item_name: string; quantity: number; unit: string }>;
  fullInventory?: Array<{ item_name: string; quantity: number; unit: string }> | null;
};

export type ChatRefinementResult = {
  message: string;
  newExclusions?: string[];
  updatedRecipes?: GeneratedRecipe[];
};

export async function processChatRefinement(
  params: ChatRefinementParams
): Promise<ChatRefinementResult> {
  const { history, latestMessage, recipes, profile, exclusions, selectedItems, fullInventory } = params;
  const client = getGeminiClient();

  const prompt = `
You are Bawarchee, a personalized AI culinary assistant. You are helping a user in a live cooking chat session.

Context Details:
- CURRENT SUGGESTED RECIPES IN THIS SESSION:
${JSON.stringify(recipes, null, 2)}

- INGREDIENTS CURRENTLY SELECTED TO COOK WITH:
${selectedItems.map((item) => `  * ${item.item_name}: ${item.quantity} ${item.unit}`).join('\n')}

- OTHER AVAILABLE INGREDIENTS IN THE PANTRY:
${fullInventory && fullInventory.length > 0
  ? fullInventory.map((item) => `  * ${item.item_name}: ${item.quantity} ${item.unit}`).join('\n')
  : '  * None'}

- ACTIVE EXCLUSIONS (do not use these):
${exclusions && exclusions.length > 0 ? exclusions.map(e => `  * ${e}`).join('\n') : '  * None'}

- USER CULINARY PROFILE:
  * Dietary Restrictions: ${profile.dietary_restrictions?.join(', ') || 'None'}
  * Allergies: ${profile.allergies || 'None'}
  * Cuisine Preferences: ${profile.cuisine_preference?.join(', ') || 'None'}
  * Cooking Skill Level: ${profile.cooking_skill || 'beginner'}
  * Household Size: ${profile.household_size || 1} people (Scale portions accordingly).

Conversation History:
${history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}
USER'S LATEST MESSAGE: "${latestMessage}"

Instructions:
1. Determine if the user's latest message indicates that they do NOT have certain ingredients, run out of something, or want to exclude some ingredients from the recipes (e.g., "I don't have butter", "I run out of garlic", "Can we do it without onions?").
2. IF AND ONLY IF they mention missing ingredients or exclusions:
   - Identify the specific items to exclude.
   - Return a JSON object with:
     * "newExclusions": A string array containing the specific lowercase item names to exclude (e.g. ["butter", "garlic"]).
     * "updatedRecipes": A newly generated array of 2 to 3 recipe suggestions that do NOT use these new exclusions (or the active exclusions), prioritizing their selected ingredients. Follow the same portion scaling and dietary restrictions.
     * "message": A friendly chat message explaining that you've updated the recipes to accommodate their request.
3. ELSE (if it's a general question, cooking substitution question, greeting, or clarifying question like "Can I use yogurt instead of cream?"):
   - Return a JSON object containing ONLY:
     * "message": A helpful, friendly, and detailed response answering their question as a culinary assistant.
     * Do NOT include "newExclusions" or "updatedRecipes" in the JSON object (set them to null or omit them).

Return ONLY valid JSON. Do NOT write any code blocks, markdown wrapper fences (like \`\`\`json), or conversational text. The response must parse directly as JSON.

Constraints:
- Inside the "message" field, never output raw literal newlines or line breaks. If you need to write paragraphs or line breaks, represent them strictly as escaped "\\n" characters inside the string value.
`.trim();

  const result = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        text: prompt,
      },
    ],
    config: {
      responseMimeType: 'application/json',
    }
  });

  const responseText = stripJsonFence(result.text || '');

  try {
    const parsed = JSON.parse(responseText);
    const refinementResult: ChatRefinementResult = {
      message: String(parsed.message || ''),
    };

    if (parsed.newExclusions && Array.isArray(parsed.newExclusions)) {
      refinementResult.newExclusions = parsed.newExclusions.map(String);
    }

    if (parsed.updatedRecipes && Array.isArray(parsed.updatedRecipes)) {
      refinementResult.updatedRecipes = parsed.updatedRecipes.map((recipe: any) => ({
        title: String(recipe.title || 'Tasty Recipe'),
        ingredients_used: Array.isArray(recipe.ingredients_used)
          ? recipe.ingredients_used.map((i: any) => ({
              item_name: String(i.item_name || ''),
              quantity: Number(i.quantity ?? 1),
              unit: String(i.unit || 'pcs'),
            }))
          : [],
        steps: Array.isArray(recipe.steps) ? recipe.steps.map(String) : [],
        est_time_minutes: Number(recipe.est_time_minutes || 20),
        est_calories: Number(recipe.est_calories || 300),
        serves: Number(recipe.serves || profile.household_size || 1),
      }));
    }

    return refinementResult;
  } catch (error) {
    console.error('Error parsing chat refinement response:', error);
    return {
      message: "I processed your request, but was unable to format it properly. Could you please rephrase?",
    };
  }
}

