type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="text-center max-w-4xl mx-auto">
      {eyebrow && (
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#9B1F5C]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-4 text-4xl md:text-5xl font-black tracking-tight text-[#2E1F45] leading-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-[#5C4A6B] leading-relaxed">{description}</p>
      )}
    </div>
  );
}