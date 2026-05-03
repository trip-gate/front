import { useBackendService } from './backend.service';

export type LandingPageTypeName = 'EVENT' | 'PACKAGE' | 'CUSTOM';

export type LandingPageItem = {
  id: string;
  theme: string;
  supplier_code: string | null;
  url: string;
  type: {
    id: string;
    name: string;
  };
  quote_requests_count: number;
};

export type LandingPagesListResponse = {
  data: LandingPageItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  filters: {
    search: string | null;
    type_id: string | null;
    type_name: LandingPageTypeName | null;
    supplier_code: string | null;
    sort_order: 'asc' | 'desc';
    sort_by: 'theme' | 'url' | 'type_name';
  };
  filter_options: {
    landing_page_types: Array<{
      id: string;
      name: string;
    }>;
  };
};

export type ListLandingPagesFilters = {
  search?: string;
  type_id?: string;
  type_name?: LandingPageTypeName;
  supplier_code?: string;
  sort_order?: 'asc' | 'desc';
  sort_by?: 'theme' | 'url' | 'type_name';
  page?: number;
  page_size?: number;
};

export type CreateLandingPageInput = {
  theme: string;
  type_id: string;
  supplier_code?: string | null;
  url: string;
};

export type UpdateLandingPageInput = {
  theme?: string;
  type_id?: string;
  supplier_code?: string | null;
  url?: string;
};

function cleanQuery(
  filters: ListLandingPagesFilters,
): Record<string, string | number | boolean> {
  const entries = Object.entries(filters).filter(([, value]) => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    return value !== undefined && value !== null;
  });

  return Object.fromEntries(entries) as Record<string, string | number | boolean>;
}

function removeUndefined<T extends Record<string, unknown>>(payload: T): T {
  const filteredEntries = Object.entries(payload).filter(([, value]) => value !== undefined);
  return Object.fromEntries(filteredEntries) as T;
}

export function useLandingPagesService() {
  const backend = useBackendService();

  function list(filters: ListLandingPagesFilters) {
    return backend.request<LandingPagesListResponse>('/landing-pages', {
      method: 'GET',
      query: cleanQuery(filters),
    });
  }

  function getById(id: string) {
    return backend.request<LandingPageItem>(`/landing-pages/${id}`, {
      method: 'GET',
    });
  }

  function create(payload: CreateLandingPageInput) {
    return backend.request<LandingPageItem>('/landing-pages', {
      method: 'POST',
      body: removeUndefined(payload),
    });
  }

  function update(id: string, payload: UpdateLandingPageInput) {
    return backend.request<LandingPageItem>(`/landing-pages/${id}`, {
      method: 'PATCH',
      body: removeUndefined(payload),
    });
  }

  function remove(id: string) {
    return backend.request<void>(`/landing-pages/${id}`, {
      method: 'DELETE',
    });
  }

  return {
    list,
    getById,
    create,
    update,
    remove,
  };
}
