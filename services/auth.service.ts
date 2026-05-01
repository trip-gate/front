import { useBackendService } from './backend.service';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string;
    role: string;
  };
};

export function useAuthService() {
  const backend = useBackendService();

  function login(payload: LoginPayload) {
    return backend.request<LoginResponse>('/auth/signin', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    });
  }

  function refresh(refreshToken: string) {
    return backend.request<LoginResponse>('/auth/refresh-token', {
      method: 'POST',
      body: { refreshToken },
      skipAuth: true,
    });
  }

  function me() {
    return backend.request<LoginResponse['user']>('/auth/me');
  }

  return {
    login,
    refresh,
    me,
  };
}
