import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://192.168.1.33:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llava-phi3";

const PARSE_PROMPT = `You are a receipt/invoice parser. Extract ALL line items from this document.
Return ONLY valid JSON in this exact format, no other text:
{
  "vendor": "store or website name",
  "date": "YYYY-MM-DD",
  "order_id": "order number if visible",
  "items": [
    {"name": "full item description", "qty": 1, "unit_price": 0.00, "total": 0.00, "category": "filament|hardware|other"}
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "shipping": 0.00,
  "total": 0.00
}
For category, use "filament" if the item is 3D printer filament (PLA, PETG, ABS, TPU, etc), "hardware" if it is printer parts/accessories, or "other" for everything else.
Extract the EXACT prices shown on the document. Do not calculate or estimate.`;

async function imageToBase64(buffer: Buffer, contentType: string): Promise<string> {
  // If it's a PDF, we need to tell the user to convert or use a screenshot
  // For now, handle common image types directly
  return buffer.toString("base64");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const url = formData.get("url") as string | null;

    let imageBase64: string;

    if (url) {
      // URL mode: fetch the page screenshot or parse HTML
      // For now, return an error suggesting screenshot mode
      return NextResponse.json(
        { error: "URL parsing coming soon. For now, take a screenshot and upload it." },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type;

    if (contentType === "application/pdf") {
      // PDF: convert first page to image using a simple approach
      // Since we can't easily convert PDF to image in Node.js without native deps,
      // tell the user to screenshot the PDF for now
      // TODO: Add PDF rendering support
      return NextResponse.json(
        { error: "PDF upload not yet supported from the app. Take a screenshot of the receipt and upload the image instead." },
        { status: 400 }
      );
    }

    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: `Unsupported file type: ${contentType}. Upload a PNG, JPG, or screenshot.` },
        { status: 400 }
      );
    }

    imageBase64 = buffer.toString("base64");

    // Call Ollama vision
    const ollamaResp = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: PARSE_PROMPT,
        images: [imageBase64],
        stream: false,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!ollamaResp.ok) {
      return NextResponse.json(
        { error: `Ollama error: ${ollamaResp.status}` },
        { status: 502 }
      );
    }

    const ollamaData = await ollamaResp.json();
    const rawResponse = ollamaData.response || "";

    // Extract JSON from the response (model might wrap it in markdown code blocks)
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        error: "Could not parse receipt. Try a clearer image.",
        raw_response: rawResponse,
      }, { status: 422 });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({
        error: "AI returned invalid JSON. Try a clearer image.",
        raw_response: rawResponse,
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      data: parsed,
      model: OLLAMA_MODEL,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
