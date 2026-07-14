import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import { faq, supportTopics } from "@/lib/content";

export default function SupportPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20">
      <PageHero
        highlight="🛒 Support"
        title="We're here to help"
        description="Get help with your events, account, or technical issues. Our support team is available to answer your questions."
        action={
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <button className="rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3 text-white shadow-lg hover:-translate-y-0.5 transition-all">
              💬 Contact support
            </button>
            <button className="rounded-full border-2 border-gray-200 hover:border-gray-400 px-6 py-3 text-gray-900 transition-all hover:-translate-y-0.5">
              📊 System status
            </button>
          </div>
        }
      />

      <section className="grid gap-6 rounded-3xl border border-gray-100 bg-white p-10 md:grid-cols-2">
        {supportTopics.map((topic) => (
          <div key={topic.title} className="rounded-2xl border border-dashed border-gray-200 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              {topic.title}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              {topic.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <SectionHeading
          eyebrow="❓ FAQ"
          title="Frequently asked questions"
          description="Find answers to common questions. Need more help? Contact our support team."
        />
        <div className="mt-6 space-y-4">
          {faq.map((item) => (
            <details key={item.question} className="rounded-2xl border border-gray-100 bg-white p-6">
              <summary className="cursor-pointer text-base font-semibold text-gray-900">
                {item.question}
              </summary>
              <p className="mt-3 text-sm text-gray-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

