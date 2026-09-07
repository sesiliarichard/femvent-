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

const postImageFallbacks = [
  "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=600&q=80",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80",
];

export default async function BlogPage() {
  const { blogPosts } = await getSiteContent();

  const fontVars = `${spaceGrotesk.variable} ${workSans.variable}`;
  const heading = "font-[family-name:var(--font-space-grotesk)]";
  const body = "font-[family-name:var(--font-work-sans)]";

  return (
    <main className={`${fontVars} bg-[#FBF3FA]`}>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-10">
        <p className={`${heading} font-medium text-[13px] text-[#9B1F5C] mb-3.5`}>Blog</p>
        <h1 className={`${heading} font-bold text-4xl leading-[1.15] text-[#2E1F45] max-w-xl`}>
          Tips and stories from the FemVents community
        </h1>
        <p className={`${body} text-[#5C4A6B] max-w-lg mt-4 text-[15px] leading-relaxed`}>
          Learn from successful event organizers and stay updated on trends in the African events scene.
        </p>
      </section>

      {/* Post grid */}
      <section className="mx-auto max-w-4xl px-6 pb-20 grid gap-6 sm:grid-cols-2">
        {blogPosts.map((post: any, index: number) => (
          <article key={post.title} className="border border-[#D9C9E0] rounded-sm overflow-hidden bg-white">
            <img
              src={post.image || postImageFallbacks[index % postImageFallbacks.length]}
              alt={post.title}
              className="w-full h-[170px] object-cover"
            />
            <div className="p-6">
              <p className={`${heading} font-medium text-xs text-[#8A7A96] uppercase tracking-wider`}>
                {post.date}
              </p>
              <h3 className={`${heading} font-bold text-xl text-[#2E1F45] mt-2.5 leading-snug`}>{post.title}</h3>
              <p className={`${body} text-sm text-[#5C4A6B] mt-2.5`}>{post.excerpt}</p>
              <p className={`${body} font-medium text-[13px] text-[#2E1F45] mt-4`}>By {post.author}</p>
              <button className={`${heading} font-bold text-sm text-[#9B1F5C] mt-3 block`}>Keep reading →</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}