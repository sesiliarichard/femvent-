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

const filters = ["All", "Trending", "Hybrid", "In-person", "Virtual"];

const tagColors: Record<string, { bg: string; text: string }> = {
  orange: { bg: "bg-[#FBEAE0]", text: "text-[#8A3E1A]" },
  plum: { bg: "bg-[#F3F1F8]", text: "text-[#2E1F45]" },
  magenta: { bg: "bg-[#F9E5F0]", text: "text-[#7A1745]" },
  purple: { bg: "bg-[#EEEAF6]", text: "text-[#392C5E]" },
  lavender: { bg: "bg-[#F3D9EE]", text: "text-[#7A1745]" },
};
const tagCycle = ["orange", "magenta", "plum", "purple", "lavender"];

const eventImageFallbacks = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80",
  "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=600&q=80",
];

const categoryStyles = [
  {
    color: "#E8743B",
    text: "#2E1F45",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=500&q=80",
  },
  {
    color: "#2E1F45",
    text: "#FBF3FA",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&q=80",
  },
  {
    color: "#9B1F5C",
    text: "#FBF3FA",
    image: "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=500&q=80",
  },
  {
    color: "#4A3B78",
    text: "#FBF3FA",
    image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=500&q=80",
  },
  {
    color: "#C9508A",
    text: "#FBF3FA",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&q=80",
  },
  {
    color: "#F3D9EE",
    text: "#2E1F45",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=500&q=80",
  },
];

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default async function EventsPage() {
  const { categories, destinations, featuredEvents } = await getSiteContent();

  const fontVars = `${spaceGrotesk.variable} ${workSans.variable}`;
  const heading = "font-[family-name:var(--font-space-grotesk)]";
  const body = "font-[family-name:var(--font-work-sans)]";

  return (
    <main className={`${fontVars} bg-[#FBF3FA]`}>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <h1 className={`${heading} font-bold text-4xl sm:text-[42px] leading-[1.1] text-[#2E1F45] max-w-2xl`}>
          Find amazing events near you
        </h1>
        <p className={`${body} text-[#5C4A6B] max-w-xl mt-4 text-[15px] leading-relaxed`}>
          Browse upcoming festivals, workshops, concerts, networking events, and more. Filter by category and
          location to find exactly what you&apos;re looking for.
        </p>
        <div className="flex flex-wrap gap-2.5 mt-7">
          {filters.map((filter, index) => (
            <button
              key={filter}
              className={`${body} text-sm font-medium px-[18px] py-2.5 rounded-full border ${
                index === 0
                  ? "bg-[#2E1F45] text-[#FBF3FA] border-[#2E1F45]"
                  : "bg-transparent text-[#2E1F45] border-[#D9C9E0]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {/* Events + sidebar */}
      <section className="mx-auto max-w-6xl px-6 pb-16 grid gap-8 lg:grid-cols-[2fr_1fr] items-start">
        <div className="flex flex-col gap-4">
          {featuredEvents.map((event: any, index: number) => {
            const c1 = tagColors[tagCycle[index % tagCycle.length]];
            const c2 = tagColors[tagCycle[(index + 1) % tagCycle.length]];
            return (
              <article key={event.title} className="border border-[#D9C9E0] rounded-sm overflow-hidden bg-white">
                <img
                  src={event.image || eventImageFallbacks[index % eventImageFallbacks.length]}
                  alt={event.title}
                  className="w-full h-[160px] object-cover"
                />
                <div className="p-6">
                  <div className={`${body} flex justify-between text-xs font-medium text-[#8A7A96]`}>
                    <span>{event.city}</span>
                    <span>{event.date}</span>
                  </div>
                  <h3 className={`${heading} font-bold text-xl text-[#2E1F45] mt-3`}>{event.title}</h3>
                  <p className={`${body} text-sm text-[#5C4A6B] mt-2 max-w-md`}>{event.summary}</p>
                  <div className="flex flex-wrap gap-2 mt-3.5">
                    {event.tags?.map((tag: string, tagIndex: number) => {
                      const c = tagIndex === 0 ? c1 : c2;
                      return (
                        <span
                          key={tag}
                          className={`${body} text-xs font-medium px-3 py-1.5 rounded-full ${c.bg} ${c.text}`}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                  <div className={`${body} flex gap-5 mt-4 text-sm font-medium`}>
                    <button className="text-[#9B1F5C]">View details →</button>
                    <button className="text-[#8A7A96]">Save</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="border border-[#D9C9E0] rounded-sm p-6 bg-white sticky top-6">
          <p className={`${heading} italic text-[13px] text-[#8A7A96] mb-1.5`}>Browse by city</p>
          <h2 className={`${heading} font-bold text-lg text-[#2E1F45] mb-1.5`}>Find events in your city</h2>
          <p className={`${body} text-[13px] text-[#5C4A6B] mb-5`}>
            Check out what&apos;s happening in major cities across Africa.
          </p>
          <div>
            {destinations.map((city: any, index: number) => (
              <div key={city.city} className={`py-3 ${index > 0 ? "border-t border-[#EDE2F0]" : ""}`}>
                <p className={`${body} font-medium text-sm text-[#2E1F45]`}>{city.city}</p>
                <p className={`${body} text-xs text-[#8A7A96] mt-0.5`}>{city.stat}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className={`${heading} font-bold text-2xl text-[#2E1F45] mb-1.5`}>Browse by interest</h2>
        <p className={`${body} text-[#5C4A6B] max-w-xl mb-8 text-sm`}>
          Find events that match your interests, from music and art to business and wellness.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category: any, index: number) => {
            const s = categoryStyles[index % categoryStyles.length];
            return (
              <div
                key={category.title}
                className="group relative overflow-hidden rounded-sm min-h-[150px] bg-cover bg-center transition-transform duration-200 hover:scale-[1.015]"
                style={{ backgroundImage: `url('${category.image || s.image}')` }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `linear-gradient(180deg, ${hexToRgba(s.color, 0)} 35%, ${hexToRgba(
                      s.color,
                      0.85
                    )} 100%)`,
                  }}
                />
                <span
                  className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: s.color, color: s.text }}
                >
                  {category.title}
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className={`${heading} font-bold text-sm`} style={{ color: s.text }}>
                    {category.title}
                  </p>
                  <p className={`${body} text-[13px] mt-1`} style={{ color: s.text }}>
                    {category.copy}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}