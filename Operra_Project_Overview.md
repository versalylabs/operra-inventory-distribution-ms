# Operra — Inventory & Distribution Management System

## Product Overview

**Product Name:** Operra  
**Product Type:** Inventory & Distribution Management SaaS  
**Company:** Versaly  
**Target Market:** Small and medium-sized businesses involved in wholesale, distribution, retail, manufacturing, and product-based commerce.

### Product Vision

Operra is a modern inventory and distribution management platform designed to help businesses control their products, warehouses, purchasing, sales, deliveries, customers, suppliers, payments, and profitability from one centralized system.

The goal is to replace fragmented workflows involving spreadsheets, notebooks, WhatsApp messages, paper documents, and disconnected systems with one reliable operational platform.

Operra should feel like a professional business operating system rather than a basic inventory tracker.

---

# 1. Core Problem

Many growing businesses manage their operations across multiple disconnected tools:

- Excel/Google Sheets for inventory
- WhatsApp for orders
- Paper delivery notes
- Separate accounting software
- Manual stock calculations
- Manual payment tracking
- Phone calls for delivery coordination
- Multiple spreadsheets for customers and suppliers

This creates problems such as:

- Incorrect stock levels
- Stock losses
- Duplicate orders
- Forgotten customer balances
- Poor visibility across warehouses
- Difficult stock reconciliation
- Delayed deliveries
- Poor purchasing decisions
- Lack of profitability visibility
- Difficulty knowing which products are actually selling

Operra solves this by connecting the complete operational cycle.

---

# 2. Target Customers

## Primary Customers

Operra should initially target:

### Wholesalers
Businesses purchasing products in bulk and reselling them to retailers or other businesses.

### Distributors
Businesses distributing products to shops, agents, supermarkets, institutions, and other businesses.

### Retail Businesses
Businesses managing significant product inventories and multiple sales channels.

### Food & Beverage Businesses
Businesses distributing packaged food, beverages, and other consumables.

### Hardware & Building Material Businesses
Businesses dealing with large inventories and frequent customer orders.

### Electronics & Appliance Distributors
Businesses managing products, serial numbers, warranties, customers, and deliveries.

### Cosmetics & FMCG Businesses
Businesses with many SKUs, sales representatives, and recurring customers.

---

# 3. Product Positioning

Operra should not be positioned simply as:

> "Inventory software."

Position it as:

> **The operating system for product-based businesses.**

Alternative positioning:

> **Know your stock. Control your sales. Move your products.**

The system should connect:

```text
SUPPLIERS
    ↓
PURCHASING
    ↓
WAREHOUSE
    ↓
INVENTORY
    ↓
SALES ORDERS
    ↓
DELIVERY
    ↓
CUSTOMER
    ↓
PAYMENT
```

---

# 4. Core Product Modules

Operra will be developed in phases.

The major modules are:

1. Authentication & Organization Management
2. Dashboard
3. Product Management
4. Inventory Management
5. Warehouse Management
6. Supplier Management
7. Purchasing
8. Customer Management
9. Sales Orders
10. Distribution & Deliveries
11. Invoicing
12. Payments
13. Expenses
14. Stock Transfers
15. Stock Adjustments
16. Reports & Analytics
17. Notifications
18. User & Role Management
19. Activity & Audit Logs
20. Settings

Advanced modules can be added later.

---

# 5. Multi-Tenant Architecture

Operra should be designed as a SaaS application.

Each business is an organization/tenant.

Example:

```text
Operra
│
├── Organization A
│   ├── Users
│   ├── Products
│   ├── Warehouses
│   ├── Customers
│   └── Transactions
│
├── Organization B
│   ├── Users
│   ├── Products
│   ├── Warehouses
│   ├── Customers
│   └── Transactions
│
└── Organization C
    ├── Users
    ├── Products
    ├── Warehouses
    ├── Customers
    └── Transactions
```

Data must never leak between organizations.

Every organization should have:

- Organization profile
- Users
- Roles
- Products
- Warehouses
- Customers
- Suppliers
- Orders
- Deliveries
- Invoices
- Payments
- Reports
- Settings

