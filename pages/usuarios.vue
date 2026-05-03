<script setup lang="ts">
import { useAccountsService } from '~/services/accounts.service';
import type {
  AccountItem,
  AccountRole,
  DocumentType,
} from '~/services/accounts.service';

definePageMeta({
  middleware: 'auth',
});

const auth = useAuth();
const notifications = useNotifications();
const accountsService = useAccountsService();
const route = useRoute();

const isLoading = ref(true);
const isRefreshing = ref(false);
const isSaving = ref(false);
const deletingId = ref<string | null>(null);

const items = ref<AccountItem[]>([]);
const roleOptions = ref<AccountRole[]>(['MASTER', 'OPERATOR']);
const documentTypeOptions = ref<DocumentType[]>(['CPF', 'PASSPORT']);

const filters = reactive({
  search: '',
  role: '',
  document_type: '',
  email_confirmed: 'all' as 'all' | 'true' | 'false',
  sort_by: 'created_at' as 'created_at' | 'first_name' | 'email',
  sort_order: 'desc' as 'asc' | 'desc',
});

const pagination = reactive({
  page: 1,
  page_size: 12,
  total: 0,
  total_pages: 0,
});

const selectedId = ref<string | null>(null);
const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  birthdate: '',
  document: '',
  document_type: 'CPF' as DocumentType,
  role: 'OPERATOR' as AccountRole,
  email_confirmed: true,
});

const isEditing = computed(() => Boolean(selectedId.value));
const currentUserId = computed(() => auth.user.value?.id ?? null);
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

