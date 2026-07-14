
import Link from "next/link";
import Image from "next/image";
import {
  brand,
  destinations,
  categories,
  featuredEvents,
  impactStats,
} from "@/lib/content";

export default function Home() {
  return (
    <main className="min-h-screen pb-20">

      {/* Hero Section - Bold & Clean */}
      <section className="mx-auto max-w-7xl px-6 pt-24 pb-16 md:pt-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8">
            <div className="badge bg-rose-50 text-rose-600 border border-rose-100">
              Now live in 12 cities
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-gray-900 md:text-8xl leading-[0.9]">
              Events, <br />
              <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">Reimagined.</span>
            </h1>
            <p className="max-w-md text-xl font-medium text-gray-500 leading-relaxed">
              Discover the most curated events across Africa. From underground raves to tech summits.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/events"
                className="h-12 px-8 rounded-full bg-gradient-to-r from-rose-600 to-orange-500 text-white font-bold flex items-center justify-center shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:-translate-y-0.5 transition-all"
              >
                Explore Events
              </Link>
              <Link
                href="/organizers"
                className="h-12 px-8 rounded-full border-2 border-gray-200 text-gray-900 font-bold flex items-center justify-center hover:border-rose-500 hover:text-rose-600 transition-colors"
              >
                Create Event
              </Link>
            </div>
            {/* Search Input - Minimal */}
            <div className="relative max-w-sm">
              <input
                className="w-full h-12 pl-4 pr-12 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                placeholder="Search events..."
              />
              <button className="absolute right-2 top-2 bottom-2 aspect-square bg-gradient-to-br from-rose-500 to-orange-500 rounded-lg flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all">
                →
              </button>
            </div>
          </div>

          {/* Hero Visual - Grid Collage */}
          <div className="relative grid grid-cols-2 gap-4">
            <div className="space-y-4 pt-12">
              <div className="aspect-[3/4] rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                <Image src="/kuzasteam-hero-1.jpg" alt="Event" width={600} height={800} className="object-cover w-full h-full transition-all duration-500 hover:scale-105" />
              </div>
              <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                <div className="w-full h-full bg-rose-500 p-6 flex flex-col justify-between">
                  <span className="text-white/50 font-mono text-xs">01</span>
                  <span className="text-white font-bold text-3xl tracking-tighter">Live<br />Now</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl bg-black overflow-hidden border border-gray-800">
                <div className="w-full h-full p-6 flex flex-col justify-between text-white">
                  <span className="text-gray-500 font-mono text-xs">STATS</span>
                  <div>
                    <span className="block text-4xl font-bold tracking-tighter">1.2M</span>
                    <span className="text-gray-500 font-medium">Tickets Sold</span>
                  </div>
                </div>
              </div>
              <div className="aspect-[3/4] rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                <Image src="/kuzasteam-hero-2.jpg" alt="Event" width={600} height={800} className="object-cover w-full h-full transition-all duration-500 hover:scale-105" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="border-y border-gray-200 bg-white py-8 overflow-hidden">
        <div className="flex gap-16 animate-marquee whitespace-nowrap">
          {[...categories, ...categories].map((cat, i) => (
            <div key={i} className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-300 uppercase">
              <span>{cat.title}</span>
              <span className="text-rose-500">•</span>
            </div>
          ))}
        </div>
      </section>

      {/* Bento Grid - Features */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12">
          <h2 className="text-4xl font-black tracking-tighter">Curated Collections.</h2>
          <p className="text-gray-500 mt-2 text-lg">Hand-picked events for every vibe.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[800px] md:h-[600px]">
          {/* Large Item */}
          <div className="relative group md:col-span-2 md:row-span-2 rounded-3xl overflow-hidden bg-gray-100 border border-gray-200">
            <Image src="/nairobi.png" alt="Nairobi" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end">
              <span className="text-white/60 font-mono text-xs mb-2">TRENDING CITY</span>
              <h3 className="text-white text-4xl font-bold tracking-tighter">Nairobi</h3>
              <p className="text-white/80 mt-2">The pulse of East African tech and culture.</p>
            </div>
          </div>

          {/* Medium Item */}
          <div className="relative group md:col-span-1 md:row-span-1 rounded-3xl overflow-hidden bg-rose-50 border border-rose-100 p-6 flex flex-col justify-between hover:bg-rose-100 transition-colors">
            <span className="text-rose-600 font-bold text-xl">🔥 Hot Picks</span>
            <div>
              <div className="text-4xl font-black tracking-tighter text-gray-900 mb-1">12</div>
              <div className="text-gray-500 text-sm">Events selling out fast</div>
            </div>
          </div>

          {/* Medium Item with Image */}
          <div className="relative group md:col-span-1 md:row-span-2 rounded-3xl overflow-hidden bg-gray-900 border border-gray-800">
            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
              <span className="text-white/60 text-xs font-mono">FEATURED</span>
              <h3 className="text-white text-2xl font-bold leading-tight">Midnight<br />Sessions</h3>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
          </div>

          {/* Small Item */}
          <div className="relative group md:col-span-1 md:row-span-1 rounded-3xl overflow-hidden bg-white border border-gray-200 p-6 flex flex-col justify-center items-center text-center hover:border-gray-400 transition-colors">
            <span className="text-4xl mb-2">🎨</span>
            <span className="font-bold text-gray-900">Art & Culture</span>
          </div>
        </div>
      </section>

      {/* Featured Events List - Minimal */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-4xl font-black tracking-tighter">Upcoming Drops.</h2>
          <Link href="/events" className="text-sm font-bold border-b border-rose-500 pb-1 text-rose-600 hover:text-rose-700">View All</Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featuredEvents.map((event, i) => (
            <div key={i} className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 transition-all hover:shadow-xl hover:shadow-gray-100/50">
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 rounded-full bg-gray-50 text-xs font-bold border border-gray-100">{event.city}</span>
                <span className="text-xs font-mono text-gray-400">{event.date}</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2 group-hover:text-rose-600 transition-colors">{event.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-2">{event.summary}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Big CTA */}
      <section className="mx-auto max-w-7xl px-6 mb-20">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-rose-900 via-purple-900 to-black text-white p-12 md:p-24 text-center overflow-hidden relative shadow-2xl shadow-rose-900/40">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_rgba(255,51,102,0.4),_transparent_70%)]" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none bg-gradient-to-br from-white via-rose-100 to-purple-200 bg-clip-text text-transparent">
              Ready to go<br />
              Live?
            </h2>
            <p className="text-lg text-gray-400 font-medium">Join 5,000+ organizers creating the future of events.</p>
            <button className="h-14 px-10 rounded-full bg-white text-rose-600 font-bold text-lg hover:bg-gray-50 transition-transform hover:scale-105 shadow-xl">
              Start Creating
            </button>
          </div>
        </div>
      </section>

    </main>
  );
}

