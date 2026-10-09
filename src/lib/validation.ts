import { z } from "zod";

export const packSizeSchema = z.object({
  label: z.string().min(1),
  mrp: z.number().min(0),
  price: z.number().min(0),
  stock: z.number().min(0).default(0),
  sku: z.string().optional().default(""),
  weight: z.string().optional().default(""),
});

export const productInputSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(220),
  shortDescription: z.string().max(500).optional().default(""),
  description: z.string().optional().default(""),
  ingredients: z.string().optional().default(""),
  allergenInfo: z.string().optional().default(""),
  storageInstructions: z.string().optional().default(""),
  howToUse: z.string().optional().default(""),
  shippingInfo: z.string().optional().default(""),
  returnInfo: z.string().optional().default(""),
  category: z.string().min(1),
  images: z.array(z.string().url()).min(1),
  packSizes: z.array(packSizeSchema).min(1),
  badges: z
    .object({
      pureGhee: z.boolean().default(false),
      noMaida: z.boolean().default(false),
      noAddedSugar: z.boolean().default(false),
    })
    .optional()
    .default({ pureGhee: false, noMaida: false, noAddedSugar: false }),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  keywords: z.array(z.string()).optional().default([]),
  weight: z.string().optional().default(""),
});

export const categoryInputSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(120),
  description: z.string().max(500).optional().default(""),
  image: z.string().optional().default(""),
  published: z.boolean().default(true),
});

export const addressSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => /^[6-9]\d{9}$/.test(v), "Enter a valid Indian phone number"),
  email: z.string().email(),
  line1: z.string().min(3).max(200).describe("Address"),
  line2: z.string().max(200).optional().default("").describe("Apartment / House / Floor"),
  area: z.string().min(2).max(200).describe("Area / Landmark"),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => /^[1-9]\d{5}$/.test(v), "Enter a valid pincode"),
});

export const couponInputSchema = z.object({
  code: z.string().min(3).max(30).transform((v) => v.toUpperCase().trim()),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().min(0),
  minOrder: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).optional().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  usageLimit: z.number().min(0).optional().nullable(),
  perUserLimit: z.number().min(1).optional().nullable(),
  active: z.boolean().default(true),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        packSize: z.string(),
        quantity: z.number().min(1).max(50),
      })
    )
    .min(1),
  address: addressSchema,
  couponCode: z.string().optional().nullable(),
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CouponInput = z.infer<typeof couponInputSchema>;
