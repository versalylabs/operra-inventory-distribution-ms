import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In to Operra ERP",
  description:
    "Secure workspace portal login for Operra wholesale and distribution teams.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
