import { useBackendService } from './backend.service';

export type HotelSearchItem = {
  id: string;
  name: string;
};

export type DestinationSearchItem = HotelSearchItem & {
  region: string | null;
  country: string | null;
  country_code: string | null;
};

export type HotelMappingSearchItem = HotelSearchItem & {
  destination_name: string | null;
};

export type HotelSearchAutocompleteResponse = {
  query: string;
  destinations: DestinationSearchItem[];
  hotels: HotelMappingSearchItem[];
};

export function useHotelSearchService() {
  const backend = useBackendService();

  function autocomplete(query: string, limit = 6) {
    return backend.request<HotelSearchAutocompleteResponse>(
      '/hotel-search/autocomplete',
      {
        method: 'GET',
        skipAuth: true,
        query: {
          q: query,
          limit,
        },
      },
    );
  }

  return {
    autocomplete,
  };
}
