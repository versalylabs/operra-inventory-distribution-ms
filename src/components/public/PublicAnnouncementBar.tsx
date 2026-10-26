import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function PublicAnnouncementBar() {
  return (
    <aside aria-label="Announcement" className="w-full bg-[#15191e] text-white py-2 px-4 border-b border-[#242b35] relative z-40">
      <div className="max-w-[1200px] mx-auto flex items-center justify-center text-center text-xs font-medium tracking-compressed-sm">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-[6px] bg-white/10 text-white/90">
            <Sparkles className="w-3 h-3 text-[#ff5900]" />
            Live Enterprise Showcase
          </span>
          <span className="text-white/80">
            Operra Distributors operates a nationwide FMCG supply chain powered by the{" "}
            <strong className="text-white font-semibold">Operra Management System</strong>.
          </span>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-[#ff5900] hover:text-[#ff7830] font-semibold transition ml-1 group"
          >
            Launch Internal ERP Dashboard
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
