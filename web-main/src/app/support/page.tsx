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

const topicStyles = [
  {
    color: "#9B1F5C",
    text: "#FBF3FA",
    border: "rgba(255,255,255,0.18)",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
  },
  {
    color: "#E8743B",
    text: "#2E1F45",
    border: "rgba(46,31,69,0.18)",
    image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&q=80",
  },
  {
    color: "#4A3B78",
    text: "#FBF3FA",
    border: "rgba(255,255,255,0.18)",
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=600&q=80",
  },
  {
    color: "#C9508A",
    text: "#FBF3FA",
    border: "rgba(255,255,255,0.18)",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80",
  },
];

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default async function SupportPage() {
  const { faq, supportTopics } = await getSiteContent();

  const fontVars = `${spaceGrotesk.variable} ${workSans.variable}`;
  const heading = "font-[family-name:var(--font-space-grotesk)]";
  const body = "font-[family-name:var(--font-work-sans)]";

  return (
    <main className={`${fontVars} bg-[#FBF3FA]`}>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-10">
        <p className={`${heading} font-medium text-[13px] text-[#9B1F5C] mb-3.5`}>Support</p>
        <h1 className={`${heading} font-bold text-4xl leading-[1.1] text-[#2E1F45]`}>We&apos;re here to help</h1>
        <p className={`${body} text-[#5C4A6B] max-w-md mt-4 text-[15px] leading-relaxed`}>
          Get help with your events, account, or technical issues. Our support team is available to answer your
          questions.
        </p>
        <div className="flex flex-wrap gap-3 mt-7">
          <button className={`${heading} font-bold text-sm bg-[#2E1F45] text-[#FBF3FA] px-6 py-3.5 rounded-sm`}>
            Contact support
          </button>
          <button className={`${heading} font-bold text-sm bg-transparent text-[#2E1F45] border border-[#D9C9E0] px-6 py-3.5 rounded-sm`}>
            System status
          </button>
        </div>
      </section>

      {/* Support topics */}
      <section className="mx-auto max-w-3xl px-6 pb-16 grid gap-4 sm:grid-cols-2">
        {supportTopics.map((topic, index) => {
          const s = topicStyles[index % topicStyles.length];
          return (
            <div
              key={topic.title}
              className="rounded-sm p-6 min-h-[190px] bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(0deg, ${hexToRgba(s.color, 0.9)}, ${hexToRgba(
                  s.color,
                  0.78
                )}), url('${s.image}')`,
              }}
            >
              <p
                className={`${heading} font-bold text-[13px] uppercase tracking-wider mb-3.5`}
                style={{ color: s.text }}
              >
                {topic.title}
              </p>
              <ul className="m-0 p-0 list-none">
                {topic.items.map((item, itemIndex) => (
                  <li
                    key={item}
                    className={`${body} text-sm py-2`}
                    style={{
                      color: s.text,
                      borderTop: itemIndex > 0 ? `1px solid ${s.border}` : "none",
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <h2 className={`${heading} font-bold text-2xl text-[#2E1F45]`}>Frequently asked questions</h2>
        <p className={`${body} text-[#5C4A6B] max-w-md mt-2.5 mb-7 text-sm`}>
          Find answers to common questions. Need more help? Contact our support team.
        </p>
        <div className="space-y-3">
          {faq.map((item, index) => (
            <details
              key={item.question}
              open={index === 0}
              className="border border-[#D9C9E0] rounded-sm p-5 bg-white [&_summary::-webkit-details-marker]:hidden"
            >
              <summary
                className={`${heading} font-bold text-[15px] text-[#2E1F45] cursor-pointer flex justify-between items-center list-none`}
              >
                {item.question}
                <span className="text-[#9B1F5C] text-xl font-normal">+</span>
              </summary>
              <p className={`${body} text-sm text-[#5C4A6B] mt-3`}>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}