import { Space_Grotesk, Work_Sans } from "next/font/google";
import { brand } from "@/lib/content";
import { getSiteContent } from "@/lib/siteContent";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-space-grotesk",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-work-sans",
});

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
  { title: "Discover", text: "Feminist events, gatherings, actions, and opportunities.", color: "orange" },
  { title: "Organize", text: "Share events with the communities you want to reach.", color: "magenta" },
  { title: "Connect", text: "People, collectives, and movements doing related work.", color: "plum" },
  { title: "Archive", text: "Moments of feminist gathering and movement-building.", color: "purple" },
  { title: "Grow", text: "Networks of solidarity across geographies and generations.", color: "lavender" },
];

const storyBeats = [
  {
    year: "2025",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&q=80",
    imageAlt: "Gendering AI gathering",
    text:
      "We brought feminists together through Gendering AI, a gathering exploring gender, power, technology, and artificial intelligence. As we organized the convening, we encountered a challenge that felt familiar: feminist gatherings were happening everywhere, but there was no shared space to easily find them, connect across them, or make the organizing around them more visible.",
  },
  {
    year: "2025",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&q=80",
    imageAlt: "Piloting the FemVents idea",
    text:
      "Later that year, we began piloting the idea: what would it look like to create digital infrastructure specifically for feminist gatherings and organizing? Not simply another events platform, but a space shaped by how feminist communities actually gather, share knowledge, build relationships, and organize.",
  },
  {
    year: "2026",
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=500&q=80",
    imageAlt: "Community shaping FemVents",
    text:
      "We are taking that question back to the community. FemVents is being tested and shaped together with feminist organizers, collectives, movements, and communities. We want the people who will use FemVents to influence what it becomes: what it should make possible, what values it should uphold, and what feminist digital infrastructure should look like in practice.",
  },
];

const approachGuides = [
  "Community-led — the people using FemVents should have a voice in shaping what it becomes.",
  "Feminist by design — we consider power, inclusion, care, safety, and accessibility throughout the design process.",
  "Built for connection — we want gatherings to lead to relationships, collaboration, learning, solidarity, and collective action.",
  "Plural and inclusive — we recognize that feminist movements are diverse, contextual, multilingual, and shaped by different histories and experiences.",
  "Iterative and open — FemVents is a work in progress. We will keep testing, questioning, learning, and changing as the community grows.",
];

const exploringTogether = [
  "Discover feminist gatherings, actions, conversations, and opportunities.",
  "Find organizers, collectives, and movements working on shared issues.",
  "Create and share gatherings in ways that are accessible to different communities.",
  "Strengthen connections between people beyond a single event.",
  "Preserve knowledge and histories created through feminist gatherings.",
  "Build digital spaces that support movements without extracting from them.",
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  orange: { bg: "bg-[#FBEAE0]", text: "text-[#8A3E1A]", border: "border-[#E8743B]" },
  plum: { bg: "bg-[#F3F1F8]", text: "text-[#2E1F45]", border: "border-[#2E1F45]" },
  magenta: { bg: "bg-[#F9E5F0]", text: "text-[#7A1745]", border: "border-[#9B1F5C]" },
  purple: { bg: "bg-[#EEEAF6]", text: "text-[#392C5E]", border: "border-[#4A3B78]" },
  lavender: { bg: "bg-[#F3D9EE]", text: "text-[#7A1745]", border: "border-[#C98BC0]" },
};
const guideColors = ["orange", "plum", "magenta", "purple", "lavender"];

