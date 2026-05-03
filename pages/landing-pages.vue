<script setup lang="ts">
import { useLandingPagesService } from '~/services/landing-pages.service';
import type {
  LandingPageItem,
  LandingPageTypeName,
} from '~/services/landing-pages.service';

definePageMeta({
  middleware: 'auth',
});

const auth = useAuth();
const notifications = useNotifications();
const landingPagesService = useLandingPagesService();
const route = useRoute();

const isLoading = ref(true);
const isRefreshing = ref(false);
const isSaving = ref(false);
const deletingId = ref<string | null>(null);

const items = ref<LandingPageItem[]>([]);
const typeOptions = ref<Array<{ id: string; name: string }>>([]);

const filters = reactive({
  search: '',
  type_id: '',
  type_name: '',
  supplier_code: '',
  sort_by: 'theme' as 'theme' | 'url' | 'type_name',
  sort_order: 'asc' as 'asc' | 'desc',
});

const pagination = reactive({
  page: 1,
  page_size: 12,
  total: 0,
  total_pages: 0,
});

const selectedId = ref<string | null>(null);
const form = reactive({
  theme: '',
  type_id: '',
  supplier_code: '',
  url: '',
});

const isEditing = computed(() => Boolean(selectedId.value));
const userDisplayName = computed(() => {
  const user = auth.user.value;
  if (!user) {
    return 'Operação';
  }

  return [user.first_name, user.last_name].filter(Boolean).join(' ');
});

function isRouteActive(path: string): boolean {
  return route.path === path;
}

function resetForm() {
  form.theme = '';
  form.type_id = typeOptions.value[0]?.id ?? '';
  form.supplier_code = '';
  form.url = '';
}

function applyItemToForm(item: LandingPageItem) {
  form.theme = item.theme;
  form.type_id = item.type.id;
  form.supplier_code = item.supplier_code ?? '';
  form.url = item.url;
}

function startCreate() {
  selectedId.value = null;
  resetForm();
}

function startEdit(item: LandingPageItem) {
  selectedId.value = item.id;
  applyItemToForm(item);
}

async function fetchLandingPages(options: { resetPage?: boolean; silent?: boolean } = {}) {
  if (options.resetPage) {
    pagination.page = 1;
  }

  if (options.silent) {
    isRefreshing.value = true;
  } else {
    isLoading.value = true;
  }

  try {
    const response = await landingPagesService.list({
      search: filters.search || undefined,
      type_id: filters.type_id || undefined,
      type_name: (filters.type_name || undefined) as
        | LandingPageTypeName
        | undefined,
      supplier_code: filters.supplier_code || undefined,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order,
      page: pagination.page,
      page_size: pagination.page_size,
    });

    items.value = response.data;
    typeOptions.value = response.filter_options.landing_page_types;
    pagination.page = response.pagination.page;
    pagination.total = response.pagination.total;
    pagination.total_pages = response.pagination.total_pages;

    if (!form.type_id && typeOptions.value.length > 0) {
      form.type_id = typeOptions.value[0].id;
    }
  } catch {
    notifications.error(
      'Falha ao carregar',
      'Não foi possível consultar as landing pages.',
    );
  } finally {
    isLoading.value = false;
    isRefreshing.value = false;
  }
}

async function applyFilters() {
  await fetchLandingPages({ resetPage: true, silent: true });
}

async function clearFilters() {
  filters.search = '';
  filters.type_id = '';
  filters.type_name = '';
  filters.supplier_code = '';
  filters.sort_by = 'theme';
  filters.sort_order = 'asc';
  await fetchLandingPages({ resetPage: true, silent: true });
}

async function goToPage(nextPage: number) {
  if (nextPage < 1 || nextPage > pagination.total_pages || nextPage === pagination.page) {
    return;
  }

  pagination.page = nextPage;
  await fetchLandingPages({ silent: true });
}

async function submitForm() {
  const theme = form.theme.trim();
  const typeId = form.type_id.trim();
  const url = form.url.trim();

  if (!theme || !typeId || !url) {
    notifications.warning(
      'Campos obrigatórios',
      'Preencha tema, tipo e URL para salvar.',
    );
    return;
  }

  isSaving.value = true;

  try {
    if (isEditing.value && selectedId.value) {
      await landingPagesService.update(selectedId.value, {
        theme,
        type_id: typeId,
        supplier_code: form.supplier_code.trim() || null,
        url,
      });

      notifications.success('Landing page atualizada', 'Registro atualizado com sucesso.');
    } else {
      await landingPagesService.create({
        theme,
        type_id: typeId,
        supplier_code: form.supplier_code.trim() || null,
        url,
      });

      notifications.success('Landing page criada', 'Novo registro criado com sucesso.');
    }

    startCreate();
    await fetchLandingPages({ silent: true });
  } catch {
    notifications.error(
      'Falha ao salvar',
      'Não foi possível persistir os dados da landing page.',
    );
  } finally {
    isSaving.value = false;
  }
}

