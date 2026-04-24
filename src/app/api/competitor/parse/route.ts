import { NextResponse } from "next/server";
import { openaiChat, extractJSON } from "@/lib/openai";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    const pageResp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!pageResp.ok) return NextResponse.json({ error: `Could not fetch URL: ${pageResp.status}` }, { status: 422 });

    const html = await pageResp.text();
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#?\w+;/g, " ")
      .replace(/\s+/g, " ").trim().substring(0, 8000);

    const priceMatch = html.match(/"price"\s*:\s*"?([\d.]+)/);
    const priceHint = priceMatch ? `\nNote: structured data suggests price may be $${priceMatch[1]}` : "";

    const raw = await openaiChat([{
      role: "user",
      content: `Extract the product name, selling price, and seller from this product listing page. Return ONLY valid JSON:
{"product_name": "full product name", "price": 0.00, "seller": "store or seller name", "source": "Amazon|Etsy|Walmart|eBay|Other"}
The price MUST be the actual selling price shown.${priceHint}\n\nPage text:\n${textContent}`,
    }], { maxTokens: 300 });

    const parsed = extractJSON(raw);
    if (!parsed) return NextResponse.json({ error: "Could not extract product info", raw_response: raw }, { status: 422 });
    parsed.url = url;
    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
