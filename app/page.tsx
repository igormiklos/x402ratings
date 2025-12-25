"use client";

import {createClient} from "@supabase/supabase-js";
import {useEffect, useState} from "react";
import {RainbowKitProvider, getDefaultConfig, lightTheme, ConnectButton} from "@rainbow-me/rainbowkit";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {WagmiProvider} from "wagmi";
import {base} from "wagmi/chains";
import StarRating from "./components/StarRating";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const config = getDefaultConfig({
  appName: "x402ratings",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [base],
});

const queryClient = new QueryClient();

// Generate consistent avatar color from string
function getAvatarColor(name: string) {
  const colors = ["bg-blue-600", "bg-purple-600", "bg-pink-600", "bg-green-600", "bg-yellow-600", "bg-red-600", "bg-indigo-600", "bg-cyan-600"];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function Home() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({url: "", name: "", description: ""});

  async function loadServices() {
    const {data} = await supabase.from("services").select("*").order("rating_count", {ascending: false});
    setServices(data || []);
    setLoading(false);
  }

  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.("cca-lite.coinbase.com") || args[0]?.toString?.().includes?.("Failed to fetch")) {
        return;
      }
      originalError.apply(console, args);
    };

    loadServices();

    return () => {
      console.error = originalError;
    };
  }, []);

  async function handleAddService() {
    if (!formData.url || !formData.name) return;

    await supabase.from("services").insert({
      url: formData.url,
      name: formData.name,
      description: formData.description || null,
      rating_sum: 0,
      rating_count: 0,
    });

    setFormData({url: "", name: "", description: ""});
    setFormOpen(false);
    loadServices();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-gray-400 text-lg">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme()}
          appInfo={{
            appName: "x402ratings",
            disclaimer: undefined,
          }}
        >
          <div className="min-h-screen bg-gray-950">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white">x402ratings</h1>
                    <p className="text-sm text-gray-400 mt-1">
                      The dumbest <span className="text-gray-500">(not really)</span>, fastest reputation layer
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <ConnectButton />
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Admin Section */}
              {true && (
                <div className="mb-8">
                  <button
                    onClick={() => setFormOpen(!formOpen)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors border border-gray-700"
                  >
                    <span className="text-lg">{formOpen ? "−" : "+"}</span>
                    <span className="text-sm font-medium">Add Service</span>
                    <span className="text-xs text-gray-500">(admin)</span>
                  </button>

                  {formOpen && (
                    <div className="mt-4 bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Service URL</label>
                          <input
                            type="url"
                            placeholder="https://example.com"
                            value={formData.url}
                            onChange={(e) => setFormData({...formData, url: e.target.value})}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Service Name</label>
                          <input
                            placeholder="My Awesome Service"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                          <textarea
                            placeholder="Brief description of the service..."
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleAddService}
                            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors"
                          >
                            Add Service
                          </button>
                          <button
                            onClick={() => setFormOpen(false)}
                            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Services Grid */}
              <div className="space-y-4">
                {services.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🤷</div>
                    <p className="text-xl text-gray-400">No services yet.</p>
                    <p className="text-gray-500 mt-2">Be the first to add one.</p>
                  </div>
                ) : (
                  services.map((s) => {
                    const avgRating = s.rating_count === 0 ? 0 : s.rating_sum / s.rating_count;
                    const fullStars = Math.floor(avgRating);
                    const hasHalfStar = avgRating % 1 >= 0.5;

                    return (
                      <div key={s.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-lg p-6 transition-all">
                        <div className="flex gap-4">
                          {/* Avatar */}
                          <div className={`w-16 h-16 rounded-lg ${getAvatarColor(s.name)} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-2xl font-bold text-white">{s.name.charAt(0).toUpperCase()}</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-semibold text-white mb-1 truncate">{s.name}</h2>
                                <a
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:text-cyan-300 text-sm truncate block transition-colors"
                                >
                                  {s.url}
                                </a>
                              </div>

                              {/* Rating Display */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="text-yellow-400 text-lg flex">
                                  {[...Array(5)].map((_, i) => {
                                    if (i < fullStars) {
                                      return <span key={i}>★</span>;
                                    } else if (i === fullStars && hasHalfStar) {
                                      return (
                                        <span key={i} className="relative inline-block">
                                          <span className="text-gray-700">★</span>
                                          <span className="absolute inset-0 overflow-hidden" style={{width: "50%"}}>
                                            ★
                                          </span>
                                        </span>
                                      );
                                    } else {
                                      return (
                                        <span key={i} className="text-gray-700">
                                          ★
                                        </span>
                                      );
                                    }
                                  })}
                                </div>
                                <span className="text-sm text-gray-400">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</span>
                                <span className="text-xs text-gray-500">({s.rating_count})</span>
                              </div>
                            </div>

                            {s.description && <p className="text-gray-400 text-sm mb-4 line-clamp-2">{s.description}</p>}

                            {/* Star Rating Component */}
                            <StarRating
                              serviceId={s.id}
                              currentRating={Math.round(avgRating)}
                              ratingCount={s.rating_count || 0}
                              onRatingUpdate={loadServices}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-800 mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500 text-sm">
                <p>Built for the x402 ecosystem</p>
              </div>
            </footer>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
