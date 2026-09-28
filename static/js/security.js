const APIManager = {
  isPWA: function() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://');
  },

  saveKey: function(provider, apiKey) {
    if (!apiKey) return;
    if (this.isPWA()) {
      localStorage.setItem(`api_key_${provider}`, apiKey);
      return { storage: 'local', msg: 'Chave salva com segurança no PWA!' };
    } else {
      sessionStorage.setItem(`api_key_${provider}`, apiKey);
      return { storage: 'session', msg: 'Acesso via navegador. Chave salva temporariamente apenas nesta sessão.' };
    }
  },

  getKey: function(provider) {
    if (this.isPWA()) {
      return localStorage.getItem(`api_key_${provider}`) || sessionStorage.getItem(`api_key_${provider}`);
    }
    return sessionStorage.getItem(`api_key_${provider}`);
  },

  sanitize: function() {
    if (!this.isPWA()) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('api_key_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('[Segurança] Modo Web detectado: Limpeza de chaves executada no localStorage.');
    } else {
      console.log('[Segurança] Modo PWA ativo: Armazenamento local seguro.');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  APIManager.sanitize();
});