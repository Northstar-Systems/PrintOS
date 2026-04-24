import { NextResponse } from "next/server";
import { openaiChat, extractJSON } from "@/lib/openai";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !file.type.startsWith("image/")) return NextResponse.json({ error: "Upload a PNG or JPG screenshot" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageBase64 = buffer.toString("base64");
    const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";

    const raw = await openaiChat([{
      role: "user",
      content: [
        { type: "text", text: `Extract the product name, selling price, and seller from this product listing screenshot. Return ONLY valid JSON:\n{"product_name": "full product name", "price": 0.00, "seller": "store or seller name", "source": "Amazon|Etsy|Walmart|eBay|Other"}\nThe price MUST be the actual selling price shown.` },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
      ],
    }], { maxTokens: 300 });

    const parsed = extractJSON(raw);
    if (!parsed) return NextResponse.json({ error: "Could not extract product info", raw_response: raw }, { status: 422 });
    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
