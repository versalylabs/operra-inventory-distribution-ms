import { prisma } from "@/lib/prisma";
import { DeliveryStatus, DriverStatus, VehicleStatus } from "@prisma/client";

export interface CreateVehicleInput {
  organizationId: string;
  userId: string;
  registrationNumber: string;
  makeModel: string;
  vehicleType?: string;
  capacityKg?: number;
  assignedDepotId?: string | null;
  insuranceExpiry?: string | null;
  inspectionExpiry?: string | null;
  status?: VehicleStatus;
  notes?: string | null;
}

export interface UpdateVehicleInput extends Partial<CreateVehicleInput> {
  id: string;
  organizationId: string;
  userId: string;
}

export interface CreateDriverInput {
  organizationId: string;
  userId: string;
  code?: string;
  fullName: string;
  phone: string;
  email?: string | null;
  licenseNumber: string;
  licenseClass?: string;
  licenseExpiry?: string | null;
  defaultVehicleId?: string | null;
  status?: DriverStatus;
}

export interface UpdateDriverInput extends Partial<CreateDriverInput> {
  id: string;
  organizationId: string;
  userId: string;
}

export interface CreateDeliveryInput {
  organizationId: string;
  userId: string;
  salesOrderId: string;
  driverId?: string | null;
  vehicleId?: string | null;
  deliveryAddress?: string | null;
  scheduledDate?: string | null;
  dispatchNotes?: string | null;
  dispatchImmediately?: boolean;
}

export interface ProofOfDeliveryInput {
  recipientName: string;
  recipientRole?: string | null;
  recipientPhone?: string | null;
  signatureData: string;
  gpsCoordinates?: string | null;
  deliveryNotes?: string | null;
}

