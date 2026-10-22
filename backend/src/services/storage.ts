import { createClient } from '@supabase/supabase-js';
import { extname } from 'node:path';
import { config } from '../config';

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: { persistSession: false },
  }
);

export async function uploadReceipt(
  userId: string,
  file: { buffer: Buffer; mimetype: string; originalname: string }
): Promise<string> {
  const rawExt = extname(file.originalname).replace(/^\./, '').toLowerCase();
  const ext = rawExt || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(config.supabase.bucket)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from(config.supabase.bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}
