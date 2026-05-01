export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth();
  const isAuthenticated = await auth.ensureAuthenticated();

  if (!isAuthenticated) {
    return navigateTo('/entrar');
  }
});

