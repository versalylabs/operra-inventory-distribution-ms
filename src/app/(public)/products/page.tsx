"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ArrowRight,
  PackageCheck,
  CheckCircle2,
  Phone,
  Sparkles,
  Download,
} from "lucide-react";

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  categoryKey: string;
  brand: string;
  packSize: string;
  moq: string;
  wholesalePrice: string;
  stockStatus: "IN_STOCK" | "LIMITED_STOCK";
  unitOfMeasure: string;
}

const SAMPLE_PRODUCTS: ProductItem[] = [
  // Beverages & Dairy
  {
    id: "p1",
    sku: "BEV-WAT-001",
    name: "Mt. Kenya Natural Sparkling Spring Water",
    category: "Beverages & Dairy",
    categoryKey: "beverages",
    brand: "Mt. Kenya Springs",
    packSize: "500ml × 24 bottles (Shrink Pack)",
    moq: "10 Cases",
    wholesalePrice: "KES 780 / case",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Case",
  },
  {
    id: "p2",
    sku: "BEV-WAT-002",
    name: "Operra Spring Still Mineral Water",
    category: "Beverages & Dairy",
    categoryKey: "beverages",
    brand: "Operra Waters",
    packSize: "1.5L × 12 bottles",
    moq: "15 Cases",
    wholesalePrice: "KES 650 / case",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Case",
  },
  {
    id: "p3",
    sku: "BEV-MLK-001",
    name: "Highland Gold Pure UHT Whole Milk",
    category: "Beverages & Dairy",
    categoryKey: "beverages",
    brand: "Highland Dairy",
    packSize: "500ml × 12 Pouches (Crate)",
    moq: "20 Crates",
    wholesalePrice: "KES 720 / crate",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Crate",
  },
  {
    id: "p4",
    sku: "BEV-SDA-001",
    name: "Sparkling Citrus Tonic & Ginger Ale",
    category: "Beverages & Dairy",
    categoryKey: "beverages",
    brand: "Savannah Beverages",
    packSize: "330ml Can × 24 pack",
    moq: "10 Cases",
    wholesalePrice: "KES 1,450 / case",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Case",
  },

  // Food & Grains
  {
    id: "p5",
    sku: "FOD-FLR-001",
    name: "Operra Supreme Fortified Maize Meal",
    category: "Packaged Staples & Grains",
    categoryKey: "food",
    brand: "Operra Millers",
    packSize: "2kg × 12 packets (Bale)",
    moq: "25 Bales",
    wholesalePrice: "KES 1,580 / bale",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Bale",
  },
  {
    id: "p6",
    sku: "FOD-RCE-001",
    name: "Aromatic Pure Pishori Mwea Rice",
    category: "Packaged Staples & Grains",
    categoryKey: "food",
    brand: "Mwea Harvest",
    packSize: "25kg Bag (Double Sealed)",
    moq: "10 Bags",
    wholesalePrice: "KES 3,950 / bag",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Bag",
  },
  {
    id: "p7",
    sku: "FOD-PST-001",
    name: "Golden Durum Spaghetti Pasta",
    category: "Packaged Staples & Grains",
    categoryKey: "food",
    brand: "Pasta Gusto",
    packSize: "400g × 20 packets (Carton)",
    moq: "15 Cartons",
    wholesalePrice: "KES 1,320 / carton",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Carton",
  },
  {
    id: "p8",
    sku: "FOD-WHT-001",
    name: "Baker's Choice Premium Wheat Flour",
    category: "Packaged Staples & Grains",
    categoryKey: "food",
    brand: "Operra Flour Mills",
    packSize: "2kg × 12 packets (Bale)",
    moq: "20 Bales",
    wholesalePrice: "KES 1,840 / bale",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Bale",
  },

  // Edible Oils
  {
    id: "p9",
    sku: "OIL-VEG-001",
    name: "Golden Sun Triple-Refined Vegetable Cooking Oil",
    category: "Edible Cooking Oils",
    categoryKey: "edible-oils",
    brand: "Golden Sun Refineries",
    packSize: "5 Litres × 4 Jerrycans (Carton)",
    moq: "10 Cartons",
    wholesalePrice: "KES 4,680 / carton",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Carton",
  },
  {
    id: "p10",
    sku: "OIL-VEG-002",
    name: "Commercial Bulk Pure Palm Cooking Oil",
    category: "Edible Cooking Oils",
    categoryKey: "edible-oils",
    brand: "Golden Sun Refineries",
    packSize: "20 Litres Commercial Drum",
    moq: "5 Drums",
    wholesalePrice: "KES 4,250 / drum",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Drum",
  },

  // Personal Care & Hygiene
  {
    id: "p11",
    sku: "PER-SOP-001",
    name: "PureShield Active Antibacterial Bar Soap",
    category: "Personal Care & Hygiene",
    categoryKey: "personal-care",
    brand: "PureShield Healthcare",
    packSize: "100g × 72 bars (Carton)",
    moq: "10 Cartons",
    wholesalePrice: "KES 2,450 / carton",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Carton",
  },
  {
    id: "p12",
    sku: "PER-TTH-001",
    name: "ProDental Complete Fluoride Toothpaste",
    category: "Personal Care & Hygiene",
    categoryKey: "personal-care",
    brand: "ProDental",
    packSize: "140g × 48 tubes (Carton)",
    moq: "8 Cartons",
    wholesalePrice: "KES 3,120 / carton",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Carton",
  },
  {
    id: "p13",
    sku: "PER-DPR-001",
    name: "ComfyDry Comfort Baby Diapers (Size 3 Midi)",
    category: "Personal Care & Hygiene",
    categoryKey: "personal-care",
    brand: "ComfyDry Baby",
    packSize: "64 pcs × 4 jumbo packs (Bale)",
    moq: "5 Bales",
    wholesalePrice: "KES 4,150 / bale",
    stockStatus: "LIMITED_STOCK",
    unitOfMeasure: "Bale",
  },

  // Home & Cleaning
  {
    id: "p14",
    sku: "CLN-DET-001",
    name: "PowerClean Multi-Action Laundry Washing Powder",
    category: "Home & Cleaning Supplies",
    categoryKey: "cleaning",
    brand: "PowerClean",
    packSize: "1kg × 12 packs (Bale)",
    moq: "15 Bales",
    wholesalePrice: "KES 1,980 / bale",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Bale",
  },
  {
    id: "p15",
    sku: "CLN-BLC-001",
    name: "SaniChlor Extra Thick Pine Bleach Disinfectant",
    category: "Home & Cleaning Supplies",
    categoryKey: "cleaning",
    brand: "SaniChlor Chem",
    packSize: "750ml × 12 bottles (Carton)",
    moq: "10 Cartons",
    wholesalePrice: "KES 1,450 / carton",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Carton",
  },

  // Confectionery & Snacks
  {
    id: "p16",
    sku: "SNK-BSC-001",
    name: "SunBake Classic Fortified Glucose Biscuits",
    category: "Snacks & Confectionery",
    categoryKey: "confectionery",
    brand: "SunBake Bakers",
    packSize: "50g × 144 packets (Master Carton)",
    moq: "10 Cartons",
    wholesalePrice: "KES 1,720 / carton",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Carton",
  },
  {
    id: "p17",
    sku: "SNK-CRP-001",
    name: "Operra Ridge Cut Sweet Chilli Potato Crisps",
    category: "Snacks & Confectionery",
    categoryKey: "confectionery",
    brand: "Operra Snacks",
    packSize: "50g × 24 packets (Box)",
    moq: "12 Boxes",
    wholesalePrice: "KES 1,180 / box",
    stockStatus: "IN_STOCK",
    unitOfMeasure: "Box",
  },
];

