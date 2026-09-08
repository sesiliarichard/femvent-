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

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$29/mo",
    description: "For new organizers launching their first event.",
    badge: "Best for first-time hosts",
    features: [
      { label: "Events", value: "1 live event at a time" },
      { label: "Ticketing", value: "Free & paid tickets" },
      { label: "Check-in", value: "QR scanner" },
      { label: "Team", value: "1 (you)" },
      { label: "Marketing", value: "Basic email notifications" },
      { label: "Analytics", value: "Basic sales dashboard" },
      { label: "Automation", value: "—" },
      { label: "Support", value: "Email support" },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "$79/mo",
    description: "For growing communities managing more than one event.",
    badge: "Popular for scaling teams",
    features: [
      { label: "Events", value: "Unlimited simultaneous events" },
      { label: "Ticketing", value: "Discount codes, waitlists" },
      { label: "Check-in", value: "QR scanner + check-in analytics" },
      { label: "Team", value: "Up to 5 seats" },
      { label: "Marketing", value: "Bulk email & SMS, affiliate tracking" },
      { label: "Analytics", value: "Full sales & attendee analytics" },
      { label: "Automation", value: "Basic email workflows" },
      { label: "Support", value: "Priority email support" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$149/mo",
    description: "Advanced automation, analytics, and premium support.",
    badge: "Built for full-scale operations",
    features: [
      { label: "Events", value: "Unlimited + multi-day events" },
      { label: "Ticketing", value: "Seating/seat maps, A/B testing" },
      { label: "Check-in", value: "Advanced check-in + live analytics" },
      { label: "Team", value: "Unlimited seats" },
      { label: "Marketing", value: "Full email workflow automation" },
      { label: "Analytics", value: "Custom reports, exportable data" },
      { label: "Automation", value: "Tax calc, invoicing, virtual events (Zoom)" },
      { label: "Support", value: "Dedicated priority support" },
    ],
  },
] as const;

export default function PricingPage() {
  const hostAppUrl = process.env.NEXT_PUBLIC_HOST_APP_URL || "";

  const fontVars = `${spaceGrotesk.variable} ${workSans.variable}`;
  const heading = "font-[family-name:var(--font-space-grotesk)]";
  const body = "font-[family-name:var(--font-work-sans)]";

  return (
    <main className={`${fontVars} bg-[#FBF3FA]`}>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <p className={`${heading} font-medium text-[13px] text-[#9B1F5C] mb-3.5`}>Pricing</p>
        <h1 className={`${heading} font-bold text-4xl sm:text-[42px] leading-[1.1] text-[#2E1F45] max-w-xl`}>
          Pick the setup that fits your team
        </h1>
        <p className={`${body} text-[#5C4A6B] max-w-md mt-4 text-[15px] leading-relaxed`}>
          Start hosting events on FemVents — choose a plan and get access to your dashboard.
        </p>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-6xl px-6 pt-3 pb-16 grid gap-5 md:grid-cols-3 items-start">
        {plans.map((plan) => {
          const isHighlight = plan.id === "growth";
          return (
            <div
              key={plan.id}
              className={`relative rounded-sm p-7 flex flex-col ${
                isHighlight
                  ? "bg-[#2E1F45] text-[#FBF3FA] shadow-[0_24px_48px_rgba(46,31,69,0.28)] md:-translate-y-3"
                  : "bg-white border border-[#D9C9E0] text-[#2E1F45]"
              }`}
            >
              {isHighlight && (
                <span
                  className={`${heading} absolute -top-[13px] left-7 bg-[#E8743B] text-[#2E1F45] font-bold text-[11px] uppercase tracking-wide px-3.5 py-1.5 rounded-full shadow-[0_4px_10px_rgba(232,116,59,0.4)]`}
                >
                  Most popular
                </span>
              )}
              <p className={`${heading} font-medium text-[11px] uppercase tracking-wider opacity-65`}>
                {plan.badge}
              </p>
              <div className="flex items-end justify-between mt-4">
                <span className={`${heading} font-bold text-[26px]`}>{plan.name}</span>
                <span className={`${heading} font-bold text-lg`}>{plan.price}</span>
              </div>
              <p
                className={`${body} text-sm mt-3.5 pb-5 opacity-85 border-b ${
                  isHighlight ? "border-white/15" : "border-black/10"
                }`}
              >
                {plan.description}
              </p>

              <ul className="list-none m-0 p-0 flex-grow">
                {plan.features.map((feature, index) => (
                  <li
                    key={feature.label}
                    className={`${body} text-[13px] flex gap-2 items-baseline ${
                      index === 0 ? "pt-4 pb-2.5" : "py-2.5 border-t"
                    } ${isHighlight ? "border-white/15" : "border-black/10"}`}
                  >
                    <span
                      className={`${heading} font-bold text-[10.5px] uppercase tracking-wider opacity-55 flex-shrink-0 w-20`}
                    >
                      {feature.label}
                    </span>
                    <span className="flex-1 font-medium">{feature.value}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`${hostAppUrl}/signup?plan=${plan.id}`}
                className={`${heading} block w-full mt-7 py-3.5 rounded-sm text-center font-bold text-sm ${
                  isHighlight ? "bg-[#E8743B] text-[#2E1F45]" : "bg-[#F3D9EE] text-[#2E1F45]"
                }`}
              >
                Choose {plan.name}
              </Link>
            </div>
          );
        })}
      </section>
    </main>
  );
}