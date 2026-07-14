import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import { brand, impactStats } from "@/lib/content";

const milestones = [
  {
    year: "2022",
    title: "Beta launch",
    detail: "Started in Nairobi with a handful of local event organizers testing the platform.",
  },
  {
    year: "2023",
    title: "Regional expansion",
    detail: "Expanded to Lagos, Kigali, Cape Town, and Accra with local payment support.",
  },
  {
    year: "2024",
    title: "Mobile app launch",
    detail: "Released iOS and Android apps with improved attendee discovery and analytics.",
  },
  {
    year: "2025",
    title: "Platform updates",
    detail: "Added marketplace features and API access for larger event organizations.",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20">
      <PageHero
        highlight="💫 About"
        title="We help people create and discover amazing events."
        description={`${brand.name} is a team of event enthusiasts, developers, and designers building tools to make event organizing easier across Africa.`}
      />

      <section className="rounded-3xl border border-purple-100 bg-gradient-to-br from-white to-purple-50/30 p-10 shadow-lg">
        <SectionHeading
          eyebrow="📅 Our story"
          title="Growing with our community"
          description="We've been building FemVents with feedback from organizers and attendees across Africa."
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {milestones.map((item, index) => {
            const colors = [
              'from-blue-500/15 to-cyan-500/5',
              'from-purple-500/15 to-pink-500/5',
              'from-orange-500/15 to-amber-500/5',
              'from-green-500/15 to-emerald-500/5',
            ];
            return (
              <div key={item.year} className={`rounded-2xl border border-gray-200 bg-gradient-to-br ${colors[index]} p-6 hover-lift`}>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent">
                  {item.year}
                </p>
                <p className="mt-3 text-xl font-semibold text-gray-900">
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
              </div>
            );
          })}
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

      <section className="rounded-3xl border border-purple-100 bg-gradient-to-br from-rose-50 via-white to-indigo-50 p-10 shadow-xl">
        <SectionHeading
          eyebrow="🌟 Our approach"
          title="Building tools that work for organizers"
          description="We're a remote-first team with members across Africa. Our focus is on creating simple, effective tools for event creators."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/60 bg-white/70 p-6">
            <p className="text-sm font-semibold text-gray-600">What matters to us</p>
            <ul className="mt-4 list-disc space-y-2 pl-4 text-sm text-gray-600">
              <li>Making event management easier for everyone</li>
              <li>Creating beautiful, intuitive experiences</li>
              <li>Transparency in how we operate</li>
              <li>Supporting communities across Africa</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 p-6">
            <p className="text-sm font-semibold text-gray-600">What we're working on</p>
            <ul className="mt-4 list-disc space-y-2 pl-4 text-sm text-gray-600">
              <li>Better tools for finding venues and vendors</li>
              <li>Improved analytics for organizers</li>
              <li>More payment options and faster payouts</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