const CATEGORIES_FILTER = [
  { key: "all", label: "All Departments" },
  { key: "beverages", label: "Beverages & Dairy" },
  { key: "food", label: "Staples & Grains" },
  { key: "edible-oils", label: "Edible Oils" },
  { key: "personal-care", label: "Personal Care" },
  { key: "cleaning", label: "Home & Cleaning" },
  { key: "confectionery", label: "Snacks & Confectionery" },
];

export default function PublicProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = SAMPLE_PRODUCTS.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.categoryKey === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full bg-white">
      {/* 1. PAGE HEADER */}
      <section className="relative pt-12 pb-12 border-b border-[#f3f3f7] bg-white overflow-hidden">
        {/* Low-opacity FMCG products & wholesale catalog background image */}
        <div
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.07] mix-blend-multiply filter contrast-125"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=2000&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#f3f3f7] border border-[#b9bbc6] text-[#6f737b] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#ff5900]" />
            LIVE WHOLESALE PRODUCT CATALOGUE · 2,800+ SKUS
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-[#000000] tracking-compressed-lg leading-tight">
                Wholesale Product Catalog
              </h1>
              <p className="text-base text-[#60646c] max-w-2xl">
                Direct-from-manufacturer case, pallet, and container rates for supermarkets, retail chains, and institutional procurement.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-[#ff5900] hover:bg-[#e04e00] text-white px-5 py-2.5 rounded-[12px] text-sm font-semibold tracking-compressed-sm transition shadow-xs"
              >
                Request Custom Volume Price
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FILTER & SEARCH BAR */}
      <section className="py-6 border-b border-[#f3f3f7] bg-[#ffffff] sticky top-20 z-20 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Department Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES_FILTER.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-[12px] text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.key
                    ? "bg-[#000000] text-white"
                    : "bg-[#f3f3f7] text-[#60646c] hover:text-[#000000] hover:bg-[#e6e6eb]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#8b8d98] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, brand, or name..."
              className="w-full bg-[#f3f3f7] border border-[#b9bbc6]/40 rounded-[12px] pl-10 pr-4 py-2 text-xs text-[#000000] placeholder:text-[#8b8d98] focus:bg-white focus:outline-none focus:border-[#000000] transition"
            />
          </div>
        </div>
      </section>

      {/* 3. PRODUCT CATALOG GRID */}
      <section className="py-12 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6 text-xs text-[#60646c]">
            <span>
              Showing <strong className="text-[#000000]">{filteredProducts.length}</strong> wholesale products in catalog
            </span>
            <span className="flex items-center gap-1 text-[#ff5900] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#ff5900]" />
              Depot Stock Status: Live via Operra ERP
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-[12px] border border-[#b9bbc6]/60 p-6 flex flex-col justify-between hover:border-[#000000] transition-all space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#8b8d98]">
                      {product.sku}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-[6px] ${
                        product.stockStatus === "IN_STOCK"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {product.stockStatus === "IN_STOCK" ? "Available in Depots" : "Limited Stock"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#ff5900]">
                      {product.brand}
                    </span>
                    <h3 className="text-base font-bold text-[#000000] leading-snug tracking-compressed-sm mt-0.5">
                      {product.name}
                    </h3>
                  </div>

                  <div className="p-3 bg-[#f3f3f7] rounded-[10px] text-xs space-y-1 text-[#60646c]">
                    <div className="flex justify-between">
                      <span>Packaging:</span>
                      <strong className="text-[#000000]">{product.packSize}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Minimum Order (MOQ):</span>
                      <strong className="text-[#000000]">{product.moq}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#f3f3f7] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#8b8d98] block">Tier-1 Wholesale Rate</span>
                    <span className="text-base font-extrabold text-[#000000] tracking-compressed-sm">
                      {product.wholesalePrice}
                    </span>
                  </div>

                  <Link
                    href={`/contact?sku=${product.sku}&name=${encodeURIComponent(product.name)}`}
                    className="inline-flex items-center gap-1.5 bg-[#000000] hover:bg-[#15191e] text-white px-3.5 py-2 rounded-[10px] text-xs font-semibold tracking-compressed-sm transition"
                  >
                    Order / Quote
                    <ArrowRight className="w-3.5 h-3.5 text-[#ff5900]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20 bg-[#f3f3f7] rounded-[16px] p-8 border border-[#b9bbc6]/40 space-y-3">
              <PackageCheck className="w-12 h-12 text-[#8b8d98] mx-auto" />
              <h3 className="text-lg font-bold text-[#000000]">No matching products found</h3>
              <p className="text-sm text-[#60646c] max-w-md mx-auto">
                Try refining your search keyword or selecting a different department tab. Or contact our central procurement team directly.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-[10px]"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. WHOLESALE CONTRACT TERMS CALLOUT */}
      <section className="py-16 bg-[#f3f3f7] border-t border-[#b9bbc6]/30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-[16px] p-8 sm:p-10 border border-[#b9bbc6]/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#ff5900]">
                CREDIT &amp; CONTRACT SUPPLY
              </span>
              <h3 className="text-2xl font-bold text-[#000000] tracking-compressed-sm">
                Need customized pallet pricing for multi-branch retail?
              </h3>
              <p className="text-sm text-[#60646c] max-w-xl">
                We provide approved retail supermarket chains and institutional buyers with 30-day revolving credit accounts and scheduled replenishment deliveries.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-[#ff5900] hover:bg-[#e04e00] text-white px-5 py-3 rounded-[12px] text-sm font-semibold tracking-compressed-sm transition shadow-xs"
              >
                Talk to Wholesale Account Manager
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
