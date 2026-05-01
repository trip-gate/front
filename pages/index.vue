<script setup lang="ts">
const auth = useAuth();
const notifications = useNotifications();

const isAuthenticated = computed(() => auth.isAuthenticated.value);

function goToPortal() {
  if (isAuthenticated.value) {
    navigateTo('/dashboard');
    return;
  }

  notifications.info(
    'Acesso TripGate',
    'Faça login para continuar no dashboard.',
  );
  navigateTo('/entrar');
}
</script>

<template>
  <main class="home-page">
    <div class="bg-shape bg-shape--left" />
    <div class="bg-shape bg-shape--right" />

    <header class="topbar">
      <img src="/tripgate-logo.png" alt="TripGate" class="topbar__logo" />
      <nav class="topbar__actions">
        <NuxtLink class="ghost-btn" to="/entrar">Entrar</NuxtLink>
        <button class="solid-btn" type="button" @click="goToPortal">
          {{ isAuthenticated ? 'Abrir Painel' : 'Começar Agora' }}
        </button>
      </nav>
    </header>

    <section class="hero">
      <div class="hero__copy">
        <p class="eyebrow">Ecossistema TripGate</p>
        <h1>Gestão de viagens com foco em conversão, segurança e escala.</h1>
        <p class="description">
          Conecte atendimento comercial, orçamento e operação em um único fluxo digital.
          O login da plataforma leva você direto para o dashboard operacional.
        </p>
        <div class="hero__cta-row">
          <button class="solid-btn solid-btn--lg" type="button" @click="goToPortal">
            Ir para Dashboard
          </button>
          <NuxtLink class="ghost-btn ghost-btn--lg" to="/entrar">Acessar Conta</NuxtLink>
        </div>
      </div>

      <aside class="hero__panel">
        <h2>TripGate em números</h2>
        <ul>
          <li>
            <strong>+120</strong>
            <span>parceiros comerciais ativos</span>
          </li>
          <li>
            <strong>24/7</strong>
            <span>operação com monitoramento digital</span>
          </li>
          <li>
            <strong>SLA curto</strong>
            <span>resposta rápida para novas solicitações</span>
          </li>
        </ul>
      </aside>
    </section>

    <section class="pillars">
      <article>
        <h3>Confiabilidade</h3>
        <p>Arquitetura orientada a autenticação segura com renovação de sessão.</p>
      </article>
      <article>
        <h3>Produtividade</h3>
        <p>Fluxo de entrada simplificado para reduzir fricção no acesso do time.</p>
      </article>
      <article>
        <h3>Experiência Mobile</h3>
        <p>Interface desenhada com breakpoints reais e tipografia fluida.</p>
      </article>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  padding: 1.1rem;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 10% 5%, rgb(116 184 181 / 26%), transparent 32%),
    radial-gradient(circle at 90% 95%, rgb(28 95 148 / 18%), transparent 35%),
    linear-gradient(145deg, #e9eae8 0%, #cedde7 100%);
}

.bg-shape {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(1px);
}

.bg-shape--left {
  width: 16rem;
  height: 16rem;
  left: -5rem;
  top: 68%;
  background: linear-gradient(140deg, rgb(245 181 46 / 46%), rgb(242 122 46 / 48%));
}

.bg-shape--right {
  width: 20rem;
  height: 20rem;
  right: -7rem;
  top: -4rem;
  background: linear-gradient(140deg, rgb(15 34 51 / 24%), rgb(28 95 148 / 30%));
}