function formatDateTime(value: string | null): string {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function toDateInput(value: string | null): string {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

function toIsoDate(dateValue: string): string {
  const parsed = new Date(`${dateValue}T00:00:00.000Z`);
  return parsed.toISOString();
}

function resetForm() {
  form.first_name = '';
  form.last_name = '';
  form.email = '';
  form.phone = '';
  form.password = '';
  form.birthdate = '';
  form.document = '';
  form.document_type = 'CPF';
  form.role = 'OPERATOR';
  form.email_confirmed = true;
}

function applyItemToForm(item: AccountItem) {
  form.first_name = item.first_name;
  form.last_name = item.last_name ?? '';
  form.email = item.email;
  form.phone = item.phone ?? '';
  form.password = '';
  form.birthdate = toDateInput(item.birthdate);
  form.document = item.document;
  form.document_type = item.document_type;
  form.role = item.role;
  form.email_confirmed = Boolean(item.email_confirmed_at);
}

function startCreate() {
  selectedId.value = null;
  resetForm();
}

function startEdit(item: AccountItem) {
  selectedId.value = item.id;
  applyItemToForm(item);
}

function resolveEmailConfirmedFilter(): boolean | undefined {
  if (filters.email_confirmed === 'true') {
    return true;
  }

  if (filters.email_confirmed === 'false') {
    return false;
  }

  return undefined;
}

async function fetchAccounts(options: { resetPage?: boolean; silent?: boolean } = {}) {
  if (options.resetPage) {
    pagination.page = 1;
  }

  if (options.silent) {
    isRefreshing.value = true;
  } else {
    isLoading.value = true;
  }

  try {
    const response = await accountsService.list({
      search: filters.search || undefined,
      role: (filters.role || undefined) as AccountRole | undefined,
      document_type: (filters.document_type || undefined) as
        | DocumentType
        | undefined,
      email_confirmed: resolveEmailConfirmedFilter(),
      sort_by: filters.sort_by,
      sort_order: filters.sort_order,
      page: pagination.page,
      page_size: pagination.page_size,
    });

    items.value = response.data;
    roleOptions.value = response.filter_options.roles;
    documentTypeOptions.value = response.filter_options.document_types;
    pagination.page = response.pagination.page;
    pagination.total = response.pagination.total;
    pagination.total_pages = response.pagination.total_pages;
  } catch {
    notifications.error(
      'Falha ao carregar',
      'Não foi possível consultar os usuários.',
    );
  } finally {
    isLoading.value = false;
    isRefreshing.value = false;
  }
}

async function applyFilters() {
  await fetchAccounts({ resetPage: true, silent: true });
}

async function clearFilters() {
  filters.search = '';
  filters.role = '';
  filters.document_type = '';
  filters.email_confirmed = 'all';
  filters.sort_by = 'created_at';
  filters.sort_order = 'desc';
  await fetchAccounts({ resetPage: true, silent: true });
}

async function goToPage(nextPage: number) {
  if (nextPage < 1 || nextPage > pagination.total_pages || nextPage === pagination.page) {
    return;
  }

  pagination.page = nextPage;
  await fetchAccounts({ silent: true });
}

async function submitForm() {
  const firstName = form.first_name.trim();
  const email = form.email.trim().toLowerCase();
  const document = form.document.trim();

  if (!firstName || !email || !document) {
    notifications.warning(
      'Campos obrigatórios',
      'Preencha nome, e-mail e documento para continuar.',
    );
    return;
  }

  if (!isEditing.value && form.password.trim().length < 8) {
    notifications.warning(
      'Senha inválida',
      'Para criar um usuário, informe uma senha com no mínimo 8 caracteres.',
    );
    return;
  }

  isSaving.value = true;

  try {
    if (isEditing.value && selectedId.value) {
      await accountsService.update(selectedId.value, {
        first_name: firstName,
        last_name: form.last_name.trim() || null,
        email,
        phone: form.phone.trim() || null,
        password: form.password.trim() || undefined,
        birthdate: form.birthdate ? toIsoDate(form.birthdate) : null,
        document,
        document_type: form.document_type,
        role: form.role,
        email_confirmed: form.email_confirmed,
      });

      notifications.success('Usuário atualizado', 'As alterações foram salvas.');
    } else {
      await accountsService.create({
        first_name: firstName,
        last_name: form.last_name.trim() || null,
        email,
        phone: form.phone.trim() || null,
        password: form.password.trim(),
        birthdate: form.birthdate ? toIsoDate(form.birthdate) : undefined,
        document,
        document_type: form.document_type,
        role: form.role,
        email_confirmed: form.email_confirmed,
      });

      notifications.success('Usuário criado', 'Novo registro criado com sucesso.');
    }

    startCreate();
    await fetchAccounts({ silent: true });
  } catch {
    notifications.error(
      'Falha ao salvar',
      'Não foi possível persistir os dados do usuário.',
    );
  } finally {
    isSaving.value = false;
  }
}

async function deleteAccount(item: AccountItem) {
  if (item.id === currentUserId.value) {
    notifications.warning(
      'Operação bloqueada',
      'Você não pode remover seu próprio usuário.',
    );
    return;
  }

  if (import.meta.client) {
    const confirmed = window.confirm(
      `Deseja realmente remover o usuário ${item.email}?`,
    );

    if (!confirmed) {
      return;
    }
  }

  deletingId.value = item.id;

  try {
    await accountsService.remove(item.id);
    notifications.success('Usuário removido', 'O usuário foi inativado com sucesso.');

    if (selectedId.value === item.id) {
      startCreate();
    }

    await fetchAccounts({ silent: true });
  } catch {
    notifications.error(
      'Falha ao remover',
      'Não foi possível remover o usuário selecionado.',
    );
  } finally {
    deletingId.value = null;
  }
}

async function handleSignOut() {
  await auth.signOut();
}

onMounted(async () => {
  startCreate();
  await fetchAccounts();
});
</script>

<template>
  <main class="accounts-page">
    <div class="accounts-glow accounts-glow--a" />
    <div class="accounts-glow accounts-glow--b" />

    <header class="accounts-header">
      <div>
        <p class="accounts-header__eyebrow">TripGate Security</p>
        <h1>Gestão de usuários</h1>
        <p class="accounts-header__subtitle">
          {{ userDisplayName }}, administre usuários, níveis de acesso e status de confirmação.
        </p>
      </div>

      <div class="accounts-header__actions">
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
            placeholder="Nome, e-mail ou documento"
          />
        </label>

        <label class="field">
          <span>Perfil</span>
          <select v-model="filters.role">
            <option value="">Todos</option>
            <option v-for="role in roleOptions" :key="role" :value="role">
              {{ role }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Documento</span>
          <select v-model="filters.document_type">
            <option value="">Todos</option>
            <option v-for="docType in documentTypeOptions" :key="docType" :value="docType">
              {{ docType }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Email confirmado</span>
          <select v-model="filters.email_confirmed">
            <option value="all">Todos</option>
            <option value="true">Confirmado</option>
            <option value="false">Não confirmado</option>
          </select>
        </label>

        <label class="field">
          <span>Ordenar por</span>
          <select v-model="filters.sort_by">
            <option value="created_at">Data de criação</option>
            <option value="first_name">Nome</option>
            <option value="email">Email</option>
          </select>
        </label>

        <label class="field">
          <span>Direção</span>
          <select v-model="filters.sort_order">
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
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
          <h2>Usuários cadastrados</h2>
          <span>Total: {{ pagination.total }}</span>
        </header>

        <section v-if="isLoading" class="state-box">
          <p>Carregando usuários...</p>
        </section>

        <section v-else-if="items.length === 0" class="state-box">
          <p>Nenhum usuário encontrado para os filtros selecionados.</p>
        </section>

        <div v-else class="table-wrap">
          <table class="accounts-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Documento</th>
                <th>Perfil</th>
                <th>Confirmado</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id" :class="{ 'is-selected': item.id === selectedId }">
                <td>
                  <strong>{{ item.first_name }} {{ item.last_name || '' }}</strong>
                </td>
                <td>{{ item.email }}</td>
                <td>{{ item.document }} ({{ item.document_type }})</td>
                <td>{{ item.role }}</td>
                <td>
                  {{ item.email_confirmed_at ? 'Sim' : 'Não' }}
                </td>
                <td>{{ formatDateTime(item.created_at) }}</td>
                <td>
                  <div class="row-actions">
                    <button class="ghost-btn ghost-btn--tiny" type="button" @click="startEdit(item)">
                      Editar
                    </button>
                    <button
                      class="danger-btn"
                      type="button"
                      :disabled="deletingId === item.id || item.id === currentUserId"
                      @click="deleteAccount(item)"
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
          <h2>{{ isEditing ? 'Editar usuário' : 'Novo usuário' }}</h2>
          <button class="ghost-btn ghost-btn--alt" type="button" @click="startCreate">
            Novo registro
          </button>
        </header>

        <form class="form-grid" @submit.prevent="submitForm">
          <label class="field">
            <span>Primeiro nome</span>
            <input v-model="form.first_name" type="text" maxlength="120" required />
          </label>

          <label class="field">
            <span>Último nome</span>
            <input v-model="form.last_name" type="text" maxlength="120" />
          </label>

          <label class="field">
            <span>Email</span>
            <input v-model="form.email" type="email" maxlength="160" required />
          </label>

          <label class="field">
            <span>Telefone</span>
            <input v-model="form.phone" type="text" maxlength="30" />
          </label>

          <label class="field">
            <span>Senha {{ isEditing ? '(opcional)' : '' }}</span>
            <input
              v-model="form.password"
              type="password"
              minlength="8"
              maxlength="72"
              :required="!isEditing"
            />
          </label>

          <label class="field">
            <span>Data de nascimento</span>
            <input v-model="form.birthdate" type="date" />
          </label>

          <label class="field">
            <span>Documento</span>
            <input v-model="form.document" type="text" maxlength="40" required />
          </label>

          <label class="field">
            <span>Tipo de documento</span>
            <select v-model="form.document_type">
              <option v-for="docType in documentTypeOptions" :key="docType" :value="docType">
                {{ docType }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Perfil</span>
            <select v-model="form.role">
              <option v-for="role in roleOptions" :key="role" :value="role">
                {{ role }}
              </option>
            </select>
          </label>

          <label class="field field--inline">
            <input v-model="form.email_confirmed" type="checkbox" />
            <span>Email confirmado</span>
          </label>

          <button class="solid-btn" type="submit" :disabled="isSaving">
            {{ isSaving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar usuário' }}
          </button>
        </form>
      </article>
    </section>
  </main>
</template>

<style scoped>
.accounts-page {
  min-height: 100vh;
  padding: clamp(0.9rem, 3vw, 1.7rem);
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 5% 0%, rgb(116 184 181 / 20%), transparent 34%),
    radial-gradient(circle at 98% 100%, rgb(242 122 46 / 16%), transparent 35%),
    linear-gradient(145deg, #e9eef2 0%, #dce8ee 100%);
}

.accounts-glow {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.accounts-glow--a {
  width: 16rem;
  height: 16rem;
  top: -5rem;
  right: -5rem;
  background: linear-gradient(145deg, rgb(245 181 46 / 40%), rgb(242 122 46 / 42%));
}

.accounts-glow--b {
  width: 14rem;
  height: 14rem;
  left: -5rem;
  bottom: -5rem;
  background: linear-gradient(145deg, rgb(28 95 148 / 24%), rgb(15 34 51 / 30%));
}

.accounts-header {
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

.accounts-header__eyebrow {
  margin: 0;
  color: #1c5f94;
  font: 700 0.74rem/1 'Work Sans', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.accounts-header h1 {
  margin: 0.42rem 0 0;
  color: #0f2233;
  font: 800 clamp(1.4rem, 3.7vw, 2rem) / 1.1 'REM', sans-serif;
}

.accounts-header__subtitle {
  margin: 0.6rem 0 0;
  color: rgb(15 34 51 / 76%);
  font: 500 0.88rem/1.45 'Work Sans', sans-serif;
}

.accounts-header__actions {
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
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
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

.accounts-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 48rem;
}

.accounts-table th,
.accounts-table td {
  padding: 0.62rem 0.54rem;
  border-bottom: 1px solid rgb(15 34 51 / 9%);
  text-align: left;
  color: #0f2233;
  font: 500 0.79rem/1.35 'Work Sans', sans-serif;
}

.accounts-table th {
  color: #1c5f94;
  font: 700 0.72rem/1 'Work Sans', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.accounts-table td strong {
  font: 700 0.82rem/1.2 'REM', sans-serif;
}

.accounts-table tr.is-selected {
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

.field--inline {
  display: flex;
  gap: 0.46rem;
  align-items: center;
}

.field--inline span {
  margin: 0;
  font: 600 0.8rem/1.2 'Work Sans', sans-serif;
  color: #0f2233;
  text-transform: none;
  letter-spacing: normal;
}

.field--inline input {
  width: auto;
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
  .accounts-header {
    flex-direction: column;
  }

  .accounts-header__actions {
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


