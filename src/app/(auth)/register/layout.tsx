import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Organization Workspace",
  description:
    "Register a new commercial wholesale or distribution tenant workspace on Operra.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
