import Link from "next/link";
import { navLinks, brand } from "@/lib/content";



export default function Footer() {
  return (
    <footer className="border-t border-[#D9C9E0] bg-[#FBF3FA]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="text-lg font-bold text-[#9B1F5C]">{brand.name}</p>
          <p className="mt-3 text-sm text-[#5C4A6B]">{brand.description}</p>
          <p className="mt-4 text-xs text-[#8A7A97]">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
        </div>
        <div className="grid flex-1 gap-8 sm:grid-cols-2">
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
          </div>
        </div>
      </div>
    </footer>
  );
}