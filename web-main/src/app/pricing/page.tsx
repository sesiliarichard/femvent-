import Link from "next/link";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$29/mo",
    description: "For new organizers launching their first event.",
    badge: "Best for first-time hosts",
  },
  {
    id: "growth",
    name: "Growth",
    price: "$79/mo",
    description: "For growing communities managing more than one event.",
    badge: "Popular for scaling teams",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$149/mo",
    description: "Advanced automation, analytics, and premium support.",
    badge: "Built for full-scale operations",
  },
] as const;

export default function PricingPage() {
  const hostAppUrl = process.env.NEXT_PUBLIC_HOST_APP_URL || "";

  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">Pricing</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight text-gray-900">
          Pick the setup that fits your team
        </h1>
        <p className="mt-4 text-lg text-gray-500">
          Start hosting events on FemVents — choose a plan and get access to your dashboard.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm hover:border-rose-300 hover:shadow-lg transition-all"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
              {plan.badge}
            </p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <h2 className="text-3xl font-black text-gray-900">{plan.name}</h2>
              <span className="text-xl font-bold text-gray-900">{plan.price}</span>
            </div>
            <p className="mt-4 text-sm text-gray-600">{plan.description}</p>

            <Link
              href={`${hostAppUrl}/signup?plan=${plan.id}`}
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:-translate-y-0.5"
            >
              Choose {plan.name}
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}