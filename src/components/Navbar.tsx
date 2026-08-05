import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const links = ["Agents", "Sources", "Pricing"];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="animate-fade-down relative z-20">
      <div className="flex items-center justify-between px-5 sm:px-8 lg:px-10 py-4 sm:py-5">
        <a href="/" className="flex items-center gap-2 text-gray-900">
          <Logo className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[15px] font-medium tracking-tight">Leadly</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <button className="flex items-center gap-1 text-[13px] text-gray-700 hover:text-gray-900">
            Toolkit <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {links.map((l) => (
            <a key={l} href="/auth" className="text-[13px] text-gray-700 hover:text-gray-900">
              {l}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/auth"
            className="hidden sm:inline-flex bg-gray-900 text-white text-[13px] font-medium px-4 sm:px-5 py-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            Start free
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden w-9 h-9 rounded-full text-gray-900 hover:bg-gray-900/10 flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden absolute left-4 right-4 top-full rounded-2xl bg-white/80 backdrop-blur-xl ring-1 ring-gray-200 px-5 py-3 animate-fade-up">
          {["Toolkit", ...links].map((l) => (
            <a
              key={l}
              href="/auth"
              className="block py-3 text-[15px] text-gray-700 hover:text-gray-900 border-b border-gray-200 last:border-b-0"
            >
              {l}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
