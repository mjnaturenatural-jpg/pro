import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const SiteSettingsSchema = new Schema(
  {
    key: { type: String, default: "site", unique: true },
    brandName: { type: String, default: "MJ Nature Naturals" },
    logo: { type: String, default: "" },
    favicon: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    address: { type: String, default: "" },
    instagram: { type: String, default: "" },
    facebook: { type: String, default: "" },
    youtube: { type: String, default: "" },
    announcementText: { type: String, default: "" },
    announcementEnabled: { type: Boolean, default: false },
    freeShippingThreshold: { type: Number, default: 999 },
    flatShipping: { type: Number, default: 79 },
    taxRate: { type: Number, default: 0 },
    gstNumber: { type: String, default: "" },
  },
  { timestamps: true }
);

export type SiteSettingsDoc = InferSchemaType<typeof SiteSettingsSchema>;
export const SiteSettings: Model<SiteSettingsDoc> =
  models.SiteSettings || model("SiteSettings", SiteSettingsSchema);
