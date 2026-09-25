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

export default function PricingPage() {
  const fontVars = `${spaceGrotesk.variable} ${workSans.variable}`;
  const heading = "font-[family-name:var(--font-space-grotesk)]";
  const body = "font-[family-name:var(--font-work-sans)]";

  return (
    <main className={`${fontVars} bg-[#FBF3FA]`}>
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-10">
        <p className={`${heading} font-medium text-[13px] text-[#9B1F5C] mb-3.5`}>Pricing</p>
        <h1 className={`${heading} font-bold text-4xl sm:text-[42px] leading-[1.1] text-[#2E1F45]`}>
          FemVents is free
        </h1>
        <p className={`${body} text-[#5C4A6B] max-w-lg mt-4 text-[15px] leading-relaxed`}>
          FemVents is free to use. There are no fees to discover gatherings, share opportunities,
          connect with movements, or contribute to the feminist commons.
        </p>
        <p className={`${body} text-[#5C4A6B] max-w-lg mt-4 text-[15px] leading-relaxed`}>
          We believe access to feminist spaces, knowledge and connections should not depend on who
          can afford to pay a platform.
        </p>
      </section>

      <section className="bg-[#2E1F45]">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className={`${heading} font-bold text-2xl leading-snug text-[#E8743B]`}>
            Support the commons
          </h2>
          <p className={`${body} text-[#D9C9E0] mt-4 text-sm leading-relaxed`}>
            FemVents is sustained as shared feminist infrastructure. If you value this work and have
            the means to contribute, you can make a voluntary donation to help us maintain the
            platform, improve accessibility, support community participation, and build new tools.
          </p>
          <a href="/support-femvents" className={`${heading} inline-block font-bold text-sm bg-[#E8743B] text-[#2E1F45] px-6 py-3.5 rounded-sm mt-6`}>
            Support FemVents
          </a>
          <p className={`${body} text-[#D9C9E0] mt-5 text-xs leading-relaxed`}>
            Giving is always optional. Donating does not provide greater visibility, priority access,
            or special status on the platform.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2 className={`${heading} font-bold text-2xl text-[#2E1F45]`}>
          Help us build FemVents together
        </h2>
        <p className={`${body} text-[#5C4A6B] mt-4 text-sm leading-relaxed`}>
          FemVents is being shaped with the communities who use it. What would make it easier for
          you to find each other, gather, collaborate, share knowledge, and stay connected across
          movements and places?
        </p>
        <p className={`${body} text-[#5C4A6B] mt-3 text-sm leading-relaxed`}>
          Tell us what you need, what is missing, what is not working, and what you would like us to
          build next.
        </p>
        <Link href="/shape" className={`${heading} inline-block font-bold text-sm bg-[#F3D9EE] text-[#2E1F45] px-6 py-3.5 rounded-sm mt-6`}>
          Shape FemVents
        </Link>
      </section>
    </main>
  );
}