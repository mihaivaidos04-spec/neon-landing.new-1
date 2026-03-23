import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { getSupabase } from "@/src/lib/supabase";

const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = "avatars";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId =
      (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id ?? undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const mime = file.type || "";
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mime)) {
      return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const resized = await sharp(buf)
      .rotate()
      .resize(256, 256, { fit: "cover", position: "attention" })
      .webp({ quality: 86 })
      .toBuffer();

    const path = `${userId}/${Date.now()}.webp`;
    const supabase = getSupabase();
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, resized, {
      contentType: "image/webp",
      upsert: true,
    });
    if (upErr) {
      console.error("[api/profile/avatar] storage", upErr);
      return NextResponse.json(
        { error: "Upload failed — ensure Supabase bucket `avatars` exists and is writable." },
        { status: 502 }
      );
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: publicUrl },
    });

    return NextResponse.json({ ok: true, avatarUrl: publicUrl });
  } catch (err) {
    console.error("[api/profile/avatar]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
