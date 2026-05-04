<script setup lang="ts">
import { useQuoteRequestsService } from '~/services/quote-requests.service';
import type {
  QuoteResponseItem,
  QuoteRequestStatus,
} from '~/services/quote-requests.service';

definePageMeta({
  middleware: 'auth',
});

const auth = useAuth();
const notifications = useNotifications();
const quoteRequestsService = useQuoteRequestsService();
const route = useRoute();

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

const statusUpdatingById = reactive<Record<string, boolean>>({});

const statusLabelMap: Record<QuoteRequestStatus, string> = {
  PENDING: 'PENDENTE',
  IN_SERVICE: 'EM ATENDIMENTO',
  CLOSED: 'ENCERRADO',
};

const whatsappLinks = computed<Record<string, string | null>>(() =>
  Object.fromEntries(items.value.map((item) => [item.id, buildWhatsAppLink(item)])),
);

const userDisplayName = computed(() => {
  const user = auth.user.value;
  if (!user) {
    return 'Operação';
  }

  return [user.first_name, user.last_name].filter(Boolean).join(' ');
});

function getStatusLabel(status: QuoteRequestStatus): string {
  return statusLabelMap[status];
}

function getStatusClass(status: QuoteRequestStatus): string {
  if (status === 'IN_SERVICE') {
    return 'request-card__status--in-service';
  }

  if (status === 'CLOSED') {
    return 'request-card__status--closed';
  }

  return 'request-card__status--pending';
}

function isStatusUpdating(id: string): boolean {
  return statusUpdatingById[id] === true;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function isRouteActive(path: string): boolean {
  return route.path === path;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(value));
}

function formatCount(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatGuestsBreakdown(item: QuoteResponseItem): string {
  const guestTypes = [
    {
      qty: item.guests.adt_qty,
      singular: 'adulto',
      plural: 'adultos',
    },
    {
      qty: item.guests.chd_qty,
      singular: 'criança',
      plural: 'crianças',
    },
    {
      qty: item.guests.inf_qty,
      singular: 'bebê',
      plural: 'bebês',
    },
  ];

  const parts = guestTypes
    .filter((guestType) => guestType.qty > 0)
    .map((guestType) =>
      formatCount(guestType.qty, guestType.singular, guestType.plural),
    );

  if (parts.length === 0) {
    return 'Sem hóspedes informados';
  }

  return joinPartsWithAnd(parts);
}

function formatRoomsBreakdown(item: QuoteResponseItem): string {
  return formatRoomTypesForMessage(item);
}

function formatLeadPhone(phone: string | null): string {
  if (!phone) {
    return 'Sem telefone';
  }

  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return phone;
  }

  if (digits.startsWith('55')) {
    const local = digits.slice(2);
    if (local.length === 11) {
      const ddd = local.slice(0, 2);
      const first = local.slice(2, 7);
      const last = local.slice(7, 11);
      return `+55 (${ddd}) ${first}-${last}`;
    }

    if (local.length === 10) {
      const ddd = local.slice(0, 2);
      const first = local.slice(2, 6);
      const last = local.slice(6, 10);
      return `+55 (${ddd}) ${first}-${last}`;
    }
  }

  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const first = digits.slice(2, 7);
    const last = digits.slice(7, 11);
    return `(${ddd}) ${first}-${last}`;
  }

  if (digits.length === 10) {
    const ddd = digits.slice(0, 2);
    const first = digits.slice(2, 6);
    const last = digits.slice(6, 10);
    return `(${ddd}) ${first}-${last}`;
  }

  return phone;
}

function normalizeWhatsAppPhone(phone: string | null): string | null {
  if (!phone) {
    return null;
  }

  const onlyDigits = phone.replace(/\D/g, '');
  const normalized = onlyDigits.startsWith('00') ? onlyDigits.slice(2) : onlyDigits;

  if (normalized.length < 10) {
    return null;
  }

  if (normalized.startsWith('55')) {
    return normalized;
  }

  if (normalized.length === 10 || normalized.length === 11) {
    return `55${normalized}`;
  }

  return normalized;
}

function joinPartsWithAnd(parts: string[]): string {
  if (parts.length === 0) {
    return '';
  }

  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return `${parts[0]} e ${parts[1]}`;
  }

  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}

function formatRoomTypesForMessage(item: QuoteResponseItem): string {
  const roomTypes = [
    {
      qty: item.rooms.sgl_room_qty,
      singular: 'quarto individual',
      plural: 'quartos individuais',
    },
    {
      qty: item.rooms.dbl_room_qty,
      singular: 'quarto duplo',
      plural: 'quartos duplos',
    },
    {
      qty: item.rooms.tpl_room_qty,
      singular: 'quarto triplo',
      plural: 'quartos triplos',
    },
    {
      qty: item.rooms.qdp_room_qty,
      singular: 'quarto quádruplo',
      plural: 'quartos quádruplos',
    },
  ];

  const parts = roomTypes
    .filter((roomType) => roomType.qty > 0)
    .map((roomType) =>
      formatCount(roomType.qty, roomType.singular, roomType.plural),
    );

  if (parts.length === 0) {
    return formatCount(item.rooms.total, 'quarto', 'quartos');
  }

  return joinPartsWithAnd(parts);
}

