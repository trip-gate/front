type SignInInput = {
  email: string;
  password: string;
};

type SignInResponse = {
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

type AuthUser = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  role: string;
  roles: string[];
  exp: number;
  iat: number;
};

type JwtPayload = {
  sub: string;
  roles?: string[];
  email?: string;
  first_name?: string;
  last_name?: string | null;
  exp?: number;
  iat?: number;
};

const ACCESS_TOKEN_COOKIE = 'tg_access_token';
const REFRESH_TOKEN_COOKIE = 'tg_refresh_token';
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

let clientRefreshPromise: Promise<boolean> | null = null;

function decodeJwtPayload(token: string): JwtPayload | null {
  const tokenParts = token.split('.');

  if (tokenParts.length !== 3) {
    return null;
  }

  try {
    const payloadBase64 = tokenParts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(tokenParts[1].length / 4) * 4, '=');
    const decoded = import.meta.server
      ? Buffer.from(payloadBase64, 'base64').toString('utf-8')
      : atob(payloadBase64);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function isJwtExpired(payload: JwtPayload): boolean {
  if (!payload.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now() + 10_000;
}

function mapJwtPayloadToUser(payload: JwtPayload): AuthUser | null {
  if (!payload.sub || !payload.email || !payload.first_name || !payload.exp || !payload.iat) {
    return null;
  }

  return {
    id: payload.sub,
    first_name: payload.first_name,
    last_name: payload.last_name ?? null,
    email: payload.email,
    role: payload.roles?.[0] ?? 'UNKNOWN',
    roles: payload.roles ?? [],
    exp: payload.exp,
    iat: payload.iat,
  };
}

function getStatusCode(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  if ('statusCode' in error && typeof error.statusCode === 'number') {
    return error.statusCode;
  }

  if ('response' in error) {
    const response = error.response as { status?: number };
    if (typeof response?.status === 'number') {
      return response.status;
    }
  }

  return null;
}

export function useAuth() {
  const config = useRuntimeConfig();
  const secureCookie = process.env.NODE_ENV === 'production';
  const accessToken = useCookie<string | null>(ACCESS_TOKEN_COOKIE, {
    default: () => null,
    path: '/',
    sameSite: 'lax',
    secure: secureCookie,
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
  const refreshToken = useCookie<string | null>(REFRESH_TOKEN_COOKIE, {
    default: () => null,
    path: '/',
    sameSite: 'lax',
    secure: secureCookie,
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
  const user = useState<AuthUser | null>('auth:user', () => null);

  function clearSession() {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
  }

  function applySession(payload: SignInResponse) {
    accessToken.value = payload.access_token;
    refreshToken.value = payload.refresh_token;

    const decodedPayload = decodeJwtPayload(payload.access_token);
    const parsedUser = decodedPayload ? mapJwtPayloadToUser(decodedPayload) : null;

    if (!parsedUser) {
      clearSession();
      throw new Error('Invalid access token payload.');
    }

    user.value = parsedUser;
  }

  function hydrateFromToken() {
    const token = accessToken.value;

    if (!token) {
      user.value = null;
      return;
    }

    const decodedPayload = decodeJwtPayload(token);
    if (!decodedPayload || isJwtExpired(decodedPayload)) {
      clearSession();
      return;
    }

    const parsedUser = mapJwtPayloadToUser(decodedPayload);
    user.value = parsedUser;
  }

  async function signIn(credentials: SignInInput) {
    const payload = await $fetch<SignInResponse>('/auth/signin', {
      baseURL: config.public.apiBaseUrl,
      method: 'POST',
      body: {
        email: credentials.email.trim(),
        password: credentials.password.trim(),
      },
      retry: 0,
    });

    applySession(payload);
    return payload;
  }

  async function refreshSession(): Promise<boolean> {
    if (!refreshToken.value) {
      clearSession();
      return false;
    }

    if (import.meta.client && clientRefreshPromise) {
      return clientRefreshPromise;
    }

    const refreshOperation = (async () => {
      try {
        const payload = await $fetch<SignInResponse>('/auth/refresh-token', {
          baseURL: config.public.apiBaseUrl,
          method: 'POST',
          body: {
            refreshToken: refreshToken.value,
          },
          retry: 0,
        });

        applySession(payload);
        return true;
      } catch {
        clearSession();
        return false;
      } finally {
        if (import.meta.client) {
          clientRefreshPromise = null;
        }
      }
    })();

    if (import.meta.client) {
      clientRefreshPromise = refreshOperation;
    }

    return refreshOperation;
  }

  async function getAccessToken(): Promise<string | null> {
    const token = accessToken.value;

    if (!token) {
      return null;
    }

    const decodedPayload = decodeJwtPayload(token);

    if (!decodedPayload) {
      clearSession();
      return null;
    }

    if (!isJwtExpired(decodedPayload)) {
      if (!user.value) {
        user.value = mapJwtPayloadToUser(decodedPayload);
      }
      return token;
    }

    const hasRefreshed = await refreshSession();
    if (!hasRefreshed) {
      return null;
    }

    return accessToken.value;
  }

  async function ensureAuthenticated(): Promise<boolean> {
    const token = await getAccessToken();
    return Boolean(token);
  }

  async function signOut(options: { redirectToLogin?: boolean } = {}) {
    const shouldRedirect = options.redirectToLogin !== false;
    const currentToken = accessToken.value;

    if (currentToken) {
      try {
        await $fetch('/auth/logout', {
          baseURL: config.public.apiBaseUrl,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
          retry: 0,
        });
      } catch (error) {
        const statusCode = getStatusCode(error);
        if (statusCode !== 401) {
          console.warn('Failed to logout server-side session.');
        }
      }
    }

    clearSession();

    if (shouldRedirect) {
      await navigateTo('/entrar');
    }
  }

  const isAuthenticated = computed(() => Boolean(user.value && accessToken.value));

  return {
    user,
    isAuthenticated,
    signIn,
    signOut,
    refreshSession,
    ensureAuthenticated,
    getAccessToken,
    hydrateFromToken,
  };
}