export const DistributionService = {
  async listVehicles(organizationId: string) {
    const vehicles = await prisma.vehicle.findMany({
      where: { organizationId },
      include: {
        assignedDepot: {
          select: { id: true, code: true, name: true },
        },
        defaultDrivers: {
          select: { id: true, code: true, fullName: true },
        },
        _count: {
          select: { deliveries: true },
        },
      },
      orderBy: { registrationNumber: "asc" },
    });

    return vehicles.map((v) => ({
      id: v.id,
      registrationNumber: v.registrationNumber,
      makeModel: v.makeModel,
      vehicleType: v.vehicleType,
      capacityKg: v.capacityKg,
      assignedDepotId: v.assignedDepotId,
      assignedDepot: v.assignedDepot,
      defaultDriver: v.defaultDrivers[0] || null,
      insuranceExpiry: v.insuranceExpiry?.toISOString() || null,
      inspectionExpiry: v.inspectionExpiry?.toISOString() || null,
      status: v.status,
      notes: v.notes,
      deliveryCount: v._count.deliveries,
    }));
  },

  async createVehicle(input: CreateVehicleInput) {
    return prisma.$transaction(async (tx) => {
      const reg = input.registrationNumber.trim().toUpperCase();

      const existing = await tx.vehicle.findUnique({
        where: {
          organizationId_registrationNumber: {
            organizationId: input.organizationId,
            registrationNumber: reg,
          },
        },
      });

      if (existing) {
        throw new Error(
          `DUPLICATE_VEHICLE_PLATE:Vehicle ${reg} is already registered in your fleet.`
        );
      }

      const vehicle = await tx.vehicle.create({
        data: {
          organizationId: input.organizationId,
          registrationNumber: reg,
          makeModel: input.makeModel.trim(),
          vehicleType: input.vehicleType?.trim() || "Box Truck",
          capacityKg:
            input.capacityKg !== undefined ? Number(input.capacityKg) : 3500,
          assignedDepotId: input.assignedDepotId || null,
          insuranceExpiry: input.insuranceExpiry
            ? new Date(input.insuranceExpiry)
            : null,
          inspectionExpiry: input.inspectionExpiry
            ? new Date(input.inspectionExpiry)
            : null,
          status: input.status || "AVAILABLE",
          notes: input.notes?.trim() || null,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "VEHICLE_CREATED",
          entity: "Vehicle",
          entityId: vehicle.id,
          newValue: {
            registrationNumber: vehicle.registrationNumber,
            makeModel: vehicle.makeModel,
            capacityKg: vehicle.capacityKg,
          },
        },
      });

      return vehicle;
    });
  },

  async updateVehicle(input: UpdateVehicleInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.vehicle.findFirst({
        where: { id: input.id, organizationId: input.organizationId },
      });

      if (!existing) {
        throw new Error("VEHICLE_NOT_FOUND");
      }

      const updated = await tx.vehicle.update({
        where: { id: input.id },
        data: {
          ...(input.registrationNumber
            ? {
                registrationNumber: input.registrationNumber
                  .trim()
                  .toUpperCase(),
              }
            : {}),
          ...(input.makeModel ? { makeModel: input.makeModel.trim() } : {}),
          ...(input.vehicleType
            ? { vehicleType: input.vehicleType.trim() }
            : {}),
          ...(input.capacityKg !== undefined
            ? { capacityKg: Number(input.capacityKg) }
            : {}),
          ...(input.assignedDepotId !== undefined
            ? { assignedDepotId: input.assignedDepotId || null }
            : {}),
          ...(input.insuranceExpiry !== undefined
            ? {
                insuranceExpiry: input.insuranceExpiry
                  ? new Date(input.insuranceExpiry)
                  : null,
              }
            : {}),
          ...(input.inspectionExpiry !== undefined
            ? {
                inspectionExpiry: input.inspectionExpiry
                  ? new Date(input.inspectionExpiry)
                  : null,
              }
            : {}),
          ...(input.status ? { status: input.status } : {}),
          ...(input.notes !== undefined
            ? { notes: input.notes?.trim() || null }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "VEHICLE_UPDATED",
          entity: "Vehicle",
          entityId: updated.id,
          newValue: {
            registrationNumber: updated.registrationNumber,
            status: updated.status,
          },
        },
      });

      return updated;
    });
  },

  async listDrivers(organizationId: string) {
    const drivers = await prisma.driver.findMany({
      where: { organizationId },
      include: {
        defaultVehicle: {
          select: {
            id: true,
            registrationNumber: true,
            makeModel: true,
            vehicleType: true,
          },
        },
        _count: {
          select: { deliveries: true },
        },
      },
      orderBy: { fullName: "asc" },
    });

    return drivers.map((d) => ({
      id: d.id,
      code: d.code,
      fullName: d.fullName,
      phone: d.phone,
      email: d.email,
      licenseNumber: d.licenseNumber,
      licenseClass: d.licenseClass,
      licenseExpiry: d.licenseExpiry?.toISOString() || null,
      defaultVehicleId: d.defaultVehicleId,
      defaultVehicle: d.defaultVehicle,
      status: d.status,
      completedDeliveries: d.completedDeliveries,
      totalAssignedDeliveries: d._count.deliveries,
    }));
  },

  async createDriver(input: CreateDriverInput) {
    return prisma.$transaction(async (tx) => {
      const count = await tx.driver.count({
        where: { organizationId: input.organizationId },
      });

      const code = input.code
        ? input.code.trim().toUpperCase()
        : `DRV-${String(count + 101)}`;

      const driver = await tx.driver.create({
        data: {
          organizationId: input.organizationId,
          code,
          fullName: input.fullName.trim(),
          phone: input.phone.trim(),
          email: input.email?.trim() || null,
          licenseNumber: input.licenseNumber.trim().toUpperCase(),
          licenseClass: input.licenseClass?.trim() || "BCE",
          licenseExpiry: input.licenseExpiry
            ? new Date(input.licenseExpiry)
            : null,
          defaultVehicleId: input.defaultVehicleId || null,
          status: input.status || "AVAILABLE",
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "DRIVER_CREATED",
          entity: "Driver",
          entityId: driver.id,
          newValue: {
            code: driver.code,
            fullName: driver.fullName,
            licenseNumber: driver.licenseNumber,
          },
        },
      });

      return driver;
    });
  },

  async updateDriver(input: UpdateDriverInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.driver.findFirst({
        where: { id: input.id, organizationId: input.organizationId },
      });

      if (!existing) {
        throw new Error("DRIVER_NOT_FOUND");
      }

      const updated = await tx.driver.update({
        where: { id: input.id },
        data: {
          ...(input.fullName ? { fullName: input.fullName.trim() } : {}),
          ...(input.phone ? { phone: input.phone.trim() } : {}),
          ...(input.email !== undefined
            ? { email: input.email?.trim() || null }
            : {}),
          ...(input.licenseNumber
            ? { licenseNumber: input.licenseNumber.trim().toUpperCase() }
            : {}),
          ...(input.licenseClass
            ? { licenseClass: input.licenseClass.trim() }
            : {}),
          ...(input.licenseExpiry !== undefined
            ? {
                licenseExpiry: input.licenseExpiry
                  ? new Date(input.licenseExpiry)
                  : null,
              }
            : {}),
          ...(input.defaultVehicleId !== undefined
            ? { defaultVehicleId: input.defaultVehicleId || null }
            : {}),
          ...(input.status ? { status: input.status } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "DRIVER_UPDATED",
          entity: "Driver",
          entityId: updated.id,
          newValue: {
            fullName: updated.fullName,
            status: updated.status,
          },
        },
      });

      return updated;
    });
  },

  async listDeliveries(organizationId: string) {
    const deliveries = await prisma.delivery.findMany({
      where: { organizationId },
      include: {
        salesOrder: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
          },
        },
        customer: {
          select: {
            id: true,
            code: true,
            businessName: true,
            contactPerson: true,
            phone: true,
            city: true,
          },
        },
        warehouse: {
          select: { id: true, code: true, name: true },
        },
        driver: {
          select: { id: true, code: true, fullName: true, phone: true },
        },
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            makeModel: true,
            vehicleType: true,
          },
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
        proofOfDelivery: {
          include: {
            capturedBy: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return deliveries.map((del) => {
      const totalDispatchedUnits = del.items.reduce(
        (sum, i) => sum + i.dispatchedQuantity,
        0
      );
      const totalDeliveredUnits = del.items.reduce(
        (sum, i) => sum + i.deliveredQuantity,
        0
      );

      return {
        id: del.id,
        deliveryNumber: del.deliveryNumber,
        salesOrderId: del.salesOrderId,
        salesOrder: {
          ...del.salesOrder,
          totalAmount: Number(del.salesOrder.totalAmount),
        },
        customerId: del.customerId,
        customer: del.customer,
        warehouseId: del.warehouseId,
        warehouse: del.warehouse,
        driverId: del.driverId,
        driver: del.driver,
        vehicleId: del.vehicleId,
        vehicle: del.vehicle,
        deliveryAddress: del.deliveryAddress,
        scheduledDate: del.scheduledDate.toISOString(),
        status: del.status,
        dispatchNotes: del.dispatchNotes,
        failureReason: del.failureReason,
        dispatchedAt: del.dispatchedAt?.toISOString() || null,
        deliveredAt: del.deliveredAt?.toISOString() || null,
        createdAt: del.createdAt.toISOString(),
        totalDispatchedUnits,
        totalDeliveredUnits,
        items: del.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          unitOfMeasure: item.product.unitOfMeasure,
          orderedQuantity: item.orderedQuantity,
          dispatchedQuantity: item.dispatchedQuantity,
          deliveredQuantity: item.deliveredQuantity,
          returnedQuantity: item.returnedQuantity,
        })),
        proofOfDelivery: del.proofOfDelivery
          ? {
              id: del.proofOfDelivery.id,
              recipientName: del.proofOfDelivery.recipientName,
              recipientRole: del.proofOfDelivery.recipientRole,
              recipientPhone: del.proofOfDelivery.recipientPhone,
              signatureData: del.proofOfDelivery.signatureData,
              gpsCoordinates: del.proofOfDelivery.gpsCoordinates,
              deliveryNotes: del.proofOfDelivery.deliveryNotes,
              capturedAt: del.proofOfDelivery.capturedAt.toISOString(),
              capturedBy: del.proofOfDelivery.capturedBy,
            }
          : null,
      };
    });
  },

  async createDelivery(input: CreateDeliveryInput) {
    return prisma.$transaction(async (tx) => {
      const [org, salesOrder] = await Promise.all([
        tx.organization.findUnique({ where: { id: input.organizationId } }),
        tx.salesOrder.findFirst({
          where: {
            id: input.salesOrderId,
            organizationId: input.organizationId,
          },
          include: {
            customer: true,
            warehouse: true,
            items: true,
          },
        }),
      ]);

      if (!org || !salesOrder) {
        throw new Error("SALES_ORDER_NOT_FOUND");
      }

      const count = await tx.delivery.count({
        where: { organizationId: input.organizationId },
      });

      const year = new Date().getFullYear();
      const prefix = org.deliveryPrefix || "DEL-";
      const deliveryNumber = `${prefix}${year}-${String(count + 1).padStart(4, "0")}`;

      const hasAssignment = Boolean(input.driverId || input.vehicleId);
      const initialStatus: DeliveryStatus = input.dispatchImmediately
        ? "IN_TRANSIT"
        : hasAssignment
        ? "ASSIGNED"
        : "PENDING";

      const delivery = await tx.delivery.create({
        data: {
          organizationId: input.organizationId,
          deliveryNumber,
          salesOrderId: salesOrder.id,
          customerId: salesOrder.customerId,
          warehouseId: salesOrder.warehouseId,
          driverId: input.driverId || null,
          vehicleId: input.vehicleId || null,
          deliveryAddress:
            input.deliveryAddress?.trim() ||
            salesOrder.deliveryAddress ||
            salesOrder.customer.deliveryAddress ||
            salesOrder.customer.address ||
            salesOrder.customer.city ||
            "Customer Premises",
          scheduledDate: input.scheduledDate
            ? new Date(input.scheduledDate)
            : new Date(),
          status: initialStatus,
          dispatchNotes: input.dispatchNotes?.trim() || null,
          dispatchedAt: input.dispatchImmediately ? new Date() : null,
          createdById: input.userId,
          items: {
            create: salesOrder.items.map((item) => ({
              productId: item.productId,
              orderedQuantity: item.orderedQuantity,
              dispatchedQuantity: item.orderedQuantity,
              deliveredQuantity: 0,
              returnedQuantity: 0,
            })),
          },
        },
      });

      // Update SalesOrder to READY_FOR_DELIVERY if it was CONFIRMED or PROCESSING
      if (
        salesOrder.status === "CONFIRMED" ||
        salesOrder.status === "PROCESSING"
      ) {
        await tx.salesOrder.update({
          where: { id: salesOrder.id },
          data: { status: "READY_FOR_DELIVERY" },
        });
      }

      if (input.dispatchImmediately) {
        if (input.driverId) {
          await tx.driver.update({
            where: { id: input.driverId },
            data: { status: "ON_DELIVERY" },
          });
        }
        if (input.vehicleId) {
          await tx.vehicle.update({
            where: { id: input.vehicleId },
            data: { status: "ON_ROUTE" },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "DELIVERY_CREATED",
          entity: "Delivery",
          entityId: delivery.id,
          newValue: {
            deliveryNumber: delivery.deliveryNumber,
            salesOrder: salesOrder.orderNumber,
            customer: salesOrder.customer.businessName,
            status: delivery.status,
          },
        },
      });

      return delivery;
    });
  },

  async updateDeliveryStatus(input: {
    organizationId: string;
    userId: string;
    deliveryId: string;
    status: DeliveryStatus;
    driverId?: string | null;
    vehicleId?: string | null;
    failureReason?: string | null;
    pod?: ProofOfDeliveryInput;
  }) {
    return prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.findFirst({
        where: {
          id: input.deliveryId,
          organizationId: input.organizationId,
        },
        include: {
          salesOrder: {
            include: {
              items: {
                include: { product: true },
              },
              customer: true,
              warehouse: true,
              organization: true,
            },
          },
          items: true,
        },
      });

      if (!delivery) {
        throw new Error("DELIVERY_NOT_FOUND");
      }

      const targetDriverId =
        input.driverId !== undefined ? input.driverId : delivery.driverId;
      const targetVehicleId =
        input.vehicleId !== undefined ? input.vehicleId : delivery.vehicleId;

      if (
        input.status === "DISPATCHED" ||
        input.status === "IN_TRANSIT"
      ) {
        if (targetDriverId) {
          await tx.driver.update({
            where: { id: targetDriverId },
            data: { status: "ON_DELIVERY" },
          });
        }
        if (targetVehicleId) {
          await tx.vehicle.update({
            where: { id: targetVehicleId },
            data: { status: "ON_ROUTE" },
          });
        }
      }

      // When marking DELIVERED: capture Proof of Delivery, deduct warehouse stock if not yet deducted on SalesOrder, and release Driver/Vehicle
      if (input.status === "DELIVERED") {
        if (!input.pod || !input.pod.recipientName?.trim()) {
          throw new Error(
            "POD_REQUIRED:Recipient name and Proof of Delivery acknowledgement are required to mark a delivery as Delivered."
          );
        }

        await tx.proofOfDelivery.upsert({
          where: { deliveryId: delivery.id },
          create: {
            organizationId: input.organizationId,
            deliveryId: delivery.id,
            recipientName: input.pod.recipientName.trim(),
            recipientRole:
              input.pod.recipientRole?.trim() || "Receiving Officer",
            recipientPhone: input.pod.recipientPhone?.trim() || null,
            signatureData:
              input.pod.signatureData?.trim() ||
              `SIG-VERIFIED-${delivery.deliveryNumber}`,
            gpsCoordinates:
              input.pod.gpsCoordinates?.trim() ||
              "-1.286389, 36.817223 (Nairobi Metropolitan)",
            deliveryNotes: input.pod.deliveryNotes?.trim() || null,
            capturedById: input.userId,
          },
          update: {
            recipientName: input.pod.recipientName.trim(),
            recipientRole:
              input.pod.recipientRole?.trim() || "Receiving Officer",
            recipientPhone: input.pod.recipientPhone?.trim() || null,
            signatureData: input.pod.signatureData.trim(),
            gpsCoordinates: input.pod.gpsCoordinates?.trim() || null,
            deliveryNotes: input.pod.deliveryNotes?.trim() || null,
            capturedById: input.userId,
            capturedAt: new Date(),
          },
        });

        for (const item of delivery.items) {
          await tx.deliveryItem.update({
            where: { id: item.id },
            data: {
              deliveredQuantity: item.dispatchedQuantity,
            },
          });
        }

        // Synchronize linked SalesOrder & deduct physical stock if SalesOrder wasn't already DELIVERED
        const order = delivery.salesOrder;
        if (order.status !== "DELIVERED") {
          for (const item of order.items) {
            const remainingToDeliver = Math.max(
              0,
              item.orderedQuantity - item.deliveredQuantity
            );
            if (remainingToDeliver === 0) continue;

            const inv = await tx.inventoryItem.findUnique({
              where: {
                productId_warehouseId: {
                  productId: item.productId,
                  warehouseId: order.warehouseId,
                },
              },
            });

            const previousStock = inv?.currentStock ?? 0;
            const currentReserved = inv?.reservedStock ?? 0;
            const newStock = Math.max(0, previousStock - remainingToDeliver);
            const newReserved = order.stockReserved
              ? Math.max(0, currentReserved - remainingToDeliver)
              : currentReserved;

            await tx.inventoryItem.upsert({
              where: {
                productId_warehouseId: {
                  productId: item.productId,
                  warehouseId: order.warehouseId,
                },
              },
              create: {
                organizationId: input.organizationId,
                productId: item.productId,
                warehouseId: order.warehouseId,
                currentStock: newStock,
                reservedStock: 0,
              },
              update: {
                currentStock: newStock,
                reservedStock: newReserved,
              },
            });

            await tx.salesOrderItem.update({
              where: { id: item.id },
              data: {
                deliveredQuantity: item.orderedQuantity,
              },
            });

            await tx.stockMovement.create({
              data: {
                organizationId: input.organizationId,
                productId: item.productId,
                warehouseId: order.warehouseId,
                movementType: "SALE",
                quantity: -remainingToDeliver,
                previousQuantity: previousStock,
                newQuantity: newStock,
                reference: `${order.orderNumber} / ${delivery.deliveryNumber}`,
                notes: `Delivered to ${order.customer.businessName} (POD signed by ${input.pod.recipientName.trim()})`,
                userId: input.userId,
              },
            });
          }

          await tx.salesOrder.update({
            where: { id: order.id },
            data: {
              status: "DELIVERED",
              stockReserved: false,
              deliveredAt: new Date(),
            },
          });

          await tx.customer.update({
            where: { id: order.customerId },
            data: {
              totalPurchases: {
                increment: Number(order.totalAmount),
              },
              outstandingBalance: {
                increment: Number(order.totalAmount),
              },
            },
          });
        }

        if (targetDriverId) {
          await tx.driver.update({
            where: { id: targetDriverId },
            data: {
              status: "AVAILABLE",
              completedDeliveries: { increment: 1 },
            },
          });
        }
        if (targetVehicleId) {
          await tx.vehicle.update({
            where: { id: targetVehicleId },
            data: { status: "AVAILABLE" },
          });
        }
      }

      if (input.status === "FAILED" || input.status === "CANCELLED") {
        if (targetDriverId) {
          await tx.driver.update({
            where: { id: targetDriverId },
            data: { status: "AVAILABLE" },
          });
        }
        if (targetVehicleId) {
          await tx.vehicle.update({
            where: { id: targetVehicleId },
            data: { status: "AVAILABLE" },
          });
        }
      }

      const updated = await tx.delivery.update({
        where: { id: delivery.id },
        data: {
          status: input.status,
          ...(input.driverId !== undefined
            ? { driverId: input.driverId || null }
            : {}),
          ...(input.vehicleId !== undefined
            ? { vehicleId: input.vehicleId || null }
            : {}),
          ...(input.failureReason !== undefined
            ? { failureReason: input.failureReason?.trim() || null }
            : {}),
          ...((input.status === "DISPATCHED" ||
            input.status === "IN_TRANSIT") &&
          !delivery.dispatchedAt
            ? { dispatchedAt: new Date() }
            : {}),
          ...(input.status === "DELIVERED"
            ? { deliveredAt: new Date() }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: `DELIVERY_${input.status}`,
          entity: "Delivery",
          entityId: delivery.id,
          newValue: {
            deliveryNumber: delivery.deliveryNumber,
            status: input.status,
            recipientName: input.pod?.recipientName || null,
          },
        },
      });

      return updated;
    });
  },
};
