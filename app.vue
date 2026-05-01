<script setup lang="ts">
const auth = useAuth();
auth.hydrateFromToken();
</script>

<template>
  <NuxtPage />
  <AppNotifications />
</template>
