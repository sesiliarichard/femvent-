import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import { organizerSpotlights, impactStats } from "@/lib/content";

const workflow = [
  "Upload your event details and images",
  "Set up ticket types and pricing",
  "Publish and share your event link",
  "Track ticket sales and check in attendees on event day",
];

export default function OrganizersPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20">
      <PageHero
        highlight="💼 For Organizers"
        title="Professional tools for event creators"
        description="Everything you need to create, promote, and manage your events. From ticket sales to attendee check-in, we've got you covered."
        action={
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:-translate-y-0.5 transition-all">
              📅 Get started
            </button>
            <button className="rounded-full border-2 border-gray-200 hover:border-gray-400 px-6 py-3 text-sm font-semibold text-gray-900 transition-all hover:-translate-y-0.5">
              📥 Learn more
            </button>
          </div>
        }
      />

      <section className="grid gap-6 md:grid-cols-2">
        {organizerSpotlights.map((org, index) => {
          const gradients = [
            'from-blue-500/15 to-cyan-500/5',
            'from-purple-500/15 to-pink-500/5',
            'from-orange-500/15 to-amber-500/5',
          ];
          const icons = ['🎭', '🚀', '🎨'];

          return (
            <article
              key={org.name}
              className={`group relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br ${gradients[index]} p-6 shadow-lg hover-lift`}
            >
              <div className="absolute top-4 right-4 text-4xl opacity-10 group-hover:opacity-20 transition-opacity">
                {icons[index]}
              </div>
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] bg-gradient-to-r from-gray-600 to-gray-400 bg-clip-text text-transparent">
                  {org.focus}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-gray-900">
                  {org.name}
                </h3>
                <p className="mt-1 text-sm font-semibold text-rose-500">
                  ✨ {org.stat}
                </p>
                <p className="mt-3 text-sm text-gray-600">{org.blurb}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-3xl border border-purple-300/30 bg-gradient-to-br from-gray-900 via-purple-900 to-rose-900 p-10 text-white shadow-2xl">
        <SectionHeading
          eyebrow="⚡ How it works"
          title="Simple tools for professional results"
          description="Create and manage events with tools designed to keep your team organized and your attendees happy."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {workflow.map((step, index) => (
            <div key={step} className="group rounded-2xl border border-white/20 bg-white/5 p-6 hover:bg-white/10 transition-all hover:-translate-y-1">
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
                Step {index + 1}
              </span>
              <p className="mt-3 text-lg font-semibold">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-gray-100 bg-white p-8 sm:grid-cols-2 lg:grid-cols-4 shadow-lg">
        {impactStats.map((stat, index) => {
          const gradients = [
            'from-rose-500/10 to-pink-500/5',
            'from-purple-500/10 to-blue-500/5',
            'from-orange-500/10 to-amber-500/5',
            'from-cyan-500/10 to-teal-500/5',
          ];
          return (
            <div key={stat.label} className={`p-4 rounded-xl bg-gradient-to-br ${gradients[index]} hover-lift`}>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                {stat.label}
              </p>
              <p className="mt-3 text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-gray-500">{stat.detail}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}

