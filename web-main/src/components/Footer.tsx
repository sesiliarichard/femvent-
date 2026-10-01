import Link from "next/link";
import { navLinks, brand } from "@/lib/content";



export default function Footer() {
  return (
    <footer className="border-t border-[#D9C9E0] bg-[#FBF3FA]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="text-lg font-bold text-[#9B1F5C]">{brand.name}</p>
          <p className="mt-1 text-sm font-semibold text-[#2E1F45]">{brand.tagline}</p>
          <p className="mt-3 text-sm text-[#5C4A6B]">{brand.description}</p>
          <a
            href={`${process.env.NEXT_PUBLIC_HOST_APP_URL}/signup`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-[#E8743B] px-4 py-2.5 text-sm font-bold text-[#2E1F45] hover:bg-[#D5652E] transition-colors"
          >
            Host a gathering →
          </a>
          <p className="mt-4 text-xs text-[#8A7A97]">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
            <br />
            Built with feminist communities, not just for them.
          </p>
        </div>
        <div className="grid flex-1 gap-8 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-[#2E1F45]">Explore</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[#5C4A6B]">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-[#9B1F5C] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
          <p className="text-sm font-semibold text-[#2E1F45]">Community</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[#5C4A6B]">
              <Link href="/principles" className="hover:text-[#9B1F5C] transition-colors">
                Our Convening Principles
              </Link>
              <Link href="/shape" className="hover:text-[#9B1F5C] transition-colors">
                Shape FemVents
              </Link>
              <Link href="/support" className="hover:text-[#9B1F5C] transition-colors">
                Support
              </Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2E1F45]">Connect</p>
            <div className="mt-4 flex gap-3">
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3D9EE] text-[#9B1F5C] text-xs font-semibold hover:bg-[#E8C3E0] transition-colors">
                IG
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3D9EE] text-[#9B1F5C] text-xs font-semibold hover:bg-[#E8C3E0] transition-colors">
                LI
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3D9EE] text-[#9B1F5C] text-xs font-semibold hover:bg-[#E8C3E0] transition-colors">
                X
              </a>
            </div>
            <p className="mt-4 text-xs text-[#8A7A97] leading-relaxed max-w-[220px]">
              Guided by feminist principles of access, consent, privacy &amp; movement memory.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}