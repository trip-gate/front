<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useAuthService } from '~/services/auth.service';

type FeedbackType = 'success' | 'error' | '';

const authService = useAuthService();
const runtimeConfig = useRuntimeConfig();

const form = reactive({
  email: '',
  password: '',
});

const isLoading = ref(false);
const feedback = ref('');
const feedbackType = ref<FeedbackType>('');

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'data' in error) {
    const payload = (error as { data?: { message?: string | string[] } }).data;
    if (Array.isArray(payload?.message)) {
      return payload.message.join(', ');
    }
    if (typeof payload?.message === 'string') {
      return payload.message;
    }
  }

  return 'Nao foi possivel autenticar com o backend local.';
}

async function onSubmit() {
  feedback.value = '';
  feedbackType.value = '';
  isLoading.value = true;

  try {
    await authService.login({
      email: form.email,
      password: form.password,
    });

    feedback.value = 'Login enviado com sucesso para o backend.';
    feedbackType.value = 'success';
  } catch (error) {
    feedback.value = getErrorMessage(error);
    feedbackType.value = 'error';
  } finally {
    isLoading.value = false;
  }
}
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
        <h1 class="brand-pane__title">Conexoes que transformam a forma de viajar.</h1>
        <p class="brand-pane__text">
          Hub de negocios no turismo com inteligencia comercial, distribuicao digital e atendimento
          consultivo.
        </p>

        <div class="brand-pane__chips">
          <span>Curadoria estrategica</span>
          <span>Modelo hibrido</span>
          <span>Escala com confianca</span>
        </div>
      </aside>

      <section class="login-pane">
        <img class="login-pane__logo" src="/tripgate-logo.png" alt="TripGate Viagens" />
        <h2 class="login-pane__title">Acesse sua conta</h2>
        <p class="login-pane__subtitle">
          Use seu e-mail e senha para testar a integracao com o backend local.
        </p>

        <form class="login-form" @submit.prevent="onSubmit">
          <label class="field-label" for="email">E-mail</label>
          <input
            id="email"
            v-model="form.email"
            class="field-input"
            type="email"
            autocomplete="email"
            placeholder="voce@tripgate.com"
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
            required
          />

          <button class="submit-button" type="submit" :disabled="isLoading">
            {{ isLoading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <p class="api-target">API local: {{ runtimeConfig.public.apiBaseUrl }}</p>
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
  padding: 32px;
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
  width: 520px;
  height: 520px;
  top: -140px;
  right: -90px;
  opacity: 0.82;
  background: linear-gradient(145deg, rgb(245 181 46 / 70%), rgb(242 122 46 / 78%));
}

.bg-orb-b {
  width: 380px;
  height: 380px;
  bottom: -160px;
  left: -110px;
  opacity: 0.5;
  background: linear-gradient(145deg, rgb(138 110 219 / 70%), rgb(28 95 148 / 60%));
}

.login-shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.05fr minmax(360px, 470px);
  width: min(1160px, 100%);
  min-height: 680px;
  border: 1px solid rgb(15 34 51 / 10%);
  border-radius: 28px;
  overflow: hidden;
  background: rgb(233 234 232 / 74%);
  backdrop-filter: blur(10px);
  box-shadow:
    0 35px 95px rgb(15 34 51 / 18%),
    inset 0 1px 0 rgb(255 255 255 / 42%);
  animation: rise-in 0.8s ease-out;
}

.brand-pane {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  padding: 48px 56px;
  background:
    linear-gradient(125deg, rgb(15 34 51 / 97%), rgb(28 95 148 / 96%) 48%, rgb(15 34 51 / 94%)),
    radial-gradient(circle at 90% 10%, rgb(245 181 46 / 28%), transparent 36%);
  color: #e9eae8;
}

.brand-pane__logo {
  width: 180px;
  max-width: 100%;
}

.brand-pane__logo-wrap {
  display: inline-flex;
  width: fit-content;
  padding: 10px 14px;
  border: 1px solid rgb(233 234 232 / 35%);
  border-radius: 14px;
  background: linear-gradient(145deg, rgb(233 234 232 / 96%), rgb(206 221 231 / 88%));
  box-shadow:
    0 12px 28px rgb(15 34 51 / 26%),
    inset 0 1px 0 rgb(255 255 255 / 36%);
}

.brand-pane__title {
  margin: 0;
  font: 700 2.2rem/1.1 'REM', sans-serif;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.brand-pane__text {
  margin: 0;
  max-width: 46ch;
  font-size: 1.05rem;
  line-height: 1.55;
  color: rgb(233 234 232 / 90%);
}

.brand-pane__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.brand-pane__chips span {
  padding: 10px 14px;
  border: 1px solid rgb(245 181 46 / 45%);
  border-radius: 999px;
  font-size: 0.83rem;
  font-weight: 600;
  color: #f5b52e;
  background: rgb(245 181 46 / 10%);
}

.login-pane {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 48px 38px;
  background: linear-gradient(180deg, #fff 0%, #f8f9f7 100%);
}

.login-pane__logo {
  width: 152px;
  margin-bottom: 8px;
}

.login-pane__title {
  margin: 0;
  font: 700 2rem/1.12 'REM', sans-serif;
  letter-spacing: -0.02em;
  color: #0f2233;
}

.login-pane__subtitle {
  margin: 0 0 14px;
  font-size: 0.98rem;
  line-height: 1.5;
  color: rgb(15 34 51 / 72%);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-label {
  margin-top: 4px;
  font-size: 0.86rem;
  font-weight: 600;
  color: #1c5f94;
}

.field-input {
  width: 100%;
  padding: 14px 14px 13px;
  border: 1px solid rgb(15 34 51 / 18%);
  border-radius: 12px;
  outline: none;
  font: 500 0.98rem/1.2 'Work Sans', sans-serif;
  color: #0f2233;
  background: #fff;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.field-input::placeholder {
  color: rgb(15 34 51 / 45%);
}

.field-input:focus {
  border-color: #1c5f94;
  box-shadow:
    0 0 0 4px rgb(116 184 181 / 23%),
    0 7px 24px rgb(15 34 51 / 11%);
  transform: translateY(-1px);
}

.submit-button {
  margin-top: 14px;
  border: none;
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  font: 700 1rem/1 'REM', sans-serif;
  color: #0f2233;
  background: linear-gradient(115deg, #f5b52e 8%, #f27a2e 92%);
  box-shadow:
    0 12px 26px rgb(242 122 46 / 34%),
    inset 0 1px 0 rgb(255 255 255 / 32%);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow:
    0 16px 30px rgb(242 122 46 / 40%),
    inset 0 1px 0 rgb(255 255 255 / 38%);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  cursor: not-allowed;
  filter: grayscale(0.25);
  opacity: 0.8;
}

.api-target {
  margin: 14px 0 0;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.77rem;
  color: rgb(15 34 51 / 75%);
  background: rgb(206 221 231 / 42%);
}

.feedback {
  margin: 10px 0 0;
  padding: 11px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
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

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 980px) {
  .login-home {
    padding: 20px;
  }

  .login-shell {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .brand-pane {
    padding: 34px 26px;
  }

  .brand-pane__title {
    font-size: 1.8rem;
  }

  .login-pane {
    padding: 32px 24px;
  }
}
</style>
