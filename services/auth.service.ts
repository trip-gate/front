import { useBackendService } from './backend.service';

export type LoginPayload = {
  email: string;
  password: string;
};

export function useAuthService() {
  const backend = useBackendService();

  function login(payload: LoginPayload) {
    return backend.request('/auth/login', {
      method: 'POST',
      body: payload,
    });
  }

  return {
    login,
  };
}
