import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import { brand } from "@/lib/content";

const platformGuides = [
  {
    title: "Feminist by design.",
    detail:
      "We think about power, access, safety, care, representation, and participation in how the platform is built.",
  },
  {
    title: "Community-rooted.",
    detail: "FemVents should serve organizers and movements rather than extract value from them.",
  },
  {
    title: "Plural feminisms.",
    detail:
      "There is no single feminism. We make space for different feminist histories, politics, identities, languages, geographies, and ways of organizing.",
  },
  {
    title: "Accessible and inclusive.",
    detail:
      "We want more people to be able to find and participate in feminist spaces including people often excluded by geography, language, disability, cost, or institutional networks.",
  },
  {
    title: "Built for connection, not just attendance.",
    detail:
      "Success isn't simply how many tickets are sold. It is whether people find each other, exchange knowledge, build relationships, organize, and create change.",
  },
];

const platformActions = [
  { icon: "🔍", text: "Discover feminist events, gatherings, actions, and opportunities." },
  { icon: "📣", text: "Organize and share events with the communities you want to reach." },
  { icon: "🤝", text: "Connect with people, collectives, and movements doing related work." },
  { icon: "🗂️", text: "Archive moments of feminist gathering and movement-building." },
  { icon: "🌐", text: "Grow networks of solidarity across geographies, generations, and movements." },
];

const storyBeats = [
  {
    year: "2025",
    text:
      "We brought feminists together through Gendering AI, a gathering exploring gender, power, technology, and artificial intelligence. As we organized the convening, we encountered a challenge that felt familiar: feminist gatherings were happening everywhere, but there was no shared space to easily find them, connect across them, or make the organizing around them more visible.",
  },
  {
    year: "2025",
    text:
      "Later that year, we began piloting the idea: what would it look like to create digital infrastructure specifically for feminist gatherings and organizing? Not simply another events platform, but a space shaped by how feminist communities actually gather, share knowledge, build relationships, and organize.",
  },
  {
    year: "2026",
    text:
      "We are taking that question back to the community. FemVents is being tested and shaped together with feminist organizers, collectives, movements, and communities. We want the people who will use FemVents to influence what it becomes: what it should make possible, what values it should uphold, and what feminist digital infrastructure should look like in practice.",
  },
];

const approachGuides = [
  { icon: "🧭", text: "Community-led — the people using FemVents should have a voice in shaping what it becomes." },
  { icon: "✨", text: "Feminist by design — we consider power, inclusion, care, safety, and accessibility throughout the design process." },
  { icon: "💞", text: "Built for connection — we want gatherings to lead to relationships, collaboration, learning, solidarity, and collective action." },
  { icon: "🌈", text: "Plural and inclusive — we recognize that feminist movements are diverse, contextual, multilingual, and shaped by different histories and experiences." },
  { icon: "🔄", text: "Iterative and open — FemVents is a work in progress. We will keep testing, questioning, learning, and changing as the community grows." },
];