.topbar {
  width: min(74rem, 100%);
  margin: 0 auto;
  padding: 0.75rem clamp(0.8rem, 2.5vw, 1.25rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 1rem;
  border: 1px solid rgb(15 34 51 / 10%);
  background: rgb(255 255 255 / 72%);
  backdrop-filter: blur(7px);
}

.topbar__logo {
  width: clamp(6.8rem, 17vw, 8.4rem);
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.hero {
  width: min(74rem, 100%);
  margin: 1rem auto 0;
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.8fr);
}

.hero__copy {
  border-radius: 1.35rem;
  border: 1px solid rgb(15 34 51 / 9%);
  padding: clamp(1.3rem, 3.5vw, 2.3rem);
  background:
    radial-gradient(circle at 95% 10%, rgb(245 181 46 / 18%), transparent 36%),
    linear-gradient(130deg, rgb(15 34 51 / 96%), rgb(28 95 148 / 94%));
  color: #e9eae8;
  box-shadow: 0 26px 54px rgb(15 34 51 / 20%);
}

.eyebrow {
  margin: 0 0 0.65rem;
  color: #f5b52e;
  font: 700 0.8rem/1 'Work Sans', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero__copy h1 {
  margin: 0;
  font: 800 clamp(1.75rem, 4.6vw, 3rem) / 1.05 'REM', sans-serif;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.description {
  margin: 1rem 0 0;
  max-width: 55ch;
  font: 500 clamp(0.94rem, 2.1vw, 1.08rem) / 1.58 'Work Sans', sans-serif;
  color: rgb(233 234 232 / 90%);
}

.hero__cta-row {
  margin-top: 1.2rem;
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.hero__panel {
  border-radius: 1.35rem;
  padding: clamp(1.25rem, 3.3vw, 2rem);
  border: 1px solid rgb(15 34 51 / 12%);
  background: linear-gradient(155deg, rgb(255 255 255 / 88%), rgb(248 250 252 / 96%));
  box-shadow: 0 18px 40px rgb(15 34 51 / 12%);
}

.hero__panel h2 {
  margin: 0 0 1rem;
  font: 700 clamp(1.15rem, 3.2vw, 1.45rem) / 1.2 'REM', sans-serif;
  color: #0f2233;
}

.hero__panel ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.75rem;
}

.hero__panel li {
  padding: 0.8rem 0.9rem;
  border: 1px solid rgb(28 95 148 / 20%);
  border-radius: 0.95rem;
  background: linear-gradient(130deg, rgb(206 221 231 / 30%), rgb(233 234 232 / 70%));
  display: grid;
  gap: 0.2rem;
}

.hero__panel strong {
  font: 800 1.05rem/1 'REM', sans-serif;
  color: #1c5f94;
}

.hero__panel span {
  font: 500 0.86rem/1.35 'Work Sans', sans-serif;
  color: rgb(15 34 51 / 78%);
}

.pillars {
  width: min(74rem, 100%);
  margin: 1rem auto 0;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.pillars article {
  border-radius: 1rem;
  border: 1px solid rgb(15 34 51 / 10%);
  background: rgb(255 255 255 / 78%);
  backdrop-filter: blur(6px);
  padding: 1rem;
}

.pillars h3 {
  margin: 0;
  font: 700 1.06rem/1.2 'REM', sans-serif;
  color: #0f2233;
}

.pillars p {
  margin: 0.5rem 0 0;
  font: 500 0.89rem/1.45 'Work Sans', sans-serif;
  color: rgb(15 34 51 / 77%);
}

.solid-btn,
.ghost-btn {
  border-radius: 0.85rem;
  font: 700 0.88rem/1 'REM', sans-serif;
  padding: 0.75rem 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.solid-btn {
  border: 0;
  color: #0f2233;
  background: linear-gradient(115deg, #f5b52e 10%, #f27a2e 92%);
  box-shadow: 0 12px 24px rgb(242 122 46 / 34%);
}

.solid-btn:hover {
  transform: translateY(-1px);
}

.solid-btn--lg {
  padding-inline: 1.2rem;
}

.ghost-btn {
  border: 1px solid rgb(15 34 51 / 28%);
  background: rgb(255 255 255 / 72%);
  color: #0f2233;
}

.ghost-btn--lg {
  border-color: rgb(233 234 232 / 30%);
  color: #e9eae8;
  background: rgb(233 234 232 / 10%);
}

@media (max-width: 980px) {
  .home-page {
    padding: 0.85rem;
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .pillars {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .topbar {
    padding: 0.7rem 0.75rem;
    align-items: flex-start;
    flex-direction: column;
    gap: 0.65rem;
  }

  .topbar__actions {
    width: 100%;
    justify-content: space-between;
  }

  .hero__cta-row {
    flex-direction: column;
    align-items: stretch;
  }

  .solid-btn,
  .ghost-btn {
    width: 100%;
    text-align: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .solid-btn,
  .ghost-btn {
    transition: none;
  }
}
</style>
