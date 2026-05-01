<script setup lang="ts">
import { useQuoteRequestsService } from '~/services/quote-requests.service';
import type { QuoteResponseItem } from '~/services/quote-requests.service';

definePageMeta({
  middleware: 'auth',
});

const auth = useAuth();
const notifications = useNotifications();
const quoteRequestsService = useQuoteRequestsService();

const isLoading = ref(true);
const isRefreshing = ref(false);
const items = ref<QuoteResponseItem[]>([]);
const landingPageOptions = ref<
  Array<{ id: string; theme: string; type_name: string | null; url: string }>
>([]);

const filters = reactive({
  start_date: '',
  end_date: '',
  landing_page_id: '',
  lead_name: '',
  sort_order: 'desc' as 'asc' | 'desc',
});

const pagination = reactive({
  page: 1,
  page_size: 12,
  total: 0,
  total_pages: 0,
});

const userDisplayName = computed(() => {
  const user = auth.user.value;
  if (!user) {
    return 'Operação';
  }

  return [user.first_name, user.last_name].filter(Boolean).join(' ');
});

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(value));
}

async function fetchResponses(options: { resetPage?: boolean; silent?: boolean } = {}) {
  if (options.resetPage) {
    pagination.page = 1;
  }

  if (options.silent) {
    isRefreshing.value = true;
  } else {
    isLoading.value = true;
  }

  try {
    const response = await quoteRequestsService.listResponses({
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
      landing_page_id: filters.landing_page_id || undefined,
      lead_name: filters.lead_name || undefined,
      sort_order: filters.sort_order,
      page: pagination.page,
      page_size: pagination.page_size,
    });

    items.value = response.data;
    landingPageOptions.value = response.filter_options.landing_pages;
    pagination.total = response.pagination.total;
    pagination.total_pages = response.pagination.total_pages;
    pagination.page = response.pagination.page;
  } catch {
    notifications.error(
      'Falha ao carregar',
      'Não foi possível consultar as solicitações de orçamento.',
    );
  } finally {
    isLoading.value = false;
    isRefreshing.value = false;
  }
}

async function applyFilters() {
  await fetchResponses({ resetPage: true, silent: true });
}

async function clearFilters() {
  filters.start_date = '';
  filters.end_date = '';
  filters.landing_page_id = '';
  filters.lead_name = '';
  filters.sort_order = 'desc';
  await fetchResponses({ resetPage: true, silent: true });
}

async function goToPage(nextPage: number) {
  if (nextPage < 1 || nextPage > pagination.total_pages || nextPage === pagination.page) {
    return;
  }

  pagination.page = nextPage;
  await fetchResponses({ silent: true });
}

async function handleSignOut() {
  await auth.signOut();
}

onMounted(async () => {
  await fetchResponses();
});
</script>