---

# 6. User Roles

The system should support role-based access control.

Initial roles:

## Super Admin

Platform-level Versaly administrator.

Can:

- Manage organizations
- View platform statistics
- Manage subscriptions
- Manage system settings
- Manage organizations/users

## Organization Owner

Business owner.

Can:

- Access everything within their organization
- Manage users
- Configure business settings
- View reports
- Manage financial information

## Manager

Can:

- Manage inventory
- Manage products
- Manage purchasing
- Manage sales
- Manage customers
- Manage suppliers
- View reports

## Warehouse Staff

Can:

- View inventory
- Receive stock
- Pick orders
- Process transfers
- Perform stock counts
- Update warehouse operations

## Sales Staff

Can:

- Manage customers
- Create quotations
- Create sales orders
- View product availability
- Track customer balances

## Delivery Staff

Can:

- View assigned deliveries
- Update delivery status
- Record delivery confirmation
- Upload proof of delivery

Permissions should be configurable later.

---

# 7. Dashboard

The dashboard is the main operational overview.

It should provide a quick picture of the business.

## Key Metrics

Display:

- Total Inventory Value
- Total Products
- Low Stock Items
- Out of Stock Items
- Pending Orders
- Orders Today
- Pending Deliveries
- Outstanding Customer Balances
- Outstanding Supplier Balances
- Revenue
- Expenses
- Gross Profit

## Dashboard Charts

Include:

- Sales over time
- Top-selling products
- Revenue by category
- Stock value by category
- Sales by warehouse
- Customer sales
- Outstanding balances

Dashboard widgets should be configurable in future versions.

---

# 8. Product Management

Products are the foundation of the system.

Each product should support:

- Product name
- SKU
- Barcode
- Product description
- Category
- Brand
- Unit of measure
- Cost price
- Selling price
- Wholesale price
- Tax rate
- Minimum stock level
- Reorder level
- Maximum stock level
- Product image
- Status
- Supplier
- Warehouse availability

---

# 9. Product Categories

Businesses should be able to organize products into categories.

Example:

```text
Beverages
├── Soft Drinks
├── Juices
├── Water
└── Energy Drinks

Food
├── Snacks
├── Cereals
└── Canned Foods
```

Categories should support:

- Name
- Description
- Parent category
- Status

Support nested categories where appropriate.

---

# 10. Inventory Management

Inventory management should provide a complete view of stock.

Users should be able to see:

- Current stock
- Reserved stock
- Available stock
- Incoming stock
- Damaged stock
- Stock value
- Stock movement history

### Stock Formula

```text
Available Stock =
Current Stock
- Reserved Stock
```

The system must maintain an accurate stock ledger.

Every inventory change should create a stock movement record.

---

# 11. Stock Movement

Stock movements should include:

- Purchase receipt
- Sale
- Return
- Transfer
- Adjustment
- Damage
- Loss
- Opening balance

Each movement should record:

- Product
- Warehouse
- Quantity
- Previous quantity
- New quantity
- Movement type
- Reference
- User
- Date/time
- Notes

Stock movements should be immutable wherever possible.

Corrections should be made through adjustment transactions rather than silently editing historical records.

---

# 12. Warehouses

Businesses should be able to create multiple warehouses.

Each warehouse should have:

- Name
- Code
- Location
- Contact
- Manager
- Status

Products can have different stock quantities at each warehouse.

---

# 13. Stock Transfers

Users should be able to transfer stock between warehouses.

Workflow:

```text
Warehouse A
     ↓
Transfer Request
     ↓
Approval
     ↓
Dispatch
     ↓
In Transit
     ↓
Warehouse B
     ↓
Received
```

Transfer statuses:

- Draft
- Requested
- Approved
- Dispatched
- In Transit
- Received
- Cancelled

Every transfer should generate appropriate stock movements.

---

# 14. Stock Adjustments

Authorized users should be able to adjust stock.

Adjustment reasons may include:

- Damaged goods
- Lost goods
- Expired goods
- Stock count correction
- Opening balance
- Data correction

