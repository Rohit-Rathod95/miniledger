import { apiFetch } from './client';

export interface RequestOtpResponse {
  message: string;
  otp?: string;
}

export interface VerifyOtpResponse {
  token: string;
  user: {
    id: string;
    phone: string;
  };
}

export async function requestOtp(phone: string): Promise<RequestOtpResponse> {
  return apiFetch<RequestOtpResponse>('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
  return apiFetch<VerifyOtpResponse>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp }),
  });
}
