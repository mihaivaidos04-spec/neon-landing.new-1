import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { checkAccess, type FilterType } from "@/src/lib/access";

const VALID_FILTER_TYPES: FilterType[] = ["gender", "location", "all"];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const filterType = body?.filterType as FilterType | undefined;
    if (!filterType || !VALID_FILTER_TYPES.includes(filterType)) {
      return NextResponse.json(
        { error: "Invalid filterType", allowed: false },
        { status: 400 }
      );
    }

    const result = await checkAccess(userId, filterType);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/access/check]", err);
    return NextResponse.json(
      { allowed: false, error: "Server error" },
      { status: 500 }
    );
  }
}
