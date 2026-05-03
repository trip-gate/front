<script setup lang="ts">
import { useQuoteRequestsService } from '~/services/quote-requests.service';
import type {
  DashboardLandingPageSummary,
  DashboardMetricsResponse,
  DashboardPeriod,
} from '~/services/quote-requests.service';

definePageMeta({
  middleware: 'auth',
});

const auth = useAuth();
const notifications = useNotifications();
const quoteRequestsService = useQuoteRequestsService();
const route = useRoute();

const selectedPeriod = ref<DashboardPeriod>('today');
const metrics = ref<DashboardMetricsResponse | null>(null);
const isLoading = ref(true);
const isUpdatingPeriod = ref(false);

const periodOptions: Array<{ label: string; value: DashboardPeriod }> = [
  { label: 'Hoje', value: 'today' },
  { label: 'Sempre', value: 'all_time' },
];

const userDisplayName = computed(() => {
  const user = auth.user.value;
  if (!user) {
    return 'Operação';
  }

  return [user.first_name, user.last_name].filter(Boolean).join(' ');
});

const chartPoints = computed(() => {
  if (!metrics.value) {
    return [];
  }

  const maxCount = Math.max(1, ...metrics.value.timeline.points.map((point) => point.count));

  return metrics.value.timeline.points.map((point) => ({
    ...point,
    percentage: Math.max(6, Math.round((point.count / maxCount) * 100)),
  }));
});

const selectedTopLandingPage = computed<DashboardLandingPageSummary | null>(() => {
  if (!metrics.value) {
    return null;
  }

  return metrics.value.top_landing_pages.selected;
});

const topLandingPageToday = computed<DashboardLandingPageSummary | null>(() => {
  if (!metrics.value) {
    return null;
  }

  return metrics.value.top_landing_pages.today;
});

const topLandingPageAllTime = computed<DashboardLandingPageSummary | null>(() => {
  if (!metrics.value) {
    return null;
  }

  return metrics.value.top_landing_pages.all_time;
});

const selectedRequestsCount = computed(() => metrics.value?.quote_requests.selected_value ?? 0);
const requestsTodayCount = computed(() => metrics.value?.quote_requests.today ?? 0);
const requestsTotalCount = computed(() => metrics.value?.quote_requests.total ?? 0);

function isRouteActive(path: string): boolean {
  return route.path === path;
}

async function fetchDashboard(period: DashboardPeriod, isPeriodUpdate = false) {
  if (isPeriodUpdate) {
    isUpdatingPeriod.value = true;
  } else {
    isLoading.value = true;
  }

  try {
    const response = await quoteRequestsService.getDashboard(period);
    metrics.value = response;
    selectedPeriod.value = response.selected_period;
  } catch {
    notifications.error(
      'Falha ao carregar',
      'Não foi possível carregar os indicadores do dashboard.',
    );
  } finally {
    isLoading.value = false;
    isUpdatingPeriod.value = false;
  }
}

async function handlePeriodChange(period: DashboardPeriod) {
  if (period === selectedPeriod.value && metrics.value) {
    return;
  }

  selectedPeriod.value = period;
  await fetchDashboard(period, true);
}

async function handleSignOut() {
  await auth.signOut();
}

onMounted(async () => {
  await fetchDashboard('today');
});
</script>

