// Registro explícito de service worker no padrão recomendado pelo PWABuilder.
(function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(function (registration) {
        registration.update();
      })
      .catch(function (error) {
        console.warn("Falha ao registrar service worker:", error);
      });
  });
})();
