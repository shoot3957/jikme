import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: '업로드할 이미지 파일(file)이 필요합니다.' }, { status: 400 });
  }

  const ext = ALLOWED_MIME_TO_EXT[file.type];
  if (!ext) {
    return NextResponse.json({ error: 'jpg, png, webp 형식의 이미지만 업로드할 수 있습니다.' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: '이미지 용량은 5MB를 넘을 수 없습니다.' }, { status: 400 });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'public-images';
  const path = `${userId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: '이미지 업로드에 실패했습니다.' }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
