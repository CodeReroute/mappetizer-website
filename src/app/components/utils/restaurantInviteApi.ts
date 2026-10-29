const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mappetizer.ca/api';

export const IOS_STORE_URL = 'https://apps.apple.com/app/id0000000000';
export const ANDROID_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.mappetizer.app';

export type InvitePreview = {
  restaurantName: string;
  profileUrl: string | null;
  expired: boolean;
  used: boolean;
};

export type AuthSession = {
  token: string;
  phoneNumber: string;
};

type ApiResult<T> = {
  status: number;
  data: T;
};

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...init.headers,
    },
  });

  let data = {} as T;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = {} as T;
    }
  }

  return { status: response.status, data };
}

export function getInvitePreview(token: string) {
  return request<InvitePreview & { message?: string }>(
    `/v1/restaurant/invites/${encodeURIComponent(token)}`,
  );
}

export function bindInvitePhone(token: string, phone: string) {
  return request<{ message?: string }>(
    `/v1/restaurant/invites/${encodeURIComponent(token)}/bind-phone`,
    {
      method: 'POST',
      body: JSON.stringify({ phone }),
    },
  );
}

export function generateLoginCode(phone: string) {
  return request<{ message?: string }>(
    '/v1/user/login/password-less/generate-code',
    {
      method: 'POST',
      body: JSON.stringify({ input: phone }),
    },
  );
}

export function verifyLoginCode(phone: string, code: string) {
  return request<AuthSession & { message?: string; phoneNumber?: string }>(
    '/v1/user/login/password-less/verify-code',
    {
      method: 'POST',
      body: JSON.stringify({ input: phone, code, fcmToken: 'web' }),
    },
  );
}

export function createAccount(fields: {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  profilePicture: File | null;
}) {
  const body = new FormData();
  body.append('firstName', fields.firstName);
  body.append('lastName', fields.lastName);
  body.append('phoneNumber', fields.phoneNumber);
  body.append('dateOfBirth', fields.dateOfBirth);
  if (fields.profilePicture) {
    body.append('profilePicture', fields.profilePicture);
  }

  return request<AuthSession & { message?: string | string[] }>(
    '/v1/user/signup',
    {
      method: 'POST',
      body,
    },
  );
}

export function redeemInvite(token: string, sessionToken: string) {
  return request<{
    restaurantId?: string;
    restaurantName?: string;
    message?: string;
  }>('/v1/restaurant/invites/redeem', {
    method: 'POST',
    headers: { token: sessionToken },
    body: JSON.stringify({ token }),
  });
}

export function messageFromBody(data: {
  message?: string | string[];
}): string | undefined {
  const raw = data.message;
  if (Array.isArray(raw)) return raw[0];
  if (typeof raw === 'string' && raw.trim()) return raw;
  return undefined;
}

export function toE164(dialCode: string, nationalNumber: string): string | null {
  const dial = dialCode.replace(/\D/g, '');
  let digits = nationalNumber.replace(/\D/g, '');
  if (!dial || !digits) return null;
  if (digits.startsWith(dial)) {
    digits = digits.slice(dial.length);
  }
  const phone = `+${dial}${digits}`;
  if (phone.length < 8 || phone.length > 16) return null;
  return phone;
}
