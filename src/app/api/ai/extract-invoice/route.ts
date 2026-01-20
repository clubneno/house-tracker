import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { neonAuth } from "@/lib/auth/server";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Base64 image data is required" },
        { status: 400 }
      );
    }

    const imageContent: Anthropic.ImageBlockParam = {
      type: "image",
      source: {
        type: "base64",
        media_type: (mimeType || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: imageBase64,
      },
    };

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            imageContent,
            {
              type: "text",
              text: `Analyze this invoice/receipt image and extract the following information in JSON format:

{
  "date": "YYYY-MM-DD format or null if not found",
  "supplierName": "Name of the vendor/supplier",
  "supplierAddress": "Address if visible, or null",
  "invoiceNumber": "Invoice/receipt number if visible, or null",
  "lineItems": [
    {
      "description": "Item description",
      "brand": "Brand name if visible, or null",
      "quantity": 1,
      "unitPrice": 0.00,
      "totalPrice": 0.00
    }
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "totalAmount": 0.00,
  "currency": "EUR or detected currency code",
  "paymentMethod": "Payment method if visible, or null",
  "notes": "Any additional relevant information"
}

Important:
- Extract all visible line items
- Amounts should be numbers without currency symbols
- If a value cannot be determined, use null
- Ensure dates are in YYYY-MM-DD format
- Be thorough and accurate

Return ONLY valid JSON, no additional text.`,
            },
          ],
        },
      ],
    });

    // Extract the text content from the response
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse the JSON response
    let extractedData;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = JSON.parse(textContent.text);
      }
    } catch (parseError) {
      console.error("Failed to parse Claude response:", textContent.text);
      return NextResponse.json(
        { error: "Failed to parse invoice data", rawResponse: textContent.text },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error("AI extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract invoice data" },
      { status: 500 }
    );
  }
}
