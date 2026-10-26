import type { Metadata } from "next";
import { PublicAnnouncementBar } from "@/components/public/PublicAnnouncementBar";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";

export const metadata: Metadata = {
  title: {
    default: "Operra Distributors — Premier FMCG Wholesale & Logistics",
    template: "%s | Operra Distributors",
  },
};

export default function PublicSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] text-[#000000] selection:bg-[#ff5900] selection:text-white antialiased">
      <PublicAnnouncementBar />
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
