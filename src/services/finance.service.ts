import {
  ExpenseCategory,
  InvoiceStatus,
  PaymentMethod,
  CustomerStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class FinanceService {
  /**
   * Lists all invoices for an organization with customer, order, line items, and payments
   */
  static async listInvoices(organizationId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { organizationId },
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            businessName: true,
            contactPerson: true,
            phone: true,
            email: true,
            city: true,
            taxNumber: true,
            customerType: true,
            paymentTermsDays: true,
            creditLimit: true,
            outstandingBalance: true,
            status: true,
          },
        },
        salesOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
        issuedBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unitOfMeasure: true,
              },
            },
          },
        },
        payments: {
          include: {
            recordedBy: { select: { id: true, name: true } },
          },
          orderBy: { paymentDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    return invoices.map((inv) => {
      const subtotal = Number(inv.subtotal);
      const discountAmount = Number(inv.discountAmount);
      const taxAmount = Number(inv.taxAmount);
      const totalAmount = Number(inv.totalAmount);
      const amountPaid = Number(inv.amountPaid);
      const balanceDue = Number(inv.balanceDue);

      const isPastDue =
        balanceDue > 0 &&
        inv.status !== "CANCELLED" &&
        inv.status !== "PAID" &&
        new Date(inv.dueDate) < now;

      const daysOverdue = isPastDue
        ? Math.max(
            1,
            Math.floor(
              (now.getTime() - new Date(inv.dueDate).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 0;

      return {
        ...inv,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        amountPaid,
        balanceDue,
        isPastDue,
        daysOverdue,
        customer: {
          ...inv.customer,
          creditLimit: Number(inv.customer.creditLimit),
          outstandingBalance: Number(inv.customer.outstandingBalance),
        },
        items: inv.items.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          discountAmount: Number(item.discountAmount),
          taxRate: Number(item.taxRate),
          lineTotal: Number(item.lineTotal),
        })),
        payments: inv.payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
      };
    });
  }

  /**
   * Lists sales orders that do not yet have an active invoice so they can be billed in one click
   */
  static async listBillableSalesOrders(organizationId: string) {
    const orders = await prisma.salesOrder.findMany({
      where: {
        organizationId,
        status: {
          in: [
            "CONFIRMED",
            "PROCESSING",
            "READY_FOR_DELIVERY",
            "PARTIALLY_DELIVERED",
            "DELIVERED",
          ],
        },
        invoices: {
          none: {
            status: { not: "CANCELLED" },
          },
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            businessName: true,
            paymentTermsDays: true,
            taxNumber: true,
          },
        },
        warehouse: {
          select: { id: true, name: true, code: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, unitOfMeasure: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal),
      discountAmount: Number(o.discountAmount),
      taxAmount: Number(o.taxAmount),
      totalAmount: Number(o.totalAmount),
      items: o.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        discountAmount: Number(i.discountAmount),
        taxRate: Number(i.taxRate),
        lineTotal: Number(i.lineTotal),
      })),
    }));
  }

  /**
   * Generates a tax invoice from a Sales Order or custom line items
   */
  static async createInvoice(input: {
    organizationId: string;
    issuedById: string;
    salesOrderId?: string;
    customerId?: string;
    dueDate?: string;
    taxReference?: string;
    notes?: string;
    status?: InvoiceStatus;
  }) {
    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.findUniqueOrThrow({
        where: { id: input.organizationId },
      });

      const count = await tx.invoice.count({
        where: { organizationId: input.organizationId },
      });
      const year = new Date().getFullYear();
      const invoiceNumber = `${org.invoicePrefix}${year}-${String(
        count + 1
      ).padStart(4, "0")}`;

      if (!input.salesOrderId) {
        throw new Error("Please select a confirmed or delivered Sales Order to generate an invoice.");
      }

      const salesOrder = await tx.salesOrder.findFirst({
        where: {
          id: input.salesOrderId,
          organizationId: input.organizationId,
        },
        include: {
          customer: true,
          items: true,
          invoices: {
            where: { status: { not: "CANCELLED" } },
          },
        },
      });

      if (!salesOrder) {
        throw new Error("Sales order not found.");
      }

      if (salesOrder.invoices.length > 0) {
        throw new Error(
          `Sales order ${salesOrder.orderNumber} already has an active invoice (${salesOrder.invoices[0].invoiceNumber}).`
        );
      }

      const customer = salesOrder.customer;
      const issueDate = new Date();
      const dueDate = input.dueDate
        ? new Date(input.dueDate)
        : new Date(
            issueDate.getTime() +
              (customer.paymentTermsDays || org.defaultPaymentTerms || 14) *
                24 *
                60 *
                60 *
                1000
          );

      const taxReference =
        input.taxReference?.trim() ||
        `KRA-CU-${year}-${String(104800 + count + 1)}`;

      const totalAmount = Number(salesOrder.totalAmount);
      const status = input.status || "ISSUED";

      const invoice = await tx.invoice.create({
        data: {
          organizationId: input.organizationId,
          invoiceNumber,
          salesOrderId: salesOrder.id,
          customerId: customer.id,
          issuedById: input.issuedById,
          status,
          issueDate,
          dueDate,
          subtotal: salesOrder.subtotal,
          discountAmount: salesOrder.discountAmount,
          taxAmount: salesOrder.taxAmount,
          totalAmount: salesOrder.totalAmount,
          amountPaid: 0,
          balanceDue: status === "CANCELLED" ? 0 : salesOrder.totalAmount,
          taxReference,
          notes:
            input.notes?.trim() ||
            `Tax Invoice generated for Sales Order ${salesOrder.orderNumber}`,
          items: {
            create: salesOrder.items.map((item) => ({
              productId: item.productId,
              quantity:
                item.deliveredQuantity > 0
                  ? item.deliveredQuantity
                  : item.orderedQuantity,
              unitPrice: item.unitPrice,
              discountAmount: item.discountAmount,
              taxRate: item.taxRate,
              lineTotal: item.lineTotal,
            })),
          },
        },
      });

      // If the sales order wasn't already delivered (which would have added to customer balance),
      // synchronize customer outstandingBalance with open invoices + uninvoiced delivered orders
      if (salesOrder.status !== "DELIVERED" && status !== "CANCELLED") {
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            outstandingBalance: { increment: totalAmount },
            totalPurchases: { increment: totalAmount },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.issuedById,
          action: "CREATE_INVOICE",
          entity: "Invoice",
          entityId: invoice.id,
          newValue: {
            invoiceNumber,
            orderNumber: salesOrder.orderNumber,
            customer: customer.businessName,
            totalAmount,
            taxReference,
          },
        },
      });

      return invoice;
    });
  }

  /**
   * Updates an invoice status (e.g. ISSUED, OVERDUE, CANCELLED)
   */
  static async updateInvoiceStatus(input: {
    organizationId: string;
    userId: string;
    invoiceId: string;
    status: InvoiceStatus;
  }) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: {
          id: input.invoiceId,
          organizationId: input.organizationId,
        },
        include: { customer: true },
      });

      if (!invoice) {
        throw new Error("Invoice not found.");
      }

      if (input.status === "CANCELLED" && Number(invoice.amountPaid) > 0) {
        throw new Error(
          "Cannot cancel an invoice that already has recorded payments."
        );
      }

      const previousBalanceDue = Number(invoice.balanceDue);

      const updated = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: input.status,
          balanceDue: input.status === "CANCELLED" ? 0 : invoice.balanceDue,
        },
      });

      if (input.status === "CANCELLED" && previousBalanceDue > 0) {
        const nextBalance = Math.max(
          0,
          Number(invoice.customer.outstandingBalance) - previousBalanceDue
        );
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: { outstandingBalance: nextBalance },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: `INVOICE_${input.status}`,
          entity: "Invoice",
          entityId: invoice.id,
          previousValue: { status: invoice.status },
          newValue: { status: input.status },
        },
      });

      return updated;
    });
  }

  /**
   * Lists all recorded customer payments
   */
  static async listPayments(organizationId: string) {
    const payments = await prisma.payment.findMany({
      where: { organizationId },
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            businessName: true,
            customerType: true,
            phone: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            balanceDue: true,
            status: true,
            salesOrder: { select: { orderNumber: true } },
          },
        },
        recordedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    return payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      invoice: {
        ...p.invoice,
        totalAmount: Number(p.invoice.totalAmount),
        balanceDue: Number(p.invoice.balanceDue),
      },
    }));
  }

  /**
   * Records a payment against an Invoice and updates customer AR balance & credit status
   */
  static async recordPayment(input: {
    organizationId: string;
    recordedById: string;
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
    reference?: string;
    paymentDate?: string;
    notes?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: {
          id: input.invoiceId,
          organizationId: input.organizationId,
        },
        include: {
          customer: true,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found.");
      }

      if (invoice.status === "CANCELLED") {
        throw new Error("Cannot record payment for a cancelled invoice.");
      }

      const currentBalanceDue = Number(invoice.balanceDue);
      if (currentBalanceDue <= 0) {
        throw new Error(`Invoice ${invoice.invoiceNumber} is already paid in full.`);
      }

      const amount = Number(input.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Payment amount must be greater than zero.");
      }

      if (amount > currentBalanceDue + 0.01) {
        throw new Error(
          `Payment amount (${amount.toLocaleString()}) exceeds invoice balance due (${currentBalanceDue.toLocaleString()}).`
        );
      }

      const count = await tx.payment.count({
        where: { organizationId: input.organizationId },
      });
      const year = new Date().getFullYear();
      const paymentNumber = `PAY-${year}-${String(count + 1).padStart(4, "0")}`;

      const newAmountPaid = Number(invoice.amountPaid) + amount;
      const newBalanceDue = Math.max(0, Number(invoice.totalAmount) - newAmountPaid);
      const newInvoiceStatus: InvoiceStatus =
        newBalanceDue <= 0.01 ? "PAID" : "PARTIALLY_PAID";

      const defaultRef =
        input.method === "MPESA"
          ? `SHK${Math.random().toString(36).substring(2, 9).toUpperCase()}`
          : input.method === "BANK_TRANSFER"
          ? `EFT-${year}-${String(count + 101)}`
          : `RCP-${year}-${String(count + 101)}`;

      const payment = await tx.payment.create({
        data: {
          organizationId: input.organizationId,
          paymentNumber,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          recordedById: input.recordedById,
          amount,
          method: input.method,
          reference: input.reference?.trim() || defaultRef,
          paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
          notes: input.notes?.trim() || null,
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          status: newInvoiceStatus,
        },
      });

      // Update Customer Outstanding Balance and auto-release ON_HOLD if back within credit limit
      const currentCustomerBalance = Number(invoice.customer.outstandingBalance);
      const nextCustomerBalance = Math.max(0, currentCustomerBalance - amount);
      const creditLimit = Number(invoice.customer.creditLimit);

      const shouldAutoReleaseHold =
        invoice.customer.status === "ON_HOLD" &&
        (creditLimit === 0 || nextCustomerBalance <= creditLimit);

      await tx.customer.update({
        where: { id: invoice.customerId },
        data: {
          outstandingBalance: nextCustomerBalance,
          ...(shouldAutoReleaseHold ? { status: "ACTIVE" } : {}),
        },
      });

      await tx.notification.create({
        data: {
          organizationId: input.organizationId,
          type: "PAYMENT_RECEIVED",
          title: `Payment Received (${paymentNumber})`,
          message: `${invoice.customer.businessName} paid ${amount.toLocaleString()} via ${input.method} against ${invoice.invoiceNumber}.`,
          link: "/finance/payments",
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.recordedById,
          action: "RECORD_PAYMENT",
          entity: "Payment",
          entityId: payment.id,
          newValue: {
            paymentNumber,
            invoiceNumber: invoice.invoiceNumber,
            customer: invoice.customer.businessName,
            amount,
            method: input.method,
            newInvoiceStatus,
            nextCustomerBalance,
          },
        },
      });

      return payment;
    });
  }

  /**
   * Computes Credit Control & Accounts Receivable Aging across all customers
   */
  static async getCreditControlSummary(organizationId: string) {
    const customers = await prisma.customer.findMany({
      where: { organizationId },
      include: {
        salesRep: { select: { id: true, name: true } },
        invoices: {
          where: {
            status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
          },
        },
      },
      orderBy: { outstandingBalance: "desc" },
    });

    const now = new Date();

    return customers.map((c) => {
      const creditLimit = Number(c.creditLimit);
      const outstandingBalance = Number(c.outstandingBalance);
      const totalPurchases = Number(c.totalPurchases);
      const availableCredit = Math.max(0, creditLimit - outstandingBalance);
      const utilizationPct =
        creditLimit > 0
          ? Math.round((outstandingBalance / creditLimit) * 100)
          : 0;

      let overdueBalance = 0;
      let overdueInvoicesCount = 0;
      let maxDaysOverdue = 0;

      for (const inv of c.invoices) {
        const bal = Number(inv.balanceDue);
        const due = new Date(inv.dueDate);
        if (bal > 0 && due < now) {
          overdueBalance += bal;
          overdueInvoicesCount += 1;
          const days = Math.max(
            1,
            Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
          );
          if (days > maxDaysOverdue) maxDaysOverdue = days;
        }
      }

      const creditRisk: "HEALTHY" | "WARNING" | "EXCEEDED" | "ON_HOLD" =
        c.status === "ON_HOLD"
          ? "ON_HOLD"
          : creditLimit > 0 && outstandingBalance > creditLimit
          ? "EXCEEDED"
          : utilizationPct >= 80 || overdueInvoicesCount > 0
          ? "WARNING"
          : "HEALTHY";

      return {
        id: c.id,
        code: c.code,
        businessName: c.businessName,
        contactPerson: c.contactPerson,
        phone: c.phone,
        city: c.city,
        customerType: c.customerType,
        paymentTermsDays: c.paymentTermsDays,
        creditLimit,
        outstandingBalance,
        availableCredit,
        totalPurchases,
        utilizationPct,
        overdueBalance,
        overdueInvoicesCount,
        maxDaysOverdue,
        openInvoicesCount: c.invoices.length,
        status: c.status,
        creditRisk,
        salesRep: c.salesRep,
      };
    });
  }

  /**
   * Updates a customer's Credit Hold status, credit limit, or payment terms
   */
  static async updateCustomerCreditControl(input: {
    organizationId: string;
    userId: string;
    customerId: string;
    status?: CustomerStatus;
    creditLimit?: number;
    paymentTermsDays?: number;
    notes?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: {
          id: input.customerId,
          organizationId: input.organizationId,
        },
      });

      if (!customer) {
        throw new Error("Customer account not found.");
      }

      const updated = await tx.customer.update({
        where: { id: customer.id },
        data: {
          ...(input.status ? { status: input.status } : {}),
          ...(input.creditLimit !== undefined
            ? { creditLimit: Number(input.creditLimit) }
            : {}),
          ...(input.paymentTermsDays !== undefined
            ? { paymentTermsDays: Number(input.paymentTermsDays) }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "CREDIT_CONTROL_UPDATE",
          entity: "Customer",
          entityId: customer.id,
          previousValue: {
            status: customer.status,
            creditLimit: Number(customer.creditLimit),
            paymentTermsDays: customer.paymentTermsDays,
          },
          newValue: {
            status: updated.status,
            creditLimit: Number(updated.creditLimit),
            paymentTermsDays: updated.paymentTermsDays,
            notes: input.notes || null,
          },
        },
      });

      return updated;
    });
  }

  /**
   * Lists operational expenses for an organization
   */
  static async listExpenses(organizationId: string) {
    const expenses = await prisma.expense.findMany({
      where: { organizationId },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        recordedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { expenseDate: "desc" },
    });

    return expenses.map((e) => ({
      ...e,
      amount: Number(e.amount),
    }));
  }

  /**
   * Records a new operational expense (Fuel, Transport, Warehouse, Repairs, etc.)
   */
  static async createExpense(input: {
    organizationId: string;
    recordedById: string;
    category: ExpenseCategory;
    amount: number;
    description: string;
    paymentMethod: PaymentMethod;
    reference?: string;
    warehouseId?: string;
    expenseDate?: string;
    notes?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const amount = Number(input.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Expense amount must be greater than zero.");
      }

      if (!input.description?.trim()) {
        throw new Error("Expense description is required.");
      }

      const count = await tx.expense.count({
        where: { organizationId: input.organizationId },
      });
      const year = new Date().getFullYear();
      const expenseNumber = `EXP-${year}-${String(count + 1).padStart(4, "0")}`;

      const expense = await tx.expense.create({
        data: {
          organizationId: input.organizationId,
          expenseNumber,
          category: input.category,
          amount,
          description: input.description.trim(),
          paymentMethod: input.paymentMethod,
          reference: input.reference?.trim() || null,
          warehouseId: input.warehouseId || null,
          recordedById: input.recordedById,
          expenseDate: input.expenseDate
            ? new Date(input.expenseDate)
            : new Date(),
          notes: input.notes?.trim() || null,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.recordedById,
          action: "RECORD_EXPENSE",
          entity: "Expense",
          entityId: expense.id,
          newValue: {
            expenseNumber,
            category: input.category,
            amount,
            description: input.description,
          },
        },
      });

      return expense;
    });
  }
}
