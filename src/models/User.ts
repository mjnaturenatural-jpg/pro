import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: "", trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["CUSTOMER", "ADMIN"], default: "CUSTOMER", index: true },
    address: {
      fullName: String,
      phone: String,
      email: String,
      line1: String,
      line2: String,
      area: String,
      city: String,
      state: String,
      pincode: String,
    },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1, role: 1 });

export type UserDoc = InferSchemaType<typeof UserSchema>;
export const User: Model<UserDoc> = models.User || model("User", UserSchema);
