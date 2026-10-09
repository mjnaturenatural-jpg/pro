import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const NewsletterSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    subscribed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type NewsletterDoc = InferSchemaType<typeof NewsletterSchema>;
export const NewsletterSubscriber: Model<NewsletterDoc> =
  models.NewsletterSubscriber || model("NewsletterSubscriber", NewsletterSchema);
