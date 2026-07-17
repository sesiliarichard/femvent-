"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks, brand } from "@/lib/content";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isRegistrationPage = /^\/events\/[^/]+\/register/.test(pathname);

  const logo = (
    <Link href="/" className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-rose-500 to-orange-400 shadow-lg p-1">
        <div className="bg-white rounded-lg w-full h-full flex items-center justify-center">
          <img
            src="/femvents.png"
            alt="FemVents App"
            className="h-7 w-7 rounded-md"
          />
        </div>
      </div>
      <span className="text-lg font-bold text-rose-600 md:text-xl hover:text-rose-700 transition-colors">
        FemVentsApp
      </span>
    </Link>
  );

  if (isRegistrationPage) {
    return (
      <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-3 md:px-6 md:py-4">
          {logo}
        </div>
      </header>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {logo}

        <nav className="hidden gap-6 text-sm font-medium text-gray-600 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-rose-500 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-rose-500 to-purple-500 group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 md:inline-flex"
          >
            Log in
          </Link>
          <Link
            href={brand.primaryCta.href}
            className="hidden rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg md:inline-flex"
          >
            {brand.primaryCta.label}
          </Link>

          <button
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-gray-400 md:hidden"
          >
            <span className="sr-only">Toggle menu</span>
            <div className="space-y-1.5">
              <span className="block h-0.5 w-4 rounded-full bg-gray-700" />
              <span className="block h-0.5 w-3 rounded-full bg-gray-700" />
              <span className="block h-0.5 w-5 rounded-full bg-gray-700" />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white/95 px-4 pb-4 pt-2 shadow-sm md:hidden">
          <nav className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={brand.primaryCta.href}
              className="mt-2 rounded-full bg-gray-900 px-4 py-2 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              {brand.primaryCta.label}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
