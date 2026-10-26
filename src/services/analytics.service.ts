import { prisma } from "@/lib/prisma";

export class AnalyticsService {
  /**
   * Computes comprehensive multi-domain analytics for Section 27 & Section 28:
   * 1. Financial P&L + Product-Level Profitability (Revenue, COGS, Gross Profit, Expenses, Net Profit)
   * 2. Sales Analytics (By Customer, By Category, By Warehouse, By Salesperson)
   * 3. Inventory & Valuation Analytics (By Warehouse, Low/Out of Stock, Movement Breakdown)
   * 4. Purchasing & Supplier Performance (By Supplier, GRN Quality & Discrepancies)
   * 5. Distribution & Driver Performance (Delivery SLA, POD completion, Driver leaderboard)
   */
  static async getExecutiveAnalytics(organizationId: string) {
    const [
      products,
      categories,
      warehouses,
      inventoryItems,
      stockMovements,
      suppliers,
      purchaseOrders,
      goodsReceipts,
      customers,
      salesOrders,
      deliveries,
      drivers,
      vehicles,
      invoices,
      payments,
      expenses,
    ] = await Promise.all([
      prisma.product.findMany({
        where: { organizationId },
        include: { category: { select: { id: true, name: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({
        where: { organizationId },
      }),
      prisma.warehouse.findMany({
        where: { organizationId },
        include: { manager: { select: { name: true } } },
      }),
      prisma.inventoryItem.findMany({
        where: { organizationId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              costPrice: true,
              sellingPrice: true,
              wholesalePrice: true,
              reorderLevel: true,
              unitOfMeasure: true,
              category: { select: { name: true } },
            },
          },
          warehouse: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.stockMovement.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.supplier.findMany({
        where: { organizationId },
        orderBy: { totalPurchases: "desc" },
      }),
      prisma.purchaseOrder.findMany({
        where: { organizationId },
        include: { supplier: { select: { companyName: true, code: true } } },
      }),
      prisma.goodsReceipt.findMany({
        where: { organizationId },
        include: { items: true },
      }),
      prisma.customer.findMany({
        where: { organizationId },
        include: { salesRep: { select: { name: true } } },
        orderBy: { totalPurchases: "desc" },
      }),
      prisma.salesOrder.findMany({
        where: { organizationId, status: { not: "CANCELLED" } },
        include: {
          customer: { select: { id: true, businessName: true, code: true, customerType: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          salesPerson: { select: { id: true, name: true } },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  costPrice: true,
                  sellingPrice: true,
                  wholesalePrice: true,
                  categoryId: true,
                  category: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
      prisma.delivery.findMany({
        where: { organizationId },
        include: {
          driver: { select: { id: true, fullName: true, code: true } },
          vehicle: { select: { id: true, registrationNumber: true, makeModel: true } },
          proofOfDelivery: true,
        },
      }),
      prisma.driver.findMany({
        where: { organizationId },
        include: {
          defaultVehicle: { select: { registrationNumber: true, makeModel: true } },
          deliveries: { select: { id: true, status: true } },
        },
        orderBy: { completedDeliveries: "desc" },
      }),
      prisma.vehicle.findMany({
        where: { organizationId },
      }),
      prisma.invoice.findMany({
        where: { organizationId, status: { not: "CANCELLED" } },
      }),
      prisma.payment.findMany({
        where: { organizationId },
      }),
      prisma.expense.findMany({
        where: { organizationId },
        include: { warehouse: { select: { name: true, code: true } } },
        orderBy: { expenseDate: "desc" },
      }),
    ]);

    // 1. PRODUCT-LEVEL PROFITABILITY & CATALOG MARGIN ENGINE (Section 28)
    const productSalesMap = new Map<
      string,
      { unitsSold: number; revenueExclTax: number; revenueInclTax: number; cogs: number }
    >();

    for (const order of salesOrders) {
      for (const item of order.items) {
        const current = productSalesMap.get(item.productId) || {
          unitsSold: 0,
          revenueExclTax: 0,
          revenueInclTax: 0,
          cogs: 0,
        };
        const qty = item.orderedQuantity;
        const unitPrice = Number(item.unitPrice);
        const unitCost = Number(item.product.costPrice);
        const netExclTax = qty * unitPrice - Number(item.discountAmount);
        const lineTotal = Number(item.lineTotal);

        current.unitsSold += qty;
        current.revenueExclTax += netExclTax;
        current.revenueInclTax += lineTotal;
        current.cogs += qty * unitCost;
        productSalesMap.set(item.productId, current);
      }
    }

    const productProfitability = products.map((p) => {
      const costPrice = Number(p.costPrice);
      const wholesalePrice = Number(p.wholesalePrice || p.sellingPrice);
      const sellingPrice = Number(p.sellingPrice);
      const catalogUnitProfit = wholesalePrice - costPrice;
      const catalogMarginPct =
        wholesalePrice > 0
          ? Number(((catalogUnitProfit / wholesalePrice) * 100).toFixed(1))
          : 0;

      const salesPerf = productSalesMap.get(p.id) || {
        unitsSold: 0,
        revenueExclTax: 0,
        revenueInclTax: 0,
        cogs: 0,
      };
      const realizedGrossProfit = salesPerf.revenueExclTax - salesPerf.cogs;
      const realizedMarginPct =
        salesPerf.revenueExclTax > 0
          ? Number(
              ((realizedGrossProfit / salesPerf.revenueExclTax) * 100).toFixed(1)
            )
          : catalogMarginPct;

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        categoryName: p.category?.name || "Uncategorized",
        unitOfMeasure: p.unitOfMeasure,
        costPrice,
        wholesalePrice,
        sellingPrice,
        catalogUnitProfit,
        catalogMarginPct,
        unitsSold: salesPerf.unitsSold,
        revenueExclTax: salesPerf.revenueExclTax,
        revenueInclTax: salesPerf.revenueInclTax,
        cogs: salesPerf.cogs,
        realizedGrossProfit,
        realizedMarginPct,
      };
    });

    productProfitability.sort(
      (a, b) => b.realizedGrossProfit - a.realizedGrossProfit
    );

    // 2. FINANCIAL P&L SUMMARY
    const totalSalesRevenueExclTax = salesOrders.reduce(
      (sum, o) => sum + Number(o.subtotal) - Number(o.discountAmount),
      0
    );
    const totalSalesRevenueInclTax = salesOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0
    );
    const totalCOGS = productProfitability.reduce((sum, p) => sum + p.cogs, 0);
    const grossProfit = totalSalesRevenueExclTax - totalCOGS;
    const grossMarginPct =
      totalSalesRevenueExclTax > 0
        ? Number(((grossProfit / totalSalesRevenueExclTax) * 100).toFixed(1))
        : 0;

    const totalOperatingExpenses = expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );
    const netOperatingProfit = grossProfit - totalOperatingExpenses;
    const netMarginPct =
      totalSalesRevenueExclTax > 0
        ? Number(
            ((netOperatingProfit / totalSalesRevenueExclTax) * 100).toFixed(1)
          )
        : 0;

    const expensesByCategoryMap = new Map<string, number>();
    for (const e of expenses) {
      expensesByCategoryMap.set(
        e.category,
        (expensesByCategoryMap.get(e.category) || 0) + Number(e.amount)
      );
    }
    const expensesByCategory = Array.from(expensesByCategoryMap.entries()).map(
      ([category, amount]) => ({
        category,
        amount,
        sharePct:
          totalOperatingExpenses > 0
            ? Math.round((amount / totalOperatingExpenses) * 100)
            : 0,
      })
    );

    const totalInvoicedAmount = invoices.reduce(
      (s, i) => s + Number(i.totalAmount),
      0
    );
    const totalCollectedCash = payments.reduce(
      (s, p) => s + Number(p.amount),
      0
    );
    const totalCustomerReceivables = customers.reduce(
      (s, c) => s + Number(c.outstandingBalance),
      0
    );
    const totalSupplierPayables = suppliers.reduce(
      (s, sup) => s + Number(sup.outstandingBalance),
      0
    );

    // 3. SALES ANALYTICS (By Customer, By Warehouse, By Category, By Salesperson)
    const salesByWarehouse = warehouses.map((w) => {
      const whOrders = salesOrders.filter((o) => o.warehouseId === w.id);
      const revenue = whOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
      return {
        warehouseId: w.id,
        name: w.name,
        code: w.code,
        orderCount: whOrders.length,
        revenue,
      };
    });

    const salesByCategoryMap = new Map<
      string,
      { categoryName: string; unitsSold: number; revenue: number; grossProfit: number }
    >();
    for (const p of productProfitability) {
      const curr = salesByCategoryMap.get(p.categoryName) || {
        categoryName: p.categoryName,
        unitsSold: 0,
        revenue: 0,
        grossProfit: 0,
      };
      curr.unitsSold += p.unitsSold;
      curr.revenue += p.revenueInclTax;
      curr.grossProfit += p.realizedGrossProfit;
      salesByCategoryMap.set(p.categoryName, curr);
    }
    const salesByCategory = Array.from(salesByCategoryMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );

    const salesByCustomer = customers.map((c) => {
      const custOrders = salesOrders.filter((o) => o.customerId === c.id);
      const orderRevenue = custOrders.reduce(
        (s, o) => s + Number(o.totalAmount),
        0
      );
      return {
        id: c.id,
        code: c.code,
        businessName: c.businessName,
        customerType: c.customerType,
        salesRepName: c.salesRep?.name || "Unassigned",
        orderCount: custOrders.length,
        totalPurchases: Number(c.totalPurchases),
        activeOrderRevenue: orderRevenue,
        outstandingBalance: Number(c.outstandingBalance),
        creditLimit: Number(c.creditLimit),
        status: c.status,
      };
    });

    // 4. INVENTORY & VALUATION ANALYTICS
    const inventoryByWarehouse = warehouses.map((w) => {
      const items = inventoryItems.filter((i) => i.warehouseId === w.id);
      let currentUnits = 0;
      let reservedUnits = 0;
      let damagedUnits = 0;
      let costValuation = 0;
      let wholesaleValuation = 0;

      for (const item of items) {
        const avail = Math.max(0, item.currentStock - item.reservedStock);
        currentUnits += item.currentStock;
        reservedUnits += item.reservedStock;
        damagedUnits += item.damagedStock;
        costValuation += item.currentStock * Number(item.product.costPrice);
        wholesaleValuation +=
          avail *
          Number(item.product.wholesalePrice || item.product.sellingPrice);
      }

      return {
        id: w.id,
        name: w.name,
        code: w.code,
        managerName: w.manager?.name || "Assigned",
        skuCount: items.filter((i) => i.currentStock > 0).length,
        currentUnits,
        reservedUnits,
        availableUnits: Math.max(0, currentUnits - reservedUnits),
        damagedUnits,
        costValuation,
        wholesaleValuation,
        potentialGrossProfit: wholesaleValuation - costValuation,
      };
    });

    const lowAndOutStockReport = inventoryItems
      .filter((i) => {
        const avail = Math.max(0, i.currentStock - i.reservedStock);
        return avail <= i.product.reorderLevel;
      })
      .map((i) => {
        const available = Math.max(0, i.currentStock - i.reservedStock);
        return {
          id: i.id,
          sku: i.product.sku,
          productName: i.product.name,
          categoryName: i.product.category?.name || "General",
          warehouseName: i.warehouse.name,
          warehouseCode: i.warehouse.code,
          currentStock: i.currentStock,
          reservedStock: i.reservedStock,
          availableStock: available,
          reorderLevel: i.product.reorderLevel,
          shortfall: Math.max(0, i.product.reorderLevel * 2 - available),
          estimatedRestockCost:
            Math.max(0, i.product.reorderLevel * 2 - available) *
            Number(i.product.costPrice),
          status: available === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
        };
      });

    // 5. PURCHASING & SUPPLIER PERFORMANCE
    const supplierPerformance = suppliers.map((s) => {
      const supPOs = purchaseOrders.filter((po) => po.supplierId === s.id);
      const supGRNs = goodsReceipts.filter((g) => g.supplierId === s.id);
      let orderedUnits = 0;
      let receivedUnits = 0;
      let damagedUnits = 0;
      let missingUnits = 0;

      for (const grn of supGRNs) {
        for (const item of grn.items) {
          orderedUnits += item.orderedQuantity;
          receivedUnits += item.receivedQuantity;
          damagedUnits += item.damagedQuantity;
          missingUnits += item.missingQuantity;
        }
      }

      const fulfillmentRatePct =
        orderedUnits > 0
          ? Math.round((receivedUnits / orderedUnits) * 100)
          : 100;

      return {
        id: s.id,
        code: s.code,
        companyName: s.companyName,
        city: s.city,
        paymentTermsDays: s.paymentTermsDays,
        poCount: supPOs.length,
        grnCount: supGRNs.length,
        totalPurchases: Number(s.totalPurchases),
        outstandingBalance: Number(s.outstandingBalance),
        fulfillmentRatePct,
        damagedUnits,
        missingUnits,
      };
    });

    // 6. DISTRIBUTION & FLEET PERFORMANCE
    const deliveryStats = {
      totalDeliveries: deliveries.length,
      deliveredCount: deliveries.filter((d) => d.status === "DELIVERED").length,
      inTransitCount: deliveries.filter(
        (d) => d.status === "IN_TRANSIT" || d.status === "DISPATCHED"
      ).length,
      assignedOrPendingCount: deliveries.filter(
        (d) => d.status === "ASSIGNED" || d.status === "PENDING"
      ).length,
      failedCount: deliveries.filter((d) => d.status === "FAILED").length,
      podVerifiedCount: deliveries.filter((d) => Boolean(d.proofOfDelivery))
        .length,
    };

    const driverLeaderboard = drivers.map((drv) => ({
      id: drv.id,
      code: drv.code,
      fullName: drv.fullName,
      phone: drv.phone,
      licenseNumber: drv.licenseNumber,
      status: drv.status,
      completedDeliveries: drv.completedDeliveries,
      activeAssignedCount: drv.deliveries.filter(
        (d) => d.status === "ASSIGNED" || d.status === "IN_TRANSIT"
      ).length,
      vehicleReg: drv.defaultVehicle?.registrationNumber || "Unassigned",
      vehicleModel: drv.defaultVehicle?.makeModel || "",
    }));

    return {
      financialSummary: {
        totalSalesRevenueExclTax,
        totalSalesRevenueInclTax,
        totalCOGS,
        grossProfit,
        grossMarginPct,
        totalOperatingExpenses,
        netOperatingProfit,
        netMarginPct,
        totalInvoicedAmount,
        totalCollectedCash,
        totalCustomerReceivables,
        totalSupplierPayables,
        expensesByCategory,
      },
      productProfitability,
      salesAnalytics: {
        salesByWarehouse,
        salesByCategory,
        salesByCustomer,
      },
      inventoryAnalytics: {
        inventoryByWarehouse,
        lowAndOutStockReport,
        totalInventoryCostValue: inventoryByWarehouse.reduce(
          (s, w) => s + w.costValuation,
          0
        ),
        totalInventoryWholesaleValue: inventoryByWarehouse.reduce(
          (s, w) => s + w.wholesaleValuation,
          0
        ),
        recentMovementsCount: stockMovements.length,
      },
      purchasingAnalytics: {
        supplierPerformance,
      },
      distributionAnalytics: {
        deliveryStats,
        driverLeaderboard,
        totalVehicles: vehicles.length,
      },
    };
  }

  /**
   * Automated Alert Scanner (Sections 29 & 30):
   * Scans live stock levels, overdue invoices, and credit limit breaches and creates system notifications
   */
  static async runAutomatedAlertScan(organizationId: string) {
    const [inventoryItems, invoices, customers, existingNotifications] =
      await Promise.all([
        prisma.inventoryItem.findMany({
          where: { organizationId },
          include: {
            product: {
              select: { name: true, sku: true, reorderLevel: true },
            },
            warehouse: { select: { name: true, code: true } },
          },
        }),
        prisma.invoice.findMany({
          where: {
            organizationId,
            status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
          },
          include: { customer: { select: { businessName: true } } },
        }),
        prisma.customer.findMany({
          where: { organizationId },
        }),
        prisma.notification.findMany({
          where: { organizationId },
          select: { title: true },
        }),
      ]);

    const existingTitles = new Set(existingNotifications.map((n) => n.title));
    const createdAlerts: Array<{ type: string; title: string; message: string; link: string }> = [];

    // 1. Scan Out-of-Stock & Low Stock items
    for (const item of inventoryItems) {
      const available = Math.max(0, item.currentStock - item.reservedStock);
      if (available === 0) {
        const title = `Out of Stock Alert: ${item.product.sku} at ${item.warehouse.code}`;
        if (!existingTitles.has(title)) {
          createdAlerts.push({
            type: "LOW_STOCK",
            title,
            message: `${item.product.name} (${item.product.sku}) has 0 available units at ${item.warehouse.name}. Reorder level is ${item.product.reorderLevel} units.`,
            link: "/inventory/stock",
          });
          existingTitles.add(title);
        }
      } else if (available <= item.product.reorderLevel) {
        const title = `Low Stock Warning: ${item.product.sku} at ${item.warehouse.code}`;
        if (!existingTitles.has(title)) {
          createdAlerts.push({
            type: "LOW_STOCK",
            title,
            message: `${item.product.name} is down to ${available} available units at ${item.warehouse.name} (Reorder threshold: ${item.product.reorderLevel}).`,
            link: "/purchasing/orders",
          });
          existingTitles.add(title);
        }
      }
    }

    // 2. Scan Overdue Invoices
    const now = new Date();
    for (const inv of invoices) {
      const bal = Number(inv.balanceDue);
      if (bal > 0 && new Date(inv.dueDate) < now) {
        const title = `Overdue Invoice: ${inv.invoiceNumber} (${inv.customer.businessName})`;
        if (!existingTitles.has(title)) {
          createdAlerts.push({
            type: "INVOICE_OVERDUE",
            title,
            message: `Invoice ${inv.invoiceNumber} for ${inv.customer.businessName} has an overdue balance of ${bal.toLocaleString()} past due date ${new Date(
              inv.dueDate
            ).toLocaleDateString()}.`,
            link: "/sales/invoices",
          });
          existingTitles.add(title);
        }
      }
    }

    // 3. Scan Customer Credit Holds / High Utilization
    for (const cust of customers) {
      const limit = Number(cust.creditLimit);
      const bal = Number(cust.outstandingBalance);
      if (
        cust.status === "ON_HOLD" ||
        (limit > 0 && bal >= limit * 0.9)
      ) {
        const title = `Credit Control Alert: ${cust.businessName} (${cust.code})`;
        if (!existingTitles.has(title)) {
          createdAlerts.push({
            type: "CREDIT_CONTROL",
            title,
            message: `${cust.businessName} has an AR balance of ${bal.toLocaleString()} against a credit limit of ${limit.toLocaleString()} (Status: ${cust.status}).`,
            link: "/finance/payments",
          });
          existingTitles.add(title);
        }
      }
    }

    // Limit batch creation to top 8 new actionable alerts
    const batch = createdAlerts.slice(0, 8);
    for (const alert of batch) {
      await prisma.notification.create({
        data: {
          organizationId,
          type: alert.type,
          title: alert.title,
          message: alert.message,
          link: alert.link,
          isRead: false,
        },
      });
    }

    return {
      scannedStockRows: inventoryItems.length,
      scannedInvoices: invoices.length,
      newAlertsCreated: batch.length,
    };
  }
}