<template>
  <main class="dash-page">
    <div class="dash-glow dash-glow--a" />
    <div class="dash-glow dash-glow--b" />

    <header class="dash-topbar">
      <div>
        <p class="dash-topbar__eyebrow">TripGate Intelligence</p>
        <h1>Dashboard de solicitações</h1>
        <p class="dash-topbar__subtitle">
          Olá, {{ userDisplayName }}. Visualize novos registros e performance de landing pages.
        </p>
      </div>

      <div class="dash-topbar__actions">
        <NuxtLink :class="['ghost-btn', { 'ghost-btn--active': isRouteActive('/dashboard') }]" to="/dashboard">Dashboard</NuxtLink>
        <NuxtLink :class="['ghost-btn', { 'ghost-btn--active': isRouteActive('/solicitacoes-orcamento') }]" to="/solicitacoes-orcamento">Solicitações</NuxtLink>
        <NuxtLink :class="['ghost-btn', { 'ghost-btn--active': isRouteActive('/usuarios') }]" to="/usuarios">Usuários</NuxtLink>
        <NuxtLink :class="['ghost-btn', { 'ghost-btn--active': isRouteActive('/landing-pages') }]" to="/landing-pages">Landing pages</NuxtLink>
        <button class="ghost-btn" type="button" @click="handleSignOut">Sair</button>
      </div>
    </header>

    <section class="period-switch" aria-label="Selecionar período">
      <button
        v-for="option in periodOptions"
        :key="option.value"
        type="button"
        :class="['period-switch__button', { 'period-switch__button--active': option.value === selectedPeriod }]"
        :disabled="isUpdatingPeriod"
        @click="handlePeriodChange(option.value)"
      >
        {{ option.label }}
      </button>
    </section>

    <section v-if="isLoading" class="loading-box">
      <p>Carregando indicadores...</p>
    </section>

    <template v-else>
      <section class="kpi-grid">
        <article class="kpi-card kpi-card--highlight">
          <p class="kpi-card__label">
            {{ selectedPeriod === 'today' ? 'Novos registros hoje' : 'Registros acumulados' }}
          </p>
          <strong class="kpi-card__value">{{ selectedRequestsCount }}</strong>
          <p class="kpi-card__meta">
            Hoje: {{ requestsTodayCount }} | Total: {{ requestsTotalCount }}
          </p>
        </article>

        <article class="kpi-card">
          <p class="kpi-card__label">Landing page líder no período</p>
          <template v-if="selectedTopLandingPage">
            <strong class="kpi-card__value kpi-card__value--title">
              {{ selectedTopLandingPage.theme }}
            </strong>
            <p class="kpi-card__meta">
              {{ selectedTopLandingPage.total_requests }} requests |
              {{ selectedTopLandingPage.type_name ?? 'Sem tipo' }}
            </p>
          </template>
          <p v-else class="kpi-card__meta">Sem registros no período selecionado.</p>
        </article>

        <article class="kpi-card">
          <p class="kpi-card__label">Comparativo de liderança</p>
          <p class="kpi-card__meta">
            Hoje:
            <strong>{{ topLandingPageToday?.theme ?? 'Sem dados' }}</strong>
          </p>
          <p class="kpi-card__meta">
            Sempre:
            <strong>{{ topLandingPageAllTime?.theme ?? 'Sem dados' }}</strong>
          </p>
        </article>
      </section>

      <section class="chart-shell">
        <header class="chart-shell__header">
          <h2>
            {{ metrics?.timeline.mode === 'hourly' ? 'Distribuição por hora' : 'Últimos 14 dias' }}
          </h2>
          <span>{{ selectedPeriod === 'today' ? 'Visão de hoje' : 'Visão histórica' }}</span>
        </header>

        <div class="chart-bars">
          <article v-for="point in chartPoints" :key="point.key" class="chart-bars__item">
            <div class="chart-bars__bar">
              <div class="chart-bars__fill" :style="{ height: `${point.percentage}%` }" />
            </div>
            <p class="chart-bars__count">{{ point.count }}</p>
            <span class="chart-bars__label">{{ point.label }}</span>
          </article>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.dash-page {
  position: relative;
  min-height: 100vh;
  padding: clamp(0.9rem, 3vw, 1.8rem);
  overflow: hidden;
  background:
    radial-gradient(circle at 8% 0%, rgb(116 184 181 / 20%), transparent 33%),
    radial-gradient(circle at 100% 100%, rgb(242 122 46 / 14%), transparent 36%),
    linear-gradient(145deg, #e9eae8 0%, #cedde7 100%);
}

.dash-glow {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(1px);
}

.dash-glow--a {
  width: 17rem;
  height: 17rem;
  top: -5rem;
  right: -4rem;
  background: linear-gradient(145deg, rgb(245 181 46 / 38%), rgb(242 122 46 / 44%));
}

.dash-glow--b {
  width: 15rem;
  height: 15rem;
  left: -5rem;
  bottom: -4rem;
  background: linear-gradient(145deg, rgb(28 95 148 / 24%), rgb(15 34 51 / 28%));
}

.dash-topbar {
  position: relative;
  z-index: 1;
  width: min(72rem, 100%);
  margin: 0 auto;
  padding: clamp(1rem, 2.8vw, 1.5rem);
  border-radius: 1.2rem;
  border: 1px solid rgb(15 34 51 / 12%);
  background: rgb(255 255 255 / 80%);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.dash-topbar__eyebrow {
  margin: 0;
  color: #1c5f94;
  font: 700 0.75rem/1 'Work Sans', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dash-topbar h1 {
  margin: 0.4rem 0 0;
  color: #0f2233;
  font: 800 clamp(1.5rem, 4vw, 2.2rem) / 1.07 'REM', sans-serif;
}

.dash-topbar__subtitle {
  margin: 0.7rem 0 0;
  color: rgb(15 34 51 / 74%);
  font: 500 0.92rem/1.45 'Work Sans', sans-serif;
}

.dash-topbar__actions {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.ghost-btn {
  border: 1px solid rgb(15 34 51 / 28%);
  border-radius: 0.8rem;
  padding: 0.67rem 0.92rem;
  color: #0f2233;
  background: rgb(255 255 255 / 76%);
  text-decoration: none;
  cursor: pointer;
  font: 700 0.83rem/1 'REM', sans-serif;
  transition: transform 0.2s ease;
}

.ghost-btn--active {
  border-color: rgb(15 34 51 / 44%);
  color: #0f2233;
  background: linear-gradient(115deg, #f5b52e 8%, #f27a2e 92%);
}
.ghost-btn:hover {
  transform: translateY(-1px);
}

.period-switch {
  width: min(72rem, 100%);
  margin: 0.85rem auto 0;
  padding: 0.25rem;
  border-radius: 999px;
  border: 1px solid rgb(15 34 51 / 14%);
  background: rgb(255 255 255 / 74%);
  display: flex;
  gap: 0.3rem;
}

.period-switch__button {
  border: 0;
  border-radius: 999px;
  padding: 0.55rem 1rem;
  cursor: pointer;
  font: 700 0.8rem/1 'REM', sans-serif;
  color: rgb(15 34 51 / 70%);
  background: transparent;
}

.period-switch__button--active {
  color: #0f2233;
  background: linear-gradient(115deg, #f5b52e 8%, #f27a2e 92%);
}

.period-switch__button:disabled {
  cursor: not-allowed;
}

.loading-box {
  width: min(72rem, 100%);
  margin: 0.85rem auto 0;
  border-radius: 1rem;
  border: 1px solid rgb(15 34 51 / 10%);
  background: rgb(255 255 255 / 82%);
  padding: 1rem;
  color: rgb(15 34 51 / 78%);
  font: 500 0.92rem/1.4 'Work Sans', sans-serif;
}

.kpi-grid {
  width: min(72rem, 100%);
  margin: 0.85rem auto 0;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.kpi-card {
  border-radius: 1rem;
  border: 1px solid rgb(15 34 51 / 12%);
  background: rgb(255 255 255 / 84%);
  padding: 1rem;
}

.kpi-card--highlight {
  background:
    radial-gradient(circle at 85% 12%, rgb(245 181 46 / 23%), transparent 35%),
    linear-gradient(145deg, rgb(15 34 51 / 96%), rgb(28 95 148 / 93%));
  color: #e9eae8;
  border-color: rgb(15 34 51 / 24%);
}

.kpi-card__label {
  margin: 0;
  font: 700 0.78rem/1 'Work Sans', sans-serif;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.kpi-card__value {
  display: block;
  margin-top: 0.5rem;
  font: 800 clamp(1.7rem, 4vw, 2.25rem) / 1 'REM', sans-serif;
}

.kpi-card__value--title {
  font-size: clamp(1.1rem, 3.3vw, 1.4rem);
  line-height: 1.2;
}

.kpi-card__meta {
  margin: 0.55rem 0 0;
  color: inherit;
  opacity: 0.88;
  font: 500 0.88rem/1.4 'Work Sans', sans-serif;
}

.chart-shell {
  width: min(72rem, 100%);
  margin: 0.85rem auto 0;
  border-radius: 1rem;
  border: 1px solid rgb(15 34 51 / 10%);
  background: rgb(255 255 255 / 86%);
  padding: 1rem;
}

.chart-shell__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.7rem;
}

.chart-shell__header h2 {
  margin: 0;
  color: #0f2233;
  font: 700 clamp(1rem, 2.8vw, 1.25rem) / 1.2 'REM', sans-serif;
}

.chart-shell__header span {
  color: rgb(15 34 51 / 66%);
  font: 600 0.75rem/1 'Work Sans', sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.chart-bars {
  margin-top: 0.85rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(2.4rem, 1fr));
  gap: 0.5rem;
}

.chart-bars__item {
  min-width: 0;
  display: grid;
  justify-items: center;
  gap: 0.25rem;
}

.chart-bars__bar {
  position: relative;
  width: 100%;
  height: 9rem;
  border-radius: 0.65rem;
  border: 1px solid rgb(15 34 51 / 11%);
  background: linear-gradient(180deg, rgb(206 221 231 / 38%), rgb(233 234 232 / 74%));
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.chart-bars__fill {
  width: 100%;
  border-radius: 0.55rem 0.55rem 0 0;
  background: linear-gradient(180deg, #f5b52e 0%, #f27a2e 65%, #1c5f94 100%);
  transition: height 0.24s ease;
}

.chart-bars__count {
  margin: 0;
  color: #0f2233;
  font: 700 0.78rem/1 'REM', sans-serif;
}

.chart-bars__label {
  color: rgb(15 34 51 / 72%);
  font: 600 0.69rem/1 'Work Sans', sans-serif;
}

@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .dash-topbar {
    flex-direction: column;
  }

  .dash-topbar__actions {
    width: 100%;
  }

  .ghost-btn {
    flex: 1;
    text-align: center;
  }

  .period-switch {
    width: min(72rem, 100%);
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-radius: 0.9rem;
  }

  .period-switch__button {
    border-radius: 0.72rem;
  }
}

@media (max-width: 680px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .chart-bars {
    grid-template-columns: repeat(auto-fit, minmax(2.2rem, 1fr));
    gap: 0.4rem;
  }

  .chart-bars__bar {
    height: 7rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ghost-btn,
  .chart-bars__fill {
    transition: none;
  }
}
</style>


