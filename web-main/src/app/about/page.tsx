import Image from "next/image";
import { brand, impactStats } from "@/lib/content";

const vision = [
  "A shared space where feminist gatherings are easy to find.",
  "Digital infrastructure built with communities, not just for them.",
  "Connection that outlasts a single event.",
  "Room for plural feminisms — many histories, many voices.",
];

const mission = [
  "Make feminist gatherings visible, connected, and accessible.",
  "Center power, access, safety, care, and representation in design.",
  "Serve organizers and movements, not extract value from them.",
  "Stay iterative and open as the community shapes what we build.",
];

const boostCards = [
  {
    icon: "🔍",
    title: "Discover",
    text: "Find feminist events, gatherings, actions, and opportunities near you.",
  },
  {
    icon: "📣",
    title: "Organize",
    text: "Share events with the communities you want to reach.",
  },
  {
    icon: "🤝",
    title: "Connect",
    text: "Meet people, collectives, and movements doing related work.",
  },
];

export default function AboutPage() {
  return (
    <main className="flex flex-col">
      {/* Dark hero banner */}
      <section className="bg-gradient-to-br from-gray-900 via-purple-900 to-rose-900 py-24 text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-300">Home / About Us</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">About FemVents</h1>
        <p className="mx-auto mt-4 max-w-xl text-white/70">
          Where feminist movements gather.
        </p>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-24 px-6 py-20">
        {/* Vision / mission + image */}
        <section className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">Who we are</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
              Building feminist digital infrastructure
            </h2>
            <p className="mt-4 text-sm text-gray-600">
              {brand.name} is a platform for discovering, creating, and connecting around feminist events,
              gatherings, and organizing — built to make gatherings more visible, connected, and accessible.
            </p>

            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="text-sm font-bold text-gray-900">Our Vision</p>
                <ul className="mt-3 space-y-2">
                  {vision.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] text-rose-600">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Our Mission</p>
                <ul className="mt-3 space-y-2">
                  {mission.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] text-purple-600">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl border border-gray-200">
              <Image
                src="/kuzasteam-hero-1.jpg"
                alt="Feminist gathering"
                width={600}
                height={750}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 flex items-center gap-4 rounded-2xl bg-white p-5 shadow-xl">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-purple-600 text-sm font-black text-white">
                2025
              </div>
              <p className="max-w-[10rem] text-xs font-semibold text-gray-700">
                Founded to make feminist gatherings easier to find and grow.
              </p>
            </div>
          </div>
        </section>

        {/* How we boost / icon cards */}
        <section>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">How FemVents helps</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
              Three ways to get involved
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {boostCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-md hover-lift">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-purple-100 text-2xl">
                  {card.icon}
                </div>
                <p className="mt-4 text-lg font-bold text-gray-900">{card.title}</p>
                <p className="mt-2 text-sm text-gray-600">{card.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Colored stats band */}
      <section className="bg-gradient-to-r from-rose-600 to-purple-700 pt-16 pb-24 text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Growing with our community</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
          Trusted by organizers and movements
        </h2>
      </section>

      <div className="mx-auto -mt-16 max-w-6xl px-6">
        <div className="grid gap-4 rounded-3xl bg-white p-6 shadow-2xl sm:grid-cols-2 lg:grid-cols-4">
          {impactStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-gray-50 p-6 text-center">
              <p className="text-3xl font-black text-gray-900">{stat.value}</p>
              <p className="mt-1 text-sm font-semibold text-gray-700">{stat.label}</p>
              <p className="mt-1 text-xs text-gray-500">{stat.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-20 pt-20 text-center">
        <p className="text-sm font-semibold text-rose-600">
          Find a gathering. Create one. Build something together.
        </p>
      </div>
    </main>
  );
}