type RequestOptions = Omit<Parameters<typeof $fetch>[1], 'baseURL'> & {
  skipAuth?: boolean;
};

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

export function useBackendService() {
  const config = useRuntimeConfig();
  const auth = useAuth();

  function request<T>(path: string, options: RequestOptions = {}) {
    return executeRequest<T>(path, options, true);
  }

  async function executeRequest<T>(
    path: string,
    options: RequestOptions,
    allowRetry: boolean,
  ): Promise<T> {
    const { skipAuth = false, headers, ...fetchOptions } = options;
    const requestHeaders = new Headers(headers as HeadersInit | undefined);

    if (!skipAuth) {
      const token = await auth.getAccessToken();
      if (token) {
        requestHeaders.set('Authorization', `Bearer ${token}`);
      }
    }

    try {
      return await $fetch<T>(path, {
        baseURL: config.public.apiBaseUrl,
        ...fetchOptions,
        headers: requestHeaders,
      });
    } catch (error) {
      const statusCode = getStatusCode(error);

      if (!skipAuth && allowRetry && statusCode === 401) {
        const hasRefreshed = await auth.refreshSession();
        if (hasRefreshed) {
          return executeRequest(path, options, false);
        }
      }

      throw error;
    }
  }

  return {
    baseURL: config.public.apiBaseUrl,
    request,
  };
}