Every adjustment must require:

- Product
- Warehouse
- Quantity
- Reason
- User
- Date
- Optional notes

For sensitive adjustments, require manager approval.

---

# 15. Suppliers

Supplier management should include:

- Company name
- Contact person
- Phone
- Email
- Address
- Tax information
- Payment terms
- Credit limit
- Bank/payment details
- Products supplied
- Outstanding balance

Supplier profile should show:

- Total Purchases
- Outstanding Balance
- Purchase History
- Payment History
- Products Supplied

---

# 16. Purchasing

The purchasing workflow should support:

```text
Purchase Request
       ↓
Purchase Order
       ↓
Supplier
       ↓
Goods Received
       ↓
Stock Updated
       ↓
Supplier Invoice
       ↓
Payment
```

Purchase Orders should contain:

- Supplier
- Warehouse
- Products
- Quantities
- Unit cost
- Discounts
- Tax
- Total
- Expected delivery
- Notes
- Status

Statuses:

- Draft
- Pending Approval
- Approved
- Ordered
- Partially Received
- Received
- Cancelled

---

# 17. Goods Receiving

When goods arrive, warehouse staff should be able to record the actual received quantities.

Example:

```text
Ordered:
100 units

Received:
95 units

Damaged:
3 units

Missing:
2 units
```

The system should update stock based on the received quantity, not simply the ordered quantity.

---

# 18. Customers

Customer profiles should include:

- Business name
- Contact person
- Phone
- Email
- Address
- Customer type
- Credit limit
- Payment terms
- Sales representative
- Tax information
- Status

Customer profile should show:

- Total Purchases
- Outstanding Balance
- Orders
- Invoices
- Payments
- Deliveries

---

# 19. Customer Types

Allow configurable customer types such as:

- Retail
- Wholesale
- Distributor
- Corporate
- Individual

Pricing can later be linked to customer types.

---

# 20. Sales Orders

Sales workflow:

```text
Customer
   ↓
Sales Order
   ↓
Stock Reservation
   ↓
Picking
   ↓
Packing
   ↓
Delivery
   ↓
Invoice
   ↓
Payment
```

Sales orders should include:

- Customer
- Warehouse
- Salesperson
- Products
- Quantity
- Unit price
- Discount
- Tax
- Total
- Delivery information
- Notes

Statuses:

- Draft
- Confirmed
- Processing
- Ready for Delivery
- Partially Delivered
- Delivered
- Cancelled

---

# 21. Stock Reservation

When an order is confirmed, stock may be reserved.

Reserved stock should not be available for another order.

The system should prevent overselling unless an authorized setting allows negative inventory.

---

# 22. Distribution & Delivery

Delivery management is a major part of Operra.

Each delivery should contain:

- Delivery number
- Customer
- Sales order
- Driver
- Vehicle
- Delivery address
- Products
- Quantity
- Delivery date
- Notes
- Status

Statuses:

- Pending
- Assigned
- Dispatched
- In Transit
- Delivered
- Failed
- Cancelled

---

# 23. Proof of Delivery

Delivery staff should be able to capture:

- Recipient name
- Recipient signature
- Delivery timestamp
- Delivery notes
- Photo
- GPS coordinates (optional future feature)

The system should generate a proof-of-delivery record.

---

# 24. Invoicing

Invoices should be generated from sales orders.

Invoice should include:

- Business information
- Customer information
- Invoice number
- Invoice date
- Due date
- Products
- Quantity
- Price
- Discount
- Tax
- Total
- Amount paid
- Balance
- Payment status

Statuses:

- Draft
- Issued
- Partially Paid
- Paid
- Overdue
- Cancelled

---

# 25. Payments

Payment records should support:

- Cash
- M-Pesa
- Bank
- Card
- Other

Payment record:

- Payment Number
- Customer
- Invoice
- Amount
- Method
- Reference
- Date
- Recorded By
- Notes

M-Pesa integration should be designed as a future module rather than hardcoded into the core system.

---

# 26. Expenses

Businesses should be able to record operational expenses.

Examples:

