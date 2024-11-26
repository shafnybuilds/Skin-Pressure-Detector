// app/api/sensor-data/route.ts
import { NextResponse } from "next/server";
import { fetchAllData } from "@/lib/dynamo";

export const dynamic = "force-dynamic"; // Important for real-time updates
export const revalidate = 0; // Disable cache

export async function GET() {
  try {
    const data = await fetchAllData();

    if (!data) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
