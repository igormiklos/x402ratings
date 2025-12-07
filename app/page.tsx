'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  async function loadServices() {
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('rating_count', { ascending: false })
    setServices(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadServices()
  }, [])

  async function addService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    
    await supabase.from('services').insert({
      url: formData.get('url'),
      name: formData.get('name'),
      description: formData.get('description') || null,
      rating_sum: 0,
      rating_count: 0,
    })

    form.reset()
    setFormOpen(false)
    loadServices()
  }

  if (loading) return <div className="p-16 text-4xl text-center">Loading...</div>

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-6xl font-bold mb-2">x402ratings.com</h1>
      <p className="text-xl mb-8 text-cyan-400">The dumbest, fastest reputation layer for x402</p>

      <button 
        onClick={() => setFormOpen(!formOpen)}
        className="mb-8 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xl font-bold"
      >
        {formOpen ? 'Cancel' : '+ Add Service'}
      </button>

      {formOpen && (
        <form onSubmit={addService} className="bg-gray-900 p-6 rounded-lg mb-8 max-w-2xl">
          <input name="url" placeholder="https://api.example.com" required className="w-full mb-4 p-3 bg-gray-800 rounded" />
          <input name="name" placeholder="Service name" required className="w-full mb-4 p-3 bg-gray-800 rounded" />
          <textarea name="description" placeholder="What does it do? (optional)" className="w-full mb-4 p-3 bg-gray-800 rounded h-24" />
          <button type="submit" className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded font-bold">Submit</button>
        </form>
      )}

      <div className="grid gap-6 max-w-4xl">
        {services.length === 0 ? (
          <p className="text-2xl text-gray-500">No services yet. Be the first motherfucker.</p>
        ) : (
          services.map((s) => (
            <div key={s.id} className="bg-gray-900 p-6 rounded-lg border border-gray-800 hover:border-cyan-600 transition">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold">{s.name}</h2>
                  <a href={s.url} target="_blank" className="text-cyan-400 hover:underline text-lg">{s.url}</a>
                  {s.description && <p className="text-gray-400 mt-2">{s.description}</p>}
                </div>
                <div className="text-right">
                  <div className="text-5xl">
                {"★".repeat(s.rating_count === 0 ? 0 : Math.round(s.rating_sum / s.rating_count))}
                {"☆".repeat(s.rating_count === 0 ? 5 : 5 - Math.round(s.rating_sum / s.rating_count))}
                  </div>
                  <p className="text-sm text-gray-500">{s.rating_count || 0} votes</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}