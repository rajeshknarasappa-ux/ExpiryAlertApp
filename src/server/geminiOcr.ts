import { GoogleGenAI, Type } from '@google/genai';
import { OcrExtractionResult, ItemCategory } from '../types/index.ts';

/**
 * Initializes the server-side Gemini client using the recommended SDK patterns.
 */
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Parses base64 data URL into mimeType and raw base64 string
 */
function parseBase64Image(dataUri: string): { mimeType: string; data: string } {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return {
      mimeType: match[1],
      data: match[2],
    };
  }
  // If plain base64 without prefix, default to image/jpeg
  return {
    mimeType: 'image/jpeg',
    data: dataUri,
  };
}

/**
 * AI/OCR Extraction Service using Gemini 3.8 Flash
 * Analyzes product label photos to extract product name, brand, expiration date, and category.
 */
export async function extractProductDetailsFromImage(
  imageBase64OrDataUri: string
): Promise<OcrExtractionResult> {
  const ai = getGeminiClient();
  const { mimeType, data } = parseBase64Image(imageBase64OrDataUri);

  const promptText = `
You are an expert OCR and Household Inventory Label Extraction AI for the "ExpiryAlert" application.
Carefully inspect this image of a product label, packaging, container, prescription bottle, or cosmetic tube.

Your tasks:
1. Identify the Exact Product Name and Brand.
2. Search diligently for expiration date indicators such as:
   - "EXP", "EXPIRY", "EXP DATE", "BEST BY", "BEST BEFORE", "USE BY", "BB", "BBD"
   - Date formats like DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, MMM YYYY (e.g. "OCT 2026"), or "EXP 11/26"
   - If only Month and Year are provided (e.g., "11/2026"), default the date to the last day of that month (e.g., "2026-11-30").
   - If only a Manufacture Date ("MFG", "PKD") is printed and a shelf-life statement is found (e.g., "Best before 6 months from packaging"), calculate the expiry date accordingly.
   - If no explicit date is legible, make a reasonable estimate based on typical shelf-life for this product category starting from today, and flag confidence as 'low'.
3. Assign the most fitting Category from: "Groceries", "Medicine", "Cosmetics", "Pantry", "Household", "Other".
4. Determine the SubCategory (e.g., "Dairy", "Antibiotic", "Sunscreen", "Cereal", "Cleaning").
5. Transcribe the relevant raw OCR text you detected from the label (dates, batch numbers, warnings).
6. Provide a concise Storage Recommendation (e.g. "Keep refrigerated at 2-4°C", "Store below 25°C in dry place", "Store in a cool dark pantry").
7. Note any safety or consumption instructions (e.g., "Finish within 5 days of opening").

Today's reference date is: ${new Date().toISOString().split('T')[0]}.
Return output strictly conforming to the requested JSON schema.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
      config: {
        systemInstruction:
          'You are an expert visual label reader and food/drug safety inspector. Always return structured JSON accurately extracting dates in YYYY-MM-DD format.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: {
              type: Type.STRING,
              description: 'The identified product name',
            },
            brand: {
              type: Type.STRING,
              description: 'The brand or manufacturer name',
            },
            category: {
              type: Type.STRING,
              description:
                'One of: Groceries, Medicine, Cosmetics, Pantry, Household, Other',
            },
            subCategory: {
              type: Type.STRING,
              description: 'Specific subtype like Dairy, Analgesic, Skincare',
            },
            expiryDate: {
              type: Type.STRING,
              description: 'Expiration date in ISO format YYYY-MM-DD',
            },
            manufactureDate: {
              type: Type.STRING,
              description: 'Manufacture or packaging date in YYYY-MM-DD if present',
            },
            confidence: {
              type: Type.STRING,
              description: 'high, medium, or low based on visual clarity',
            },
            rawOcrText: {
              type: Type.STRING,
              description: 'Snippets of text read from the label',
            },
            notes: {
              type: Type.STRING,
              description: 'Usage advice or opening warning',
            },
            storageRecommendation: {
              type: Type.STRING,
              description: 'Ideal storage condition for freshness and safety',
            },
            estimatedShelfLifeDays: {
              type: Type.INTEGER,
              description: 'Shelf life estimate in days if estimated',
            },
          },
          required: [
            'productName',
            'brand',
            'category',
            'expiryDate',
            'confidence',
            'rawOcrText',
            'storageRecommendation',
          ],
        },
      },
    });

    const textOutput = response.text || '{}';
    const parsed = JSON.parse(textOutput);

    // Validate and sanitize category
    const validCategories: ItemCategory[] = [
      'Groceries',
      'Medicine',
      'Cosmetics',
      'Pantry',
      'Household',
      'Other',
    ];
    let sanitizedCategory: ItemCategory = 'Groceries';
    if (validCategories.includes(parsed.category as ItemCategory)) {
      sanitizedCategory = parsed.category as ItemCategory;
    }

    // Validate date format (YYYY-MM-DD)
    let sanitizedDate = parsed.expiryDate;
    if (!sanitizedDate || isNaN(new Date(sanitizedDate).getTime())) {
      // Default to 14 days from now if completely invalid
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 14);
      sanitizedDate = fallback.toISOString().split('T')[0];
    } else {
      // Ensure YYYY-MM-DD format
      sanitizedDate = new Date(sanitizedDate).toISOString().split('T')[0];
    }

    return {
      productName: parsed.productName || 'Scanned Item',
      brand: parsed.brand || '',
      category: sanitizedCategory,
      subCategory: parsed.subCategory || '',
      expiryDate: sanitizedDate,
      manufactureDate: parsed.manufactureDate || undefined,
      confidence: (parsed.confidence as 'high' | 'medium' | 'low') || 'high',
      rawOcrText: parsed.rawOcrText || '',
      notes: parsed.notes || '',
      storageRecommendation:
        parsed.storageRecommendation || 'Store according to package instructions.',
      estimatedShelfLifeDays: parsed.estimatedShelfLifeDays || undefined,
    };
  } catch (error: any) {
    console.error('Error extracting details with Gemini Vision:', error);
    throw new Error(`AI Label Scan failed: ${error.message || 'Unknown error'}`);
  }
}
