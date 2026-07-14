import PageHero from "@/components/PageHero";
import { blogPosts } from "@/lib/content";

export default function BlogPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 pb-20">
      <PageHero
        highlight="📚 Blog"
        title="Tips and stories from the FemVents community"
        description="Learn from successful event organizers and stay updated on trends in the African events scene."
      />
      <div className="grid gap-8 md:grid-cols-2">
        {blogPosts.map((post, index) => {
          const gradients = [
            'from-blue-500/10 to-cyan-500/5',
            'from-purple-500/10 to-pink-500/5',
            'from-orange-500/10 to-amber-500/5',
          ];
          const icons = ['✍️', '📊', '🎯'];

          return (
            <article
              key={post.title}
              className={`group relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br ${gradients[index]} p-6 shadow-lg hover-lift`}
            >
              <div className="absolute top-4 right-4 text-3xl opacity-15 group-hover:opacity-25 transition-opacity">
                {icons[index]}
              </div>
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] bg-gradient-to-r from-gray-500 to-gray-400 bg-clip-text text-transparent">
                  {post.date}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-gray-900">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{post.excerpt}</p>
                <p className="mt-4 text-sm font-semibold text-gray-900">
                  {post.author}
                </p>
                <button className="mt-4 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors">
                  Keep reading →
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

