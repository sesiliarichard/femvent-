type PageHeroProps = {
  title: string;
  description: string;
  highlight?: string;
  action?: React.ReactNode;
};

export default function PageHero({
  title,
  description,
  highlight,
  action,
}: PageHeroProps) {
  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-100 via-purple-50 to-orange-50 py-16 shadow-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-rose-400/20 to-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-pink-400/20 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto px-6">
          {highlight && (
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-lg">
              {highlight}
            </span>
          )}
          <h1 className="mt-6 text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent leading-tight">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-xl text-gray-700 leading-relaxed">{description}</p>
          {action && <div className="mt-8">{action}</div>}
        </div>
      </section>
    </div>
  );
}

