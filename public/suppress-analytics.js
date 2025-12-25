(function() {
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    try {
      return await originalFetch(...args);
    } catch (error) {
      if (args[0]?.toString().includes('cca-lite.coinbase.com')) {
        return new Response(null, { status: 200 });
      }
      throw error;
    }
  };
})();