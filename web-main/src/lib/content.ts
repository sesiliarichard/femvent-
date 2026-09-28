export const brand = {
  name: "FemVents",
  tagline: "Where feminist movements gather",
  description:
    "FemVents is digital infrastructure for feminist movements: a place to find gatherings, connect across issues and places, share opportunities and resources, and preserve movement memory. Free to use, and built with feminist communities.",
  primaryCta: { label: "Get the app", href: "https://drive.google.com/file/d/1qOUyvL46xUA_oREOQAEJvW_LfTA6asXG/view?usp=sharing" },
  secondaryCta: { label: "For organizers", href: "/organizers" },
};

export const navLinks = [
  { label: "Gatherings", href: "/events" },
  { label: "Host a Gathering", href: "/organizers" },
  { label: "About", href: "/about" },
  { label: "Movement Notes", href: "/blog" },
  { label: "Support", href: "/support" },
];

export const destinations = [
  { city: "Nairobi", stat: "Feminist gatherings and collectives", vibe: "Organizing • Culture" },
  { city: "Lagos", stat: "Feminist gatherings and collectives", vibe: "Arts • Tech" },
  { city: "Cape Town", stat: "Feminist gatherings and collectives", vibe: "Justice • Care" },
  { city: "Johannesburg", stat: "Feminist gatherings and collectives", vibe: "Labour • Art" },
  { city: "Kigali", stat: "Feminist gatherings and collectives", vibe: "Care • Design" },
  { city: "Accra", stat: "Feminist gatherings and collectives", vibe: "Culture • Tech" },
];

export const categories = [
  {
    title: "Organizing",
    copy: "Movement building, campaigns, collective action, and strategy spaces.",
  },
  {
    title: "Bodily autonomy",
    copy: "Rights, health, and choice: learning circles, convenings, and actions.",
  },
  {
    title: "Feminist tech",
    copy: "Power, data, AI, and digital rights through a feminist lens.",
  },
  {
    title: "Climate justice",
    copy: "Land, water, ecology, and the feminist politics of the climate crisis.",
  },
  {
    title: "Economic justice",
    copy: "Labour, care work, livelihoods, and alternative economies.",
  },
  {
    title: "Queer liberation",
    copy: "Community, safety, joy, and organizing for queer freedom.",
  },
];

export const featuredEvents = [
  {
    title: "Feminist Tech Learning Circle",
    city: "Online",
    date: "Date to be announced",
    summary:
      "A space to explore gender, power, and technology together, and to share tools and strategies.",
    tags: ["Feminist tech", "Virtual"],
  },
  {
    title: "Bodily Autonomy Convening",
    city: "Nairobi",
    date: "Date to be announced",
    summary:
      "A gathering for organizers working on bodily autonomy to exchange knowledge and plan together.",
    tags: ["Bodily autonomy", "In-person"],
  },
  {
    title: "Care and Rest: A Feminist Healing Space",
    city: "Kigali",
    date: "Date to be announced",
    summary:
      "An accessible gathering centred on collective care, rest, and solidarity.",
    tags: ["Care", "Hybrid"],
  },
];

export const organizerSpotlights: Array<{
  name: string;
  focus: string;
  stat: string;
  blurb: string;
}> = [];

export const impactStats: Array<{
  label: string;
  value: string;
  detail: string;
}> = [];

export const blogPosts = [
  {
    title: "How We Gather: Notes on Feminist Convening",
    excerpt:
      "Practice notes on facilitation, care, and building gatherings that are accessible and safe.",
    author: "FemVents Team",
    date: "Coming soon",
  },
  {
    title: "After the Gathering: What Comes Next",
    excerpt:
      "How gatherings become collaborations, campaigns, and lasting relationships.",
    author: "FemVents Team",
    date: "Coming soon",
  },
  {
    title: "Convening Tools: Agendas, Access, and Safer-Space Guidelines",
    excerpt:
      "Templates and methods shared by feminist organizers for hosting with care.",
    author: "FemVents Team",
    date: "Coming soon",
  },
];

export const faq = [
  {
    question: "Is FemVents free to use?",
    answer:
      "Yes. There are no fees to discover gatherings, share opportunities, or connect with movements. If you value the platform, you can make an optional donation. Giving never affects your access or visibility.",
  },
  {
    question: "How do I host a gathering on FemVents?",
    answer:
      "Sign up as a host, then describe your gathering: why you're gathering, who it's for, and how people can join. You can publish it in minutes. If you need help, contact us and we'll support you.",
  },
  {
    question: "Can I host a private or invite-only gathering?",
    answer:
      "Yes. You can set up password-protected gatherings, send direct invitations, or keep a gathering out of public searches.",
  },
  {
    question: "How can I help shape FemVents?",
    answer:
      "Tell us what you need, what's missing, and what you'd like us to build through the Shape FemVents form. You can answer anonymously and skip any question.",
  },
];

export const supportTopics = [
  {
    title: "Getting Started",
    items: [
      "Download FemVents on iOS / Android",
      "Host onboarding guide",
      "Sharing your gathering",
    ],
  },
  {
    title: "Access & Participation",
    items: [
      "Adding accessibility details",
      "Languages and interpretation",
      "Supporting participants",
    ],
  },
  {
    title: "Care, Privacy & Safety",
    items: [
      "Setting a code of conduct",
      "Privacy and consent guidance",
      "Reporting a concern",
    ],
  },
  {
    title: "Shape FemVents",
    items: [
      "Share your feedback",
      "Join a feedback conversation",
      "Support the commons",
    ],
  },
];
