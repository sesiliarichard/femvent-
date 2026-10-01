import Link from "next/link";
import { Space_Grotesk, Work_Sans } from "next/font/google";

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

const commitments = [
  {
    title: "Dignity",
    detail: "Every participant is treated with respect, regardless of their role, background, or how they show up.",
    color: "orange",
  },
  {
    title: "Anti-discrimination",
    detail: "Gatherings welcome people across race, class, disability, sexuality, gender identity, age, and geography.",
    color: "magenta",
  },
  {
    title: "Consent",
    detail: "Participation, photography, recording, and data sharing are never assumed — they're asked for.",
    color: "plum",
  },
  {
    title: "Accessibility",
    detail: "Hosts are encouraged to think through language, cost, physical access, and other barriers to participation.",
    color: "purple",
  },
  {
    title: "Safety",
    detail: "Gatherings have a clear approach to care and safeguarding, so participants know what to expect.",
    color: "lavender",
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  orange: { bg: "bg-[#FBEAE0]", text: "text-[#8A3E1A]", border: "border-[#E8743B]" },
  plum: { bg: "bg-[#F3F1F8]", text: "text-[#2E1F45]", border: "border-[#2E1F45]" },
  magenta: { bg: "bg-[#F9E5F0]", text: "text-[#7A1745]", border: "border-[#9B1F5C]" },
  purple: { bg: "bg-[#EEEAF6]", text: "text-[#392C5E]", border: "border-[#4A3B78]" },
  lavender: { bg: "bg-[#F3D9EE]", text: "text-[#7A1745]", border: "border-[#C98BC0]" },
};

// To replace a photo, change its link (or use your own file, e.g. "/images/principles-banner.jpg")
const bannerImage = "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1600&q=80";
const sideImage = "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1000&q=80";

const principleThemes = [
  "Access",
  "Movement building",
  "Alternative economies",
  "Consent",
  "Privacy",
  "Memory",
  "Resistance",
];

export default function PrinciplesPage() {
  const fontVars = `${spaceGrotesk.variable} ${workSans.variable}`;
  const heading = "font-[family-name:var(--font-space-grotesk)]";
  const body = "font-[family-name:var(--font-work-sans)]";

  return (
    <main className={`${fontVars} bg-[#FBF3FA]`}>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-10">
        <p className={`${heading} font-medium text-[13px] text-[#9B1F5C] mb-3.5`}>Our Convening Principles</p>
        <h1 className={`${heading} font-bold text-4xl sm:text-[42px] leading-[1.1] text-[#2E1F45]`}>
          What makes a gathering feminist?
        </h1>
        <p className={`${body} text-[#5C4A6B] max-w-lg mt-4 text-[15px] leading-relaxed`}>
          FemVents is feminist by design — but that shouldn&apos;t just be a claim we make about
          ourselves. Here&apos;s what we mean by it, and what we ask of gatherings hosted on the
          platform.
        </p>
      </section>

      {/* Photo banner */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="h-[200px] sm:h-[320px] overflow-hidden rounded-sm">
          <img
            src={bannerImage}
            alt="People gathered in conversation"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {/* Core statement */}
      <section className="bg-[#2E1F45]">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className={`${heading} font-bold text-2xl leading-snug text-[#E8743B]`}>
            Gatherings on FemVents should engage seriously with gendered power and contribute to
            feminist learning, organizing, culture, solidarity, resistance, or collective wellbeing.
          </h2>
          <p className={`${body} text-[#D9C9E0] mt-5 text-sm leading-relaxed`}>
            This isn&apos;t a purity test, and it isn&apos;t about requiring everyone to agree with
            one definition of feminism. It&apos;s a baseline: the gathering should be doing something
            in service of feminist movements, not simply borrowing the language.
          </p>
        </div>
      </section>

      {/* Plural feminisms: text and photo in two columns */}
      <section className="mx-auto max-w-6xl px-6 py-16 grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <h2 className={`${heading} font-bold text-2xl text-[#2E1F45] mb-4`}>Many feminisms, one commons</h2>
          <p className={`${body} text-[#5C4A6B] text-[15px] leading-relaxed max-w-2xl`}>
            FemVents welcomes multiple feminisms, contexts, languages, identities, and political
            traditions. There is no single feminism, and we don&apos;t ask hosts to prove their
            politics match ours. What we do ask is that hosts uphold a few shared commitments — not as
            a checklist to pass, but as the baseline for what it means to gather with care.
          </p>
        </div>
        <img
          src={sideImage}
          alt="Community members in discussion"
          className="w-full h-[240px] md:h-[340px] object-cover rounded-sm"
        />
      </section>

      {/* Commitments */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className={`${heading} font-bold text-2xl text-[#2E1F45] mb-8`}>What we ask of every host</h2>
        <div className="flex flex-col gap-[3px]">
          {commitments.map((item) => {
            const c = colorMap[item.color];
            return (
              <div key={item.title} className={`bg-[#F6EEF7] border-l-4 ${c.border} px-6 py-6`}>
                <h3 className={`${heading} font-bold text-lg text-[#2E1F45]`}>{item.title}</h3>
                <p className={`${body} text-sm mt-2 max-w-lg text-[#5C4A6B]`}>{item.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Rooted in feminist internet principles */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className={`${heading} font-bold text-2xl text-[#2E1F45] mb-4`}>
          Rooted in feminist internet principles
        </h2>
        <p className={`${body} text-[#5C4A6B] text-[15px] leading-relaxed max-w-2xl mb-6`}>
          FemVents draws on established thinking about what feminist digital infrastructure looks
          like — treating things like access, consent, privacy, and movement memory as design
          questions, not afterthoughts.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {principleThemes.map((theme) => (
            <span
              key={theme}
              className={`${body} text-sm font-medium px-4 py-2 rounded-full bg-[#F3D9EE] text-[#7A1745]`}
            >
              {theme}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <div className="bg-[#4A3B78] rounded-sm p-10 text-center">
          <h2 className={`${heading} font-bold text-2xl text-[#FBF3FA]`}>
            Have thoughts on these principles?
          </h2>
          <p className={`${body} text-[#E8D9F0] max-w-md mx-auto mt-3 text-sm leading-relaxed`}>
            These principles are meant to evolve with the community that uses FemVents. Tell us what
            we&apos;re missing, or where we&apos;ve got it wrong.
          </p>
          <Link
            href="/shape"
            className={`${heading} inline-block font-bold text-sm bg-[#E8743B] text-[#2E1F45] px-6 py-3.5 rounded-sm mt-6`}
          >
            Shape FemVents
          </Link>
        </div>
      </section>
    </main>
  );
}