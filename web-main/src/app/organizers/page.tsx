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

const spotlightImageFallbacks = [
  "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=500&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&q=80",
];

const stepColors = [
  { bg: "bg-[#E8743B]", text: "text-[#2E1F45]" },
  { bg: "bg-[#9B1F5C]", text: "text-[#FBF3FA]" },
  { bg: "bg-[#4A3B78]", text: "text-[#FBF3FA]" },
  { bg: "bg-[#F3D9EE]", text: "text-[#2E1F45]" },
];

const statColors = [
  { bg: "bg-[#E8743B]", text: "text-[#2E1F45]" },
  { bg: "bg-[#9B1F5C]", text: "text-[#FBF3FA]" },
  { bg: "bg-[#4A3B78]", text: "text-[#FBF3FA]" },
  { bg: "bg-[#F3D9EE]", text: "text-[#2E1F45]" },
];

export default async function OrganizersPage() {
  const { organizerSpotlights, impactStats, pricingPlans, organizersHero, howItWorks } = await getSiteContent();

  const heroTitle = organizersHero.title || "Professional tools for event creators";
  const heroDescription =
    organizersHero.description ||
    "Everything you need to create, promote, and manage your events. From ticket sales to attendee check-in, we've got you covered.";

  const fontVars = `${spaceGrotesk.variable} ${workSans.variable}`;
  const heading = "font-[family-name:var(--font-space-grotesk)]";
  const body = "font-[family-name:var(--font-work-sans)]";

  return (
    <main className={`${fontVars} bg-[#FBF3FA]`}>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <p className={`${heading} font-medium text-[13px] text-[#9B1F5C] mb-3.5`}>For Organizers</p>
        <h1 className={`${heading} font-bold text-4xl sm:text-[42px] leading-[1.1] text-[#2E1F45] max-w-2xl`}>
          {heroTitle}
        </h1>
        <p className={`${body} text-[#5C4A6B] max-w-xl mt-4 text-[15px] leading-relaxed`}>{heroDescription}</p>
        <div className="flex flex-wrap gap-3 mt-7">
          <a href={`${process.env.NEXT_PUBLIC_HOST_APP_URL}/signup`}>
            <button className={`${heading} font-bold text-sm bg-[#2E1F45] text-[#FBF3FA] px-6 py-3.5 rounded-sm`}>
              Get started
            </button>
          </a>
          <button className={`${heading} font-bold text-sm bg-transparent text-[#2E1F45] border border-[#D9C9E0] px-6 py-3.5 rounded-sm`}>
            Learn more
          </button>
        </div>
      </section>

      {/* Organizer spotlights */}
      <section className="mx-auto max-w-6xl px-6 pb-16 grid gap-5 sm:grid-cols-2">
        {organizerSpotlights.map((org: any, index: number) => (
          <article key={org.name} className="border border-[#D9C9E0] rounded-sm overflow-hidden bg-white">
            <img
              src={org.image || spotlightImageFallbacks[index % spotlightImageFallbacks.length]}
              alt={org.name}
              className="w-full h-[150px] object-cover"
            />
            <div className="p-[22px]">
              <p className={`${heading} font-medium text-xs text-[#8A7A96] uppercase tracking-wider`}>
                {org.focus}
              </p>
              <h3 className={`${heading} font-bold text-xl text-[#2E1F45] mt-2`}>{org.name}</h3>
              <p className={`${body} font-medium text-[13px] text-[#9B1F5C] mt-1.5`}>{org.stat}</p>
              <p className={`${body} text-sm text-[#5C4A6B] mt-2.5`}>{org.blurb}</p>
            </div>
          </article>
        ))}
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className={`${heading} font-bold text-2xl text-[#2E1F45]`}>Pick the setup that fits your team</h2>
        <p className={`${body} text-[#5C4A6B] max-w-xl mt-2.5 mb-9 text-sm`}>
          Start hosting events on FemVents — choose a plan and get access to your dashboard.
        </p>
        <div className="grid gap-5 md:grid-cols-3">
          {pricingPlans.map((plan) => {
            const isHighlight = plan.id === "growth";
            return (
              <div
                key={plan.id}
                className={`relative rounded-sm p-7 ${
                  isHighlight ? "bg-[#2E1F45] text-[#FBF3FA]" : "bg-white border border-[#D9C9E0] text-[#2E1F45]"
                }`}
              >
                {isHighlight && (
                  <span
                    className={`${heading} absolute -top-3 left-7 bg-[#E8743B] text-[#2E1F45] font-bold text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-full`}
                  >
                    Most popular
                  </span>
                )}
                <p className={`${heading} font-medium text-[11px] uppercase tracking-wider opacity-65`}>
                  {plan.badge}
                </p>
                <div className="flex items-end justify-between mt-4">
                  <span className={`${heading} font-bold text-[22px]`}>{plan.name}</span>
                  <span className={`${heading} font-bold text-lg`}>{plan.price}</span>
                </div>
                <p className={`${body} text-[13px] mt-3 opacity-85`}>{plan.description}</p>
                <a href={`${process.env.NEXT_PUBLIC_HOST_APP_URL}/signup?plan=${plan.id}`}>
                  <button
                    className={`${heading} w-full mt-6 py-3 rounded-sm font-bold text-sm ${
                      isHighlight ? "bg-[#E8743B] text-[#2E1F45]" : "bg-[#F3D9EE] text-[#2E1F45]"
                    }`}
                  >
                    Choose {plan.name}
                  </button>
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works — light background, colored step cards */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <p className={`${heading} font-medium text-[13px] text-[#9B1F5C] mb-3.5`}>How it works</p>
        <h2 className={`${heading} font-bold text-2xl text-[#2E1F45]`}>Simple tools for professional results</h2>
        <p className={`${body} text-[#5C4A6B] max-w-xl mt-2.5 mb-9 text-sm`}>
          Create and manage events with tools designed to keep your team organized and your attendees happy.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {howItWorks.map((step, index) => {
            const c = stepColors[index % stepColors.length];
            return (
              <div key={step} className={`${c.bg} rounded-sm p-[22px]`}>
                <p className={`${heading} font-medium text-xs uppercase tracking-wider opacity-75 ${c.text}`}>
                  Step {index + 1}
                </p>
                <p className={`${body} font-medium text-base mt-2.5 ${c.text}`}>{step}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Impact stats */}
      <section className="mx-auto max-w-6xl px-6 pb-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {impactStats.map((stat, index) => {
          const c = statColors[index % statColors.length];
          return (
            <div key={stat.label} className={`${c.bg} rounded-sm p-5`}>
              <p className={`${heading} font-medium text-[11px] uppercase tracking-wider opacity-70 ${c.text}`}>
                {stat.label}
              </p>
              <p className={`${heading} font-bold text-[30px] mt-2.5 ${c.text}`}>{stat.value}</p>
              <p className={`${body} text-[13px] mt-1.5 opacity-85 ${c.text}`}>{stat.detail}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}