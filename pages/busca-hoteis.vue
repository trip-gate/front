<script setup lang="ts">
import { useHotelSearchService } from '~/services/hotel-search.service';
import type {
  DestinationSearchItem,
  HotelMappingSearchItem,
} from '~/services/hotel-search.service';

const hotelSearchService = useHotelSearchService();

const query = ref('');
const isInputFocused = ref(false);
const isLoading = ref(false);
const hasSearched = ref(false);
const hasError = ref(false);
const destinations = ref<DestinationSearchItem[]>([]);
const hotels = ref<HotelMappingSearchItem[]>([]);
const autocompleteRef = ref<HTMLElement | null>(null);

const searchLimit = 8;
const debounceMs = 800;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let latestRequestId = 0;

const normalizedQuery = computed(() => query.value.trim());
const shouldShowDropdown = computed(() => {
  if (!normalizedQuery.value) {
    return false;
  }

  if (!isInputFocused.value) {
    return false;
  }

  return isLoading.value || hasSearched.value || hasError.value;
});
const hasAnyResult = computed(
  () => destinations.value.length > 0 || hotels.value.length > 0,
);

function clearResults() {
  destinations.value = [];
  hotels.value = [];
  hasSearched.value = false;
  hasError.value = false;
}

function formatDestinationMeta(destination: DestinationSearchItem): string {
  const locationParts = [destination.region, destination.country].filter(Boolean);
  return locationParts.length > 0 ? locationParts.join(' - ') : 'Destino sem localidade';
}

function selectSuggestion(name: string) {
  query.value = name;
  isInputFocused.value = false;
}

async function runAutocomplete(rawQuery: string) {
  const requestId = ++latestRequestId;
  isLoading.value = true;
  hasError.value = false;

  try {
    const response = await hotelSearchService.autocomplete(rawQuery, searchLimit);

    if (requestId !== latestRequestId) {
      return;
    }

    destinations.value = response.destinations;
    hotels.value = response.hotels;
    hasSearched.value = true;
  } catch {
    if (requestId !== latestRequestId) {
      return;
    }

    destinations.value = [];
    hotels.value = [];
    hasSearched.value = true;
    hasError.value = true;
  } finally {
    if (requestId === latestRequestId) {
      isLoading.value = false;
    }
  }
}

watch(
  query,
  (value) => {
    const nextQuery = value.trim();

    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    if (!nextQuery) {
      latestRequestId += 1;
      isLoading.value = false;
      clearResults();
      return;
    }

    debounceTimer = setTimeout(() => {
      void runAutocomplete(nextQuery);
    }, debounceMs);
  },
  {
    flush: 'post',
  },
);

