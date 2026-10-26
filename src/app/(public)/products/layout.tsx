import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wholesale Product Catalog",
  description:
    "Browse 2,800+ FMCG wholesale SKUs across food, beverages, personal care, and household lines with live trade pricing.",
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
