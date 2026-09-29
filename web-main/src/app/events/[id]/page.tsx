import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

interface AccessInfo {
  languages?: string[];
  interpretation?: boolean;
  captions?: boolean;
  wheelchair_accessible?: boolean;
  online_participation?: boolean;
  childcare?: boolean;
  transport_support?: boolean;
  scholarships_available?: boolean;
  cost_notes?: string;
  notes?: string;
}

interface CareSafety {
  code_of_conduct_url?: string;
  safeguarding_contact?: string;
  photography_policy?: string;
  recording_policy?: string;
}

interface PrivacyInfo {
  participant_names_public?: boolean;
  location_disclosed_after_registration?: boolean;
  registration_data_retained?: boolean;
  notes?: string;
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

const accessChecklistLabels: Array<{ key: keyof AccessInfo; label: string }> = [
  { key: "interpretation", label: "Interpretation provided" },
  { key: "captions", label: "Captions available" },
  { key: "wheelchair_accessible", label: "Wheelchair accessible" },
  { key: "online_participation", label: "Online participation option" },
  { key: "childcare", label: "Childcare available" },
  { key: "transport_support", label: "Transport support" },
  { key: "scholarships_available", label: "Scholarships / fee waivers available" },
];

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

  const audienceDescription: string | undefined = event.audience_description;
  const access: AccessInfo | undefined = event.access_info;
  const careSafety: CareSafety | undefined = event.care_safety;
  const privacy: PrivacyInfo | undefined = event.privacy_info;
  const afterGathering: string | undefined = event.after_gathering;

  const hasAccessContent =
    access &&
    (access.notes ||
      access.cost_notes ||
      (access.languages && access.languages.length > 0) ||
      accessChecklistLabels.some(({ key }) => access[key] === true));

  const hasCareSafetyContent =
    careSafety &&
    (careSafety.code_of_conduct_url ||
      careSafety.safeguarding_contact ||
      careSafety.photography_policy ||
      careSafety.recording_policy);

  const hasPrivacyContent =
    privacy &&
    (privacy.notes ||
      privacy.participant_names_public !== undefined ||
      privacy.location_disclosed_after_registration !== undefined ||
      privacy.registration_data_retained !== undefined);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20">
      <PageHero
        highlight={event.category || "Gathering"}
        title={event.title}
        description={event.description}
        action={
          <Link
            href={`/events/${id}/register`}
            className="inline-block rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
          >
           Join this gathering →
          </Link>
        }
      />

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
            <SectionHeading eyebrow="About this gathering" title="Why we're gathering" />
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
              {event.description}
            </p>
          </article>

          {audienceDescription && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="Participation" title="Who is this gathering for?" />
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {audienceDescription}
              </p>
            </article>
          )}

          {hasAccessContent && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="Participating with access needs" title="Access & participation" />
              <div className="mt-4 flex flex-wrap gap-2">
                {accessChecklistLabels
                  .filter(({ key }) => access?.[key] === true)
                  .map(({ key, label }) => (
                    <span
                      key={key}
                      className="rounded-full bg-[#F3D9EE] px-3 py-1.5 text-xs font-medium text-[#7A1745]"
                    >
                      ✓ {label}
                    </span>
                  ))}
              </div>
              {access?.languages && access.languages.length > 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Languages: </span>
                  {access.languages.join(", ")}
                </p>
              )}
              {access?.cost_notes && (
                <p className="mt-3 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Cost: </span>
                  {access.cost_notes}
                </p>
              )}
              {access?.notes && (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                  {access.notes}
                </p>
              )}
            </article>
          )}

          {hasCareSafetyContent && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="Gathering with care" title="Care & safety" />
              <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600">
                {careSafety?.code_of_conduct_url && (
                  <p>
                    <span className="font-semibold text-gray-900">Code of conduct: </span>
                    <a
                      href={careSafety.code_of_conduct_url}
                      className="text-[#9B1F5C] underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Read it here
                    </a>
                  </p>
                )}
                {careSafety?.safeguarding_contact && (
                  <p>
                    <span className="font-semibold text-gray-900">Safeguarding contact: </span>
                    {careSafety.safeguarding_contact}
                  </p>
                )}
                {careSafety?.photography_policy && (
                  <p>
                    <span className="font-semibold text-gray-900">Photography policy: </span>
                    {careSafety.photography_policy}
                  </p>
                )}
                {careSafety?.recording_policy && (
                  <p>
                    <span className="font-semibold text-gray-900">Recording policy: </span>
                    {careSafety.recording_policy}
                  </p>
                )}
              </div>
            </article>
          )}

          {hasPrivacyContent && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="Before you join" title="Privacy" />
              <div className="mt-4 flex flex-col gap-2 text-sm text-gray-600">
                {privacy?.participant_names_public !== undefined && (
                  <p>
                    {privacy.participant_names_public
                      ? "Participant names may be visible to others at this gathering."
                      : "Participant names are kept private."}
                  </p>
                )}
                {privacy?.location_disclosed_after_registration !== undefined && (
                  <p>
                    {privacy.location_disclosed_after_registration
                      ? "The exact location is shared after you register."
                      : "The location is public."}
                  </p>
                )}
                {privacy?.registration_data_retained !== undefined && (
                  <p>
                    {privacy.registration_data_retained
                      ? "Your registration details are retained by the host."
                      : "Your registration details are not retained after the gathering."}
                  </p>
                )}
                {privacy?.notes && <p className="whitespace-pre-line">{privacy.notes}</p>}
              </div>
            </article>
          )}

          {speakers.length > 0 && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading  eyebrow="Who's involved" title="Speakers and facilitators"/>
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
              <SectionHeading eyebrow="How we'll gather" title="Agenda" />
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

          {afterGathering && (
            <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <SectionHeading eyebrow="Beyond this gathering" title="What happens afterward?" />
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {afterGathering}
              </p>
            </article>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-6 shadow-lg sticky top-24">
          <SectionHeading eyebrow="Gathering info" title="Quick facts"/>
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
                  {event.tickets_sold || 0} / {event.capacity} participants
                </p>
              </div>
            )}
          </div>
          <Link
            href={`/events/${id}/register`}
            className="mt-6 block rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
          >
            Join this gathering →
          </Link>
        </aside>
      </section>
    </main>
  );
}