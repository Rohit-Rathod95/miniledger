import { File } from 'expo-file-system';
import { apiUpload } from './client';

export async function uploadReceipt(uri: string): Promise<string> {
  const form = new FormData();
  const name = uri.split('/').pop() || 'receipt.jpg';
  // Append an expo-file-system File, NOT { uri, name, type }.
  form.append('file', new File(uri), name);

  const { url } = await apiUpload<{ url: string }>('/uploads/receipt', form);
  return url;
}
