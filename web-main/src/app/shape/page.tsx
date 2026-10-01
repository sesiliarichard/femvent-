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

// TODO: paste the embed src URL from Google Forms (Send → <> icon → copy the src="..." value)
const GOOGLE_FORM_EMBED_URL = "";

// To replace the banner photo, change this link (or use your own file, e.g. "/images/shape-banner.jpg")
const bannerImage = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80";

export default function ShapePage() {
  const fontVars = `${spaceGrotesk.variable} ${workSans.variable}`;
  const heading = "font-[family-name:var(--font-space-grotesk)]";
  const body = "font-[family-name:var(--font-work-sans)]";

  return (
    <main className={`${fontVars} bg-[#FBF3FA]`}>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-10">
        <p className={`${heading} font-medium text-[13px] text-[#9B1F5C] mb-3.5`}>Shape FemVents</p>
        <h1 className={`${heading} font-bold text-4xl sm:text-[42px] leading-[1.1] text-[#2E1F45]`}>
          Help us build the feminist convening platform you need
        </h1>
        <p className={`${body} text-[#5C4A6B] max-w-lg mt-4 text-[15px] leading-relaxed`}>
          FemVents is being built as shared feminist infrastructure — a place to find gatherings,
          connect across movements, share opportunities and resources, and preserve feminist
          movement memory.
        </p>
        <p className={`${body} text-[#5C4A6B] max-w-lg mt-4 text-[15px] leading-relaxed`}>
          We don&apos;t want to decide what this platform should become without the people who will
          use it. This form is an invitation to tell us what would help you connect better, what is
          currently missing, what barriers you experience, and what you would like FemVents to
          become.
        </p>
        <p className={`${body} text-[#9B1F5C] max-w-lg mt-4 text-sm font-semibold`}>
          You can answer anonymously. You do not need to answer every question.
        </p>
      </section>

      {/* Photo banner */}
      <section className="mx-auto max-w-3xl px-6 pb-10">
        <div className="h-[180px] sm:h-[260px] overflow-hidden rounded-sm">
          <img
            src={bannerImage}
            alt="Community members sharing ideas"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {/* Form */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        {GOOGLE_FORM_EMBED_URL ? (
          <div className="rounded-2xl overflow-hidden border border-[#D9C9E0] bg-white shadow-sm">
            <iframe
              src={GOOGLE_FORM_EMBED_URL}
              width="100%"
              height="2400"
              className="w-full"
              title="Shape FemVents form"
            >
              Loading…
            </iframe>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-[#D9C9E0] bg-white p-10 text-center">
            <p className={`${heading} font-bold text-base text-[#2E1F45] mb-2`}>
              Form not connected yet
            </p>
            <p className={`${body} text-sm text-[#5C4A6B] max-w-md mx-auto`}>
              Once the Google Form embed link is added to{" "}
              <code className="bg-[#F3D9EE] px-1.5 py-0.5 rounded text-[#7A1745] text-xs">
                GOOGLE_FORM_EMBED_URL
              </code>{" "}
              at the top of this file, it will appear here.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}