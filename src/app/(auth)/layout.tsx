import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Authentication — Operra ERP",
    template: "%s | Operra ERP",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