function buildWhatsAppMessage(item: QuoteResponseItem): string {
  const leadFirstName = item.lead.name.trim().split(/\s+/)[0] || item.lead.name;
  const roomTypes = formatRoomTypesForMessage(item);
  const requestedPeriod = `${formatDate(item.check_in_at)} a ${formatDate(item.check_out_at)}`;

  return [
    `Olá, ${leadFirstName}! 😊`,
    'Aqui é da equipe TripGate.',
    `Recebemos sua solicitação de orçamento para ${roomTypes}`,
    `no período de ${requestedPeriod}.`,
    'Posso te enviar agora as melhores opções de viagem com valores e condições para o seu perfil? ✈️',
  ].join(' ');
}

function buildWhatsAppLink(item: QuoteResponseItem): string | null {
  const phone = normalizeWhatsAppPhone(item.lead.phone);
  if (!phone) {
    return null;
  }

  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(buildWhatsAppMessage(item))}`;
}

async function updateQuoteRequestStatus(
  item: QuoteResponseItem,
  status: QuoteRequestStatus,
  errorMessage: string,
) {
  if (isStatusUpdating(item.id) || item.status === status) {
    return;
  }

  const previousStatus = item.status;
  statusUpdatingById[item.id] = true;
  item.status = status;

  try {
    const updated = await quoteRequestsService.updateStatus(item.id, status);
    item.status = updated.status;
  } catch {
    item.status = previousStatus;
    notifications.error('Falha ao atualizar status', errorMessage);
  } finally {
    statusUpdatingById[item.id] = false;
  }
}

function handleWhatsAppClick(item: QuoteResponseItem) {
  void updateQuoteRequestStatus(
    item,
    'IN_SERVICE',
    'Nao foi possivel marcar a solicitacao como em atendimento.',
  );
}

async function closeQuoteRequest(item: QuoteResponseItem) {
  await updateQuoteRequestStatus(
    item,
    'CLOSED',
    'Nao foi possivel encerrar a solicitacao.',
  );
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
        <NuxtLink :class="['ghost-btn', { 'ghost-btn--active': isRouteActive('/dashboard') }]" to="/dashboard">Dashboard</NuxtLink>
        <NuxtLink :class="['ghost-btn', { 'ghost-btn--active': isRouteActive('/solicitacoes-orcamento') }]" to="/solicitacoes-orcamento">Solicitações</NuxtLink>
        <NuxtLink :class="['ghost-btn', { 'ghost-btn--active': isRouteActive('/usuarios') }]" to="/usuarios">Usuários</NuxtLink>
        <NuxtLink :class="['ghost-btn', { 'ghost-btn--active': isRouteActive('/landing-pages') }]" to="/landing-pages">Landing pages</NuxtLink>
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
          <div class="request-card__identity">
            <strong>{{ item.cart.code }}</strong>
            <p :class="['request-card__status', getStatusClass(item.status)]">
              {{ getStatusLabel(item.status) }}
            </p>
          </div>
          <span>{{ formatDateTime(item.created_at) }}</span>
        </header>

        <div class="request-card__section">
          <p class="request-card__label">Lead</p>
          <strong>{{ item.lead.name }}</strong>
          <p>{{ item.lead.email }}</p>
          <p>{{ formatLeadPhone(item.lead.phone) }}</p>
        </div>

        <div class="request-card__section">
          <p class="request-card__label">Landing page</p>
          <a
            class="request-card__landing-link"
            :href="item.landing_page.url"
            target="_blank"
            rel="noreferrer noopener"
          >
            {{ item.landing_page.theme }}
          </a>
        </div>

        <div class="request-card__chips">
          <span>Hóspedes: {{ item.guests.total }}</span>
          <span>Quartos: {{ item.rooms.total }}</span>
          <span>{{ formatDate(item.check_in_at) }} -> {{ formatDate(item.check_out_at) }}</span>
        </div>

        <div class="request-card__section request-card__section--details">
          <p class="request-card__label">Solicitações</p>
          <p>{{ formatGuestsBreakdown(item) }}</p>
          <p>{{ formatRoomsBreakdown(item) }}</p>
        </div>

        <div class="request-card__actions">
          <a
            v-if="whatsappLinks[item.id]"
            class="request-card__whatsapp solid-btn"
            :href="whatsappLinks[item.id] || '#'"
            target="_blank"
            rel="noreferrer noopener"
            @click="handleWhatsAppClick(item)"
          >
            <svg
              class="request-card__whatsapp-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              aria-hidden="true"
              focusable="false"
            >
              <path
                fill="currentColor"
                d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zm-5.607 12.195h-.004a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931a6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646c-.182-.065-.315-.099-.445.099c-.133.197-.513.646-.627.775c-.114.133-.232.148-.43.05c-.197-.1-.836-.308-1.592-.985c-.59-.525-.985-1.175-1.103-1.372c-.114-.198-.011-.304.088-.403c.087-.088.197-.232.296-.346c.1-.114.133-.198.198-.33c.065-.134.034-.248-.015-.347c-.05-.099-.445-1.076-.612-1.47c-.16-.389-.323-.335-.445-.34c-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654c0 .977.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992c.47.205.84.326 1.129.418c.475.152.904.129 1.246.08c.38-.058 1.171-.48 1.338-.943c.164-.464.164-.86.114-.943c-.049-.084-.182-.133-.38-.232z"
              />
            </svg>
            <span>Contactar no Whatsapp</span>
          </a>
          <p v-else class="request-card__whatsapp-hint">
            Número de telefone indisponível para iniciar contato no WhatsApp.
          </p>

          <button
            class="request-card__close-btn"
            type="button"
            :disabled="isStatusUpdating(item.id) || item.status === 'CLOSED'"
            @click="closeQuoteRequest(item)"
          >
            {{
              isStatusUpdating(item.id)
                ? 'Atualizando...'
                : item.status === 'CLOSED'
                  ? 'Encerrado'
                  : 'Encerrar'
            }}
          </button>
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
  z-index: 0;
}

.requests-page > :not(.requests-glow) {
  position: relative;
  z-index: 1;
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
  background: #fff;
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

.request-card__identity {
  display: grid;
  gap: 0.2rem;
}

.request-card__header strong {
  color: #0f2233;
  font: 800 0.98rem/1 'REM', sans-serif;
}

.request-card__header span {
  color: rgb(15 34 51 / 66%);
  font: 600 0.74rem/1 'Work Sans', sans-serif;
}

.request-card__status {
  margin: 0;
  width: fit-content;
  border-radius: 999px;
  padding: 0.22rem 0.48rem;
  border: 1px solid transparent;
  font: 800 0.64rem/1 'Work Sans', sans-serif;
  letter-spacing: 0.03em;
}

.request-card__status--pending {
  color: #665100;
  background: rgb(245 181 46 / 16%);
  border-color: rgb(245 181 46 / 38%);
}

.request-card__status--in-service {
  color: #0e4a78;
  background: rgb(28 95 148 / 14%);
  border-color: rgb(28 95 148 / 34%);
}

.request-card__status--closed {
  color: rgb(15 34 51 / 80%);
  background: rgb(15 34 51 / 8%);
  border-color: rgb(15 34 51 / 20%);
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

.request-card__landing-link {
  width: fit-content;
  color: #0f2233;
  font: 700 0.93rem/1.2 'REM', sans-serif;
  text-decoration: none;
}

.request-card__section p {
  margin: 0;
  color: rgb(15 34 51 / 75%);
  font: 500 0.82rem/1.35 'Work Sans', sans-serif;
}

.request-card__section--details {
  border-top: 1px solid rgb(15 34 51 / 10%);
  padding-top: 0.5rem;
}

.request-card__section a:not(.request-card__landing-link) {
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

.request-card__whatsapp {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.request-card__actions {
  display: grid;
  gap: 0.45rem;
}

.request-card__whatsapp-icon {
  width: 0.95rem;
  height: 0.95rem;
  flex: 0 0 auto;
}

.request-card__whatsapp-hint {
  margin: 0;
  color: rgb(15 34 51 / 66%);
  font: 600 0.78rem/1.3 'Work Sans', sans-serif;
}

.request-card__close-btn {
  justify-self: end;
  border: 1px solid rgb(15 34 51 / 24%);
  background: rgb(255 255 255 / 85%);
  color: rgb(15 34 51 / 84%);
  border-radius: 999px;
  padding: 0.3rem 0.62rem;
  font: 700 0.67rem/1 'Work Sans', sans-serif;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.request-card__close-btn:hover:not(:disabled) {
  border-color: rgb(15 34 51 / 40%);
  background: rgb(15 34 51 / 7%);
}

.request-card__close-btn:disabled {
  opacity: 0.62;
  cursor: default;
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
.ghost-btn--active {
  border-color: rgb(15 34 51 / 44%);
  color: #0f2233;
  background: linear-gradient(115deg, #f5b52e 8%, #f27a2e 92%);
}
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

