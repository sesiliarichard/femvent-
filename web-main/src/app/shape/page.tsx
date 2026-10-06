import { Space_Grotesk, Work_Sans } from "next/font/google";
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

// Default text and photo. Anything saved in Admin → Edit Shape FemVents Page replaces these.
// The Google Form embed link is set in the admin page (field "Google Form embed link").
const D = {
  "eyebrow": "Shape FemVents",
  "title": "Help us build the feminist convening platform you need",
  "intro1": "FemVents is being built as shared feminist infrastructure — a place to find gatherings, connect across movements, share opportunities and resources, and preserve feminist movement memory.",
  "intro2": "We don't want to decide what this platform should become without the people who will use it. This form is an invitation to tell us what would help you connect better, what is currently missing, what barriers you experience, and what you would like FemVents to become.",
  "note": "You can answer anonymously. You do not need to answer every question.",
  "bannerImage": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80",
  "formUrl": "https://docs.google.com/forms/d/e/1FAIpQLScxmQ8KmUqWBk1saFjRlCQMH1eSeaQlj3TMqduMGZvyALyfFg/viewform?embedded=true",
  "buttonText": "Share your thoughts",
  "buttonNote": "Opens in a new tab."
};

export default async function ShapePage() {
  const { shape } = await getSiteContent();
  const p = {
    ...D,
    ...Object.fromEntries(Object.entries(shape).filter(([, v]) => v !== "" && v != null)),
  } as typeof D;
  // The link may be the embed link (…?embedded=true); for a new tab we use the plain form link.
  const formLink = p.formUrl.replace(/[?&]embedded=true/, "");

  const fontVars = `${spaceGrotesk.variable} ${workSans.variable}`;
  const heading = "font-[family-name:var(--font-space-grotesk)]";
  const body = "font-[family-name:var(--font-work-sans)]";

  return (
    <main className={`${fontVars} bg-[#FBF3FA]`}>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-10">
        <p className={`${heading} font-medium text-[13px] text-[#9B1F5C] mb-3.5`}>{p.eyebrow}</p>
        <h1 className={`${heading} font-bold text-4xl sm:text-[42px] leading-[1.1] text-[#2E1F45]`}>
          {p.title}
        </h1>
        <p className={`${body} text-[#5C4A6B] max-w-lg mt-4 text-[15px] leading-relaxed`}>{p.intro1}</p>
        <p className={`${body} text-[#5C4A6B] max-w-lg mt-4 text-[15px] leading-relaxed`}>{p.intro2}</p>
        <p className={`${body} text-[#9B1F5C] max-w-lg mt-4 text-sm font-semibold`}>{p.note}</p>
      </section>

      {/* Photo banner */}
      <section className="mx-auto max-w-3xl px-6 pb-10">
        <div className="h-[180px] sm:h-[260px] overflow-hidden rounded-sm">
          <img src={p.bannerImage} alt={p.title} className="h-full w-full object-cover" />
        </div>
      </section>

      {/* Button that opens the Google Form in a new tab */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        {formLink ? (
          <>
            <a
              href={formLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`${heading} inline-block w-full sm:w-auto text-center font-bold text-[15px] bg-[#2E1F45] text-[#FBF3FA] hover:bg-[#4A3B78] transition-colors px-8 py-4 rounded-sm`}
            >
              {p.buttonText}
            </a>
            {p.buttonNote && (
              <p className={`${body} text-[13px] text-[#8A7A96] mt-3`}>{p.buttonNote}</p>
            )}
          </>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-[#D9C9E0] bg-white p-10 text-center">
            <p className={`${heading} font-bold text-base text-[#2E1F45] mb-2`}>
              Form not connected yet
            </p>
            <p className={`${body} text-sm text-[#5C4A6B] max-w-md mx-auto`}>
              Once the Google Form link is added in the admin page (Edit Shape FemVents Page),
              the button will appear here.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}