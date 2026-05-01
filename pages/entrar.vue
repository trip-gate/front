<script setup lang="ts">
import type { FetchError } from 'ofetch';

type FeedbackType = 'success' | 'error' | '';

const auth = useAuth();
const notifications = useNotifications();

const form = reactive({
  email: '',
  password: '',
});

const isLoading = ref(false);
const feedback = ref('');
const feedbackType = ref<FeedbackType>('');

function resolveErrorMessage(error: unknown): string {
  const fetchError = error as FetchError<{ message?: string | string[] }>;
  const statusCode = fetchError?.statusCode ?? fetchError?.response?.status;
  const rawMessage = fetchError?.data?.message;
  const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;

  if (statusCode === 401) {
    return 'E-mail ou senha inválidos.';
  }

  if (statusCode === 403 && message === 'Confirm your email') {
    return 'Confirme seu e-mail para continuar.';
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return 'Não foi possível autenticar no momento. Tente novamente.';
}

async function redirectIfAlreadyAuthenticated() {
  const loggedIn = await auth.ensureAuthenticated();
  if (loggedIn) {
    await navigateTo('/solicitacoes-orcamento');
  }
}

async function onSubmit() {
  feedback.value = '';
  feedbackType.value = '';

  const email = form.email.trim().toLowerCase();
  const password = form.password.trim();

  if (!email || !password) {
    feedback.value = 'Preencha e-mail e senha.';
    feedbackType.value = 'error';
    notifications.warning('Campos obrigatórios', 'Informe e-mail e senha para entrar.');
    return;
  }

  isLoading.value = true;

  try {
    await auth.signIn({ email, password });
    feedback.value = 'Login realizado com sucesso. Redirecionando...';
    feedbackType.value = 'success';
    notifications.success('Acesso liberado', 'Redirecionando para solicitações de orçamento.');
    await navigateTo('/solicitacoes-orcamento');
  } catch (error) {
    const message = resolveErrorMessage(error);
    feedback.value = message;
    feedbackType.value = 'error';
    notifications.error('Falha no login', message);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  redirectIfAlreadyAuthenticated();
});
</script>

<template>
  <main class="login-home">
    <div class="bg-orb bg-orb-a" />
    <div class="bg-orb bg-orb-b" />

    <section class="login-shell">
      <aside class="brand-pane">
        <div class="brand-pane__logo-wrap">
          <img class="brand-pane__logo" src="/tripgate-logo.png" alt="TripGate Viagens" />
        </div>
        <h1 class="brand-pane__title">Conexões que transformam a forma de viajar.</h1>
        <p class="brand-pane__text">
          Faça login para seguir para o painel de solicitações e manter o fluxo comercial
          centralizado.
        </p>

        <div class="brand-pane__chips">
          <span>Autenticação segura</span>
          <span>Resposta rápida</span>
          <span>Operação inteligente</span>
        </div>
      </aside>

      <section class="login-pane">
        <NuxtLink class="login-pane__back" to="/">← Voltar para home</NuxtLink>
        <img class="login-pane__logo" src="/tripgate-logo.png" alt="TripGate Viagens" />
        <h2 class="login-pane__title">Acesse sua conta</h2>
        <p class="login-pane__subtitle">Use seu e-mail e senha para continuar.</p>

        <form class="login-form" @submit.prevent="onSubmit">
          <label class="field-label" for="email">E-mail</label>
          <input
            id="email"
            v-model="form.email"
            class="field-input"
            type="email"
            autocomplete="email"
            placeholder="voce@tripgate.com.br"
            required
          />

          <label class="field-label" for="password">Senha</label>
          <input
            id="password"
            v-model="form.password"
            class="field-input"
            type="password"
            autocomplete="current-password"
            placeholder="Digite sua senha"
            minlength="8"
            maxlength="72"
            required
          />

          <button class="submit-button" type="submit" :disabled="isLoading">
            {{ isLoading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <p v-if="feedback" :class="['feedback', `feedback--${feedbackType}`]">
          {{ feedback }}
        </p>
      </section>
    </section>
  </main>
</template>

<style scoped>
.login-home {
  position: relative;
  display: grid;
  min-height: 100vh;
  padding: 1.25rem;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 10% 0%, rgb(116 184 181 / 45%), transparent 30%),
    radial-gradient(circle at 100% 100%, rgb(28 95 148 / 26%), transparent 36%),
    linear-gradient(140deg, #e9eae8 0%, #cedde7 62%, #d9d9d9 100%);
}

.bg-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(1px);
  pointer-events: none;
}

.bg-orb-a {
  width: 20rem;
  height: 20rem;
  top: -5rem;
  right: -3rem;
  opacity: 0.82;
  background: linear-gradient(145deg, rgb(245 181 46 / 70%), rgb(242 122 46 / 78%));
}

.bg-orb-b {
  width: 16rem;
  height: 16rem;
  bottom: -5rem;
  left: -3rem;
  opacity: 0.5;
  background: linear-gradient(145deg, rgb(28 95 148 / 55%), rgb(15 34 51 / 62%));
}

.login-shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.05fr minmax(19rem, 28rem);
  width: min(72rem, 100%);
  min-height: 40rem;
  border: 1px solid rgb(15 34 51 / 10%);
  border-radius: 1.5rem;
  overflow: hidden;
  background: rgb(233 234 232 / 74%);
  backdrop-filter: blur(10px);
  box-shadow:
    0 35px 95px rgb(15 34 51 / 18%),
    inset 0 1px 0 rgb(255 255 255 / 42%);
}

.brand-pane {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.1rem;
  padding: clamp(1.4rem, 3.6vw, 3rem);
  background:
    linear-gradient(125deg, rgb(15 34 51 / 97%), rgb(28 95 148 / 96%) 48%, rgb(15 34 51 / 94%)),
    radial-gradient(circle at 90% 10%, rgb(245 181 46 / 28%), transparent 36%);
  color: #e9eae8;
}

.brand-pane__logo {
  width: clamp(8.8rem, 20vw, 11rem);
}

.brand-pane__logo-wrap {
  display: inline-flex;
  width: fit-content;
  padding: 0.6rem 0.9rem;
  border: 1px solid rgb(233 234 232 / 35%);
  border-radius: 0.9rem;
  background: linear-gradient(145deg, rgb(233 234 232 / 96%), rgb(206 221 231 / 88%));
}

.brand-pane__title {
  margin: 0;
  font: 700 clamp(1.65rem, 4vw, 2.25rem) / 1.1 'REM', sans-serif;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.brand-pane__text {
  margin: 0;
  max-width: 45ch;
  font-size: 1rem;
  line-height: 1.55;
  color: rgb(233 234 232 / 90%);
}

.brand-pane__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.brand-pane__chips span {
  padding: 0.55rem 0.8rem;
  border: 1px solid rgb(245 181 46 / 45%);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #f5b52e;
  background: rgb(245 181 46 / 10%);
}

.login-pane {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.65rem;
  padding: clamp(1.4rem, 3vw, 2.4rem);
  background: linear-gradient(180deg, #fff 0%, #f8f9f7 100%);
}

.login-pane__back {
  width: fit-content;
  margin-bottom: 0.2rem;
  color: #1c5f94;
  font: 600 0.8rem/1 'Work Sans', sans-serif;
  text-decoration: none;
}

.login-pane__logo {
  width: 9.6rem;
  margin-bottom: 0.4rem;
}

.login-pane__title {
  margin: 0;
  font: 700 1.85rem/1.12 'REM', sans-serif;
  letter-spacing: -0.02em;
  color: #0f2233;
}

.login-pane__subtitle {
  margin: 0 0 0.85rem;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgb(15 34 51 / 72%);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.field-label {
  margin-top: 0.1rem;
  font-size: 0.84rem;
  font-weight: 600;
  color: #1c5f94;
}

.field-input {
  width: 100%;
  padding: 0.83rem 0.82rem 0.79rem;
  border: 1px solid rgb(15 34 51 / 18%);
  border-radius: 0.72rem;
  outline: none;
  font: 500 0.95rem/1.2 'Work Sans', sans-serif;
  color: #0f2233;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field-input::placeholder {
  color: rgb(15 34 51 / 45%);
}

.field-input:focus {
  border-color: #1c5f94;
  box-shadow: 0 0 0 4px rgb(116 184 181 / 23%);
}

.submit-button {
  margin-top: 0.8rem;
  border: none;
  border-radius: 0.86rem;
  padding: 0.85rem 0.9rem;
  cursor: pointer;
  font: 700 0.95rem/1 'REM', sans-serif;
  color: #0f2233;
  background: linear-gradient(115deg, #f5b52e 8%, #f27a2e 92%);
  box-shadow:
    0 12px 26px rgb(242 122 46 / 34%),
    inset 0 1px 0 rgb(255 255 255 / 32%);
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.submit-button:disabled {
  cursor: not-allowed;
  filter: grayscale(0.25);
  opacity: 0.84;
}

.feedback {
  margin: 0.35rem 0 0;
  padding: 0.75rem 0.8rem;
  border-radius: 0.65rem;
  font-size: 0.82rem;
  font-weight: 600;
}

.feedback--success {
  color: #0f2233;
  background: rgb(116 184 181 / 28%);
}

.feedback--error {
  color: #7a2f06;
  background: rgb(242 122 46 / 22%);
}

@media (max-width: 980px) {
  .login-home {
    padding: 0.9rem;
  }

  .login-shell {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .brand-pane {
    padding: 1.4rem 1.2rem;
  }

  .login-pane {
    padding: 1.35rem 1.1rem 1.6rem;
  }
}

@media (max-width: 640px) {
  .brand-pane__chips {
    gap: 0.45rem;
  }

  .brand-pane__chips span {
    font-size: 0.73rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .submit-button {
    transition: none;
  }
}
</style>

