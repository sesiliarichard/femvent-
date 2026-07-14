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
        <p className="text-sm font-black uppercase tracking-[0.25em] bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-4 text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent leading-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-gray-600 leading-relaxed">{description}</p>
      )}
    </div>
  );
}