export default async function Home() {
  const { about } = await getSiteContent();

  const a = {
    heroTitle: about.heroTitle || "Where feminist movements gather.",
    heroDescription:
      about.heroDescription ||
      "FemVents is a platform for discovering, creating, and connecting around feminist events, gatherings, and organizing. We are building digital infrastructure that makes it easier for feminist organizers, collectives, movements, researchers, artists, activists, and communities to find one another — and to turn gatherings into connection, learning, solidarity, and collective action.",
    heroImage:
      about.heroImage ||
      "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80",
    heroImageAlt: about.heroImageAlt || "Feminist organizers gathering at a FemVents event",
    moreThanTitle: about.moreThanTitle || "Making feminist gatherings visible, connected, and accessible",
    moreThanDescription:
      about.moreThanDescription ||
      "Feminist organizing happens everywhere: in community halls and classrooms, online spaces and festivals, protests and reading groups, conferences and kitchen-table conversations. But these spaces can be difficult to discover beyond our immediate networks.",
    guides: about.guides || platformGuides,
    infrastructureQuote: about.infrastructureQuote || "A feminist internet needs feminist infrastructure.",
    infrastructureDetail:
      about.infrastructureDetail ||
      `${brand.name} is our contribution to that infrastructure: a place to find where feminists are gathering, what they are organizing around, and how to join them.`,
    callToAction: about.callToAction || "Find a gathering. Create one. Build something together.",
    storyTitle: about.storyTitle || "FemVents began with a gathering.",
    storyBeats: about.storyBeats || storyBeats,
    stillBuildingLine: about.stillBuildingLine || "We are still building. And we believe that is part of the story.",
    builtWithLine:
      about.builtWithLine || "FemVents is not only being built for feminist communities. It is being built with them.",
    approachTitle: about.approachTitle || "Building with feminist communities, not just for them",
    approachDescription:
      about.approachDescription ||
      "We believe feminist infrastructure should be shaped by the people who use it. FemVents is being developed through an ongoing process of listening, testing, learning, and building alongside feminist organizers, collectives, and communities.",
    approachExtended:
      about.approachExtended ||
      "Rather than assuming what movements need, we want the platform to grow from the realities of how feminists gather, organize, share knowledge, build relationships, and sustain their work. For us, this means thinking beyond functionality. We are also asking questions about power, access, safety, care, representation, ownership, and whose needs technology is designed around.",
    finalLine1: about.finalLine1 || "FemVents is not a finished product handed to the community.",
    finalLine2: about.finalLine2 || "It is an invitation to shape feminist digital infrastructure together.",
  };

  const fontVars = `${spaceGrotesk.variable} ${workSans.variable}`;
  const heading = "font-[family-name:var(--font-space-grotesk)]";
  const body = "font-[family-name:var(--font-work-sans)]";

  return (
    <main className={`${fontVars} bg-[#FBF3FA]`}>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div>
            <h1 className={`${heading} font-bold text-4xl sm:text-5xl leading-[1.08] text-[#2E1F45]`}>
              {a.heroTitle}
            </h1>
            <p className={`${body} text-[15px] leading-relaxed text-[#5C4A6B] mt-5 max-w-md`}>
              {a.heroDescription}
            </p>
          </div>
          <div className="relative">
            <img
              src={a.heroImage}
              alt={a.heroImageAlt}
              className="w-full h-[340px] object-cover rounded-sm"
            />
            <div
              className={`${heading} absolute -bottom-4 -left-4 bg-[#9B1F5C] text-[#FBF3FA] font-bold text-sm px-4 py-2 rounded-sm`}
            >
              {brand.name}
            </div>
          </div>
        </div>
      </section>

      {/* More than an events platform — colored chip row */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className={`${heading} font-bold text-2xl max-w-xl text-[#2E1F45] mb-3`}>{a.moreThanTitle}</h2>
        <p className={`${body} text-[#5C4A6B] max-w-xl mb-8 text-sm`}>{a.moreThanDescription}</p>
        <div className="flex flex-wrap gap-3">
          {platformActions.map((item) => {
            const c = colorMap[item.color];
            return (
              <div key={item.title} className={`${c.bg} rounded-sm px-5 py-4 min-w-[150px]`}>
              <p className={`${heading} font-bold text-sm mb-1 ${c.text}`}>{item.title}</p>
              <p className={`${body} text-xs ${c.text}`}>{item.text}</p>
            </div>
            );
          })}
        </div>
      </section>

           {/* What guides us — accent-bordered value cards */}
           <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className={`${heading} font-bold text-2xl text-[#2E1F45] mb-8`}>The values shaping how we build</h2>
        <div className="flex flex-col gap-[3px]">
          {a.guides.map((item: any, index: number) => {
            const c = colorMap[guideColors[index % guideColors.length]];
            return (
              <div key={item.title} className={`bg-[#F6EEF7] border-l-4 ${c.border} px-6 py-6`}>
                <h3 className={`${heading} font-bold text-lg text-[#2E1F45]`}>{item.title}</h3>
                <p className={`${body} text-sm mt-2 max-w-lg text-[#5C4A6B]`}>{item.detail}</p>
              </div>
            );
          })}
        </div>
      </section>
      
      {/* Quote block */}
      <section className="bg-[#2E1F45]">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h3 className={`${heading} font-bold text-2xl leading-snug text-[#E8743B]`}>{a.infrastructureQuote}</h3>
          <p className={`${body} text-[#D9C9E0] mt-4 text-sm`}>{a.infrastructureDetail}</p>
          <p className={`${heading} font-bold text-base text-[#FBF3FA] mt-5`}>{a.callToAction}</p>
        </div>
      </section>

      {/* Our story */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className={`${heading} font-bold text-2xl text-[#2E1F45] mb-8`}>{a.storyTitle}</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {a.storyBeats.map((beat: any, index: number) => (
            <div key={index} className="bg-[#F3D9EE] rounded-sm overflow-hidden">
              <img
                src={
                  beat.image ||
                  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&q=80"
                }
                alt={beat.imageAlt || ""}
                className="w-full h-[140px] object-cover"
              />
              <div className="p-5">
                <span className={`${heading} font-bold text-2xl text-[#9B1F5C]`}>{beat.year}</span>
                <p className={`${body} text-xs text-[#5C4A6B] mt-2 leading-relaxed`}>{beat.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-[#4A3B78] rounded-sm p-8">
          <h3 className={`${heading} font-bold text-xl text-[#FBF3FA]`}>{a.stillBuildingLine}</h3>
          <p className={`${body} text-[#E8D9F0] mt-2 text-sm`}>{a.builtWithLine}</p>
        </div>
      </section>

      {/* Our approach — two color panels side by side */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className={`${heading} font-bold text-2xl max-w-xl text-[#2E1F45]`}>{a.approachTitle}</h2>
        <p className={`${body} text-[#5C4A6B] max-w-xl mt-3 text-sm`}>{a.approachDescription}</p>
        <p className={`${body} text-[#5C4A6B] max-w-2xl mt-3 text-sm`}>{a.approachExtended}</p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="bg-[#E8743B] rounded-sm p-7">
            <p className={`${heading} font-bold text-base text-[#2E1F45] mb-4`}>What guides us</p>
            <ul className="space-y-3.5">
              {approachGuides.map((text) => (
                <li key={text} className={`${body} text-sm text-[#2E1F45] leading-relaxed`}>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#4A3B78] rounded-sm p-7">
            <p className={`${heading} font-bold text-base text-[#FBF3FA] mb-4`}>What we&apos;re exploring together</p>
            <ul className="space-y-3.5">
              {exploringTogether.map((text) => (
                <li key={text} className={`${body} text-sm text-[#FBF3FA] leading-relaxed`}>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14">
          <h3 className={`${heading} font-bold text-xl text-[#2E1F45]`}>{a.finalLine1}</h3>
          <p className={`${body} text-[#5C4A6B] mt-2 text-base`}>{a.finalLine2}</p>
        </div>
      </section>
    </main>
  );
}