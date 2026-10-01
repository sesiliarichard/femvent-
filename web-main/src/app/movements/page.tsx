import Link from "next/link";
import { Space_Grotesk, Work_Sans } from "next/font/google";
import { supabase } from "@/lib/supabase";

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

const logoFallbackColors = ["#E8743B", "#9B1F5C", "#4A3B78", "#C9508A"];

// To replace the banner photo, change this link (or use your own file, e.g. "/images/movements-hero.jpg")
const bannerImage = "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1600&q=80";

async function getMovements() {
  const { data, error } = await supabase
    .from("movements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export default async function MovementsPage() {
  const movements = await getMovements();

  const fontVars = `${spaceGrotesk.variable} ${workSans.variable}`;
  const heading = "font-[family-name:var(--font-space-grotesk)]";
  const body = "font-[family-name:var(--font-work-sans)]";

  return (
    <main className={`${fontVars} bg-[#FBF3FA]`}>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <h1 className={`${heading} font-bold text-4xl sm:text-[42px] leading-[1.1] text-[#2E1F45] max-w-2xl`}>
          Movements &amp; collectives
        </h1>
        <p className={`${body} text-[#5C4A6B] max-w-xl mt-4 text-[15px] leading-relaxed`}>
          Find out who else is organizing around the issues you care about — and connect across
          places, languages, and movements.
        </p>
      </section>

      {/* Photo banner */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="relative h-[200px] sm:h-[300px] overflow-hidden rounded-sm">
          <img
            src={bannerImage}
            alt="Collectives and movements organizing together"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#2E1F45]/15" />
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        {movements.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#D9C9E0] bg-white p-14 text-center">
            <p className={`${heading} font-bold text-base text-[#2E1F45] mb-2`}>
              No collectives listed yet
            </p>
            <p className={`${body} text-sm text-[#5C4A6B] max-w-md mx-auto`}>
              Movements and collectives that create a profile on FemVents will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {movements.map((m: any, index: number) => {
              const initials = (m.name || "?")
                .split(" ")
                .map((w: string) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const fallbackColor = logoFallbackColors[index % logoFallbackColors.length];
              return (
                <Link
                  key={m.id}
                  href={`/movements/${m.id}`}
                  className="block border border-[#D9C9E0] rounded-sm overflow-hidden bg-white hover:border-[#9B1F5C] transition-colors"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {m.logo_url ? (
                        <img
                          src={m.logo_url}
                          alt={m.name}
                          className="w-12 h-12 rounded-full object-cover border border-[#D9C9E0]"
                        />
                      ) : (
                        <div
                          className={`${heading} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm`}
                          style={{ backgroundColor: fallbackColor }}
                        >
                          {initials}
                        </div>
                      )}
                      <div>
                        <h3 className={`${heading} font-bold text-lg text-[#2E1F45]`}>{m.name}</h3>
                        <p className={`${body} text-xs text-[#8A7A96]`}>
                          {[m.city, m.country].filter(Boolean).join(" / ") || "Location not listed"}
                        </p>
                      </div>
                    </div>
                    {m.focus_areas?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {m.focus_areas.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className={`${body} text-xs font-medium px-3 py-1.5 rounded-full bg-[#F3D9EE] text-[#7A1745]`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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