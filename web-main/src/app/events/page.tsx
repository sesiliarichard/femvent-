import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import { categories, destinations, featuredEvents } from "@/lib/content";

const FlameIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
  </svg>
);

const BookmarkIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

const RocketIcon = () => (
  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2.5c2.5 2 4 5.5 4 9 0 2-1 4-2 5l-2 2-2-2c-1-1-2-3-2-5 0-3.5 1.5-7 4-9z" />
    <circle cx="12" cy="9" r="1.5" strokeWidth={1.5} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 15l-2 2 1 3 3-1M15 15l2 2-1 3-3-1" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l1.5 4.5L19 9l-4.5 1.5L13 15l-1.5-4.5L7 9l4.5-1.5L13 3z" />
  </svg>
);

const LeafIcon = () => (
  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 20A7 7 0 019.8 6.1C15.5 5 17 3 17 3s-3 2.5-3 6c0 4.5-3 8-6 8h3z" />
  </svg>
);

const PaletteIcon = () => (
  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h14a2 2 0 012 2v7a4 4 0 01-4 4h-1.5a1.5 1.5 0 00-1.5 1.5v.5a2.5 2.5 0 01-2.5 2.5H7z" />
    <circle cx="7.5" cy="8.5" r="1" strokeWidth={1.5} />
    <circle cx="12" cy="6.5" r="1" strokeWidth={1.5} />
    <circle cx="16.5" cy="8.5" r="1" strokeWidth={1.5} />
  </svg>
);

const MusicNoteIcon = () => (
  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m-4 6h16v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6z" />
  </svg>
);

const LotusIcon = () => (
  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9 9 0 01-9-9c2 0 4 1 5 3M12 21a9 9 0 009-9c-2 0-4 1-5 3M12 21c0-4 2-8 0-14M12 7c-2 2-4 3-7 3M12 7c2 2 4 3 7 3" />
  </svg>
);

const UtensilsIcon = () => (
  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 2v6a2 2 0 002 2h0a2 2 0 002-2V2M8 2v20M12 2v20M18 2c-2 0-3 2-3 5s1 4 3 4v9" />
  </svg>
);

const HandshakeIcon = () => (
  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

export default function EventsPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20">
      <PageHero
        highlight="Events"
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
                  className={`inline-flex items-center gap-1.5 rounded-full ${index === 0 ? `bg-gradient-to-r ${colors[index]} text-white shadow-lg` : 'border-2 border-gray-200 hover:border-gray-400'} px-5 py-2.5 text-sm font-semibold ${index === 0 ? '' : 'text-gray-700'} transition-all hover:-translate-y-0.5`}
                >
                  {filter === "Trending" && <FlameIcon />}
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
            const eventIcons = [<RocketIcon key="r" />, <SparklesIcon key="s" />, <LeafIcon key="l" />, <PaletteIcon key="p" />];

            return (
              <article
                key={event.title}
                className={`group relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br ${eventGradients[index]} p-6 shadow-lg hover-lift`}
              >
                <div className="absolute top-4 right-4 text-gray-900 opacity-10 group-hover:opacity-20 transition-opacity">
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
                    <button className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors">
                      <BookmarkIcon /> Save
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
            title="Find events in your city"
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
          title="Browse by interest"
          description="Find events that match your interests, from music and art to business and wellness."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => {
            const icons = [<MusicNoteIcon key="m" />, <BriefcaseIcon key="b" />, <LotusIcon key="l" />, <PaletteIcon key="p" />, <UtensilsIcon key="u" />, <HandshakeIcon key="h" />];
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
                <div className="mb-2 text-gray-700">{icons[index]}</div>
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