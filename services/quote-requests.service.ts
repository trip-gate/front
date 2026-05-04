import { useBackendService } from './backend.service';

export type DashboardPeriod = 'today' | 'all_time';
export type QuoteRequestStatus = 'PENDING' | 'IN_SERVICE' | 'CLOSED';

export type DashboardMetricsResponse = {
  selected_period: DashboardPeriod;
  quote_requests: {
    today: number;
    total: number;
    selected_value: number;
  };
  top_landing_pages: {
    today: DashboardLandingPageSummary | null;
    all_time: DashboardLandingPageSummary | null;
    selected: DashboardLandingPageSummary | null;
  };
  timeline: {
    mode: 'hourly' | 'daily';
    points: Array<{
      label: string;
      key: string;
      count: number;
    }>;
  };
};

export type DashboardLandingPageSummary = {
  id: string;
  theme: string;
  url: string;
  type_name: string | null;
  total_requests: number;
};

export type QuoteResponsesListResponse = {
  data: QuoteResponseItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  filters: {
    start_date: string | null;
    end_date: string | null;
    landing_page_id: string | null;
    lead_name: string | null;
    sort_order: 'asc' | 'desc';
  };
  filter_options: {
    landing_pages: Array<{
      id: string;
      theme: string;
      type_name: string | null;
      url: string;
    }>;
  };
};

export type QuoteResponseItem = {
  id: string;
  status: QuoteRequestStatus;
  created_at: string;
  check_in_at: string;
  check_out_at: string;
  guests: {
    adt_qty: number;
    chd_qty: number;
    inf_qty: number;
    total: number;
  };
  rooms: {
    sgl_room_qty: number;
    dbl_room_qty: number;
    tpl_room_qty: number;
    qdp_room_qty: number;
    total: number;
  };
  lead: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  landing_page: {
    id: string;
    theme: string;
    url: string;
    type_name: string | null;
  };
  cart: {
    id: string;
    code: string;
    status: string;
  };
};

export type QuoteResponsesFilters = {
  start_date?: string;
  end_date?: string;
  landing_page_id?: string;
  lead_name?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
};

export type UpdateQuoteRequestStatusResponse = {
  id: string;
  status: QuoteRequestStatus;
};

function cleanFilters(filters: QuoteResponsesFilters): Record<string, string | number> {
  const entries = Object.entries(filters).filter(([, value]) => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    return value !== undefined && value !== null;
  });

  return Object.fromEntries(entries) as Record<string, string | number>;
}

export function useQuoteRequestsService() {
  const backend = useBackendService();

  function getDashboard(period: DashboardPeriod = 'today') {
    return backend.request<DashboardMetricsResponse>('/quote-requests/dashboard', {
      method: 'GET',
      query: { period },
    });
  }

  function listResponses(filters: QuoteResponsesFilters) {
    return backend.request<QuoteResponsesListResponse>('/quote-requests/responses', {
      method: 'GET',
      query: cleanFilters(filters),
    });
  }

  function updateStatus(id: string, status: QuoteRequestStatus) {
    return backend.request<UpdateQuoteRequestStatusResponse>(
      `/quote-requests/${id}/status`,
      {
        method: 'PATCH',
        body: { status },
      },
    );
  }

  return {
    getDashboard,
    listResponses,
    updateStatus,
  };
}
