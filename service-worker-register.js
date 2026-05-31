// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registered successfully:', registration);
      })
      .catch(error => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

// Handle service worker updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('✅ Service Worker updated');
  });
}

// Periodic background sync (optional)
if ('periodicSync' in ServiceWorkerRegistration.prototype) {
  navigator.serviceWorker.ready.then(async (registration) => {
    try {
      await registration.periodicSync.register('update-cache', {
        minInterval: 24 * 60 * 60 * 1000 // Daily
      });
      console.log('✅ Periodic sync registered');
    } catch (error) {
      console.log('Periodic sync not supported:', error);
    }
  });
}
