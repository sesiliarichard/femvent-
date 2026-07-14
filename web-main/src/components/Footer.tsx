import Link from "next/link";
import { navLinks, brand } from "@/lib/content";

const utilityLinks = [
  { label: "Careers", href: "/careers" },
  { label: "Press", href: "/press" },
  { label: "Security", href: "/security" },
  { label: "Status", href: "/status" },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="text-lg font-bold text-rose-600">{brand.name}</p>
          <p className="mt-3 text-sm text-gray-600">{brand.description}</p>
          <p className="mt-4 text-xs text-gray-400">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
        </div>
        <div className="grid flex-1 gap-8 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">Explore</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-rose-500 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">More</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
              {utilityLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-rose-500 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-shadow">
                IG
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-shadow">
                LI
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-shadow">
                X
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
