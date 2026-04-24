import { NextResponse } from "next/server";
import { openaiChat, extractJSON } from "@/lib/openai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PARSE_PROMPT = `Extract ALL line items from this receipt/invoice. Return ONLY valid JSON:
{"vendor":"store or website name","date":"YYYY-MM-DD","order_id":"order number if visible","items":[{"name":"full item description","qty":1,"unit_price":0.00,"total":0.00,"category":"filament|hardware|other"}],"subtotal":0.00,"tax":0.00,"shipping":0.00,"total":0.00}
Use category "filament" for 3D printer filament, "hardware" for printer parts, "other" for everything else. Extract EXACT prices shown.`;

function extractTextFromPDF(buffer: Buffer): string {
  const text = buffer.toString("latin1");
  const strings: string[] = [];
  const regex = /\(([^)]{1,200})\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const s = match[1].replace(/\\n/g, " ").replace(/\\/g, "").trim();
    if (s.length > 1 && /[a-zA-Z0-9$.]/.test(s)) strings.push(s);
  }
  return strings.join(" ").substring(0, 4000);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type;
    let messages;

    if (contentType === "application/pdf") {
      const pdfText = extractTextFromPDF(buffer);
      if (pdfText.trim().length < 10) return NextResponse.json({ error: "Could not extract text from PDF. Try a screenshot." }, { status: 422 });
      messages = [{ role: "user", content: `${PARSE_PROMPT}\n\nReceipt text:\n${pdfText}` }];
    } else if (contentType.startsWith("image/")) {
      const imageBase64 = buffer.toString("base64");
      const mimeType = contentType === "image/png" ? "image/png" : "image/jpeg";
      messages = [{ role: "user", content: [{ type: "text", text: PARSE_PROMPT }, { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } }] }];
    } else {
      return NextResponse.json({ error: "Upload PNG, JPG, or PDF." }, { status: 400 });
    }

    const raw = await openaiChat(messages);
    const parsed = extractJSON(raw);
    if (!parsed) return NextResponse.json({ error: "Could not parse receipt.", raw_response: raw }, { status: 422 });

    return NextResponse.json({ success: true, data: parsed, model: "gpt-4o-mini" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
