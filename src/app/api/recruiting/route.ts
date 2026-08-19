import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      languages,
      area,
      car,
      time,
      financial,
      experience,
      commission,
      message,
    } = body;

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Missing required fields (name, email, phone)" },
        { status: 400 },
      );
    }

    const hubUrl = process.env.ALTITUD_HUB_URL;
    const apiKey = process.env.ALTITUD_HUB_API_SECRET;

    if (!hubUrl || !apiKey) {
      console.warn("ALTITUD_HUB_URL or ALTITUD_HUB_API_SECRET not set on the server.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const endpoint = `${hubUrl.replace(/\/$/, "")}/api/v1/recruiting/candidates`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        languages,
        area,
        car,
        time,
        financial,
        experience,
        commission,
        message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Hub recruitment endpoint responded with status ${response.status}:`,
        errorText,
      );
      return NextResponse.json(
        { error: "Failed to forward candidate to Hub" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Error in website recruiting API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