- Transport
- Fuel
- Warehouse expenses
- Packaging
- Repairs
- Utilities
- Staff expenses
- Miscellaneous

Each expense should include:

- Category
- Amount
- Date
- Description
- Payment method
- Reference
- Attachment
- User

---

# 27. Reporting & Analytics

Reports should provide actionable information.

## Inventory Reports

- Current stock
- Stock valuation
- Low stock
- Out of stock
- Stock movement
- Stock adjustments
- Inventory aging

## Sales Reports

- Sales by day
- Sales by month
- Sales by product
- Sales by category
- Sales by customer
- Sales by salesperson
- Sales by warehouse

## Purchasing Reports

- Purchases by supplier
- Purchases by product
- Supplier balances
- Purchase history

## Distribution Reports

- Deliveries
- Failed deliveries
- Delivery performance
- Driver performance

## Financial Reports

- Revenue
- Expenses
- Customer receivables
- Supplier payables
- Gross profit

Reports should support date filtering and export where appropriate.

---

# 28. Profitability

Operra should eventually provide product-level profitability.

Example:

```text
Product:
Cooking Oil 1L

Cost:
KSh 180

Selling Price:
KSh 240

Gross Profit:
KSh 60

Margin:
25%
```

The system should support different cost calculation strategies in future versions.

Initial implementation may use a simple average cost model.

---

# 29. Low Stock Alerts

The system should automatically identify products approaching their reorder level.

Users should receive notifications through the application.

Future versions can support:

- Email
- SMS
- WhatsApp

---

# 30. Notifications

Create a centralized notification system.

Possible notifications:

- Low stock
- New order
- Order approved
- Delivery assigned
- Delivery completed
- Invoice overdue
- Payment received
- Purchase order approved
- Stock transfer received
- Supplier balance due

Notifications should be stored so users can review them later.

---

# 31. Search & Filtering

Search should be available throughout the system.

Users should be able to search:

- Products
- Customers
- Suppliers
- Orders
- Invoices
- Deliveries
- Purchase orders

Tables should support:

- Search
- Filters
- Sorting
- Pagination
- Date ranges
- Status filters

---

# 32. Documents

The system should eventually support document generation.

Documents include:

- Quotations
- Purchase orders
- Sales orders
- Invoices
- Delivery notes
- Receipts
- Transfer notes
- Proof of delivery

Documents should have professional printable layouts.

PDF generation can be added during later development.

---

# 33. Audit Logs

Important actions must be logged.

Examples:

```text
John changed product price
Mary created purchase order
Peter adjusted stock
Sarah approved sales order
```

Audit records should contain:

- User
- Action
- Entity
- Entity ID
- Timestamp
- Previous value where applicable
- New value where applicable

Audit logs should be accessible to authorized users.

---

# 34. Settings

Organization settings should include:

### Business

- Business name
- Logo
- Address
- Phone
- Email
- Tax information
- Currency
- Timezone

### Inventory

- Default warehouse
- Negative inventory rules
- Stock valuation method
- Reorder settings

### Sales

- Default payment terms
- Pricing settings
- Tax settings

### Documents

- Invoice numbering
- Order numbering
- Delivery numbering
- Document branding

### Users

- Roles
- Permissions

---

# 35. UI/UX Requirements

Operra should have a premium SaaS interface.

The interface should prioritize:

- Clarity
- Speed
- Consistency
- Data visibility
- Responsive design

The application should work well on:

- Desktop
- Laptop
- Tablet
- Mobile

Suggested navigation:

```text
Dashboard

Sales
  ├── Orders
  ├── Customers
  └── Invoices

Inventory
  ├── Products
  ├── Stock
  ├── Warehouses
  ├── Transfers
  └── Adjustments

Purchasing
  ├── Purchase Orders
  ├── Suppliers
  └── Receiving

Distribution
  ├── Deliveries
  ├── Drivers
  └── Vehicles

Finance
  ├── Payments
  └── Expenses

Reports

Notifications

Settings
```

---

# 36. Dashboard Design Principles

Avoid filling the dashboard with unnecessary charts.

Prioritize information that helps the user make decisions.

