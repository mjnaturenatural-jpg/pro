import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const HeroSchema = new Schema(
  {
    eyebrow: { type: String, default: "MJ NATURE NATURALS" },
    headline: { type: String, default: "Naturally made. Thoughtfully crafted." },
    subheading: {
      type: String,
      default:
        "Discover thoughtfully crafted natural foods made with carefully selected ingredients — for everyday moments that deserve a little more care.",
    },
    ctaText: { type: String, default: "Shop Now" },
    ctaHref: { type: String, default: "/shop" },
    secondaryCtaText: { type: String, default: "Explore Our Products" },
    secondaryCtaHref: { type: String, default: "/shop" },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const StorySchema = new Schema(
  {
    title: { type: String, default: "Rooted in nature, made with care" },
    body: {
      type: String,
      default:
        "MJ Nature Naturals is a premium natural food brand crafting wholesome treats from thoughtfully selected ingredients. Every batch is prepared with care, so what reaches your table feels honest, flavourful and familiar.",
    },
    image: { type: String, default: "" },
    ctaText: { type: String, default: "Discover Our Story" },
    ctaHref: { type: String, default: "/about" },
  },
  { _id: false }
);

const HighlightSchema = new Schema(
  {
    title: { type: String, default: "Made for everyday indulgence" },
    body: {
      type: String,
      default:
        "From soft jaggery laddus to rich millet cookies, our range is designed for the moments you want to slow down and savour.",
    },
    image: { type: String, default: "" },
    productName: { type: String, default: "" },
    productSlug: { type: String, default: "" },
    ctaText: { type: String, default: "Explore Product" },
  },
  { _id: false }
);

const TrustPointSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const WhyPointSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const TestimonialSchema = new Schema(
  {
    name: { type: String, required: true },
    location: { type: String, default: "" },
    quote: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
  },
  { _id: false }
);

const NewsletterSectionSchema = new Schema(
  {
    title: { type: String, default: "Stay in the loop" },
    body: {
      type: String,
      default: "Be the first to hear about new launches, seasonal specials and offers.",
    },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const HomepageContentSchema = new Schema(
  {
    key: { type: String, default: "homepage", unique: true },
    hero: { type: HeroSchema, default: () => ({}) },
    trustPoints: {
      type: [TrustPointSchema],
      default: [
        { title: "Natural Ingredients", description: "Thoughtfully selected ingredients in every recipe." },
        { title: "Made With Care", description: "Small-batch preparation with attention to detail." },
        { title: "Premium Quality", description: "A finish and texture that feels genuinely premium." },
        { title: "Secure Payments", description: "Safe and encrypted checkout every time." },
      ],
    },
    featuredProductSlugs: { type: [String], default: [] },
    story: { type: StorySchema, default: () => ({}) },
    highlight: { type: HighlightSchema, default: () => ({}) },
    whyPoints: {
      type: [WhyPointSchema],
      default: [
        { title: "Thoughtfully Selected Ingredients", description: "We start with ingredients we would happily use at home." },
        { title: "Made With Care", description: "Each batch is prepared and packed with care." },
        { title: "Freshly Packed", description: "Packed close to dispatch so freshness travels well." },
        { title: "Delivered To Your Door", description: "Carefully packed and shipped to your doorstep." },
      ],
    },
    testimonials: { type: [TestimonialSchema], default: [] },
    testimonialsEnabled: { type: Boolean, default: false },
    newsletter: { type: NewsletterSectionSchema, default: () => ({}) },
    instagramUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export type HomepageContentDoc = InferSchemaType<typeof HomepageContentSchema>;
export const HomepageContent: Model<HomepageContentDoc> =
  models.HomepageContent || model("HomepageContent", HomepageContentSchema);
