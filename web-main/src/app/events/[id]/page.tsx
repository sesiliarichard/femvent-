import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

async function getEvent(id: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) notFound();

  const eventDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Date TBA";

  const venueName = event.venue?.name || event.location || "Venue TBA";
  const venueCity = event.venue?.city || "";
  const speakers: Array<{ name?: string; title?: string }> = event.speakers || [];
  const agenda: Array<{ title?: string; time?: string }> = event.agenda || [];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20">
      <PageHero
        highlight={event.category || "🎉 Event"}
        title={event.title}
        description={event.description}
        action={
          <Link
            href={`/events/${id}/register`}
            className="inline-block rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
          >
            Register Now →
          </Link>
        }
      />

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
            <SectionHeading eyebrow="About this event" title="Event Details" />
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
              {event.description}
            </p>
          </article>

          {speakers.length > 0 && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="Who's speaking" title="Speakers" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {speakers.map((speaker, index) => (
                  <div
                    key={`${speaker.name}-${index}`}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <p className="text-sm font-semibold text-gray-900">{speaker.name}</p>
                    {speaker.title && (
                      <p className="text-xs text-gray-500">{speaker.title}</p>
                    )}
                  </div>
                ))}
              </div>
            </article>
          )}

          {agenda.length > 0 && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="What to expect" title="Agenda Highlights" />
              <div className="mt-4 flex flex-col gap-3">
                {agenda.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                      {item.time
                        ? new Date(item.time).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{item.title}</span>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-6 shadow-lg sticky top-24">
          <SectionHeading eyebrow="Event Info" title="📋 Quick facts" />
          <div className="mt-6 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Date & Time
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">{eventDate}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Venue
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {venueName}
                {venueCity && `, ${venueCity}`}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Price
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {event.price > 0 ? `$${event.price}` : "Free"}
              </p>
            </div>
            {event.capacity && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Capacity
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {event.tickets_sold || 0} / {event.capacity} registered
                </p>
              </div>
            )}
          </div>
          <Link
            href={`/events/${id}/register`}
            className="mt-6 block rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
          >
            Register Now →
          </Link>
        </aside>
      </section>
    </main>
  );
}