The first screen should answer:

1. How much am I selling?
2. How much stock do I have?
3. What is running low?
4. What orders need attention?
5. What deliveries need attention?
6. Who owes me money?
7. What do I owe suppliers?
8. How is the business performing?

---

# 37. Mobile Considerations

Warehouse and delivery staff may primarily use mobile devices.

Mobile interfaces should prioritize:

- Stock lookup
- Order lookup
- Delivery status
- Proof of delivery
- Customer lookup
- Barcode scanning
- Quick stock actions

A dedicated native mobile application is not required initially.

The web application should be responsive/PWA-ready.

---

# 38. Barcode Support

The architecture should allow barcode support.

Future functionality:

- Scan product
- Find product
- Add product to order
- Receive stock
- Perform stock counts
- Transfer stock

Barcode scanning should be implemented after the core inventory system is stable.

---

# 39. M-Pesa Integration

M-Pesa is important for the Kenyan market.

However, the initial architecture should abstract payment providers.

Create a payment layer that can eventually support:

```text
Payment Provider
├── M-Pesa
├── Bank
├── Card
└── Cash
```

Future M-Pesa functionality may include:

- STK Push
- Payment confirmation
- Automatic invoice settlement
- Payment reconciliation

Do not make the core application dependent on M-Pesa.

---

# 40. Security Requirements

Security is a core requirement.

Implement:

- Secure authentication
- Password hashing
- Session management
- Role-based authorization
- Tenant isolation
- Server-side validation
- Input sanitization
- CSRF protection where applicable
- Secure file handling
- Rate limiting where appropriate
- Audit logs
- Secure environment variables

Never expose sensitive organization data between tenants.

---

# 41. Data Integrity

Inventory is highly sensitive to data corruption.

The system must prioritize transaction integrity.

For stock-affecting operations:

```text
BEGIN TRANSACTION

Create transaction
Update inventory
Create stock movement
Update related records

COMMIT
```

If any part fails, the entire operation should roll back.

Avoid directly manipulating stock quantities from multiple unrelated parts of the application.

Create centralized inventory services/functions for stock operations.

---

# 42. Recommended Architecture

The coding agent may choose the exact implementation architecture, but the application should follow a clean modular structure.

Suggested conceptual architecture:

```text
Frontend
   ↓
API / Server Actions
   ↓
Business Logic
   ↓
Database
```

Business logic should be separated from UI components.

Examples:

```text
InventoryService
OrderService
PurchaseService
PaymentService
DeliveryService
NotificationService
ReportingService
```

The exact architecture may be adapted by the coding agent based on the selected technology stack.

---

# 43. Recommended Technology Direction

Operra should be built as a modern web application.

Preferred characteristics:

- Modern frontend framework
- Type-safe development where practical
- Relational database
- ORM
- Responsive UI
- API-ready architecture
- Cloud deployment
- Environment-based configuration

The application should be deployable to Vercel or an equivalent modern cloud platform.

Database architecture should be suitable for production rather than relying on SQLite for the final deployment.

---

# 44. SaaS Readiness

Operra should eventually support subscription plans.

Possible plans:

### Starter
For small businesses.

### Business
For growing businesses.

### Professional
For distributors with multiple warehouses and users.

### Enterprise
Custom pricing.

Potential limits:

- Users
- Warehouses
- Products
- Orders
- Storage
- Reports
- Integrations

The initial development should prepare the architecture for this but should not allow subscription billing to complicate the core MVP.

---

# 45. Future Integrations

Potential integrations:

- M-Pesa
- WhatsApp
- Email
- SMS
- Accounting software
- Payment gateways
- Barcode scanners
- Google Maps
- E-commerce platforms
- POS systems

These should be treated as modular integrations.

---

# 46. Future Advanced Features

Potential future features include:

### AI Sales Forecasting
Predict future product demand.

### Automated Reordering
Automatically recommend or generate purchase orders based on sales velocity.

### Route Optimization
Optimize delivery routes.

### Customer Portal
Customers can:

- View orders
- View invoices
- Pay invoices
- Track deliveries
- Download documents