<template>
  <main class="requests-page">
    <div class="requests-glow requests-glow--a" />
    <div class="requests-glow requests-glow--b" />

    <header class="requests-header">
      <div>
        <p class="requests-header__eyebrow">TripGate Pipeline</p>
        <h1>Solicitações de orçamento</h1>
        <p class="requests-header__subtitle">
          {{ userDisplayName }}, acompanhe o fluxo e filtre por período, landing page e lead.
        </p>
      </div>

      <div class="requests-header__actions">
        <NuxtLink class="ghost-btn" to="/dashboard">Voltar ao dashboard</NuxtLink>
        <button class="ghost-btn" type="button" @click="handleSignOut">Sair</button>
      </div>
    </header>

    <section class="filters-shell">
      <div class="filters-grid">
        <label class="field">
          <span>Data inicial</span>
          <input v-model="filters.start_date" type="date" />
        </label>

        <label class="field">
          <span>Data final</span>
          <input v-model="filters.end_date" type="date" />
        </label>

        <label class="field">
          <span>Landing page</span>
          <select v-model="filters.landing_page_id">
            <option value="">Todas</option>
            <option v-for="option in landingPageOptions" :key="option.id" :value="option.id">
              {{ option.theme }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Nome do lead</span>
          <input v-model="filters.lead_name" type="text" placeholder="Ex.: Maria" />
        </label>

        <label class="field">
          <span>Ordenação</span>
          <select v-model="filters.sort_order">
            <option value="desc">Mais novos primeiro</option>
            <option value="asc">Mais antigos primeiro</option>
          </select>
        </label>
      </div>

      <div class="filters-actions">
        <button class="solid-btn" type="button" :disabled="isRefreshing" @click="applyFilters">
          {{ isRefreshing ? 'Atualizando...' : 'Aplicar filtros' }}
        </button>
        <button class="ghost-btn ghost-btn--alt" type="button" :disabled="isRefreshing" @click="clearFilters">
          Limpar
        </button>
      </div>
    </section>

    <section v-if="isLoading" class="state-box">
      <p>Carregando solicitações...</p>
    </section>

    <section v-else-if="items.length === 0" class="state-box">
      <p>Nenhum registro encontrado para os filtros selecionados.</p>
    </section>

    <section v-else class="cards-grid">
      <article v-for="item in items" :key="item.id" class="request-card">
        <header class="request-card__header">
          <strong>{{ item.cart.code }}</strong>
          <span>{{ formatDateTime(item.created_at) }}</span>
        </header>

        <div class="request-card__section">
          <p class="request-card__label">Lead</p>
          <strong>{{ item.lead.name }}</strong>
          <p>{{ item.lead.email }}</p>
          <p>{{ item.lead.phone || 'Sem telefone' }}</p>
        </div>

        <div class="request-card__section">
          <p class="request-card__label">Landing page</p>
          <strong>{{ item.landing_page.theme }}</strong>
          <p>{{ item.landing_page.type_name || 'Sem tipo' }}</p>
          <a :href="item.landing_page.url" target="_blank" rel="noreferrer noopener">
            Abrir URL
          </a>
        </div>

        <div class="request-card__chips">
          <span>Hóspedes: {{ item.guests.total }}</span>
          <span>Quartos: {{ item.rooms.total }}</span>
          <span>{{ formatDate(item.check_in_at) }} -> {{ formatDate(item.check_out_at) }}</span>
        </div>
      </article>
    </section>

    <footer v-if="pagination.total_pages > 1" class="pagination">
      <button type="button" class="ghost-btn ghost-btn--alt" @click="goToPage(pagination.page - 1)">
        Anterior
      </button>
      <p>Página {{ pagination.page }} de {{ pagination.total_pages }}</p>
      <button type="button" class="ghost-btn ghost-btn--alt" @click="goToPage(pagination.page + 1)">
        Próxima
      </button>
    </footer>
  </main>
</template>

<style scoped>
.requests-page {
  min-height: 100vh;
  padding: clamp(0.9rem, 3vw, 1.7rem);
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 0% 5%, rgb(116 184 181 / 18%), transparent 33%),
    radial-gradient(circle at 100% 100%, rgb(242 122 46 / 15%), transparent 35%),
    linear-gradient(145deg, #f2f6f8 0%, #e9eef2 100%);
}

.requests-glow {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.requests-glow--a {
  width: 16rem;
  height: 16rem;
  top: -5rem;
  right: -4rem;
  background: linear-gradient(145deg, rgb(245 181 46 / 40%), rgb(242 122 46 / 40%));
}

.requests-glow--b {
  width: 15rem;
  height: 15rem;
  left: -5rem;
  bottom: -4rem;
  background: linear-gradient(145deg, rgb(28 95 148 / 20%), rgb(15 34 51 / 24%));
}

.requests-header {
  position: relative;
  z-index: 1;
  width: min(74rem, 100%);
  margin: 0 auto;
  padding: clamp(1rem, 2.8vw, 1.4rem);
  border-radius: 1.1rem;
  border: 1px solid rgb(15 34 51 / 12%);
  background: rgb(255 255 255 / 80%);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.requests-header__eyebrow {
  margin: 0;
  color: #1c5f94;
  font: 700 0.74rem/1 'Work Sans', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.requests-header h1 {
  margin: 0.4rem 0 0;
  color: #0f2233;
  font: 800 clamp(1.45rem, 3.8vw, 2.1rem) / 1.08 'REM', sans-serif;
}

.requests-header__subtitle {
  margin: 0.65rem 0 0;
  color: rgb(15 34 51 / 74%);
  font: 500 0.9rem/1.45 'Work Sans', sans-serif;
}

.requests-header__actions {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.filters-shell {
  width: min(74rem, 100%);
  margin: 0.85rem auto 0;
  border-radius: 1rem;
  border: 1px solid rgb(15 34 51 / 10%);
  background: rgb(255 255 255 / 84%);
  padding: 0.95rem;
}

.filters-grid {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 0.32rem;
}

.field span {
  color: #1c5f94;
  font: 700 0.74rem/1 'Work Sans', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field input,
.field select {
  width: 100%;
  border: 1px solid rgb(15 34 51 / 17%);
  border-radius: 0.72rem;
  padding: 0.67rem 0.72rem;
  color: #0f2233;
  background: #fff;
  font: 500 0.86rem/1.2 'Work Sans', sans-serif;
}

.filters-actions {
  margin-top: 0.8rem;
  display: flex;
  gap: 0.55rem;
}

.cards-grid {
  width: min(74rem, 100%);
  margin: 0.85rem auto 0;
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.request-card {
  border-radius: 1rem;
  border: 1px solid rgb(15 34 51 / 12%);
  background: rgb(255 255 255 / 88%);
  padding: 0.95rem;
  display: grid;
  gap: 0.65rem;
}

.request-card__header {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  align-items: baseline;
}

.request-card__header strong {
  color: #0f2233;
  font: 800 0.98rem/1 'REM', sans-serif;
}

.request-card__header span {
  color: rgb(15 34 51 / 66%);
  font: 600 0.74rem/1 'Work Sans', sans-serif;
}

.request-card__section {
  display: grid;
  gap: 0.2rem;
}

.request-card__label {
  margin: 0;
  color: #1c5f94;
  font: 700 0.73rem/1 'Work Sans', sans-serif;
  text-transform: uppercase;
}

.request-card__section strong {
  color: #0f2233;
  font: 700 0.93rem/1.2 'REM', sans-serif;
}

.request-card__section p {
  margin: 0;
  color: rgb(15 34 51 / 75%);
  font: 500 0.82rem/1.35 'Work Sans', sans-serif;
}

.request-card__section a {
  width: fit-content;
  color: #1c5f94;
  font: 700 0.78rem/1.2 'Work Sans', sans-serif;
  text-decoration: none;
}

.request-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
}

.request-card__chips span {
  border-radius: 999px;
  border: 1px solid rgb(15 34 51 / 16%);
  padding: 0.38rem 0.62rem;
  color: #0f2233;
  background: linear-gradient(130deg, rgb(206 221 231 / 26%), rgb(233 234 232 / 62%));
  font: 700 0.72rem/1 'Work Sans', sans-serif;
}

.pagination {
  width: min(74rem, 100%);
  margin: 0.9rem auto 0;
  border-radius: 1rem;
  border: 1px solid rgb(15 34 51 / 10%);
  background: rgb(255 255 255 / 84%);
  padding: 0.75rem 0.85rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.7rem;
}

.pagination p {
  margin: 0;
  color: rgb(15 34 51 / 76%);
  font: 600 0.83rem/1 'Work Sans', sans-serif;
}

.state-box {
  width: min(74rem, 100%);
  margin: 0.85rem auto 0;
  border-radius: 1rem;
  border: 1px solid rgb(15 34 51 / 10%);
  background: rgb(255 255 255 / 84%);
  padding: 1rem;
}

.state-box p {
  margin: 0;
  color: rgb(15 34 51 / 78%);
  font: 500 0.9rem/1.4 'Work Sans', sans-serif;
}

.solid-btn,
.ghost-btn {
  border-radius: 0.8rem;
  padding: 0.7rem 0.9rem;
  font: 700 0.8rem/1 'REM', sans-serif;
  cursor: pointer;
  transition: transform 0.2s ease;
  text-decoration: none;
}

.solid-btn {
  border: 0;
  color: #0f2233;
  background: linear-gradient(115deg, #f5b52e 8%, #f27a2e 92%);
}

.ghost-btn {
  border: 1px solid rgb(15 34 51 / 24%);
  color: #0f2233;
  background: rgb(255 255 255 / 78%);
}

.ghost-btn--alt {
  background: #fff;
}

.solid-btn:hover,
.ghost-btn:hover {
  transform: translateY(-1px);
}

@media (max-width: 1020px) {
  .filters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 780px) {
  .requests-header {
    flex-direction: column;
  }

  .requests-header__actions {
    width: 100%;
  }

  .ghost-btn {
    flex: 1;
    text-align: center;
  }

  .filters-actions {
    flex-direction: column;
  }

  .solid-btn,
  .ghost-btn--alt {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }

  .pagination {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (prefers-reduced-motion: reduce) {
  .solid-btn,
  .ghost-btn {
    transition: none;
  }
}
</style>
