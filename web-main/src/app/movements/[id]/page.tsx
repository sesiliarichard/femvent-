import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";

interface MovementPageProps {
  params: Promise<{ id: string }>;
}

async function getMovement(id: string) {
  const { data, error } = await supabase
    .from("movements")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

async function getGatherings(hostId: string) {
  const { data } = await supabase
    .from("events")
    .select("id, title, event_date, location")
    .eq("host_id", hostId)
    .order("event_date", { ascending: true });

  return data || [];
}

export default async function MovementDetailPage({ params }: MovementPageProps) {
  const { id } = await params;
  const movement = await getMovement(id);

  if (!movement) notFound();

  const gatherings = movement.host_id ? await getGatherings(movement.host_id) : [];
  const now = new Date();
  const upcoming = gatherings.filter((g: any) => g.event_date && new Date(g.event_date) >= now);
  const past = gatherings.filter((g: any) => g.event_date && new Date(g.event_date) < now);

  const location = [movement.city, movement.country].filter(Boolean).join(" / ");
  const focusLine = movement.focus_areas?.join(" · ");

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20">
      <PageHero
        highlight={location || undefined}
        title={movement.name}
        description={focusLine || ""}
      />

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          {movement.about && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="About" title="About our work" />
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {movement.about}
              </p>
            </article>
          )}

          {movement.organizing_around && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="Focus" title="What we're organizing around" />
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {movement.organizing_around}
              </p>
            </article>
          )}

          {movement.where_we_work && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="Reach" title="Where we work" />
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {movement.where_we_work}
              </p>
            </article>
          )}

          {upcoming.length > 0 && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="What's next" title="Upcoming gatherings" />
              <div className="mt-4 flex flex-col gap-3">
                {upcoming.map((g: any) => (
                  <a
                    key={g.id}
                    href={`/events/${g.id}`}
                    className="block rounded-xl border border-gray-200 bg-gray-50 p-4 hover:border-rose-300 transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-900">{g.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {g.event_date
                        ? new Date(g.event_date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Date TBA"}
                      {g.location ? ` · ${g.location}` : ""}
                    </p>
                  </a>
                ))}
              </div>
            </article>
          )}

          {past.length > 0 && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="Movement memory" title="Past gatherings" />
              <div className="mt-4 flex flex-col gap-3">
                {past.map((g: any) => (
                  <a
                    key={g.id}
                    href={`/events/${g.id}`}
                    className="block rounded-xl border border-gray-200 bg-gray-50 p-4 hover:border-rose-300 transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-900">{g.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {g.event_date
                        ? new Date(g.event_date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : ""}
                      {g.location ? ` · ${g.location}` : ""}
                    </p>
                  </a>
                ))}
              </div>
            </article>
          )}

          {movement.resources?.length > 0 && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="Shared knowledge" title="Resources we've shared" />
              <div className="mt-4 flex flex-col gap-2">
                {movement.resources.map((r: { title: string; url: string }, i: number) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-rose-600 underline"
                  >
                    {r.title}
                  </a>
                ))}
              </div>
            </article>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-6 shadow-lg sticky top-24">
          <SectionHeading eyebrow="Details" title="Quick facts" />
          <div className="mt-6 flex flex-col gap-4">
            {location && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Based in</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{location}</p>
              </div>
            )}
            {movement.languages?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Languages</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{movement.languages.join(", ")}</p>
              </div>
            )}
            {movement.focus_areas?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Focus areas</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {movement.focus_areas.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#F3D9EE] text-[#7A1745]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(movement.contact?.email || movement.contact?.website) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Connect with us
              </p>
              <div className="flex flex-col gap-1.5">
                {movement.contact?.email && (
                  <a href={`mailto:${movement.contact.email}`} className="text-sm text-rose-600 underline">
                    {movement.contact.email}
                  </a>
                )}
                {movement.contact?.website && (
                  <a
                    href={movement.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-rose-600 underline"
                  >
                    Website
                  </a>
                )}
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}