### Supplier Portal
Suppliers can:

- Receive purchase orders
- Confirm orders
- Update delivery status

### Sales Representative App
Sales agents can:

- View customers
- Create orders
- Check stock
- Track commissions
- Record customer visits

### Offline Mode
Useful for warehouse and field teams with unreliable internet.

---

# 47. MVP Scope

The first production MVP should NOT attempt to build every feature described above.

The MVP should focus on the operational core:

```text
Authentication
      ↓
Organization
      ↓
Products
      ↓
Warehouses
      ↓
Inventory
      ↓
Customers
      ↓
Suppliers
      ↓
Purchasing
      ↓
Sales Orders
      ↓
Stock Movements
      ↓
Basic Deliveries
      ↓
Basic Payments
      ↓
Dashboard
```

### MVP Must Have

- Authentication
- Organization setup
- User roles
- Dashboard
- Product management
- Categories
- Warehouses
- Inventory
- Stock movements
- Stock adjustments
- Stock transfers
- Suppliers
- Purchase orders
- Goods receiving
- Customers
- Sales orders
- Stock reservation
- Basic deliveries
- Invoices
- Payments
- Basic reports
- Notifications
- Audit logs
- Settings

---

# 48. Development Philosophy

Operra should be built incrementally.

Do not attempt to build the entire system in one phase.

Each phase should:

1. Build a coherent feature group
2. Connect it to existing functionality
3. Test the feature
4. Fix issues
5. Ensure existing features still work
6. Leave the application in a usable state

Avoid creating placeholder functionality that appears complete but does not actually work.

Prefer working functionality over visual complexity.

---

# 49. Suggested Development Phases

## Phase 1 — Foundation

- Project setup
- Database
- Authentication
- Organization model
- User model
- Roles
- Basic application shell
- Navigation
- UI foundation

## Phase 2 — Product & Category Management

- Products
- Categories
- SKUs
- Pricing
- Product images
- Product search

## Phase 3 — Warehouses & Inventory

- Warehouses
- Inventory records
- Stock movements
- Stock adjustments
- Stock calculations
- Inventory dashboard

## Phase 4 — Suppliers & Purchasing

- Suppliers
- Purchase orders
- Purchase order workflow
- Goods receiving
- Supplier balances

## Phase 5 — Customers & Sales

- Customers
- Sales orders
- Pricing
- Stock reservation
- Order workflow

## Phase 6 — Distribution

- Deliveries
- Delivery assignments
- Delivery status
- Delivery notes
- Proof of delivery

## Phase 7 — Invoicing & Payments

- Invoices
- Receipts
- Payments
- Customer balances
- Payment history

## Phase 8 — Transfers & Advanced Inventory

- Warehouse transfers
- Transfer workflow
- Stock reconciliation
- Inventory valuation
- Low-stock alerts

## Phase 9 — Reports & Analytics

- Sales reports
- Inventory reports
- Purchasing reports
- Customer reports
- Supplier reports
- Financial summaries

## Phase 10 — Notifications & Automation

- In-app notifications
- Automated alerts
- Low-stock notifications
- Overdue invoice notifications
- Order notifications

## Phase 11 — Security & Production Hardening

- Permission review
- Tenant isolation testing
- Validation
- Audit logs
- Error handling
- Performance
- Security review

## Phase 12 — Deployment

- Production database
- Environment variables
- Deployment
- Domain configuration
- Production testing
- Backup strategy
- Monitoring
- Error tracking

## Phase 13 — SaaS & Commercialization

- Subscription plans
- Usage limits
- Billing
- Trial period
- Organization onboarding
- Subscription management

---

# 50. Seed/Demo Data

Development should include realistic demo data.

Example organization:

**Acme Distributors Ltd**

### Warehouses

- Nairobi Main
- Industrial Area Depot
- Mombasa Warehouse

### Product Categories

- Beverages
- Food
- Household
- Personal Care
- Electronics

### Products

At least 20 realistic products.

### Customers

At least 10 customers.

### Suppliers

At least 5 suppliers.

### Transactions

