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

const platformActions = [
  { title: "Discover", text: "Feminist events and opportunities." },
  { title: "Organize", text: "Share events with your communities." },
  { title: "Connect", text: "Find related collectives and movements." },
  { title: "Archive", text: "Moments of movement-building." },
  { title: "Grow", text: "Networks of solidarity, at scale." },
];

const platformGuides = [
  {
    title: "Feminist by design.",
    detail:
      "We think about power, access, safety, care, representation, and participation in how the platform is built.",
    color: "orange",
  },
  {
    title: "Community-rooted.",
    detail: "FemVents should serve organizers and movements rather than extract value from them.",
    color: "plum",
  },
  {
    title: "Plural feminisms.",
    detail:
      "There is no single feminism. We make space for different feminist histories, politics, identities, languages, and geographies.",
    color: "magenta",
  },
  {
    title: "Accessible and inclusive.",
    detail:
      "We want more people to find and participate in feminist spaces, including those often excluded by geography, language, disability, or cost.",
    color: "purple",
  },
  {
    title: "Built for connection, not just attendance.",
    detail: "Success isn't how many tickets are sold. It's whether people find each other and create change.",
    color: "lavender",
  },
];

const storyBeats = [
  {
    year: "2025",
    text: "We brought feminists together through Gendering AI, exploring gender, power, technology, and AI.",
  },
  {
    year: "2025",
    text: "We began piloting digital infrastructure shaped by how feminist communities actually gather and organize.",
  },
  {
    year: "2026",
    text: "FemVents is being tested and shaped together with feminist organizers and communities.",
  },
];

const approachGuides = [
  "Community-led — the people using FemVents shape what it becomes.",
  "Feminist by design — power, inclusion, care, and safety throughout.",
  "Built for connection, not just transactions.",
  "Plural and inclusive across languages and histories.",
  "Iterative and open — always a work in progress.",
];

const exploringTogether = [
  "Discover feminist gatherings, actions, and opportunities.",
  "Find organizers and movements working on shared issues.",
  "Create gatherings accessible to different communities.",
  "Strengthen connections beyond a single event.",
  "Preserve knowledge and histories of feminist gathering.",
];

const colorMap: Record<string, { bg: string; text: string }> = {
  orange: { bg: "bg-[#E8743B]", text: "text-[#2E1F45]" },
  plum: { bg: "bg-[#2E1F45]", text: "text-[#FBF3FA]" },
  magenta: { bg: "bg-[#9B1F5C]", text: "text-[#FBF3FA]" },
  purple: { bg: "bg-[#4A3B78]", text: "text-[#FBF3FA]" },
  lavender: { bg: "bg-[#F3D9EE]", text: "text-[#2E1F45]" },
};

export default async function AboutPage() {
  const { about } = await getSiteContent();

  const a = {
    heroTitle: about.heroTitle || "Where feminist movements gather.",
    heroDescription:
      about.heroDescription ||
      "FemVents is a platform for discovering, creating, and connecting around feminist events, gatherings, and organizing across Africa.",
    heroImage: about.heroImage || null,
    heroImageAlt: about.heroImageAlt || "Feminist organizers gathering at a FemVents event",
    moreThanTitle: about.moreThanTitle || "Making feminist gatherings visible, connected, and accessible",
    moreThanDescription:
      about.moreThanDescription ||
      "Feminist organizing happens everywhere — but these spaces can be difficult to discover beyond immediate networks.",
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
      "We believe feminist infrastructure should be shaped by the people who use it — through listening, testing, and building alongside organizers and communities.",
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
          {a.heroImage && (
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
          )}
        </div>
      </section>

      {/* More than an events platform */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className={`${heading} font-bold text-2xl max-w-xl text-[#2E1F45]`}>{a.moreThanTitle}</h2>
        <p className={`${body} text-[#5C4A6B] max-w-xl mt-3 text-sm`}>{a.moreThanDescription}</p>
        <div className="flex flex-col sm:flex-row mt-10 border-t-2 border-[#2E1F45]">
          {platformActions.map((item, i) => (
            <div
              key={item.title}
              className={`flex-1 py-5 pr-4 ${i < platformActions.length - 1 ? "sm:border-r border-[#D9C9E0] border-b sm:border-b-0" : ""}`}
            >
              <p className={`${heading} font-bold text-sm text-[#9B1F5C]`}>{item.title}</p>
              <p className={`${body} text-xs text-[#5C4A6B] mt-1.5`}>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What guides us — stacked color blocks */}
      <section>
        <div className="mx-auto max-w-6xl px-6 pb-8">
          <h2 className={`${heading} font-bold text-2xl text-[#2E1F45] mb-8`}>The values shaping how we build</h2>
        </div>
        {a.guides.map((item: any, index: number) => {
          const colors = ["orange", "plum", "magenta", "purple", "lavender"];
          const c = colorMap[item.color || colors[index % colors.length]];
          return (
            <div key={item.title} className={c.bg}>
              <div className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6 items-start">
                <p className={`${heading} font-medium text-xs opacity-75 ${c.text}`}>
                  {String(index + 1).padStart(2, "0")} — Values
                </p>
                <div>
                  <h3 className={`${heading} font-bold text-xl ${c.text}`}>{item.title}</h3>
                  <p className={`${body} text-sm mt-2 max-w-lg ${c.text} opacity-90`}>{item.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
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
              {beat.image && (
                <img src={beat.image} alt={beat.imageAlt || ""} className="w-full h-[140px] object-cover" />
              )}
              <div className="p-5">
                <span className={`${heading} font-bold text-2xl text-[#9B1F5C]`}>{beat.year}</span>
                <p className={`${body} text-xs text-[#5C4A6B] mt-2`}>{beat.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-[#4A3B78] rounded-sm p-8">
          <h3 className={`${heading} font-bold text-xl text-[#FBF3FA]`}>{a.stillBuildingLine}</h3>
          <p className={`${body} text-[#E8D9F0] mt-2 text-sm`}>{a.builtWithLine}</p>
        </div>
      </section>

      {/* Our approach */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className={`${heading} font-bold text-2xl max-w-xl text-[#2E1F45]`}>{a.approachTitle}</h2>
        <p className={`${body} text-[#5C4A6B] max-w-xl mt-3 text-sm`}>{a.approachDescription}</p>

        <div className="mt-10 space-y-4">
          {approachGuides.map((text) => (
            <div key={text} className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4 py-4 border-b border-[#D9C9E0]">
              <span className={`${heading} font-bold text-sm text-[#9B1F5C]`}>Guides us</span>
              <p className={`${body} text-sm text-[#3A3650]`}>{text}</p>
            </div>
          ))}
          {exploringTogether.map((text) => (
            <div key={text} className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4 py-4 border-b border-[#D9C9E0]">
              <span className={`${heading} font-bold text-sm text-[#4A3B78]`}>Exploring</span>
              <p className={`${body} text-sm text-[#3A3650]`}>{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h3 className={`${heading} font-bold text-xl text-[#2E1F45]`}>{a.finalLine1}</h3>
          <p className={`${body} text-[#5C4A6B] mt-2 text-base`}>{a.finalLine2}</p>
        </div>
      </section>
    </main>
  );
}