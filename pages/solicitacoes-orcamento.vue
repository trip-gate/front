<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
});

const auth = useAuth();
const notifications = useNotifications();

const userDisplayName = computed(() => {
  const user = auth.user.value;
  if (!user) {
    return 'Usuário';
  }

  const firstName = user.first_name?.trim();
  const lastName = user.last_name?.trim();
  return [firstName, lastName].filter(Boolean).join(' ');
});

async function handleSignOut() {
  await auth.signOut();
}

function notifyPlaceholder() {
  notifications.info(
    'Módulo em evolução',
    'A definição funcional desta tela será detalhada no próximo prompt.',
  );
}
</script>

<template>
  <main class="dashboard-page">
    <header class="dashboard-header">
      <div>
        <p class="dashboard-header__eyebrow">TripGate</p>
        <h1>Solicitações de Orçamento</h1>
        <p class="dashboard-header__subtitle">
          Bem-vindo, {{ userDisplayName }}. Sua sessão foi autenticada com sucesso.
        </p>
      </div>
      <button class="ghost-btn" type="button" @click="handleSignOut">Sair</button>
    </header>

    <section class="grid-cards">
      <article>
        <h2>Fluxo autenticado</h2>
        <p>Login concluído e redirecionamento aplicado conforme regra para esta rota.</p>
      </article>
      <article>
        <h2>Próximos requisitos</h2>
        <p>Os comportamentos de negócio desta página serão implementados no próximo passo.</p>
      </article>
      <article>
        <h2>Integrações prontas</h2>
        <p>A infraestrutura de token e renovação de sessão já está ativa para novas APIs.</p>
      </article>
    </section>

    <button class="primary-btn" type="button" @click="notifyPlaceholder">
      Ver estado da implementação
    </button>
  </main>
</template>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  padding: clamp(1rem, 3vw, 2rem);
  background:
    radial-gradient(circle at 85% 10%, rgb(116 184 181 / 20%), transparent 34%),
    linear-gradient(145deg, #f2f6f8 0%, #e9eef2 100%);
}

.dashboard-header {
  width: min(70rem, 100%);
  margin: 0 auto;
  border-radius: 1.1rem;
  padding: clamp(1.1rem, 3vw, 1.6rem);
  border: 1px solid rgb(15 34 51 / 10%);
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.dashboard-header__eyebrow {
  margin: 0 0 0.35rem;
  color: #1c5f94;
  font: 700 0.76rem/1 'Work Sans', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dashboard-header h1 {
  margin: 0;
  color: #0f2233;
  font: 800 clamp(1.55rem, 3.8vw, 2.2rem) / 1.06 'REM', sans-serif;
}

.dashboard-header__subtitle {
  margin: 0.65rem 0 0;
  color: rgb(15 34 51 / 75%);
  font: 500 0.92rem/1.45 'Work Sans', sans-serif;
}

.grid-cards {
  width: min(70rem, 100%);
  margin: 0.95rem auto 0;
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid-cards article {
  padding: 1rem;
  border-radius: 0.9rem;
  border: 1px solid rgb(15 34 51 / 12%);
  background: rgb(255 255 255 / 88%);
}

.grid-cards h2 {
  margin: 0;
  color: #0f2233;
  font: 700 1.02rem/1.15 'REM', sans-serif;
}

.grid-cards p {
  margin: 0.5rem 0 0;
  color: rgb(15 34 51 / 78%);
  font: 500 0.86rem/1.4 'Work Sans', sans-serif;
}

.primary-btn,
.ghost-btn {
  border-radius: 0.8rem;
  cursor: pointer;
  font: 700 0.86rem/1 'REM', sans-serif;
  transition: transform 0.2s ease;
}

.primary-btn {
  display: block;
  margin: 0.95rem auto 0;
  width: min(70rem, 100%);
  border: 0;
  padding: 0.85rem 1rem;
  color: #0f2233;
  background: linear-gradient(115deg, #f5b52e 8%, #f27a2e 92%);
}

.ghost-btn {
  border: 1px solid rgb(15 34 51 / 24%);
  background: rgb(255 255 255 / 88%);
  color: #0f2233;
  padding: 0.7rem 0.9rem;
}

.primary-btn:hover,
.ghost-btn:hover {
  transform: translateY(-1px);
}

@media (max-width: 960px) {
  .grid-cards {
    grid-template-columns: 1fr;
  }

  .dashboard-header {
    flex-direction: column;
  }

  .ghost-btn {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .primary-btn,
  .ghost-btn {
    transition: none;
  }
}
</style>

