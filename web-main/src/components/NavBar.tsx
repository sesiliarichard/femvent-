"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks, brand } from "@/lib/content";

const communityLinks = [
  { href: "/principles", label: "Principles" },
  { href: "/shape", label: "Shape FemVents" },
  { href: "/support", label: "Support" },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const allLinks = [...navLinks, ...communityLinks];
  const pathname = usePathname();
  const isRegistrationPage = /^\/events\/[^/]+\/register/.test(pathname);

  const logo = (
    <Link href="/" className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E1F45] p-1">
        <div className="bg-[#F3D9EE] rounded-lg w-full h-full flex items-center justify-center">
          <img
            src="/femvents.png"
            alt="FemVents App"
            className="h-7 w-7 rounded-md"
          />
        </div>
      </div>
      <span className="text-lg font-bold text-[#9B1F5C] md:text-xl hover:text-[#7A1745] transition-colors">
        FemVents
      </span>
    </Link>
  );

  if (isRegistrationPage) {
    return (
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#D9C9E0] bg-[#FBF3FA]/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-3 md:px-6 md:py-4">
          {logo}
        </div>
      </header>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[#D9C9E0] bg-[#FBF3FA]/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {logo}

        <nav className="hidden items-center gap-5 text-sm font-medium text-[#5C4A6B] lg:flex">
        {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-[#9B1F5C] relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#9B1F5C] group-hover:w-full transition-all duration-300" />
            </Link>
          ))}

          <div className="relative group">
            <button
              type="button"
              aria-haspopup="true"
              className="inline-flex items-center gap-1 transition hover:text-[#9B1F5C] group-focus-within:text-[#9B1F5C]"
            >
              Community
              <span aria-hidden="true" className="text-[10px]">▾</span>
            </button>
            <div className="invisible absolute left-0 top-full z-50 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="min-w-[200px] rounded-md border border-[#D9C9E0] bg-white p-2 shadow-md">
                {communityLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => e.currentTarget.blur()}
                    className="block rounded px-3 py-2 hover:bg-[#F3D9EE] hover:text-[#9B1F5C]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/organizers"
            className="hidden text-sm font-bold text-[#9B1F5C] hover:text-[#7A1745] lg:inline-flex"
          >
            Host a Gathering
          </Link>
          <Link
            href={`${process.env.NEXT_PUBLIC_HOST_APP_URL}/login`}
           className="hidden rounded-full bg-[#9B1F5C] px-5 py-2 text-sm font-semibold text-[#FBF3FA] shadow-sm transition hover:bg-[#7A1745] lg:inline-flex"
          >
            Sign In
          </Link>

          <button
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D9C9E0] bg-white text-[#2E1F45] shadow-sm hover:border-[#9B1F5C] lg:hidden"
          >
            <span className="sr-only">Toggle menu</span>
            <div className="space-y-1.5">
              <span className="block h-0.5 w-4 rounded-full bg-[#2E1F45]" />
              <span className="block h-0.5 w-3 rounded-full bg-[#2E1F45]" />
              <span className="block h-0.5 w-5 rounded-full bg-[#2E1F45]" />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#EDE2F0] bg-[#FBF3FA]/95 px-4 pb-4 pt-2 shadow-sm lg:hidden">
                   <nav className="flex flex-col gap-2 text-sm font-medium text-[#5C4A6B]">
                   {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 hover:bg-[#F3D9EE]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
                     <Link
              href="/organizers"
              className="rounded-full px-3 py-2 font-semibold text-[#9B1F5C] hover:bg-[#F3D9EE]"
              onClick={() => setOpen(false)}
            >
              Host a Gathering
            </Link>
                       <Link
              href={`${process.env.NEXT_PUBLIC_HOST_APP_URL}/login`}
              className="mt-2 rounded-full bg-[#9B1F5C] px-4 py-2 text-center text-sm font-semibold text-[#FBF3FA]"
              onClick={() => setOpen(false)}
            >
              Sign In
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}