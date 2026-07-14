import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import { categories, destinations, featuredEvents } from "@/lib/content";

export default function EventsPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20">
      <PageHero
        highlight="🎉 Events"
        title="Find amazing events near you"
        description="Browse upcoming festivals, workshops, concerts, networking events, and more. Filter by category and location to find exactly what you're looking for."
        action={
          <div className="flex flex-wrap gap-3">
            {["All", "Trending", "Hybrid", "In-person", "Virtual"].map((filter, index) => {
              const colors = [
                "from-gray-700 to-gray-900",
                "from-orange-500 to-red-500",
                "from-purple-500 to-pink-500",
                "from-blue-500 to-cyan-500",
                "from-green-500 to-emerald-500",
              ];
              return (
                <button
                  key={filter}
                  className={`rounded-full ${index === 0 ? `bg-gradient-to-r ${colors[index]} text-white shadow-lg` : 'border-2 border-gray-200 hover:border-gray-400'} px-5 py-2.5 text-sm font-semibold ${index === 0 ? '' : 'text-gray-700'} transition-all hover:-translate-y-0.5`}
                >
                  {filter === "Trending" && "🔥 "}
                  {filter}
                </button>
              );
            })}
          </div>
        }
      />

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-6">
          {featuredEvents.map((event, index) => {
            const eventGradients = [
              'from-blue-500/10 via-purple-500/5 to-transparent',
              'from-rose-500/10 via-pink-500/5 to-transparent',
              'from-green-500/10 via-emerald-500/5 to-transparent',
              'from-orange-500/10 via-amber-500/5 to-transparent',
            ];
            const eventIcons = ['🚀', '🎉', '🌿', '🎨'];

            return (
              <article
                key={event.title}
                className={`group relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br ${eventGradients[index]} p-6 shadow-lg hover-lift`}
              >
                <div className="absolute top-4 right-4 text-4xl opacity-20 group-hover:opacity-30 transition-opacity">
                  {eventIcons[index]}
                </div>
                <div className="relative">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                    <span>{event.city}</span>
                    <span>{event.date}</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-gray-900">
                    {event.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{event.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/80 border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold">
                    <button className="text-rose-500 hover:text-rose-600 transition-colors">
                      View details →
                    </button>
                    <button className="text-gray-500 hover:text-gray-900 transition-colors">
                      💾 Save
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <aside className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-6 shadow-lg backdrop-blur h-fit sticky top-24">
          <SectionHeading
            eyebrow="Browse by city"
            title="🗺️ Find events in your city"
            description="Check out what's happening in major cities across Africa."
          />
          <div className="mt-6 flex flex-col gap-3">
            {destinations.map((city) => (
              <div
                key={city.city}
                className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-4 hover-lift cursor-pointer"
              >
                <p className="text-sm font-semibold text-gray-900">{city.city}</p>
                <p className="text-xs text-gray-500">{city.stat}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section>
        <SectionHeading
          eyebrow="Categories"
          title="🎯 Browse by interest"
          description="Find events that match your interests, from music and art to business and wellness."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => {
            const icons = ['🎵', '💼', '🧘', '🎨', '🍽️', '🤝'];
            const gradients = [
              'from-rose-500/10 to-pink-500/5',
              'from-blue-500/10 to-purple-500/5',
              'from-green-500/10 to-emerald-500/5',
              'from-purple-500/10 to-fuchsia-500/5',
              'from-orange-500/10 to-red-500/5',
              'from-cyan-500/10 to-blue-500/5',
            ];

            return (
              <div
                key={category.title}
                className={`rounded-2xl border border-gray-200 bg-gradient-to-br ${gradients[index]} p-5 hover-lift`}
              >
                <div className="text-3xl mb-2">{icons[index]}</div>
                <p className="text-lg font-semibold text-gray-900">
                  {category.title}
                </p>
                <p className="mt-2 text-sm text-gray-600">{category.copy}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