Include:

- Purchase orders
- Stock receipts
- Sales orders
- Deliveries
- Invoices
- Payments
- Stock transfers

The dashboard should look meaningful immediately after installation.

---

# 51. Demo Scenario

The system should support this complete demonstration:

```text
1. Admin creates warehouse
2. Admin creates supplier
3. Admin creates products
4. User creates purchase order
5. Warehouse receives stock
6. Inventory increases
7. Salesperson creates customer
8. Salesperson creates sales order
9. Stock becomes reserved
10. Warehouse processes order
11. Delivery is created
12. Driver marks delivery as delivered
13. Invoice is generated
14. Customer payment is recorded
15. Customer balance updates
16. Dashboard updates
17. Reports reflect the transaction
```

This end-to-end flow should work reliably before advanced features are introduced.

---

# 52. Design Direction

Operra should feel:

- Premium
- Professional
- Modern
- Reliable
- Operational
- Data-driven
- Simple

Avoid:

- Overly colorful dashboards
- Excessive gradients
- Excessive animations
- Unnecessary charts
- Cluttered tables
- Consumer-app styling

The product should look appropriate for a business owner managing significant inventory value.

---

# 53. Versaly Branding

Operra is a product of **Versaly**.

The product should have its own identity while maintaining a connection to Versaly.

Possible branding structure:

```text
VERSALY
   presents

OPERRA

Inventory & Distribution Management
```

The interface should allow future Versaly products to share common design patterns.

---

# 54. Success Criteria

Operra will be considered successful when a real business can use it to manage the majority of its daily product operations without needing separate spreadsheets.

A user should be able to answer:

> How much stock do I have?

> Where is that stock?

> What did I buy?

> Who supplied it?

> What have I sold?

> Who bought it?

> What has been delivered?

> Who owes me money?

> What do I owe suppliers?

> Which products are running low?

> Which products make the most money?

> How is the business performing?

All of these answers should be available from the system.

---

# 55. Long-Term Vision

Operra should eventually become more than an inventory application.

The long-term vision is:

> **A complete operating platform for product-based businesses.**

Potential final ecosystem:

```text
                    OPERRA
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
    INVENTORY       SALES       PURCHASING
        │             │             │
        └─────────────┼─────────────┘
                      ↓
                 DISTRIBUTION
                      │
           ┌──────────┼──────────┐
           ↓          ↓          ↓
        FINANCE     REPORTS     CRM
           │
           ↓
        PAYMENTS
           │
           ↓
      M-PESA / BANK
```

The system should be designed so additional modules can be introduced without rebuilding the foundation.

---

# 56. Important Instructions for the Development Agent

When implementing Operra:

1. Read this entire specification before beginning development.
2. Do not attempt to build all phases simultaneously.
3. Work only on the current development phase provided.
4. Inspect the existing codebase before making architectural decisions.
5. Preserve existing functionality when adding new features.
6. Use clean, maintainable architecture.
7. Avoid unnecessary dependencies.
8. Do not create fake functionality merely to make a screen appear complete.
9. All important actions should actually persist to the database.
10. Validate data on the server side.
11. Protect tenant data rigorously.
12. Use database transactions for stock-affecting operations.
13. Do not silently modify historical inventory movements.
14. Use realistic demo data during development.
15. Make the UI responsive.
16. Handle loading, empty, success, and error states.
17. Do not over-engineer features that are not required for the current phase.
18. When a requirement is ambiguous, choose a sensible production-ready implementation rather than stopping unnecessarily.
19. Leave room for future integrations such as M-Pesa, WhatsApp, SMS, and accounting systems.
20. At the end of every phase, verify that the application runs successfully and that existing functionality has not been broken.

---

# Final Product Goal

Operra should become a polished, commercially viable Inventory & Distribution Management platform that Versaly can demonstrate to a real wholesaler, distributor, retailer, manufacturer, or product-based business.

The goal is not simply to create an inventory CRUD application.

The goal is to create a **real business operating system** that manages the flow of products, money, orders, and information from supplier to warehouse to customer.

**Built by Versaly.**