onBeforeUnmount(() => {
  if (!debounceTimer) {
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = null;
});

function handleClickOutside(event: MouseEvent) {
  if (!autocompleteRef.value) {
    return;
  }

  if (autocompleteRef.value.contains(event.target as Node)) {
    return;
  }

  isInputFocused.value = false;
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <main class="hotel-search-page">
    <div class="hotel-search-glow hotel-search-glow--a" />
    <div class="hotel-search-glow hotel-search-glow--b" />

    <header class="hotel-search-header">
      <img src="/tripgate-logo.png" alt="TripGate" class="hotel-search-header__logo" />
      <NuxtLink class="hotel-search-header__back" to="/">Voltar</NuxtLink>
    </header>

    <section class="hotel-search-hero">
      <p class="hotel-search-hero__eyebrow">TripGate Search</p>
      <h1>Busca de destinos e hoteis</h1>
      <p>
        Digite o nome de uma cidade, regiao ou hotel para visualizar sugestoes separadas
        por categoria.
      </p>
    </section>

    <section ref="autocompleteRef" class="autocomplete-shell">
      <label class="autocomplete-label" for="hotel-search-input">Pesquisar</label>
      <div class="autocomplete-input-wrap">
        <input
          id="hotel-search-input"
          v-model="query"
          type="text"
          autocomplete="off"
          placeholder="Ex.: Rio de Janeiro, Copacabana Palace..."
          spellcheck="false"
          @focus="isInputFocused = true"
        />
      </div>

      <div v-if="shouldShowDropdown" class="autocomplete-dropdown">
        <p v-if="isLoading" class="autocomplete-state">Buscando sugestoes...</p>
        <p v-else-if="hasError" class="autocomplete-state autocomplete-state--error">
          Nao foi possivel consultar as sugestoes agora.
        </p>
        <p v-else-if="hasSearched && !hasAnyResult" class="autocomplete-state">
          Nenhum resultado encontrado para "{{ normalizedQuery }}".
        </p>

        <div v-else class="autocomplete-groups">
          <section class="dropdown-group" aria-label="Destinos">
            <h2>Destinos:</h2>
            <ul v-if="destinations.length > 0">
              <li v-for="destination in destinations" :key="destination.id">
                <button type="button" @click="selectSuggestion(destination.name)">
                  <strong>{{ destination.name }}</strong>
                  <small>{{ formatDestinationMeta(destination) }}</small>
                </button>
              </li>
            </ul>
            <p v-else class="dropdown-group__empty">Nenhum destino encontrado.</p>
          </section>

          <div v-if="destinations.length > 0 && hotels.length > 0" class="dropdown-divider" />

          <section class="dropdown-group" aria-label="Hoteis">
            <h2>Hoteis:</h2>
            <ul v-if="hotels.length > 0">
              <li v-for="hotel in hotels" :key="hotel.id">
                <button type="button" @click="selectSuggestion(hotel.name)">
                  <strong>{{ hotel.name }}</strong>
                  <small>{{ hotel.destination_name || 'Sem destino vinculado' }}</small>
                </button>
              </li>
            </ul>
            <p v-else class="dropdown-group__empty">Nenhum hotel encontrado.</p>
          </section>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.hotel-search-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  padding: clamp(0.9rem, 3vw, 1.6rem);
  background:
    radial-gradient(circle at 8% 8%, rgb(116 184 181 / 20%), transparent 36%),
    radial-gradient(circle at 95% 100%, rgb(242 122 46 / 16%), transparent 35%),
    linear-gradient(145deg, #e9eef2 0%, #dce8ee 100%);
}

.hotel-search-glow {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.hotel-search-glow--a {
  width: 17rem;
  height: 17rem;
  top: -6rem;
  right: -5rem;
  background: linear-gradient(145deg, rgb(245 181 46 / 38%), rgb(242 122 46 / 42%));
}

.hotel-search-glow--b {
  width: 14rem;
  height: 14rem;
  left: -5rem;
  bottom: -5rem;
  background: linear-gradient(145deg, rgb(28 95 148 / 24%), rgb(15 34 51 / 32%));
}

.hotel-search-page > :not(.hotel-search-glow) {
  position: relative;
  z-index: 1;
}

.hotel-search-header {
  width: min(66rem, 100%);
  margin: 0 auto;
  border-radius: 1rem;
  border: 1px solid rgb(15 34 51 / 10%);
  background: rgb(255 255 255 / 80%);
  backdrop-filter: blur(8px);
  padding: 0.75rem 0.95rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hotel-search-header__logo {
  width: clamp(6.5rem, 16vw, 8rem);
}

.hotel-search-header__back {
  border: 1px solid rgb(15 34 51 / 24%);
  border-radius: 999px;
  padding: 0.5rem 0.8rem;
  color: #0f2233;
  font: 700 0.76rem/1 'REM', sans-serif;
  text-decoration: none;
  background: rgb(255 255 255 / 78%);
}

.hotel-search-hero {
  width: min(66rem, 100%);
  margin: 0.8rem auto 0;
  border-radius: 1.2rem;
  border: 1px solid rgb(15 34 51 / 12%);
  padding: clamp(1.2rem, 3.2vw, 1.9rem);
  color: #e9eae8;
  background:
    radial-gradient(circle at 88% 10%, rgb(245 181 46 / 24%), transparent 34%),
    linear-gradient(130deg, rgb(15 34 51 / 96%), rgb(28 95 148 / 93%));
  box-shadow: 0 24px 46px rgb(15 34 51 / 18%);
}

.hotel-search-hero__eyebrow {
  margin: 0;
  color: #f5b52e;
  font: 700 0.75rem/1 'Work Sans', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hotel-search-hero h1 {
  margin: 0.55rem 0 0;
  font: 800 clamp(1.45rem, 4vw, 2.3rem) / 1.06 'REM', sans-serif;
  letter-spacing: -0.02em;
}

.hotel-search-hero p {
  margin: 0.72rem 0 0;
  max-width: 58ch;
  color: rgb(233 234 232 / 90%);
  font: 500 0.92rem/1.5 'Work Sans', sans-serif;
}

.autocomplete-shell {
  width: min(66rem, 100%);
  margin: 0.8rem auto 0;
  position: relative;
  border-radius: 1rem;
  border: 1px solid rgb(15 34 51 / 10%);
  background: rgb(255 255 255 / 86%);
  backdrop-filter: blur(6px);
  padding: 0.95rem;
}

.autocomplete-label {
  display: inline-block;
  color: #1c5f94;
  font: 700 0.73rem/1 'Work Sans', sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.autocomplete-input-wrap {
  margin-top: 0.4rem;
}

.autocomplete-input-wrap input {
  width: 100%;
  border: 1px solid rgb(15 34 51 / 16%);
  border-radius: 0.82rem;
  padding: 0.8rem 0.86rem;
  color: #0f2233;
  font: 600 0.9rem/1.2 'Work Sans', sans-serif;
  background: #fff;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.autocomplete-input-wrap input:focus {
  border-color: rgb(28 95 148 / 48%);
  box-shadow: 0 0 0 3px rgb(28 95 148 / 14%);
}

.autocomplete-dropdown {
  position: absolute;
  top: calc(100% - 0.2rem);
  left: 0.95rem;
  right: 0.95rem;
  z-index: 25;
  border-radius: 0.95rem;
  border: 1px solid rgb(15 34 51 / 16%);
  background: #fff;
  box-shadow: 0 18px 36px rgb(15 34 51 / 16%);
  padding: 0.85rem;
  max-height: min(26rem, 62vh);
  overflow-y: auto;
}

.autocomplete-state {
  margin: 0;
  color: rgb(15 34 51 / 78%);
  font: 500 0.84rem/1.4 'Work Sans', sans-serif;
}

.autocomplete-state--error {
  color: #8f230c;
}

.autocomplete-groups {
  display: grid;
  gap: 0.5rem;
}

.dropdown-group h2 {
  margin: 0;
  color: #0f2233;
  font: 800 1.08rem/1.15 'REM', sans-serif;
}

.dropdown-group ul {
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.44rem;
}

.dropdown-group li button {
  width: 100%;
  border: 0;
  background: transparent;
  border-radius: 0.55rem;
  padding: 0.3rem 0.25rem;
  text-align: left;
  cursor: pointer;
  display: grid;
  gap: 0.08rem;
}

.dropdown-group li button strong {
  color: #0f2233;
  font: 600 1.04rem/1.2 'REM', sans-serif;
}

.dropdown-group li button small {
  color: rgb(15 34 51 / 82%);
  font: 400 0.95rem/1.2 'Work Sans', sans-serif;
}

.dropdown-group li button:hover {
  background: rgb(15 34 51 / 5%);
}

.dropdown-group__empty {
  margin: 0.5rem 0 0;
  color: rgb(15 34 51 / 65%);
  font: 500 0.9rem/1.35 'Work Sans', sans-serif;
}

.dropdown-divider {
  height: 1px;
  border-top: 1px dashed rgb(15 34 51 / 40%);
  margin: 0.1rem 0;
}

@media (max-width: 560px) {
  .hotel-search-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.55rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .autocomplete-input-wrap input,
  .dropdown-group li button {
    transition: none;
  }
}
</style>
