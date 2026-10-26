import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Operra Phase 1, 2, 3 & 4 data...");

  const defaultPasswordHash = await bcrypt.hash("operra123", 10);

  // 1. Primary Demo Organization: Acme Distributors Ltd
  const acmeOrg = await prisma.organization.upsert({
    where: { slug: "acme-distributors" },
    update: {},
    create: {
      name: "Acme Distributors Ltd",
      slug: "acme-distributors",
      email: "operations@acmedistributors.co.ke",
      phone: "+254 711 234 567",
      address: "Mombasa Road, Industrial Area, Block C",
      city: "Nairobi",
      country: "Kenya",
      taxNumber: "P051234567X",
      currency: "KES",
      timezone: "Africa/Nairobi",
      status: "ACTIVE",
      allowNegativeStock: false,
      valuationMethod: "AVERAGE_COST",
      invoicePrefix: "INV-",
      orderPrefix: "ORD-",
      purchasePrefix: "PO-",
      deliveryPrefix: "DEL-",
      transferPrefix: "TRF-",
      defaultPaymentTerms: 30,
      defaultTaxRate: 16.0,
    },
  });

  // 2. Secondary Tenant: Savannah Hardware & Supplies
  const savannahOrg = await prisma.organization.upsert({
    where: { slug: "savannah-hardware" },
    update: {},
    create: {
      name: "Savannah Hardware & Supplies",
      slug: "savannah-hardware",
      email: "info@savannahhardware.co.ke",
      phone: "+254 722 987 654",
      address: "Enterprise Road, Industrial Area",
      city: "Nairobi",
      country: "Kenya",
      taxNumber: "P059876543Z",
      currency: "KES",
      timezone: "Africa/Nairobi",
      status: "ACTIVE",
    },
  });

  // 3. Role-Based Demo Users
  const demoUsers: Array<{
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    title: string;
    isSuperAdmin?: boolean;
  }> = [
    {
      name: "David Kimani",
      email: "owner@acmedistributors.co.ke",
      phone: "+254 711 000 001",
      role: "OWNER",
      title: "Managing Director",
      isSuperAdmin: true,
    },
    {
      name: "Sarah Wanjiku",
      email: "manager@acmedistributors.co.ke",
      phone: "+254 711 000 002",
      role: "MANAGER",
      title: "Operations & Supply Chain Manager",
    },
    {
      name: "Peter Ochieng",
      email: "warehouse@acmedistributors.co.ke",
      phone: "+254 711 000 003",
      role: "WAREHOUSE_STAFF",
      title: "Chief Storekeeper — Nairobi Main",
    },
    {
      name: "Grace Mutua",
      email: "sales@acmedistributors.co.ke",
      phone: "+254 711 000 004",
      role: "SALES_STAFF",
      title: "Senior B2B Sales Executive",
    },
    {
      name: "Joseph Kiprop",
      email: "driver@acmedistributors.co.ke",
      phone: "+254 711 000 005",
      role: "DELIVERY_STAFF",
      title: "Fleet Dispatch Lead (KCD 452P)",
    },
  ];

  const userMap: Record<string, string> = {};

  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        phone: u.phone,
        isSuperAdmin: Boolean(u.isSuperAdmin),
      },
      create: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        passwordHash: defaultPasswordHash,
        isSuperAdmin: Boolean(u.isSuperAdmin),
        status: "ACTIVE",
        lastLoginAt: new Date(),
      },
    });

    userMap[u.role] = user.id;

    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: acmeOrg.id,
          userId: user.id,
        },
      },
      update: {
        role: u.role,
        title: u.title,
        isActive: true,
      },
      create: {
        organizationId: acmeOrg.id,
        userId: user.id,
        role: u.role,
        title: u.title,
        isActive: true,
      },
    });

    if (u.role === "OWNER") {
      await prisma.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: savannahOrg.id,
            userId: user.id,
          },
        },
        update: {
          role: "OWNER",
          title: "Director",
        },
        create: {
          organizationId: savannahOrg.id,
          userId: user.id,
          role: "OWNER",
          title: "Director",
        },
      });
    }
  }

  // 4. Phase 2: Product Categories
  const parentCategories = [
    {
      name: "Beverages",
      slug: "beverages",
      description:
        "Carbonated soft drinks, bottled water, fruit juices, and energy drinks.",
    },
    {
      name: "Food & Staples",
      slug: "food-staples",
      description:
        "Cooking oils, maize meal, wheat flour, rice, sugar, and packaged groceries.",
    },
    {
      name: "Household & Cleaning",
      slug: "household-cleaning",
      description:
        "Laundry detergents, bar soaps, dishwashing liquids, and surface disinfectants.",
    },
    {
      name: "Personal Care",
      slug: "personal-care",
      description:
        "Bathing soaps, body lotions, oral care, and grooming essentials.",
    },
    {
      name: "Electronics & Appliances",
      slug: "electronics-appliances",
      description:
        "Small domestic appliances, LED lighting, extension sockets, and kettles.",
    },
  ];

  const categoryMap: Record<string, string> = {};

  for (const pCat of parentCategories) {
    const created = await prisma.category.upsert({
      where: {
        organizationId_slug: {
          organizationId: acmeOrg.id,
          slug: pCat.slug,
        },
      },
      update: {
        name: pCat.name,
        description: pCat.description,
      },
      create: {
        organizationId: acmeOrg.id,
        name: pCat.name,
        slug: pCat.slug,
        description: pCat.description,
        status: "ACTIVE",
      },
    });
    categoryMap[pCat.slug] = created.id;
  }

  const subCategories = [
    {
      name: "Soft Drinks & Sodas",
      slug: "soft-drinks-sodas",
      parentSlug: "beverages",
      description: "PET and returnable glass bottle sodas.",
    },
    {
      name: "Bottled Water & Juices",
      slug: "bottled-water-juices",
      parentSlug: "beverages",
      description: "Mineral water, nectars, and ready-to-drink fruit juices.",
    },
    {
      name: "Cooking Oils & Fats",
      slug: "cooking-oils-fats",
      parentSlug: "food-staples",
      description: "Refined vegetable oils and cooking fats in 1L to 20L packs.",
    },
    {
      name: "Flours, Grains & Sugar",
      slug: "flours-grains-sugar",
      parentSlug: "food-staples",
      description:
        "Fortified maize meal, baking wheat flour, rice, and sugar bales.",
    },
    {
      name: "Laundry & Dish Care",
      slug: "laundry-dish-care",
      parentSlug: "household-cleaning",
      description:
        "Washing powders, multipurpose laundry bars, and dishwashing pastes.",
    },
  ];

  for (const sCat of subCategories) {
    const created = await prisma.category.upsert({
      where: {
        organizationId_slug: {
          organizationId: acmeOrg.id,
          slug: sCat.slug,
        },
      },
      update: {
        name: sCat.name,
        description: sCat.description,
        parentId: categoryMap[sCat.parentSlug],
      },
      create: {
        organizationId: acmeOrg.id,
        name: sCat.name,
        slug: sCat.slug,
        description: sCat.description,
        parentId: categoryMap[sCat.parentSlug],
        status: "ACTIVE",
      },
    });
    categoryMap[sCat.slug] = created.id;
  }

  // 5. Phase 2: 22 Realistic Products
  const products = [
    {
      name: "Fresh Fri Vegetable Cooking Oil 1L (Carton 12x1L)",
      sku: "OIL-FF-1L",
      barcode: "6161100100018",
      categorySlug: "cooking-oils-fats",
      brand: "Pwani Oil",
      unitOfMeasure: "Carton",
      costPrice: 2880,
      wholesalePrice: 3180,
      sellingPrice: 3360,
      minStockLevel: 25,
      reorderLevel: 50,
      maxStockLevel: 500,
      preferredSupplier: "Pwani Oil Products Ltd",
      description:
        "Triple-refined vegetable cooking oil, 12 bottles of 1L per carton.",
    },
    {
      name: "Elianto Corn Oil 2L (Carton 6x2L)",
      sku: "OIL-EL-2L",
      barcode: "6161100100025",
      categorySlug: "cooking-oils-fats",
      brand: "Bidco Africa",
      unitOfMeasure: "Carton",
      costPrice: 3450,
      wholesalePrice: 3780,
      sellingPrice: 3960,
      minStockLevel: 15,
      reorderLevel: 35,
      maxStockLevel: 300,
      preferredSupplier: "Bidco Africa Ltd",
      description:
        "100% pure corn oil for cholesterol-conscious households, 6x2L carton.",
    },
    {
      name: "Golden Fry Cooking Oil 20L Jerrycan",
      sku: "OIL-GF-20L",
      barcode: "6161100100032",
      categorySlug: "cooking-oils-fats",
      brand: "Bidco Africa",
      unitOfMeasure: "Jerrycan (20L)",
      costPrice: 4250,
      wholesalePrice: 4600,
      sellingPrice: 4850,
      minStockLevel: 20,
      reorderLevel: 45,
      maxStockLevel: 400,
      preferredSupplier: "Bidco Africa Ltd",
      description:
        "Commercial 20L yellow jerrycan ideal for hotels, restaurants, and bulk retailers.",
    },
    {
      name: "Kimbo White Cooking Fat 2kg Tub (Carton 6x2kg)",
      sku: "FAT-KB-2KG",
      barcode: "6161100100049",
      categorySlug: "cooking-oils-fats",
      brand: "Bidco Africa",
      unitOfMeasure: "Carton",
      costPrice: 3100,
      wholesalePrice: 3420,
      sellingPrice: 3600,
      minStockLevel: 20,
      reorderLevel: 40,
      maxStockLevel: 350,
      preferredSupplier: "Bidco Africa Ltd",
      description: "Pure white vegetable cooking fat, 6 tubs of 2kg.",
    },
    {
      name: "Jogoo Fortified Maize Meal 2kg (Bale 12x2kg)",
      sku: "FLR-JG-2KG",
      barcode: "6161100200015",
      categorySlug: "flours-grains-sugar",
      brand: "Unga Group",
      unitOfMeasure: "Bale",
      costPrice: 1680,
      wholesalePrice: 1840,
      sellingPrice: 1950,
      minStockLevel: 40,
      reorderLevel: 80,
      maxStockLevel: 800,
      preferredSupplier: "Unga Millers Ltd",
      description:
        "Sifted fortified white maize meal, standard 12x2kg wholesale bale.",
    },
    {
      name: "Exe All-Purpose Wheat Flour 2kg (Bale 12x2kg)",
      sku: "FLR-EX-2KG",
      barcode: "6161100200022",
      categorySlug: "flours-grains-sugar",
      brand: "Unga Group",
      unitOfMeasure: "Bale",
      costPrice: 1920,
      wholesalePrice: 2100,
      sellingPrice: 2220,
      minStockLevel: 35,
      reorderLevel: 70,
      maxStockLevel: 600,
      preferredSupplier: "Unga Millers Ltd",
      description:
        "Home baking all-purpose wheat flour, 12 packets of 2kg per bale.",
    },
    {
      name: "Pembe Maize Meal 2kg (Bale 12x2kg)",
      sku: "FLR-PB-2KG",
      barcode: "6161100200039",
      categorySlug: "flours-grains-sugar",
      brand: "Pembe Flour Mills",
      unitOfMeasure: "Bale",
      costPrice: 1640,
      wholesalePrice: 1800,
      sellingPrice: 1900,
      minStockLevel: 30,
      reorderLevel: 65,
      maxStockLevel: 600,
      preferredSupplier: "Pembe Flour Mills Ltd",
      description: "Fortified grade-1 sifted maize meal, 12x2kg bale.",
    },
    {
      name: "Daawat Long Grain Basmati Rice 5kg (Bale 4x5kg)",
      sku: "RIC-DW-5KG",
      barcode: "6161100200046",
      categorySlug: "flours-grains-sugar",
      brand: "Daawat",
      unitOfMeasure: "Bale",
      costPrice: 3800,
      wholesalePrice: 4150,
      sellingPrice: 4400,
      minStockLevel: 15,
      reorderLevel: 30,
      maxStockLevel: 250,
      preferredSupplier: "Capwell Industries Ltd",
      description: "Aromatic aged basmati rice, 4 bags of 5kg per master bale.",
    },
    {
      name: "Kabras Premium White Sugar 2kg (Bale 10x2kg)",
      sku: "SUG-KB-2KG",
      barcode: "6161100200053",
      categorySlug: "flours-grains-sugar",
      brand: "Kabras Sugar",
      unitOfMeasure: "Bale",
      costPrice: 2650,
      wholesalePrice: 2880,
      sellingPrice: 3050,
      minStockLevel: 30,
      reorderLevel: 60,
      maxStockLevel: 500,
      preferredSupplier: "West Kenya Sugar Co.",
      description:
        "Clean mill-white cane sugar pre-packed in 10x2kg retail bags.",
    },
    {
      name: "Coca-Cola Original PET 500ml (Case 24x500ml)",
      sku: "BEV-CC-500",
      barcode: "5449000000996",
      categorySlug: "soft-drinks-sodas",
      brand: "Coca-Cola",
      unitOfMeasure: "Case (24x)",
      costPrice: 1180,
      wholesalePrice: 1320,
      sellingPrice: 1440,
      minStockLevel: 50,
      reorderLevel: 100,
      maxStockLevel: 1000,
      preferredSupplier: "Nairobi Bottlers Ltd",
      description: "24 PET bottles of 500ml Coca-Cola Original Taste.",
    },
    {
      name: "Fanta Orange PET 1.25L (Case 12x1.25L)",
      sku: "BEV-FO-125",
      barcode: "5449000011527",
      categorySlug: "soft-drinks-sodas",
      brand: "Coca-Cola",
      unitOfMeasure: "Case (12x)",
      costPrice: 1260,
      wholesalePrice: 1400,
      sellingPrice: 1520,
      minStockLevel: 30,
      reorderLevel: 60,
      maxStockLevel: 600,
      preferredSupplier: "Nairobi Bottlers Ltd",
      description: "Family-size 1.25L Fanta Orange PET pack of 12.",
    },
    {
      name: "Keringet Natural Mineral Water 1L (Case 12x1L)",
      sku: "WAT-KR-1L",
      barcode: "6161100300012",
      categorySlug: "bottled-water-juices",
      brand: "Keringet",
      unitOfMeasure: "Case (12x)",
      costPrice: 680,
      wholesalePrice: 780,
      sellingPrice: 860,
      minStockLevel: 40,
      reorderLevel: 80,
      maxStockLevel: 800,
      preferredSupplier: "Crown Beverages Ltd",
      description: "Pure natural highland spring mineral water, 12x1L case.",
    },
    {
      name: "Del Monte Mixed Fruit Juice 1L (Carton 12x1L)",
      sku: "JUC-DM-1L",
      barcode: "6161100300029",
      categorySlug: "bottled-water-juices",
      brand: "Del Monte",
      unitOfMeasure: "Carton",
      costPrice: 2160,
      wholesalePrice: 2400,
      sellingPrice: 2580,
      minStockLevel: 20,
      reorderLevel: 40,
      maxStockLevel: 350,
      preferredSupplier: "Del Monte Kenya Ltd",
      description:
        "Tetra Pak 1L tropical mixed fruit juice blend, 12 packs per carton.",
    },
    {
      name: "Red Bull Energy Drink 250ml (Tray 24x250ml)",
      sku: "BEV-RB-250",
      barcode: "9002490100070",
      categorySlug: "soft-drinks-sodas",
      brand: "Red Bull",
      unitOfMeasure: "Case (24x)",
      costPrice: 3600,
      wholesalePrice: 3960,
      sellingPrice: 4200,
      minStockLevel: 15,
      reorderLevel: 30,
      maxStockLevel: 250,
      preferredSupplier: "East African Beverage Distributors",
      description: "24 cans of 250ml Red Bull Energy Drink.",
    },
    {
      name: "Omo Hand Washing Powder Fast Action 1kg (Bale 12x1kg)",
      sku: "HHC-OM-1KG",
      barcode: "6161100400019",
      categorySlug: "laundry-dish-care",
      brand: "Unilever",
      unitOfMeasure: "Bale",
      costPrice: 2760,
      wholesalePrice: 3050,
      sellingPrice: 3240,
      minStockLevel: 20,
      reorderLevel: 45,
      maxStockLevel: 400,
      preferredSupplier: "Unilever Kenya Ltd",
      description: "High-foam laundry detergent powder, 12 pouches of 1kg.",
    },
    {
      name: "Sunlight 2-in-1 Washing Powder 500g (Bale 24x500g)",
      sku: "HHC-SL-500",
      barcode: "6161100400026",
      categorySlug: "laundry-dish-care",
      brand: "Unilever",
      unitOfMeasure: "Bale",
      costPrice: 2640,
      wholesalePrice: 2920,
      sellingPrice: 3120,
      minStockLevel: 25,
      reorderLevel: 50,
      maxStockLevel: 450,
      preferredSupplier: "Unilever Kenya Ltd",
      description: "Sensational fragrance washing powder, 24 packets of 500g.",
    },
    {
      name: "Menengai Cream Laundry Bar Soap 800g (Carton 25 Bars)",
      sku: "HHC-MN-800",
      barcode: "6161100400033",
      categorySlug: "laundry-dish-care",
      brand: "Menengai",
      unitOfMeasure: "Carton",
      costPrice: 3150,
      wholesalePrice: 3450,
      sellingPrice: 3650,
      minStockLevel: 30,
      reorderLevel: 60,
      maxStockLevel: 500,
      preferredSupplier: "Menengai Oil Refineries Ltd",
      description: "Long-lasting cream laundry bar soap, 25x800g master carton.",
    },
    {
      name: "Axion Lemon Dishwashing Paste 400g (Carton 24x400g)",
      sku: "HHC-AX-400",
      barcode: "6161100400040",
      categorySlug: "laundry-dish-care",
      brand: "Colgate-Palmolive",
      unitOfMeasure: "Carton",
      costPrice: 2880,
      wholesalePrice: 3180,
      sellingPrice: 3360,
      minStockLevel: 15,
      reorderLevel: 30,
      maxStockLevel: 300,
      preferredSupplier: "Hasbah Kenya Ltd",
      description: "Grease-cutting lemon dishwashing paste, 24 tubs of 400g.",
    },
    {
      name: "Dettol Antiseptic Disinfectant Liquid 500ml (Carton 12x500ml)",
      sku: "PRC-DT-500",
      barcode: "6161100500016",
      categorySlug: "personal-care",
      brand: "Reckitt",
      unitOfMeasure: "Carton",
      costPrice: 4500,
      wholesalePrice: 4920,
      sellingPrice: 5220,
      minStockLevel: 12,
      reorderLevel: 25,
      maxStockLevel: 200,
      preferredSupplier: "Reckitt Benckiser East Africa",
      description: "Concentrated antiseptic liquid, 12 bottles of 500ml.",
    },
    {
      name: "Geisha Long Lasting Bathing Soap 125g (Carton 72x125g)",
      sku: "PRC-GS-125",
      barcode: "6161100500023",
      categorySlug: "personal-care",
      brand: "Unilever",
      unitOfMeasure: "Carton",
      costPrice: 3750,
      wholesalePrice: 4100,
      sellingPrice: 4320,
      minStockLevel: 20,
      reorderLevel: 40,
      maxStockLevel: 350,
      preferredSupplier: "Unilever Kenya Ltd",
      description:
        "Assorted natural extracts family bathing soap, 72 bars per carton.",
    },
    {
      name: "Vaseline Pure Petroleum Jelly Original 250ml (Carton 24x250ml)",
      sku: "PRC-VS-250",
      barcode: "6161100500030",
      categorySlug: "personal-care",
      brand: "Unilever",
      unitOfMeasure: "Carton",
      costPrice: 4200,
      wholesalePrice: 4620,
      sellingPrice: 4920,
      minStockLevel: 15,
      reorderLevel: 30,
      maxStockLevel: 250,
      preferredSupplier: "Unilever Kenya Ltd",
      description:
        "Triple-purified petroleum jelly 250ml jars, carton of 24.",
    },
    {
      name: "Ramtons Cordless Electric Kettle 1.7L (RM/281)",
      sku: "ELC-RM-281",
      barcode: "6161100600013",
      categorySlug: "electronics-appliances",
      brand: "Ramtons",
      unitOfMeasure: "Unit",
      costPrice: 1650,
      wholesalePrice: 1950,
      sellingPrice: 2250,
      minStockLevel: 10,
      reorderLevel: 20,
      maxStockLevel: 150,
      preferredSupplier: "Hypermart Ltd (Ramtons)",
      description:
        "2200W rapid-boil cordless electric kettle with auto shut-off, 1-year warranty.",
    },
  ];

  const productRecords: Array<{
    id: string;
    sku: string;
    name: string;
    costPrice: number;
    wholesalePrice: number;
    sellingPrice: number;
    reorderLevel: number;
  }> = [];

  for (const prod of products) {
    const created = await prisma.product.upsert({
      where: {
        organizationId_sku: {
          organizationId: acmeOrg.id,
          sku: prod.sku,
        },
      },
      update: {
        name: prod.name,
        barcode: prod.barcode,
        categoryId: categoryMap[prod.categorySlug],
        brand: prod.brand,
        unitOfMeasure: prod.unitOfMeasure,
        costPrice: prod.costPrice,
        wholesalePrice: prod.wholesalePrice,
        sellingPrice: prod.sellingPrice,
        minStockLevel: prod.minStockLevel,
        reorderLevel: prod.reorderLevel,
        maxStockLevel: prod.maxStockLevel,
        preferredSupplier: prod.preferredSupplier,
        description: prod.description,
      },
      create: {
        organizationId: acmeOrg.id,
        name: prod.name,
        sku: prod.sku,
        barcode: prod.barcode,
        categoryId: categoryMap[prod.categorySlug],
        brand: prod.brand,
        unitOfMeasure: prod.unitOfMeasure,
        costPrice: prod.costPrice,
        wholesalePrice: prod.wholesalePrice,
        sellingPrice: prod.sellingPrice,
        taxRate: 16.0,
        minStockLevel: prod.minStockLevel,
        reorderLevel: prod.reorderLevel,
        maxStockLevel: prod.maxStockLevel,
        preferredSupplier: prod.preferredSupplier,
        description: prod.description,
        status: "ACTIVE",
      },
    });
    productRecords.push({
      id: created.id,
      sku: created.sku,
      name: created.name,
      costPrice: Number(created.costPrice),
      wholesalePrice: Number(created.wholesalePrice || created.sellingPrice),
      sellingPrice: Number(created.sellingPrice),
      reorderLevel: created.reorderLevel,
    });
  }

  // 6. Phase 3: Seed 3 Warehouses
  const warehouseConfigs = [
    {
      name: "Nairobi Main",
      code: "NBO-MAIN",
      location: "Nairobi",
      address: "Mombasa Road, Syokimau Logistics Park, Godown A1",
      phone: "+254 711 234 501",
      email: "nairobi.main@acmedistributors.co.ke",
      managerId: userMap["WAREHOUSE_STAFF"],
      isDefault: true,
    },
    {
      name: "Industrial Area Depot",
      code: "IND-DEPOT",
      location: "Nairobi Industrial Area",
      address: "Lunga Lunga Road, Block 4, Warehouse 7",
      phone: "+254 711 234 502",
      email: "industrial.depot@acmedistributors.co.ke",
      managerId: userMap["MANAGER"],
      isDefault: false,
    },
    {
      name: "Mombasa Warehouse",
      code: "MSA-PORT",
      location: "Mombasa",
      address: "Changamwe Port Reitz Road, Coast Distribution Hub",
      phone: "+254 711 234 503",
      email: "mombasa@acmedistributors.co.ke",
      managerId: userMap["OWNER"],
      isDefault: false,
    },
  ];

  const warehouseMap: Record<string, string> = {};

  for (const wh of warehouseConfigs) {
    const created = await prisma.warehouse.upsert({
      where: {
        organizationId_code: {
          organizationId: acmeOrg.id,
          code: wh.code,
        },
      },
      update: {
        name: wh.name,
        location: wh.location,
        address: wh.address,
        phone: wh.phone,
        email: wh.email,
        managerId: wh.managerId,
        isDefault: wh.isDefault,
      },
      create: {
        organizationId: acmeOrg.id,
        name: wh.name,
        code: wh.code,
        location: wh.location,
        address: wh.address,
        phone: wh.phone,
        email: wh.email,
        managerId: wh.managerId,
        isDefault: wh.isDefault,
        status: "ACTIVE",
      },
    });
    warehouseMap[wh.code] = created.id;
  }

  // 7. Phase 3: Seed Inventory Items, Opening Balance Stock Movements & Adjustments
  const existingMovementCount = await prisma.stockMovement.count({
    where: { organizationId: acmeOrg.id },
  });

  if (existingMovementCount === 0) {
    for (let idx = 0; idx < productRecords.length; idx++) {
      const prod = productRecords[idx];

      const stockProfile = [
        {
          whCode: "NBO-MAIN",
          current: idx === 13 ? 18 : idx === 21 ? 0 : 120 + (idx % 5) * 35,
          reserved: idx % 3 === 0 ? 15 : 0,
          incoming: idx % 4 === 0 ? 50 : 0,
          damaged: idx === 0 ? 3 : 0,
        },
        {
          whCode: "IND-DEPOT",
          current: idx % 6 === 0 ? 14 : 65 + (idx % 4) * 20,
          reserved: idx % 5 === 0 ? 10 : 0,
          incoming: 0,
          damaged: 0,
        },
        {
          whCode: "MSA-PORT",
          current: idx % 7 === 0 ? 0 : 45 + (idx % 3) * 25,
          reserved: 0,
          incoming: idx % 5 === 0 ? 40 : 0,
          damaged: 0,
        },
      ];

      for (const sp of stockProfile) {
        const warehouseId = warehouseMap[sp.whCode];

        await prisma.inventoryItem.upsert({
          where: {
            productId_warehouseId: {
              productId: prod.id,
              warehouseId,
            },
          },
          update: {
            currentStock: sp.current,
            reservedStock: sp.reserved,
            incomingStock: sp.incoming,
            damagedStock: sp.damaged,
          },
          create: {
            organizationId: acmeOrg.id,
            productId: prod.id,
            warehouseId,
            currentStock: sp.current,
            reservedStock: sp.reserved,
            incomingStock: sp.incoming,
            damagedStock: sp.damaged,
          },
        });

        if (sp.current > 0) {
          await prisma.stockMovement.create({
            data: {
              organizationId: acmeOrg.id,
              productId: prod.id,
              warehouseId,
              movementType: "OPENING_BALANCE",
              quantity: sp.current,
              previousQuantity: 0,
              newQuantity: sp.current,
              reference: `OB-2026-${sp.whCode}`,
              notes: `Initial verified warehouse stock count at ${sp.whCode}`,
              userId: userMap["WAREHOUSE_STAFF"],
            },
          });
        }
      }
    }

    const firstProd = productRecords[0];
    const secondProd = productRecords[4];

    await prisma.stockAdjustment.create({
      data: {
        organizationId: acmeOrg.id,
        adjustmentNumber: "ADJ-1001",
        productId: firstProd.id,
        warehouseId: warehouseMap["NBO-MAIN"],
        quantityDelta: -3,
        previousQuantity: 123,
        newQuantity: 120,
        reason: "DAMAGED_GOODS",
        status: "APPROVED",
        notes: "3 cartons punctured during forklift offloading at Bay 2",
        createdById: userMap["WAREHOUSE_STAFF"],
        approvedById: userMap["MANAGER"],
        approvedAt: new Date(),
      },
    });

    await prisma.stockMovement.create({
      data: {
        organizationId: acmeOrg.id,
        productId: firstProd.id,
        warehouseId: warehouseMap["NBO-MAIN"],
        movementType: "DAMAGE",
        quantity: -3,
        previousQuantity: 123,
        newQuantity: 120,
        reference: "ADJ-1001",
        notes: "3 cartons punctured during forklift offloading at Bay 2",
        userId: userMap["WAREHOUSE_STAFF"],
      },
    });

    await prisma.stockAdjustment.create({
      data: {
        organizationId: acmeOrg.id,
        adjustmentNumber: "ADJ-1002",
        productId: secondProd.id,
        warehouseId: warehouseMap["IND-DEPOT"],
        quantityDelta: -28,
        previousQuantity: 145,
        newQuantity: 117,
        reason: "STOCK_COUNT_CORRECTION",
        status: "PENDING_APPROVAL",
        notes:
          "End-of-week physical cycle count variance requiring Manager sign-off",
        createdById: userMap["WAREHOUSE_STAFF"],
      },
    });
  }

  // 8. Phase 4: Seed 5 Realistic Suppliers per Section 50 ("At least 5 suppliers")
  const supplierConfigs = [
    {
      code: "SUP-101",
      companyName: "Bidco Africa Ltd",
      contactPerson: "Martin Njoroge",
      phone: "+254 709 100 200",
      email: "trade.orders@bidcoafrica.com",
      address: "Thika Superhighway, Industrial Zone",
      city: "Thika",
      taxNumber: "P051100221A",
      paymentTermsDays: 30,
      creditLimit: 5000000,
      bankDetails: "KCB Bank • A/C 1102938475 (Paybill 522522)",
      suppliedCategories: "Cooking Oils, Cooking Fats, Laundry Bar Soaps",
      totalPurchases: 1450000,
      outstandingBalance: 485000,
    },
    {
      code: "SUP-102",
      companyName: "Unga Millers (E.A.) Ltd",
      contactPerson: "Esther Wambui",
      phone: "+254 722 204 881",
      email: "wholesale@unga.com",
      address: "Commercial Street, Industrial Area",
      city: "Nairobi",
      taxNumber: "P051100442B",
      paymentTermsDays: 14,
      creditLimit: 3500000,
      bankDetails: "Equity Bank • A/C 018029384712",
      suppliedCategories: "Jogoo Maize Meal, Exe Wheat Flour, Porridge Flours",
      totalPurchases: 980000,
      outstandingBalance: 210000,
    },
    {
      code: "SUP-103",
      companyName: "Nairobi Bottlers Ltd (Coca-Cola)",
      contactPerson: "Brian Otieno",
      phone: "+254 711 082 000",
      email: "keyaccounts@nairobibottlers.co.ke",
      address: "Airport North Road, Embakasi",
      city: "Nairobi",
      taxNumber: "P051100889C",
      paymentTermsDays: 7,
      creditLimit: 2500000,
      bankDetails: "Standard Chartered • A/C 0102039485700",
      suppliedCategories: "Coca-Cola, Fanta, Sprite PET & Glass Cases",
      totalPurchases: 820000,
      outstandingBalance: 0,
    },
    {
      code: "SUP-104",
      companyName: "Unilever Kenya Ltd",
      contactPerson: "Faith Chepkoech",
      phone: "+254 733 600 900",
      email: "distributor.desk@unilever.com",
      address: "Commercial Street, Industrial Area",
      city: "Nairobi",
      taxNumber: "P051100994D",
      paymentTermsDays: 30,
      creditLimit: 4000000,
      bankDetails: "Absa Bank Kenya • A/C 2039485712",
      suppliedCategories: "Omo, Sunlight, Geisha, Vaseline, Royco",
      totalPurchases: 1120000,
      outstandingBalance: 340000,
    },
    {
      code: "SUP-105",
      companyName: "Pwani Oil Products Ltd",
      contactPerson: "Hassan Ali",
      phone: "+254 720 445 110",
      email: "sales@pwanioil.com",
      address: "Jomvu Industrial Estate",
      city: "Mombasa",
      taxNumber: "P051100775E",
      paymentTermsDays: 30,
      creditLimit: 3000000,
      bankDetails: "DTB Bank • A/C 0019283746",
      suppliedCategories: "Fresh Fri Cooking Oil, Popco, Ushindi Bar Soap",
      totalPurchases: 760000,
      outstandingBalance: 195000,
    },
  ];

  const supplierMap: Record<string, string> = {};

  for (const sup of supplierConfigs) {
    const created = await prisma.supplier.upsert({
      where: {
        organizationId_code: {
          organizationId: acmeOrg.id,
          code: sup.code,
        },
      },
      update: {
        companyName: sup.companyName,
        contactPerson: sup.contactPerson,
        phone: sup.phone,
        email: sup.email,
        address: sup.address,
        city: sup.city,
        taxNumber: sup.taxNumber,
        paymentTermsDays: sup.paymentTermsDays,
        creditLimit: sup.creditLimit,
        bankDetails: sup.bankDetails,
        suppliedCategories: sup.suppliedCategories,
      },
      create: {
        organizationId: acmeOrg.id,
        code: sup.code,
        companyName: sup.companyName,
        contactPerson: sup.contactPerson,
        phone: sup.phone,
        email: sup.email,
        address: sup.address,
        city: sup.city,
        taxNumber: sup.taxNumber,
        paymentTermsDays: sup.paymentTermsDays,
        creditLimit: sup.creditLimit,
        bankDetails: sup.bankDetails,
        suppliedCategories: sup.suppliedCategories,
        totalPurchases: sup.totalPurchases,
        outstandingBalance: sup.outstandingBalance,
        status: "ACTIVE",
      },
    });
    supplierMap[sup.code] = created.id;
  }

  // 9. Phase 4: Seed 3 Purchase Orders & 1 Goods Receipt Note (GRN) demonstrating Section 17 discrepancy handling
  const existingPoCount = await prisma.purchaseOrder.count({
    where: { organizationId: acmeOrg.id },
  });

  if (existingPoCount === 0) {
    const elianto = productRecords[1]; // Elianto Corn Oil
    const goldenFry = productRecords[2]; // Golden Fry 20L
    const jogoo = productRecords[4]; // Jogoo Maize Meal
    const exeFlour = productRecords[5]; // Exe Wheat Flour
    const omo = productRecords[14]; // Omo 1kg

    // PO-2001: Fully Received with a GRN showing 100 Ordered -> 95 Received, 3 Damaged, 2 Missing (exact Section 17 example)
    const po1Sub = 100 * goldenFry.costPrice;
    const po1Tax = po1Sub * 0.16;
    const po1 = await prisma.purchaseOrder.create({
      data: {
        organizationId: acmeOrg.id,
        poNumber: "PO-2001",
        supplierId: supplierMap["SUP-101"],
        warehouseId: warehouseMap["NBO-MAIN"],
        status: "RECEIVED",
        subtotal: po1Sub,
        discountAmount: 0,
        taxAmount: po1Tax,
        totalAmount: po1Sub + po1Tax,
        expectedDeliveryAt: new Date(Date.now() - 2 * 86400000),
        notes: "Monthly bulk replenishment of Golden Fry 20L jerrycans",
        createdById: userMap["MANAGER"],
        approvedById: userMap["OWNER"],
        approvedAt: new Date(Date.now() - 4 * 86400000),
        orderedAt: new Date(Date.now() - 4 * 86400000),
        receivedAt: new Date(Date.now() - 1 * 86400000),
        items: {
          create: [
            {
              productId: goldenFry.id,
              orderedQuantity: 100,
              receivedQuantity: 95,
              damagedQuantity: 3,
              unitCost: goldenFry.costPrice,
              taxRate: 16.0,
              lineTotal: po1Sub + po1Tax,
            },
          ],
        },
      },
    });

    await prisma.goodsReceipt.create({
      data: {
        organizationId: acmeOrg.id,
        grnNumber: "GRN-3001",
        purchaseOrderId: po1.id,
        supplierId: supplierMap["SUP-101"],
        warehouseId: warehouseMap["NBO-MAIN"],
        receivedById: userMap["WAREHOUSE_STAFF"],
        deliveryNoteRef: "DN-BIDCO-90412",
        notes:
          "Ordered 100 units: 95 received in good condition, 3 jerrycans leaked in transit, 2 short-shipped.",
        totalAcceptedValue: 95 * goldenFry.costPrice * 1.16,
        items: {
          create: [
            {
              productId: goldenFry.id,
              orderedQuantity: 100,
              receivedQuantity: 95,
              damagedQuantity: 3,
              missingQuantity: 2,
              unitCost: goldenFry.costPrice,
            },
          ],
        },
      },
    });

    // PO-2002: ORDERED (In Transit) — Ready for one-click Goods Receiving in the UI
    const po2Sub = 80 * jogoo.costPrice + 60 * exeFlour.costPrice;
    const po2Tax = po2Sub * 0.16;
    await prisma.purchaseOrder.create({
      data: {
        organizationId: acmeOrg.id,
        poNumber: "PO-2002",
        supplierId: supplierMap["SUP-102"],
        warehouseId: warehouseMap["NBO-MAIN"],
        status: "ORDERED",
        subtotal: po2Sub,
        discountAmount: 5000,
        taxAmount: po2Tax,
        totalAmount: po2Sub - 5000 + po2Tax,
        expectedDeliveryAt: new Date(Date.now() + 86400000),
        notes: "Urgent maize and wheat flour restock for Nairobi Main",
        createdById: userMap["MANAGER"],
        approvedById: userMap["OWNER"],
        approvedAt: new Date(),
        orderedAt: new Date(),
        items: {
          create: [
            {
              productId: jogoo.id,
              orderedQuantity: 80,
              receivedQuantity: 0,
              damagedQuantity: 0,
              unitCost: jogoo.costPrice,
              taxRate: 16.0,
              lineTotal: 80 * jogoo.costPrice * 1.16,
            },
            {
              productId: exeFlour.id,
              orderedQuantity: 60,
              receivedQuantity: 0,
              damagedQuantity: 0,
              unitCost: exeFlour.costPrice,
              taxRate: 16.0,
              lineTotal: 60 * exeFlour.costPrice * 1.16,
            },
          ],
        },
      },
    });

    // PO-2003: PENDING_APPROVAL — Ready for one-click Manager Approval in the UI
    const po3Sub = 40 * omo.costPrice + 30 * elianto.costPrice;
    const po3Tax = po3Sub * 0.16;
    await prisma.purchaseOrder.create({
      data: {
        organizationId: acmeOrg.id,
        poNumber: "PO-2003",
        supplierId: supplierMap["SUP-104"],
        warehouseId: warehouseMap["IND-DEPOT"],
        status: "PENDING_APPROVAL",
        subtotal: po3Sub,
        discountAmount: 0,
        taxAmount: po3Tax,
        totalAmount: po3Sub + po3Tax,
        expectedDeliveryAt: new Date(Date.now() + 3 * 86400000),
        notes: "Industrial Area Depot monthly detergent stock order",
        createdById: userMap["WAREHOUSE_STAFF"],
        items: {
          create: [
            {
              productId: omo.id,
              orderedQuantity: 40,
              receivedQuantity: 0,
              damagedQuantity: 0,
              unitCost: omo.costPrice,
              taxRate: 16.0,
              lineTotal: 40 * omo.costPrice * 1.16,
            },
            {
              productId: elianto.id,
              orderedQuantity: 30,
              receivedQuantity: 0,
              damagedQuantity: 0,
              unitCost: elianto.costPrice,
              taxRate: 16.0,
              lineTotal: 30 * elianto.costPrice * 1.16,
            },
          ],
        },
      },
    });
  }

  // 9. Seed Phase 5 Customers (10 realistic Kenyan accounts across Wholesale, Distributor, Corporate, Retail, Individual)
  const customersData = [
    {
      code: "CUS-101",
      businessName: "Naivas Supermarkets — Westlands Branch",
      contactPerson: "Grace Wanjiku",
      phone: "+254 722 310 400",
      email: "procurement.westlands@naivas.co.ke",
      city: "Nairobi",
      address: "Waiyaki Way, Westlands",
      deliveryAddress: "Naivas Receiving Bay, Waiyaki Way, Westlands",
      customerType: "WHOLESALE" as const,
      taxNumber: "P051209841K",
      paymentTermsDays: 30,
      creditLimit: 2500000,
      totalPurchases: 845000,
      outstandingBalance: 312000,
      salesRepRole: "SALES_STAFF",
      status: "ACTIVE" as const,
    },
    {
      code: "CUS-102",
      businessName: "Quickmart Retail Ltd — Kilimani",
      contactPerson: "brian.omondi@quickmart.co.ke",
      phone: "+254 733 412 890",
      email: "orders@quickmart.co.ke",
      city: "Nairobi",
      address: "Argwings Kodhek Rd, Kilimani",
      deliveryAddress: "Quickmart Loading Dock, Kilimani",
      customerType: "WHOLESALE" as const,
      taxNumber: "P051334912M",
      paymentTermsDays: 30,
      creditLimit: 2000000,
      totalPurchases: 620000,
      outstandingBalance: 185000,
      salesRepRole: "SALES_STAFF",
      status: "ACTIVE" as const,
    },
    {
      code: "CUS-103",
      businessName: "Rift Valley Wholesalers & Cash-and-Carry",
      contactPerson: "Samuel Kiprop",
      phone: "+254 711 889 230",
      email: "info@riftvalleywholesalers.co.ke",
      city: "Nakuru",
      address: "Kenyatta Avenue, Nakuru CBD",
      deliveryAddress: "Godown 4, Industrial Area, Nakuru",
      customerType: "DISTRIBUTOR" as const,
      taxNumber: "P051449821B",
      paymentTermsDays: 14,
      creditLimit: 1500000,
      totalPurchases: 490000,
      outstandingBalance: 140000,
      salesRepRole: "MANAGER",
      status: "ACTIVE" as const,
    },
    {
      code: "CUS-104",
      businessName: "Coastline General Merchants Ltd",
      contactPerson: "Hassan Bakari",
      phone: "+254 720 654 321",
      email: "hassan@coastlinemerchants.co.ke",
      city: "Mombasa",
      address: "Nkrumah Road, Mombasa Island",
      deliveryAddress: "Changamwe Logistics Yard, Mombasa",
      customerType: "DISTRIBUTOR" as const,
      taxNumber: "P051551092Z",
      paymentTermsDays: 14,
      creditLimit: 1200000,
      totalPurchases: 365000,
      outstandingBalance: 95000,
      salesRepRole: "SALES_STAFF",
      status: "ACTIVE" as const,
    },
    {
      code: "CUS-105",
      businessName: "Sarova Hotels & Hospitality Group",
      contactPerson: "Mercy Njoroge",
      phone: "+254 721 908 112",
      email: "purchasing@sarovahotels.com",
      city: "Nairobi",
      address: "Kimathi Street, CBD, Nairobi",
      deliveryAddress: "Sarova Central Kitchen Stores,Lusaka Rd",
      customerType: "CORPORATE" as const,
      taxNumber: "P051667123L",
      paymentTermsDays: 30,
      creditLimit: 1800000,
      totalPurchases: 530000,
      outstandingBalance: 210000,
      salesRepRole: "MANAGER",
      status: "ACTIVE" as const,
    },
    {
      code: "CUS-106",
      businessName: "Eastleigh Mart & Mini-Supermarket",
      contactPerson: "Abdi Farah",
      phone: "+254 722 771 904",
      email: "abdi@eastleighmart.co.ke",
      city: "Nairobi",
      address: "1st Avenue, Eastleigh",
      deliveryAddress: "1st Avenue, Section 2, Eastleigh",
      customerType: "RETAIL" as const,
      taxNumber: "P051778234Q",
      paymentTermsDays: 7,
      creditLimit: 600000,
      totalPurchases: 275000,
      outstandingBalance: 45000,
      salesRepRole: "SALES_STAFF",
      status: "ACTIVE" as const,
    },
    {
      code: "CUS-107",
      businessName: "Thika Road Sundries & Provision Store",
      contactPerson: "Josephine Muthoni",
      phone: "+254 724 553 119",
      email: "jmuthoni@thikasundries.co.ke",
      city: "Ruiru",
      address: "Eastern Bypass Junction, Ruiru",
      deliveryAddress: "Ruiru Town Market Stall B12",
      customerType: "RETAIL" as const,
      taxNumber: "P051889345W",
      paymentTermsDays: 7,
      creditLimit: 400000,
      totalPurchases: 190000,
      outstandingBalance: 375000,
      salesRepRole: "SALES_STAFF",
      status: "ON_HOLD" as const,
    },
    {
      code: "CUS-108",
      businessName: "Lake Basin Distributors Kisumu",
      contactPerson: "Phenny Achieng",
      phone: "+254 735 112 678",
      email: "orders@lakebasindist.co.ke",
      city: "Kisumu",
      address: "Oginga Odinga Street, Kisumu",
      deliveryAddress: "Obote Road Warehouse Complex, Kisumu",
      customerType: "DISTRIBUTOR" as const,
      taxNumber: "P051990456E",
      paymentTermsDays: 14,
      creditLimit: 1000000,
      totalPurchases: 410000,
      outstandingBalance: 0,
      salesRepRole: "SALES_STAFF",
      status: "ACTIVE" as const,
    },
    {
      code: "CUS-109",
      businessName: "Java House Coffee & Commissary Ltd",
      contactPerson: "Kevin Mutua",
      phone: "+254 709 223 000",
      email: "supplychain@javahouseafrica.com",
      city: "Nairobi",
      address: "Industrial Area, Funzi Road",
      deliveryAddress: "Funzi Road Central Commissary, Industrial Area",
      customerType: "CORPORATE" as const,
      taxNumber: "P052001567R",
      paymentTermsDays: 30,
      creditLimit: 1500000,
      totalPurchases: 390000,
      outstandingBalance: 118000,
      salesRepRole: "MANAGER",
      status: "ACTIVE" as const,
    },
    {
      code: "CUS-110",
      businessName: "Peter Ndegwa (Walk-in Cash Account)",
      contactPerson: "Peter Ndegwa",
      phone: "+254 712 309 876",
      email: "pndegwa@gmail.com",
      city: "Nairobi",
      address: "Donholm Phase 5, Nairobi",
      deliveryAddress: "Customer Self-Collection at Embakasi Hub",
      customerType: "INDIVIDUAL" as const,
      taxNumber: "A004918273K",
      paymentTermsDays: 0,
      creditLimit: 50000,
      totalPurchases: 48500,
      outstandingBalance: 0,
      salesRepRole: "SALES_STAFF",
      status: "ACTIVE" as const,
    },
  ];

  const customerMap: Record<string, string> = {};
  for (const c of customersData) {
    const cust = await prisma.customer.upsert({
      where: {
        organizationId_code: {
          organizationId: acmeOrg.id,
          code: c.code,
        },
      },
      update: {
        businessName: c.businessName,
        customerType: c.customerType,
        creditLimit: c.creditLimit,
        totalPurchases: c.totalPurchases,
        outstandingBalance: c.outstandingBalance,
        status: c.status,
      },
      create: {
        organizationId: acmeOrg.id,
        code: c.code,
        businessName: c.businessName,
        contactPerson: c.contactPerson,
        phone: c.phone,
        email: c.email,
        city: c.city,
        address: c.address,
        deliveryAddress: c.deliveryAddress,
        customerType: c.customerType,
        taxNumber: c.taxNumber,
        paymentTermsDays: c.paymentTermsDays,
        creditLimit: c.creditLimit,
        totalPurchases: c.totalPurchases,
        outstandingBalance: c.outstandingBalance,
        salesRepId: userMap[c.salesRepRole] || userMap["SALES_STAFF"],
        status: c.status,
      },
    });
    customerMap[c.code] = cust.id;
  }

  // 10. Seed Phase 5 Sales Orders (5 orders across DELIVERED, READY_FOR_DELIVERY, PROCESSING, CONFIRMED, DRAFT)
  const existingOrderCount = await prisma.salesOrder.count({
    where: { organizationId: acmeOrg.id },
  });

  if (existingOrderCount === 0) {
    const freshFri = productRecords[0];
    const goldenFry = productRecords[2];
    const jogoo = productRecords[4];
    const daawatRice = productRecords[6];
    const brooksideMilk = productRecords[8];
    const cocaCola = productRecords[10];
    const omo = productRecords[14];

    // ORD-2026-0001: DELIVERED (Fulfilled & Deducted)
    const ord1Sub = 25 * freshFri.wholesalePrice + 30 * jogoo.wholesalePrice;
    const ord1Tax = ord1Sub * 0.16;
    await prisma.salesOrder.create({
      data: {
        organizationId: acmeOrg.id,
        orderNumber: "ORD-2026-0001",
        customerId: customerMap["CUS-101"],
        warehouseId: warehouseMap["NBO-MAIN"],
        salesPersonId: userMap["SALES_STAFF"],
        status: "DELIVERED",
        subtotal: ord1Sub,
        discountAmount: 0,
        taxAmount: ord1Tax,
        totalAmount: ord1Sub + ord1Tax,
        deliveryAddress: "Naivas Receiving Bay, Waiyaki Way, Westlands",
        expectedDeliveryAt: new Date(Date.now() - 2 * 86400000),
        confirmedAt: new Date(Date.now() - 3 * 86400000),
        deliveredAt: new Date(Date.now() - 1 * 86400000),
        stockReserved: false,
        notes: "Weekly Naivas Westlands edible oil & flour replenishment",
        items: {
          create: [
            {
              productId: freshFri.id,
              orderedQuantity: 25,
              deliveredQuantity: 25,
              unitPrice: freshFri.wholesalePrice,
              discountAmount: 0,
              taxRate: 16,
              lineTotal: 25 * freshFri.wholesalePrice * 1.16,
            },
            {
              productId: jogoo.id,
              orderedQuantity: 30,
              deliveredQuantity: 30,
              unitPrice: jogoo.wholesalePrice,
              discountAmount: 0,
              taxRate: 16,
              lineTotal: 30 * jogoo.wholesalePrice * 1.16,
            },
          ],
        },
      },
    });

    // ORD-2026-0002: READY_FOR_DELIVERY (Stock Reserved at NBO-MAIN)
    const ord2Sub =
      20 * brooksideMilk.wholesalePrice + 40 * cocaCola.wholesalePrice;
    const ord2Tax = ord2Sub * 0.16;
    await prisma.salesOrder.create({
      data: {
        organizationId: acmeOrg.id,
        orderNumber: "ORD-2026-0002",
        customerId: customerMap["CUS-102"],
        warehouseId: warehouseMap["NBO-MAIN"],
        salesPersonId: userMap["SALES_STAFF"],
        status: "READY_FOR_DELIVERY",
        subtotal: ord2Sub,
        discountAmount: 0,
        taxAmount: ord2Tax,
        totalAmount: ord2Sub + ord2Tax,
        deliveryAddress: "Quickmart Loading Dock, Kilimani",
        expectedDeliveryAt: new Date(Date.now() + 86400000),
        confirmedAt: new Date(Date.now() - 86400000),
        stockReserved: true,
        notes: "Picked & palletized at Loading Bay 2 for morning dispatch",
        items: {
          create: [
            {
              productId: brooksideMilk.id,
              orderedQuantity: 20,
              deliveredQuantity: 0,
              unitPrice: brooksideMilk.wholesalePrice,
              discountAmount: 0,
              taxRate: 16,
              lineTotal: 20 * brooksideMilk.wholesalePrice * 1.16,
            },
            {
              productId: cocaCola.id,
              orderedQuantity: 40,
              deliveredQuantity: 0,
              unitPrice: cocaCola.wholesalePrice,
              discountAmount: 0,
              taxRate: 16,
              lineTotal: 40 * cocaCola.wholesalePrice * 1.16,
            },
          ],
        },
      },
    });

    // ORD-2026-0003: PROCESSING (Picking & Packing at NBO-MAIN, Stock Reserved)
    const ord3Sub = 15 * goldenFry.wholesalePrice + 20 * daawatRice.wholesalePrice;
    const ord3Tax = ord3Sub * 0.16;
    await prisma.salesOrder.create({
      data: {
        organizationId: acmeOrg.id,
        orderNumber: "ORD-2026-0003",
        customerId: customerMap["CUS-105"],
        warehouseId: warehouseMap["NBO-MAIN"],
        salesPersonId: userMap["MANAGER"],
        status: "PROCESSING",
        subtotal: ord3Sub,
        discountAmount: 0,
        taxAmount: ord3Tax,
        totalAmount: ord3Sub + ord3Tax,
        deliveryAddress: "Sarova Central Kitchen Stores, Lusaka Rd",
        expectedDeliveryAt: new Date(Date.now() + 2 * 86400000),
        confirmedAt: new Date(),
        stockReserved: true,
        notes: "Hospitality kitchen supply order — include batch certificate",
        items: {
          create: [
            {
              productId: goldenFry.id,
              orderedQuantity: 15,
              deliveredQuantity: 0,
              unitPrice: goldenFry.wholesalePrice,
              discountAmount: 0,
              taxRate: 16,
              lineTotal: 15 * goldenFry.wholesalePrice * 1.16,
            },
            {
              productId: daawatRice.id,
              orderedQuantity: 20,
              deliveredQuantity: 0,
              unitPrice: daawatRice.wholesalePrice,
              discountAmount: 0,
              taxRate: 16,
              lineTotal: 20 * daawatRice.wholesalePrice * 1.16,
            },
          ],
        },
      },
    });

    // ORD-2026-0004: CONFIRMED (Stock Reserved at IND-DEPOT)
    const ord4Sub = 25 * omo.wholesalePrice;
    const ord4Tax = ord4Sub * 0.16;
    await prisma.salesOrder.create({
      data: {
        organizationId: acmeOrg.id,
        orderNumber: "ORD-2026-0004",
        customerId: customerMap["CUS-103"],
        warehouseId: warehouseMap["IND-DEPOT"],
        salesPersonId: userMap["SALES_STAFF"],
        status: "CONFIRMED",
        subtotal: ord4Sub,
        discountAmount: 0,
        taxAmount: ord4Tax,
        totalAmount: ord4Sub + ord4Tax,
        deliveryAddress: "Godown 4, Industrial Area, Nakuru",
        expectedDeliveryAt: new Date(Date.now() + 3 * 86400000),
        confirmedAt: new Date(),
        stockReserved: true,
        notes: "Upcountry wholesale consignment — reserve stock for Friday truck",
        items: {
          create: [
            {
              productId: omo.id,
              orderedQuantity: 25,
              deliveredQuantity: 0,
              unitPrice: omo.wholesalePrice,
              discountAmount: 0,
              taxRate: 16,
              lineTotal: 25 * omo.wholesalePrice * 1.16,
            },
          ],
        },
      },
    });

    // ORD-2026-0005: DRAFT Quote (Unreserved — ready for 1-click Confirm & Reserve in UI)
    const ord5Sub = 12 * freshFri.sellingPrice + 15 * jogoo.sellingPrice;
    const ord5Tax = ord5Sub * 0.16;
    await prisma.salesOrder.create({
      data: {
        organizationId: acmeOrg.id,
        orderNumber: "ORD-2026-0005",
        customerId: customerMap["CUS-106"],
        warehouseId: warehouseMap["NBO-MAIN"],
        salesPersonId: userMap["SALES_STAFF"],
        status: "DRAFT",
        subtotal: ord5Sub,
        discountAmount: 0,
        taxAmount: ord5Tax,
        totalAmount: ord5Sub + ord5Tax,
        deliveryAddress: "1st Avenue, Section 2, Eastleigh",
        expectedDeliveryAt: new Date(Date.now() + 4 * 86400000),
        stockReserved: false,
        notes: "Awaiting customer confirmation before reserving stock",
        items: {
          create: [
            {
              productId: freshFri.id,
              orderedQuantity: 12,
              deliveredQuantity: 0,
              unitPrice: freshFri.sellingPrice,
              discountAmount: 0,
              taxRate: 16,
              lineTotal: 12 * freshFri.sellingPrice * 1.16,
            },
            {
              productId: jogoo.id,
              orderedQuantity: 15,
              deliveredQuantity: 0,
              unitPrice: jogoo.sellingPrice,
              discountAmount: 0,
              taxRate: 16,
              lineTotal: 15 * jogoo.sellingPrice * 1.16,
            },
          ],
        },
      },
    });
  }

  // 11. Seed Phase 6 Inter-Warehouse Stock Transfers (RECEIVED, IN_TRANSIT, APPROVED)
  const existingTransferCount = await prisma.stockTransfer.count({
    where: { organizationId: acmeOrg.id },
  });

  if (existingTransferCount === 0) {
    const freshFri = productRecords[0];
    const jogoo = productRecords[4];
    const cocaCola = productRecords[10];
    const omo = productRecords[14];

    // TRF-2026-0001: RECEIVED (Nairobi Main -> Industrial Area Depot)
    await prisma.stockTransfer.create({
      data: {
        organizationId: acmeOrg.id,
        transferNumber: "TRF-2026-0001",
        sourceWarehouseId: warehouseMap["NBO-MAIN"],
        destinationWarehouseId: warehouseMap["IND-DEPOT"],
        status: "RECEIVED",
        driverName: "John Kamau",
        vehicleRef: "KDD 412P — Isuzu FRR",
        notes: "Weekly Industrial Area Depot replenishment of cooking oil & flour",
        requestedById: userMap["WAREHOUSE_STAFF"],
        approvedById: userMap["MANAGER"],
        dispatchedById: userMap["WAREHOUSE_STAFF"],
        receivedById: userMap["MANAGER"],
        approvedAt: new Date(Date.now() - 3 * 86400000),
        dispatchedAt: new Date(Date.now() - 2 * 86400000),
        receivedAt: new Date(Date.now() - 1 * 86400000),
        items: {
          create: [
            {
              productId: freshFri.id,
              requestedQuantity: 30,
              dispatchedQuantity: 30,
              receivedQuantity: 30,
              damagedQuantity: 0,
              unitCost: freshFri.costPrice,
            },
            {
              productId: jogoo.id,
              requestedQuantity: 40,
              dispatchedQuantity: 40,
              receivedQuantity: 39,
              damagedQuantity: 1,
              unitCost: jogoo.costPrice,
            },
          ],
        },
      },
    });

    // TRF-2026-0002: IN_TRANSIT (Nairobi Main -> Mombasa Warehouse) — Ready for 1-click Destination Receiving in UI
    await prisma.stockTransfer.create({
      data: {
        organizationId: acmeOrg.id,
        transferNumber: "TRF-2026-0002",
        sourceWarehouseId: warehouseMap["NBO-MAIN"],
        destinationWarehouseId: warehouseMap["MSA-PORT"],
        status: "IN_TRANSIT",
        driverName: "Peter Mwangi",
        vehicleRef: "KCE 889M — Mitsubishi Fuso Fighter",
        notes: "Highway haulage to Mombasa Coast Hub — ETA tomorrow morning",
        requestedById: userMap["MANAGER"],
        approvedById: userMap["OWNER"],
        dispatchedById: userMap["WAREHOUSE_STAFF"],
        approvedAt: new Date(Date.now() - 86400000),
        dispatchedAt: new Date(),
        items: {
          create: [
            {
              productId: cocaCola.id,
              requestedQuantity: 50,
              dispatchedQuantity: 50,
              receivedQuantity: 0,
              damagedQuantity: 0,
              unitCost: cocaCola.costPrice,
            },
            {
              productId: omo.id,
              requestedQuantity: 25,
              dispatchedQuantity: 25,
              receivedQuantity: 0,
              damagedQuantity: 0,
              unitCost: omo.costPrice,
            },
          ],
        },
      },
    });

    // TRF-2026-0003: APPROVED (Industrial Area Depot -> Nairobi Main) — Ready for 1-click Dispatch in UI
    await prisma.stockTransfer.create({
      data: {
        organizationId: acmeOrg.id,
        transferNumber: "TRF-2026-0003",
        sourceWarehouseId: warehouseMap["IND-DEPOT"],
        destinationWarehouseId: warehouseMap["NBO-MAIN"],
        status: "APPROVED",
        driverName: "John Kamau",
        vehicleRef: "KDD 412P — Isuzu FRR",
        notes: "Rebalancing fast-moving SKUs back to Nairobi Main Dispatch Hub",
        requestedById: userMap["WAREHOUSE_STAFF"],
        approvedById: userMap["MANAGER"],
        approvedAt: new Date(),
        items: {
          create: [
            {
              productId: freshFri.id,
              requestedQuantity: 15,
              dispatchedQuantity: 0,
              receivedQuantity: 0,
              damagedQuantity: 0,
              unitCost: freshFri.costPrice,
            },
          ],
        },
      },
    });
  }

  // 12. Seed Phase 7 Fleet Vehicles, Drivers, Deliveries & Proof of Delivery (POD)
  const vehiclesData = [
    {
      registrationNumber: "KDD 412P",
      makeModel: "Isuzu FRR 90N",
      vehicleType: "Box Truck",
      capacityKg: 5000,
      depotCode: "NBO-MAIN",
      status: "ON_ROUTE" as const,
      notes: "Primary Westlands & CBD supermarket distribution truck",
    },
    {
      registrationNumber: "KCE 889M",
      makeModel: "Mitsubishi Fuso Fighter",
      vehicleType: "Heavy Hauler",
      capacityKg: 10000,
      depotCode: "NBO-MAIN",
      status: "AVAILABLE" as const,
      notes: "Long-haul inter-depot and upcountry distributor truck",
    },
    {
      registrationNumber: "KDA 703Z",
      makeModel: "Isuzu NMR 85H",
      vehicleType: "Medium Canter",
      capacityKg: 3500,
      depotCode: "IND-DEPOT",
      status: "AVAILABLE" as const,
      notes: "Industrial Area & Eastlands rapid wholesale delivery canter",
    },
    {
      registrationNumber: "KDG 215A",
      makeModel: "Toyota Hilux Double Cab",
      vehicleType: "Pickup / Light Utility",
      capacityKg: 1200,
      depotCode: "MSA-PORT",
      status: "AVAILABLE" as const,
      notes: "Mombasa Island express hospitality & retail utility pickup",
    },
  ];

  const vehicleMap: Record<string, string> = {};
  for (const v of vehiclesData) {
    const veh = await prisma.vehicle.upsert({
      where: {
        organizationId_registrationNumber: {
          organizationId: acmeOrg.id,
          registrationNumber: v.registrationNumber,
        },
      },
      update: {
        makeModel: v.makeModel,
        vehicleType: v.vehicleType,
        capacityKg: v.capacityKg,
        status: v.status,
      },
      create: {
        organizationId: acmeOrg.id,
        registrationNumber: v.registrationNumber,
        makeModel: v.makeModel,
        vehicleType: v.vehicleType,
        capacityKg: v.capacityKg,
        assignedDepotId: warehouseMap[v.depotCode],
        insuranceExpiry: new Date(Date.now() + 240 * 86400000),
        inspectionExpiry: new Date(Date.now() + 180 * 86400000),
        status: v.status,
        notes: v.notes,
      },
    });
    vehicleMap[v.registrationNumber] = veh.id;
  }

  const driversData = [
    {
      code: "DRV-101",
      fullName: "John Kamau",
      phone: "+254 722 610 111",
      email: "driver@acmedistributors.co.ke",
      licenseNumber: "DL-KE-801942",
      licenseClass: "BCE (Commercial Truck)",
      vehiclePlate: "KDD 412P",
      status: "ON_DELIVERY" as const,
      completedDeliveries: 42,
    },
    {
      code: "DRV-102",
      fullName: "Peter Mwangi",
      phone: "+254 721 498 223",
      email: "pmwangi@acmedistributors.co.ke",
      licenseNumber: "DL-KE-665301",
      licenseClass: "BCE / CE (Heavy Articulated)",
      vehiclePlate: "KCE 889M",
      status: "AVAILABLE" as const,
      completedDeliveries: 38,
    },
    {
      code: "DRV-103",
      fullName: "Daniel Ochieng",
      phone: "+254 733 712 805",
      email: "dochieng@acmedistributors.co.ke",
      licenseNumber: "DL-KE-912044",
      licenseClass: "BCE (Commercial Truck)",
      vehiclePlate: "KDA 703Z",
      status: "AVAILABLE" as const,
      completedDeliveries: 29,
    },
    {
      code: "DRV-104",
      fullName: "Stephen Kiprono",
      phone: "+254 710 334 990",
      email: "skiprono@acmedistributors.co.ke",
      licenseNumber: "DL-KE-540129",
      licenseClass: "BC (Light Commercial)",
      vehiclePlate: "KDG 215A",
      status: "AVAILABLE" as const,
      completedDeliveries: 19,
    },
  ];

  const driverMap: Record<string, string> = {};
  for (const d of driversData) {
    const drv = await prisma.driver.upsert({
      where: {
        organizationId_code: {
          organizationId: acmeOrg.id,
          code: d.code,
        },
      },
      update: {
        fullName: d.fullName,
        defaultVehicleId: vehicleMap[d.vehiclePlate],
        status: d.status,
        completedDeliveries: d.completedDeliveries,
      },
      create: {
        organizationId: acmeOrg.id,
        code: d.code,
        userId: d.code === "DRV-101" ? userMap["DELIVERY_STAFF"] : null,
        fullName: d.fullName,
        phone: d.phone,
        email: d.email,
        licenseNumber: d.licenseNumber,
        licenseClass: d.licenseClass,
        licenseExpiry: new Date(Date.now() + 500 * 86400000),
        defaultVehicleId: vehicleMap[d.vehiclePlate],
        status: d.status,
        completedDeliveries: d.completedDeliveries,
      },
    });
    driverMap[d.code] = drv.id;
  }

  const existingDeliveryCount = await prisma.delivery.count({
    where: { organizationId: acmeOrg.id },
  });

  if (existingDeliveryCount === 0) {
    const ord1 = await prisma.salesOrder.findFirst({
      where: { organizationId: acmeOrg.id, orderNumber: "ORD-2026-0001" },
      include: { items: true },
    });
    const ord2 = await prisma.salesOrder.findFirst({
      where: { organizationId: acmeOrg.id, orderNumber: "ORD-2026-0002" },
      include: { items: true },
    });
    const ord3 = await prisma.salesOrder.findFirst({
      where: { organizationId: acmeOrg.id, orderNumber: "ORD-2026-0003" },
      include: { items: true },
    });

    if (ord1) {
      const del1 = await prisma.delivery.create({
        data: {
          organizationId: acmeOrg.id,
          deliveryNumber: "DEL-2026-0001",
          salesOrderId: ord1.id,
          customerId: ord1.customerId,
          warehouseId: ord1.warehouseId,
          driverId: driverMap["DRV-102"],
          vehicleId: vehicleMap["KCE 889M"],
          deliveryAddress:
            ord1.deliveryAddress || "Naivas Receiving Bay, Waiyaki Way, Westlands",
          scheduledDate: new Date(Date.now() - 86400000),
          status: "DELIVERED",
          dispatchNotes: "Morning supermarket window delivery",
          dispatchedAt: new Date(Date.now() - 86400000),
          deliveredAt: new Date(Date.now() - 82000000),
          createdById: userMap["MANAGER"],
          items: {
            create: ord1.items.map((i) => ({
              productId: i.productId,
              orderedQuantity: i.orderedQuantity,
              dispatchedQuantity: i.orderedQuantity,
              deliveredQuantity: i.orderedQuantity,
              returnedQuantity: 0,
            })),
          },
        },
      });

      await prisma.proofOfDelivery.create({
        data: {
          organizationId: acmeOrg.id,
          deliveryId: del1.id,
          recipientName: "Grace Wanjiku",
          recipientRole: "Senior Receiving Officer — Naivas Westlands",
          recipientPhone: "+254 722 310 400",
          signatureData: "SIG-VERIFIED-NAIVAS-WL-9941",
          gpsCoordinates: "-1.2647, 36.8021 (Westlands, Nairobi)",
          deliveryNotes:
            "All 55 units (Fresh Fri 5L & Jogoo 2kg Bales) verified intact and stamped at Receiving Bay 1.",
          capturedById: userMap["DELIVERY_STAFF"],
          capturedAt: new Date(Date.now() - 82000000),
        },
      });
    }

    if (ord2) {
      await prisma.delivery.create({
        data: {
          organizationId: acmeOrg.id,
          deliveryNumber: "DEL-2026-0002",
          salesOrderId: ord2.id,
          customerId: ord2.customerId,
          warehouseId: ord2.warehouseId,
          driverId: driverMap["DRV-101"],
          vehicleId: vehicleMap["KDD 412P"],
          deliveryAddress:
            ord2.deliveryAddress || "Quickmart Loading Dock, Kilimani",
          scheduledDate: new Date(),
          status: "IN_TRANSIT",
          dispatchNotes:
            "En route to Kilimani Loading Dock — capture POD signature on arrival",
          dispatchedAt: new Date(),
          createdById: userMap["MANAGER"],
          items: {
            create: ord2.items.map((i) => ({
              productId: i.productId,
              orderedQuantity: i.orderedQuantity,
              dispatchedQuantity: i.orderedQuantity,
              deliveredQuantity: 0,
              returnedQuantity: 0,
            })),
          },
        },
      });
    }

    if (ord3) {
      await prisma.delivery.create({
        data: {
          organizationId: acmeOrg.id,
          deliveryNumber: "DEL-2026-0003",
          salesOrderId: ord3.id,
          customerId: ord3.customerId,
          warehouseId: ord3.warehouseId,
          driverId: driverMap["DRV-103"],
          vehicleId: vehicleMap["KDA 703Z"],
          deliveryAddress:
            ord3.deliveryAddress || "Sarova Central Kitchen Stores, Lusaka Rd",
          scheduledDate: new Date(Date.now() + 86400000),
          status: "ASSIGNED",
          dispatchNotes:
            "Assigned to Daniel Ochieng (KDA 703Z) for tomorrow morning hospitality run",
          createdById: userMap["MANAGER"],
          items: {
            create: ord3.items.map((i) => ({
              productId: i.productId,
              orderedQuantity: i.orderedQuantity,
              dispatchedQuantity: i.orderedQuantity,
              deliveredQuantity: 0,
              returnedQuantity: 0,
            })),
          },
        },
      });
    }
  }

  // 14. Seed Phase 8: Tax Invoices, Customer Payments & Operational Expenses
  const existingInvoiceCount = await prisma.invoice.count({
    where: { organizationId: acmeOrg.id },
  });

  if (existingInvoiceCount === 0) {
    const ord1 = await prisma.salesOrder.findFirst({
      where: { organizationId: acmeOrg.id, orderNumber: "ORD-2026-0001" },
      include: { items: true },
    });
    const ord2 = await prisma.salesOrder.findFirst({
      where: { organizationId: acmeOrg.id, orderNumber: "ORD-2026-0002" },
      include: { items: true },
    });

    // INV-2026-0001: Linked to ORD-2026-0001 (Naivas Westlands) — PAID in full via Bank EFT + M-Pesa
    if (ord1) {
      const total1 = Number(ord1.totalAmount);
      const inv1 = await prisma.invoice.create({
        data: {
          organizationId: acmeOrg.id,
          invoiceNumber: "INV-2026-0001",
          salesOrderId: ord1.id,
          customerId: ord1.customerId,
          issuedById: userMap["MANAGER"],
          status: "PAID",
          issueDate: new Date(Date.now() - 2 * 86400000),
          dueDate: new Date(Date.now() + 28 * 86400000),
          subtotal: ord1.subtotal,
          discountAmount: ord1.discountAmount,
          taxAmount: ord1.taxAmount,
          totalAmount: ord1.totalAmount,
          amountPaid: ord1.totalAmount,
          balanceDue: 0,
          taxReference: "KRA-CU-2026-104801",
          notes: "Weekly Naivas Westlands tax invoice — Paid in full",
          items: {
            create: ord1.items.map((i) => ({
              productId: i.productId,
              quantity: i.orderedQuantity,
              unitPrice: i.unitPrice,
              discountAmount: i.discountAmount,
              taxRate: i.taxRate,
              lineTotal: i.lineTotal,
            })),
          },
        },
      });

      await prisma.payment.create({
        data: {
          organizationId: acmeOrg.id,
          paymentNumber: "PAY-2026-0001",
          invoiceId: inv1.id,
          customerId: ord1.customerId,
          recordedById: userMap["OWNER"],
          amount: total1,
          method: "BANK_TRANSFER",
          reference: "EFT-KCB-9902841",
          paymentDate: new Date(Date.now() - 86400000),
          notes: "Naivas Westlands RTGS settlement for INV-2026-0001",
        },
      });
    }

    // INV-2026-0002: Linked to ORD-2026-0002 (Quickmart Kilimani) — PARTIALLY_PAID via M-Pesa Paybill
    if (ord2) {
      const total2 = Number(ord2.totalAmount);
      const partialPaid = Math.round(total2 * 0.5);
      const balDue = total2 - partialPaid;

      const inv2 = await prisma.invoice.create({
        data: {
          organizationId: acmeOrg.id,
          invoiceNumber: "INV-2026-0002",
          salesOrderId: ord2.id,
          customerId: ord2.customerId,
          issuedById: userMap["MANAGER"],
          status: "PARTIALLY_PAID",
          issueDate: new Date(Date.now() - 86400000),
          dueDate: new Date(Date.now() + 29 * 86400000),
          subtotal: ord2.subtotal,
          discountAmount: ord2.discountAmount,
          taxAmount: ord2.taxAmount,
          totalAmount: ord2.totalAmount,
          amountPaid: partialPaid,
          balanceDue: balDue,
          taxReference: "KRA-CU-2026-104802",
          notes: "Quickmart Kilimani 50% deposit received via M-Pesa Paybill",
          items: {
            create: ord2.items.map((i) => ({
              productId: i.productId,
              quantity: i.orderedQuantity,
              unitPrice: i.unitPrice,
              discountAmount: i.discountAmount,
              taxRate: i.taxRate,
              lineTotal: i.lineTotal,
            })),
          },
        },
      });

      await prisma.payment.create({
        data: {
          organizationId: acmeOrg.id,
          paymentNumber: "PAY-2026-0002",
          invoiceId: inv2.id,
          customerId: ord2.customerId,
          recordedById: userMap["SALES_STAFF"],
          amount: partialPaid,
          method: "MPESA",
          reference: "SHK94M21LPA",
          paymentDate: new Date(Date.now() - 43200000),
          notes: "50% M-Pesa Paybill 522522 installment against INV-2026-0002",
        },
      });
    }

    // INV-2026-0003: Standalone Overdue Invoice for Thika Road Sundries (CUS-107 on Credit Hold)
    const freshFri = productRecords[0];
    const sub3 = 40 * freshFri.wholesalePrice;
    const tax3 = sub3 * 0.16;
    const total3 = sub3 + tax3;

    const inv3 = await prisma.invoice.create({
      data: {
        organizationId: acmeOrg.id,
        invoiceNumber: "INV-2026-0003",
        customerId: customerMap["CUS-107"],
        issuedById: userMap["MANAGER"],
        status: "OVERDUE",
        issueDate: new Date(Date.now() - 21 * 86400000),
        dueDate: new Date(Date.now() - 14 * 86400000),
        subtotal: sub3,
        discountAmount: 0,
        taxAmount: tax3,
        totalAmount: total3,
        amountPaid: 15000,
        balanceDue: total3 - 15000,
        taxReference: "KRA-CU-2026-104788",
        notes: "Past due 14 days — Customer account placed on Credit Hold",
        items: {
          create: [
            {
              productId: freshFri.id,
              quantity: 40,
              unitPrice: freshFri.wholesalePrice,
              discountAmount: 0,
              taxRate: 16.0,
              lineTotal: total3,
            },
          ],
        },
      },
    });

    await prisma.payment.create({
      data: {
        organizationId: acmeOrg.id,
        paymentNumber: "PAY-2026-0003",
        invoiceId: inv3.id,
        customerId: customerMap["CUS-107"],
        recordedById: userMap["SALES_STAFF"],
        amount: 15000,
        method: "MPESA",
        reference: "SHK71P09QWE",
        paymentDate: new Date(Date.now() - 10 * 86400000),
        notes: "Partial M-Pesa Till payment from Thika Road Sundries",
      },
    });
  }

  const existingExpenseCount = await prisma.expense.count({
    where: { organizationId: acmeOrg.id },
  });

  if (existingExpenseCount === 0) {
    const expenseSeeds = [
      {
        expenseNumber: "EXP-2026-0001",
        category: "FUEL" as const,
        amount: 24800,
        description:
          "Diesel fuel refill (140L) for Isuzu FVR 90L (KDA 703Z) & Mitsubishi Canter (KDD 412P)",
        paymentMethod: "MPESA" as const,
        reference: "SHK8812FUEL",
        warehouseId: warehouseMap["NBO-MAIN"],
      },
      {
        expenseNumber: "EXP-2026-0002",
        category: "TRANSPORT" as const,
        amount: 6500,
        description:
          "Nairobi Expressway & Weighbridge transit passes for Westlands & Kilimani dispatches",
        paymentMethod: "MPESA" as const,
        reference: "SHK8819TOLL",
        warehouseId: warehouseMap["NBO-MAIN"],
      },
      {
        expenseNumber: "EXP-2026-0003",
        category: "PACKAGING" as const,
        amount: 18400,
        description:
          "40 rolls heavy-duty pallet shrink-wrap and strapping tape for Industrial Area Depot",
        paymentMethod: "BANK_TRANSFER" as const,
        reference: "EFT-PKG-4091",
        warehouseId: warehouseMap["IND-DEPOT"],
      },
      {
        expenseNumber: "EXP-2026-0004",
        category: "REPAIRS" as const,
        amount: 32000,
        description:
          "Scheduled brake pad replacement & oil service for Toyota Hilux Van (KDG 215A)",
        paymentMethod: "BANK_TRANSFER" as const,
        reference: "EFT-SVC-7712",
        warehouseId: warehouseMap["IND-DEPOT"],
      },
    ];

    for (const exp of expenseSeeds) {
      await prisma.expense.create({
        data: {
          organizationId: acmeOrg.id,
          ...exp,
          recordedById: userMap["MANAGER"],
        },
      });
    }
  }

  console.log(
    "✅ Seed completed! Suppliers, POs, Customers, Sales Orders, Transfers, Fleet Vehicles, Drivers, POD Deliveries, Tax Invoices, Payments & Expenses ready."
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
