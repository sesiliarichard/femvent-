import Link from "next/link";
import { Space_Grotesk, Work_Sans } from "next/font/google";
import { supabase } from "@/lib/supabase";
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

const typeColors: Record<string, { bg: string; text: string }> = {
  Fellowship: { bg: "bg-[#FBEAE0]", text: "text-[#8A3E1A]" },
  Grant: { bg: "bg-[#F9E5F0]", text: "text-[#7A1745]" },
  "Travel funding": { bg: "bg-[#EEEAF6]", text: "text-[#392C5E]" },
  Residency: { bg: "bg-[#F3D9EE]", text: "text-[#7A1745]" },
  Job: { bg: "bg-[#F3F1F8]", text: "text-[#2E1F45]" },
  Consultancy: { bg: "bg-[#FBEAE0]", text: "text-[#8A3E1A]" },
  "Call for papers": { bg: "bg-[#F9E5F0]", text: "text-[#7A1745]" },
  "Call for speakers": { bg: "bg-[#EEEAF6]", text: "text-[#392C5E]" },
  "Call for participants": { bg: "bg-[#F3D9EE]", text: "text-[#7A1745]" },
  "Research opportunity": { bg: "bg-[#F3F1F8]", text: "text-[#2E1F45]" },
  "Volunteer opportunity": { bg: "bg-[#FBEAE0]", text: "text-[#8A3E1A]" },
  "Campaign action": { bg: "bg-[#F9E5F0]", text: "text-[#7A1745]" },
  "Training opportunity": { bg: "bg-[#EEEAF6]", text: "text-[#392C5E]" },
  Mentorship: { bg: "bg-[#F3D9EE]", text: "text-[#7A1745]" },
  Other: { bg: "bg-[#F3F1F8]", text: "text-[#2E1F45]" },
};

// Default text and photo. Anything saved in Admin → Edit Opportunities Page replaces these.
const D = {
  title: "Calls & opportunities",
  intro: "Fellowships, grants, travel funding, calls for papers, jobs, and more — opportunities shared by feminist organizers and movements.",
  bannerImage: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1600&q=80",
};

async function getOpportunities() {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .order("deadline", { ascending: true, nullsFirst: false });

  if (error || !data) return [];
  return data;
}

export default async function OpportunitiesPage() {
  const opportunities = await getOpportunities();
  const { opportunitiesPage } = await getSiteContent();
  const pg = {
    ...D,
    ...Object.fromEntries(Object.entries(opportunitiesPage).filter(([, v]) => v !== "" && v != null)),
  } as typeof D;

  const fontVars = `${spaceGrotesk.variable} ${workSans.variable}`;
  const heading = "font-[family-name:var(--font-space-grotesk)]";
  const body = "font-[family-name:var(--font-work-sans)]";

  return (
    <main className={`${fontVars} bg-[#FBF3FA]`}>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <h1 className={`${heading} font-bold text-4xl sm:text-[42px] leading-[1.1] text-[#2E1F45] max-w-2xl`}>
        {pg.title}
        </h1>
        <p className={`${body} text-[#5C4A6B] max-w-xl mt-4 text-[15px] leading-relaxed`}>
        {pg.intro}
        </p>
      </section>

      {/* Photo banner */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="h-[200px] sm:h-[300px] overflow-hidden rounded-sm">
          <img
            src={pg.bannerImage}
            alt="People learning and organizing together"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {/* List */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        {opportunities.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#D9C9E0] bg-white p-14 text-center">
            <p className={`${heading} font-bold text-base text-[#2E1F45] mb-2`}>
              No opportunities listed yet
            </p>
            <p className={`${body} text-sm text-[#5C4A6B] max-w-md mx-auto`}>
              Fellowships, grants, calls for papers, and other opportunities shared by hosts will
              appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {opportunities.map((o: any) => {
              const c = typeColors[o.type] || typeColors.Other;
              const deadline = o.deadline
                ? new Date(o.deadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null;
              return (
                <Link
                  key={o.id}
                  href={`/opportunities/${o.id}`}
                  className="block border border-[#D9C9E0] rounded-sm bg-white hover:border-[#9B1F5C] transition-colors p-6"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {o.type && (
                      <span className={`${body} text-xs font-medium px-3 py-1.5 rounded-full ${c.bg} ${c.text}`}>
                        {o.type}
                      </span>
                    )}
                    {o.remote && (
                      <span className={`${body} text-xs font-medium px-3 py-1.5 rounded-full bg-[#EEEAF6] text-[#392C5E]`}>
                        Remote
                      </span>
                    )}
                  </div>
                  <h3 className={`${heading} font-bold text-xl text-[#2E1F45]`}>{o.title}</h3>
                  {o.organization && (
                    <p className={`${body} text-sm text-[#8A7A96] mt-1`}>{o.organization}</p>
                  )}
                  <div className={`${body} flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#8A7A96] mt-3`}>
                    {o.location && <span>{o.location}</span>}
                    {deadline && <span>Deadline: {deadline}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}