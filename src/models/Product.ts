import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const PackSizeSchema = new Schema(
  {
    label: { type: String, required: true },
    mrp: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, default: "" },
    weight: { type: String, default: "" },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    ingredients: { type: String, default: "" },
    allergenInfo: { type: String, default: "" },
    storageInstructions: { type: String, default: "" },
    howToUse: { type: String, default: "" },
    shippingInfo: { type: String, default: "" },
    returnInfo: { type: String, default: "" },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    images: { type: [String], required: true, validate: (v: string[]) => v.length > 0 },
    packSizes: { type: [PackSizeSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    badges: {
      pureGhee: { type: Boolean, default: false },
      noMaida: { type: Boolean, default: false },
      noAddedSugar: { type: Boolean, default: false },
    },
    featured: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: true, index: true },
    keywords: { type: [String], default: [] },
    totalSold: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", shortDescription: "text", keywords: "text" });
ProductSchema.index({ published: 1, featured: -1, createdAt: -1 });

export type PackSizeDoc = InferSchemaType<typeof PackSizeSchema>;
export type ProductDoc = InferSchemaType<typeof ProductSchema>;
export const Product: Model<ProductDoc> = models.Product || model("Product", ProductSchema);