async function deleteLandingPage(item: LandingPageItem) {
  if (import.meta.client) {
    const confirmed = window.confirm(
      `Deseja realmente remover a landing page ${item.theme}?`,
    );

    if (!confirmed) {
      return;
    }
  }

  deletingId.value = item.id;

  try {
    await landingPagesService.remove(item.id);
    notifications.success('Landing page removida', 'Registro removido com sucesso.');

    if (selectedId.value === item.id) {
      startCreate();
    }

    await fetchLandingPages({ silent: true });
  } catch {
    notifications.error(
      'Falha ao remover',
      'Não foi possível remover essa landing page (verifique vínculos ativos).',
    );
  } finally {
    deletingId.value = null;
  }
}

async function handleSignOut() {
  await auth.signOut();
}

onMounted(async () => {
  await fetchLandingPages();
  startCreate();
});
</script>

<template>
  <main class="landing-page-admin">
    <div class="landing-page-admin__glow landing-page-admin__glow--a" />
    <div class="landing-page-admin__glow landing-page-admin__glow--b" />

    <header class="admin-header">
      <div>
        <p class="admin-header__eyebrow">TripGate Growth</p>
        <h1>Gestão de landing pages</h1>
        <p class="admin-header__subtitle">
          {{ userDisplayName }}, centralize campanhas e controle tipos para manter o funil organizado.
        </p>
      </div>

      <div class="admin-header__actions">
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
          <span>Busca</span>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Tema, URL ou supplier code"
          />
        </label>

        <label class="field">
          <span>Tipo (id)</span>
          <select v-model="filters.type_id">
            <option value="">Todos</option>
            <option v-for="type in typeOptions" :key="type.id" :value="type.id">
              {{ type.name }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Tipo (nome)</span>
          <select v-model="filters.type_name">
            <option value="">Todos</option>
            <option value="EVENT">EVENT</option>
            <option value="PACKAGE">PACKAGE</option>
            <option value="CUSTOM">CUSTOM</option>
          </select>
        </label>

        <label class="field">
          <span>Supplier code</span>
          <input v-model="filters.supplier_code" type="text" placeholder="Ex.: CVC" />
        </label>

        <label class="field">
          <span>Ordenar por</span>
          <select v-model="filters.sort_by">
            <option value="theme">Tema</option>
            <option value="url">URL</option>
            <option value="type_name">Tipo</option>
          </select>
        </label>

        <label class="field">
          <span>Direção</span>
          <select v-model="filters.sort_order">
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </label>
      </div>

      <div class="filters-actions">
        <button class="solid-btn" type="button" :disabled="isRefreshing" @click="applyFilters">
          {{ isRefreshing ? 'Atualizando...' : 'Aplicar filtros' }}
        </button>
        <button
          class="ghost-btn ghost-btn--alt"
          type="button"
          :disabled="isRefreshing"
          @click="clearFilters"
        >
          Limpar
        </button>
      </div>
    </section>

    <section class="crud-shell">
      <article class="table-card">
        <header class="table-card__header">
          <h2>Landing pages</h2>
          <span>Total: {{ pagination.total }}</span>
        </header>

        <section v-if="isLoading" class="state-box">
          <p>Carregando landing pages...</p>
        </section>

        <section v-else-if="items.length === 0" class="state-box">
          <p>Nenhum registro encontrado para os filtros selecionados.</p>
        </section>

        <div v-else class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Tema</th>
                <th>Tipo</th>
                <th>Supplier</th>
                <th>URL</th>
                <th>Quotes</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id" :class="{ 'is-selected': item.id === selectedId }">
                <td><strong>{{ item.theme }}</strong></td>
                <td>{{ item.type.name }}</td>
                <td>{{ item.supplier_code || '-' }}</td>
                <td>
                  <a :href="item.url" target="_blank" rel="noreferrer noopener">
                    {{ item.url }}
                  </a>
                </td>
                <td>{{ item.quote_requests_count }}</td>
                <td>
                  <div class="row-actions">
                    <button class="ghost-btn ghost-btn--tiny" type="button" @click="startEdit(item)">
                      Editar
                    </button>
                    <button
                      class="danger-btn"
                      type="button"
                      :disabled="deletingId === item.id"
                      @click="deleteLandingPage(item)"
                    >
                      {{ deletingId === item.id ? 'Removendo...' : 'Excluir' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer v-if="pagination.total_pages > 1" class="pagination">
          <button class="ghost-btn ghost-btn--alt" type="button" @click="goToPage(pagination.page - 1)">
            Anterior
          </button>
          <p>Página {{ pagination.page }} de {{ pagination.total_pages }}</p>
          <button class="ghost-btn ghost-btn--alt" type="button" @click="goToPage(pagination.page + 1)">
            Próxima
          </button>
        </footer>
      </article>

      <article class="form-card">
        <header class="form-card__header">
          <h2>{{ isEditing ? 'Editar landing page' : 'Nova landing page' }}</h2>
          <button class="ghost-btn ghost-btn--alt" type="button" @click="startCreate">
            Novo registro
          </button>
        </header>

        <form class="form-grid" @submit.prevent="submitForm">
          <label class="field">
            <span>Tema</span>
            <input v-model="form.theme" type="text" maxlength="140" required />
          </label>

          <label class="field">
            <span>Tipo</span>
            <select v-model="form.type_id" required>
              <option v-for="type in typeOptions" :key="type.id" :value="type.id">
                {{ type.name }} ({{ type.id }})
              </option>
            </select>
          </label>

          <label class="field">
            <span>Supplier code</span>
            <input v-model="form.supplier_code" type="text" maxlength="60" />
          </label>

          <label class="field">
            <span>URL</span>
            <input v-model="form.url" type="url" maxlength="240" required />
          </label>

          <button class="solid-btn" type="submit" :disabled="isSaving">
            {{
              isSaving
                ? 'Salvando...'
                : isEditing
                  ? 'Salvar alterações'
                  : 'Criar landing page'
            }}
          </button>
        </form>
      </article>
    </section>
  </main>
</template>

<style scoped>
.landing-page-admin {
  min-height: 100vh;
  padding: clamp(0.9rem, 3vw, 1.7rem);
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 0% 0%, rgb(116 184 181 / 17%), transparent 34%),
    radial-gradient(circle at 100% 100%, rgb(242 122 46 / 16%), transparent 35%),
    linear-gradient(145deg, #eef2f5 0%, #d7e4ec 100%);
}

.landing-page-admin__glow {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.landing-page-admin__glow--a {
  width: 16rem;
  height: 16rem;
  top: -5rem;
  right: -4rem;
  background: linear-gradient(145deg, rgb(245 181 46 / 40%), rgb(242 122 46 / 42%));
}

.landing-page-admin__glow--b {
  width: 14rem;
  height: 14rem;
  left: -4rem;
  bottom: -5rem;
  background: linear-gradient(145deg, rgb(28 95 148 / 24%), rgb(15 34 51 / 30%));
}

.admin-header {
  position: relative;
  z-index: 1;
  width: min(78rem, 100%);
  margin: 0 auto;
  padding: clamp(1rem, 2.8vw, 1.45rem);
  border-radius: 1.1rem;
  border: 1px solid rgb(15 34 51 / 12%);
  background: rgb(255 255 255 / 82%);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.admin-header__eyebrow {
  margin: 0;
  color: #1c5f94;
  font: 700 0.74rem/1 'Work Sans', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.admin-header h1 {
  margin: 0.42rem 0 0;
  color: #0f2233;
  font: 800 clamp(1.4rem, 3.7vw, 2rem) / 1.1 'REM', sans-serif;
}

.admin-header__subtitle {
  margin: 0.6rem 0 0;
  color: rgb(15 34 51 / 76%);
  font: 500 0.88rem/1.45 'Work Sans', sans-serif;
}

.admin-header__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.48rem;
}

.filters-shell {
  width: min(78rem, 100%);
  margin: 0.8rem auto 0;
  border-radius: 1rem;
  border: 1px solid rgb(15 34 51 / 10%);
  background: rgb(255 255 255 / 84%);
  padding: 0.95rem;
}

.filters-grid {
  display: grid;
  gap: 0.62rem;
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 0.3rem;
}

.field span {
  color: #1c5f94;
  font: 700 0.72rem/1 'Work Sans', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field input,
.field select {
  width: 100%;
  border: 1px solid rgb(15 34 51 / 18%);
  border-radius: 0.72rem;
  padding: 0.62rem 0.7rem;
  background: #fff;
  color: #0f2233;
  font: 500 0.84rem/1.2 'Work Sans', sans-serif;
}

.filters-actions {
  margin-top: 0.78rem;
  display: flex;
  gap: 0.5rem;
}

.crud-shell {
  width: min(78rem, 100%);
  margin: 0.8rem auto 0;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
}

.table-card,
.form-card {
  border-radius: 1rem;
  border: 1px solid rgb(15 34 51 / 12%);
  background: rgb(255 255 255 / 88%);
  padding: 0.95rem;
}

.table-card__header,
.form-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
}

.table-card__header h2,
.form-card__header h2 {
  margin: 0;
  color: #0f2233;
  font: 700 1.02rem/1.2 'REM', sans-serif;
}

.table-card__header span {
  color: rgb(15 34 51 / 70%);
  font: 700 0.74rem/1 'Work Sans', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.table-wrap {
  margin-top: 0.7rem;
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 50rem;
}

.admin-table th,
.admin-table td {
  padding: 0.62rem 0.54rem;
  border-bottom: 1px solid rgb(15 34 51 / 9%);
  text-align: left;
  color: #0f2233;
  font: 500 0.79rem/1.35 'Work Sans', sans-serif;
}

.admin-table th {
  color: #1c5f94;
  font: 700 0.72rem/1 'Work Sans', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.admin-table td strong {
  font: 700 0.82rem/1.2 'REM', sans-serif;
}

.admin-table td a {
  color: #1c5f94;
  text-decoration: none;
  font-weight: 600;
}

.admin-table tr.is-selected {
  background: linear-gradient(120deg, rgb(206 221 231 / 34%), rgb(233 234 232 / 72%));
}

.row-actions {
  display: flex;
  gap: 0.38rem;
}

.pagination {
  margin-top: 0.72rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.65rem;
}

.pagination p {
  margin: 0;
  color: rgb(15 34 51 / 76%);
  font: 600 0.8rem/1 'Work Sans', sans-serif;
}

.form-grid {
  margin-top: 0.72rem;
  display: grid;
  gap: 0.56rem;
}

.state-box {
  margin-top: 0.7rem;
  border: 1px solid rgb(15 34 51 / 10%);
  border-radius: 0.8rem;
  background: rgb(255 255 255 / 84%);
  padding: 0.85rem;
}

.state-box p {
  margin: 0;
  color: rgb(15 34 51 / 78%);
  font: 500 0.86rem/1.4 'Work Sans', sans-serif;
}

.solid-btn,
.ghost-btn,
.danger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.78rem;
  padding: 0.66rem 0.85rem;
  font: 700 0.79rem/1 'REM', sans-serif;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.2s ease;
}

.solid-btn {
  border: 0;
  background: linear-gradient(115deg, #f5b52e 8%, #f27a2e 92%);
  color: #0f2233;
}

.ghost-btn {
  border: 1px solid rgb(15 34 51 / 24%);
  background: rgb(255 255 255 / 78%);
  color: #0f2233;
}

.ghost-btn--alt {
  background: #fff;
}

.ghost-btn--tiny {
  padding: 0.45rem 0.62rem;
  border-radius: 0.62rem;
  font-size: 0.72rem;
}

.danger-btn {
  border: 1px solid rgb(196 52 30 / 30%);
  background: rgb(255 240 236);
  color: #8f230c;
}

.ghost-btn--active {
  border-color: rgb(15 34 51 / 44%);
  color: #0f2233;
  background: linear-gradient(115deg, #f5b52e 8%, #f27a2e 92%);
}
.solid-btn:hover,
.ghost-btn:hover,
.danger-btn:hover {
  transform: translateY(-1px);
}

.danger-btn:disabled,
.solid-btn:disabled,
.ghost-btn:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

@media (max-width: 1120px) {
  .filters-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .crud-shell {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .admin-header {
    flex-direction: column;
  }

  .admin-header__actions {
    width: 100%;
  }

  .ghost-btn {
    flex: 1;
    text-align: center;
  }
}

@media (max-width: 680px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }

  .filters-actions {
    flex-direction: column;
  }

  .solid-btn,
  .ghost-btn--alt {
    width: 100%;
  }

  .pagination {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (prefers-reduced-motion: reduce) {
  .solid-btn,
  .ghost-btn,
  .danger-btn {
    transition: none;
  }
}
</style>