const exploringTogether = [
  { icon: "🔎", text: "Discover feminist gatherings, actions, conversations, and opportunities." },
  { icon: "🧑‍🤝‍🧑", text: "Find organizers, collectives, and movements working on shared issues." },
  { icon: "🪧", text: "Create and share gatherings in ways that are accessible to different communities." },
  { icon: "🔗", text: "Strengthen connections between people beyond a single event." },
  { icon: "📚", text: "Preserve knowledge and histories created through feminist gatherings." },
  { icon: "🏗️", text: "Build digital spaces that support movements without extracting from them." },
];

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20">
      <PageHero
        highlight="💫 About FemVents"
        title="Where feminist movements gather."
        description="FemVents is a platform for discovering, creating, and connecting around feminist events, gatherings, and organizing. We are building digital infrastructure that makes it easier for feminist organizers, collectives, movements, researchers, artists, activists, and communities to find one another — and to turn gatherings into connection, learning, solidarity, and collective action."
      />

      {/* More than an events platform */}
      <section className="rounded-3xl border border-purple-100 bg-gradient-to-br from-white to-purple-50/30 p-10 shadow-lg">
        <SectionHeading
          eyebrow="🌍 More than an events platform"
          title="Making feminist gatherings visible, connected, and accessible"
          description="Feminist organizing happens everywhere: in community halls and classrooms, online spaces and festivals, protests and reading groups, conferences and kitchen-table conversations. But these spaces can be difficult to discover beyond our immediate networks."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {platformActions.map((item) => (
            <div
              key={item.text}
              className="flex items-start gap-4 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm hover-lift"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-purple-100 text-lg">
                {item.icon}
              </span>
              <p className="text-sm text-gray-700 pt-1.5">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What guides us */}
      <section className="rounded-3xl border border-purple-100 bg-gradient-to-br from-rose-50 via-white to-indigo-50 p-10 shadow-xl">
        <SectionHeading
          eyebrow="🌟 What guides us"
          title="The values shaping how we build"
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {platformGuides.map((item, index) => {
            const colors = [
              'from-blue-500/15 to-cyan-500/5',
              'from-purple-500/15 to-pink-500/5',
              'from-orange-500/15 to-amber-500/5',
              'from-green-500/15 to-emerald-500/5',
              'from-rose-500/15 to-purple-500/5',
            ];
            return (
              <div key={item.title} className={`rounded-2xl border border-gray-200 bg-gradient-to-br ${colors[index % colors.length]} p-6 hover-lift`}>
                <p className="text-lg font-semibold text-gray-900">{item.title}</p>
                <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-8 rounded-2xl border border-white/60 bg-white/70 p-8 text-center">
          <p className="text-xl font-bold text-gray-900">A feminist internet needs feminist infrastructure.</p>
          <p className="mt-3 text-sm text-gray-600 max-w-xl mx-auto">
            {brand.name} is our contribution to that infrastructure: a place to find where feminists are gathering,
            what they are organizing around, and how to join them.
          </p>
          <p className="mt-4 text-base font-semibold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
            Find a gathering. Create one. Build something together.
          </p>
        </div>
      </section>

      {/* Our story — vertical timeline */}
      <section className="rounded-3xl border border-purple-100 bg-gradient-to-br from-white to-purple-50/30 p-10 shadow-lg">
        <SectionHeading
          eyebrow="📖 Our story"
          title="FemVents began with a gathering."
        />

        <div className="mt-10 space-y-6">
          {storyBeats.map((beat, index) => (
            <div key={index} className="relative flex gap-6">
              <div className="flex flex-col items-center">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-purple-500 text-sm font-bold text-white shadow-md">
                  {beat.year}
                </span>
                {index < storyBeats.length - 1 && (
                  <span className="mt-2 w-px flex-1 bg-gradient-to-b from-purple-200 to-rose-100" />
                )}
              </div>
              <div className="pb-2 rounded-2xl border border-white/60 bg-white/70 p-6 flex-1">
                <p className="text-sm leading-relaxed text-gray-600">{beat.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 p-8 text-center shadow-lg">
          <p className="text-xl font-bold text-white">We are still building. And we believe that is part of the story.</p>
          <p className="mt-2 text-sm text-white/90">FemVents is not only being built for feminist communities. It is being built with them.</p>
        </div>
      </section>

      {/* Our approach */}
      <section className="rounded-3xl border border-purple-100 bg-gradient-to-br from-rose-50 via-white to-indigo-50 p-10 shadow-xl">
        <SectionHeading
          eyebrow="🤝 Our approach"
          title="Building with feminist communities, not just for them"
          description="We believe feminist infrastructure should be shaped by the people who use it. FemVents is being developed through an ongoing process of listening, testing, learning, and building alongside feminist organizers, collectives, and communities."
        />
        <p className="mt-4 text-sm text-gray-600 max-w-3xl">
          Rather than assuming what movements need, we want the platform to grow from the realities of how
          feminists gather, organize, share knowledge, build relationships, and sustain their work. For us, this
          means thinking beyond functionality. We are also asking questions about power, access, safety, care,
          representation, ownership, and whose needs technology is designed around.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/60 bg-white/70 p-6">
            <p className="text-sm font-semibold text-gray-900 mb-4">What guides us</p>
            <ul className="space-y-4">
              {approachGuides.map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-purple-100 text-sm">
                    {item.icon}
                  </span>
                  <span className="text-sm text-gray-600 pt-1">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 p-6">
            <p className="text-sm font-semibold text-gray-900 mb-4">What we are exploring together</p>
            <ul className="space-y-4">
              {exploringTogether.map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 text-sm">
                    {item.icon}
                  </span>
                  <span className="text-sm text-gray-600 pt-1">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-gradient-to-r from-purple-600 to-rose-500 p-8 text-center shadow-lg">
          <p className="text-lg font-bold text-white">
            FemVents is not a finished product handed to the community.
          </p>
          <p className="mt-1 text-base text-white/90">It is an invitation to shape feminist digital infrastructure together.</p>
        </div>
      </section>
    </main>
  );
}