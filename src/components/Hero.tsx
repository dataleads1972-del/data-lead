import { ArrowUp, Sparkles } from "lucide-react";
import { Navbar } from "./Navbar";
import { DashboardMockup, ScaledDashboard } from "./DashboardMockup";

const BG =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260611_133301_d5f2a94a-b22e-4e4a-a6b6-eacdddf1f5b0.png&w=1280&q=85";
const GRASS =
  "https://res.cloudinary.com/dy5er7kv5/image/upload/q_auto/f_auto/v1781191264/grass_eam204.png";

export function Hero() {
  return (
    <section
      style={{ backgroundImage: `url(${BG})` }}
      className="relative min-h-[100svh] overflow-hidden bg-cover bg-center flex flex-col"
    >
      <Navbar />

      <div className="flex-1 min-h-8 sm:min-h-12 lg:min-h-16 shrink-0" />

      <div className="relative z-20 flex flex-col items-center text-center px-5">
        <h1 className="text-gray-900 font-normal leading-[1.05] tracking-tight text-[40px] min-[400px]:text-[44px] sm:text-6xl lg:text-7xl xl:text-[80px]">
          <span className="block animate-fade-up">Find leads.</span>
          <span className="block animate-fade-up [animation-delay:100ms]">Effortlessly.</span>
        </h1>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="animate-fade-up [animation-delay:220ms] mt-5 sm:mt-6 w-full max-w-xl"
        >
          <div className="flex items-center gap-3 rounded-full bg-white/60 backdrop-blur-md ring-1 ring-gray-200 pl-5 pr-1.5 py-1.5">
            <input
              className="flex-1 bg-transparent text-sm sm:text-base text-gray-900 placeholder-gray-500 outline-none py-2"
              placeholder="Try: foxnut exporters, protein bar manufacturers..."
            />
            <button
              type="submit"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-900 text-white hover:scale-105 active:scale-95 transition-transform shrink-0 flex items-center justify-center"
              aria-label="Search"
            >
              <ArrowUp className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </form>

        <p className="animate-fade-up [animation-delay:340ms] mt-4 sm:mt-5 text-gray-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-md">
          Deploy multi-agent AI to research, discover, and enrich <br />
          verified business leads &mdash; ready to export as <Sparkles className="inline w-4 h-4 -mt-1" /> Excel or CSV
        </p>

        <div className="animate-fade-up [animation-delay:460ms] mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/auth"
            className="bg-gray-900 text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-gray-800 hover:shadow-lg transition-all"
          >
            Try It Free
          </a>
          <a
            href="/auth"
            className="text-gray-700 text-sm font-medium px-6 py-2.5 rounded-full ring-1 ring-gray-300 hover:bg-gray-100 transition-colors"
          >
            Talk to sales
          </a>
        </div>
      </div>

      <div className="flex-1 min-h-10 sm:min-h-12 lg:min-h-16 shrink-0" />

      <div className="animate-hero-rise [animation-delay:620ms] relative z-0 w-[92%] sm:w-[84%] lg:w-[72%] max-w-4xl mx-auto shrink-0 -mb-10 sm:-mb-20 lg:-mb-32">
        <ScaledDashboard>
          <DashboardMockup />
        </ScaledDashboard>
      </div>

      <img
        src={GRASS}
        alt=""
        className="pointer-events-none absolute bottom-0 left-0 z-10 w-full select-none"
      />
    </section>
  );
}
