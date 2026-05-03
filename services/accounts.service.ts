import { useBackendService } from './backend.service';

export type AccountRole = 'MASTER' | 'OPERATOR';
export type DocumentType = 'CPF' | 'PASSPORT';

export type AccountItem = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  birthdate: string | null;
  document: string;
  document_type: DocumentType;
  role: AccountRole;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string | null;
};

export type AccountsListResponse = {
  data: AccountItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  filters: {
    search: string | null;
    role: AccountRole | null;
    document_type: DocumentType | null;
    email_confirmed: boolean | null;
    sort_order: 'asc' | 'desc';
    sort_by: 'created_at' | 'first_name' | 'email';
  };
  filter_options: {
    roles: AccountRole[];
    document_types: DocumentType[];
  };
};

export type ListAccountsFilters = {
  search?: string;
  role?: AccountRole;
  document_type?: DocumentType;
  email_confirmed?: boolean;
  sort_order?: 'asc' | 'desc';
  sort_by?: 'created_at' | 'first_name' | 'email';
  page?: number;
  page_size?: number;
};

export type CreateAccountInput = {
  first_name: string;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  password: string;
  birthdate?: string;
  document: string;
  document_type: DocumentType;
  role: AccountRole;
  email_confirmed?: boolean;
};

export type UpdateAccountInput = {
  first_name?: string;
  last_name?: string | null;
  email?: string;
  phone?: string | null;
  password?: string;
  birthdate?: string | null;
  document?: string;
  document_type?: DocumentType;
  role?: AccountRole;
  email_confirmed?: boolean;
};

function cleanQuery(filters: ListAccountsFilters): Record<string, string | number | boolean> {
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

export function useAccountsService() {
  const backend = useBackendService();

  function list(filters: ListAccountsFilters) {
    return backend.request<AccountsListResponse>('/accounts', {
      method: 'GET',
      query: cleanQuery(filters),
    });
  }

  function getById(id: string) {
    return backend.request<AccountItem>(`/accounts/${id}`, {
      method: 'GET',
    });
  }

  function create(payload: CreateAccountInput) {
    return backend.request<AccountItem>('/accounts', {
      method: 'POST',
      body: removeUndefined(payload),
    });
  }

  function update(id: string, payload: UpdateAccountInput) {
    return backend.request<AccountItem>(`/accounts/${id}`, {
      method: 'PATCH',
      body: removeUndefined(payload),
    });
  }

  function remove(id: string) {
    return backend.request<void>(`/accounts/${id}`, {
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
