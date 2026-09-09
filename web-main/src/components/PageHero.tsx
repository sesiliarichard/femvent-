type PageHeroProps = {
  title: string;
  description: string;
  highlight?: React.ReactNode;
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
      <section className="relative overflow-hidden bg-[#FBF3FA] py-16 shadow-none">
        <div className="max-w-6xl mx-auto px-6">
          {highlight && (
            <span className="inline-flex items-center rounded-full bg-[#9B1F5C] px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] text-[#FBF3FA]">
              {highlight}
            </span>
          )}
          <h1 className="mt-6 text-5xl md:text-6xl font-bold tracking-tight text-[#2E1F45] leading-tight">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-xl text-[#5C4A6B] leading-relaxed">{description}</p>
          {action && <div className="mt-8">{action}</div>}
        </div>
      </section>
    </div>
  );
}