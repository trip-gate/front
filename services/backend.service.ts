type RequestOptions = Omit<Parameters<typeof $fetch>[1], 'baseURL'>;

export function useBackendService() {
  const config = useRuntimeConfig();

  function request<T>(path: string, options: RequestOptions = {}) {
    return $fetch<T>(path, {
      baseURL: config.public.apiBaseUrl,
      ...options,
    });
  }

  return {
    baseURL: config.public.apiBaseUrl,
    request,
  };
}
