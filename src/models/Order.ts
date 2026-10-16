import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    packSize: { type: String, required: true },
    sku: { type: String, default: "" },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true, index: true },
      phone: { type: String, required: true },
    },
    address: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String, default: "" },
      area: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    items: { type: [OrderItemSchema], required: true },
    couponCode: { type: String, default: null },
    couponDiscount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    // Expected payment currency; matches the Razorpay order created for it.
    currency: { type: String, default: "INR" },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    paymentMethod: { type: String, default: "RAZORPAY" },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    paidAt: { type: Date, default: null },
    lastReconciledAt: { type: Date, default: null },
    accessToken: { type: String, default: "", index: true },
    webhookEvents: { type: [String], default: [] },
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "REFUNDED",
      ],
      default: "PENDING",
      index: true,
    },
    shippingProvider: { type: String, default: "" },
    // Shiprocket identifiers (server-generated; never trusted from the client).
    shiprocketOrderId: { type: String, default: "" },
    shiprocketShipmentId: { type: String, default: "" },
    awb: { type: String, default: "" },
    trackingUrl: { type: String, default: "" },
    labelUrl: { type: String, default: "" },
    manifestUrl: { type: String, default: "" },
    shipmentStatus: { type: String, default: "" },
    // Last shipping error surfaced to admin; cleared on the next success.
    shipmentError: { type: String, default: "" },
    shipmentCreatedAt: { type: Date, default: null },
    shipmentUpdatedAt: { type: Date, default: null },
    shipmentHistory: [
      {
        status: String,
        location: String,
        timestamp: Date,
        _id: false,
      },
    ],
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "customer.email": 1, createdAt: -1 });
// Payment identifiers are unique per order and unique across orders. Partial
// filters keep legacy/COD orders (empty strings) out of the unique constraint.
OrderSchema.index(
  { razorpayOrderId: 1 },
  { unique: true, partialFilterExpression: { razorpayOrderId: { $gt: "" } } }
);
OrderSchema.index(
  { razorpayPaymentId: 1 },
  { unique: true, partialFilterExpression: { razorpayPaymentId: { $gt: "" } } }
);
// A Shiprocket shipment/AWB belongs to exactly one order. Partial filters keep
// unpaid/legacy orders (empty strings) out of the unique constraint.
OrderSchema.index(
  { shiprocketShipmentId: 1 },
  { unique: true, partialFilterExpression: { shiprocketShipmentId: { $gt: "" } } }
);
OrderSchema.index({ awb: 1 }, { unique: true, partialFilterExpression: { awb: { $gt: "" } } });

export type OrderDoc = InferSchemaType<typeof OrderSchema>;
export const Order: Model<OrderDoc> = models.Order || model("Order", OrderSchema);
