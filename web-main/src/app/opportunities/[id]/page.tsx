import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";

interface OpportunityPageProps {
  params: Promise<{ id: string }>;
}

async function getOpportunity(id: string) {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function OpportunityDetailPage({ params }: OpportunityPageProps) {
  const { id } = await params;
  const opportunity = await getOpportunity(id);

  if (!opportunity) notFound();

  const deadline = opportunity.deadline
    ? new Date(opportunity.deadline).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "No deadline listed";

  const locationLine = opportunity.remote
    ? [opportunity.location, "Remote"].filter(Boolean).join(" · ")
    : opportunity.location || "Location not listed";

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20">
      <PageHero
        highlight={opportunity.type || "Opportunity"}
        title={opportunity.title}
        description={opportunity.organization || ""}
        action={
          opportunity.apply_url ? (
            <a
              href={opportunity.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
            >
              Apply / learn more →
            </a>
          ) : undefined
        }
      />

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          {opportunity.description && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="Details" title="About this opportunity" />
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {opportunity.description}
              </p>
            </article>
          )}

          {opportunity.eligibility && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="Who can apply" title="Eligibility" />
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {opportunity.eligibility}
              </p>
            </article>
          )}

          {opportunity.funding_details && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="Support" title="Funding & compensation" />
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {opportunity.funding_details}
              </p>
            </article>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-6 shadow-lg sticky top-24">
          <SectionHeading eyebrow="Opportunity info" title="Quick facts" />
          <div className="mt-6 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Deadline</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{deadline}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Location</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{locationLine}</p>
            </div>
            {opportunity.type && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Type</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{opportunity.type}</p>
              </div>
            )}
          </div>
          {opportunity.apply_url && (
            <a
              href={opportunity.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
            >
              Apply / learn more →
            </a>
          )}
        </aside>
      </section>
    </main>
  );
}