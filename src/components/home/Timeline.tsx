"use client";

import { motion } from "framer-motion";
import { ChefHat, Leaf, Package, Truck } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";

const STEPS = [
  {
    step: "01",
    Icon: Leaf,
    title: "Ingredients Selected",
    body: "We start with ingredients we would happily use at home — pure ghee, real butter, original jaggery, millets and spices chosen for quality.",
  },
  {
    step: "02",
    Icon: ChefHat,
    title: "Made in Small Batches",
    body: "Each batch is prepared and cooked in our kitchen with attention to texture, taste and consistency.",
  },
  {
    step: "03",
    Icon: Package,
    title: "Packed Fresh",
    body: "Products are packed close to dispatch in food-safe packaging so freshness travels well to you.",
  },
  {
    step: "04",
    Icon: Truck,
    title: "Delivered With Care",
    body: "Orders are shipped to your doorstep with tracking, and we are here if you need anything after delivery.",
  },
];

export function Timeline() {
  return (
    <section className="bg-sand-100 py-16 sm:py-20">
      <div className="container-site">
        <SectionHeader
          eyebrow="How We Work"
          title="From Our Kitchen to Your Door"
          subtitle="Every order follows the same careful path — no shortcuts, no long warehouse waits."
          align="center"
        />
        <div className="relative">
          <motion.div
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute left-0 right-0 top-8 hidden border-t-2 border-dashed border-caramel-500/50 origin-left lg:block"
          />
          <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map(({ step, Icon, title, body }, i) => (
              <Reveal key={step} delay={i * 0.1}>
                <li className="relative rounded-3xl border border-bark-800/10 bg-ivory-100 p-6 pt-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <span className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-caramel-600 to-turmeric-500 text-white shadow-md shadow-caramel-600/30">
                    <Icon size={20} />
                  </span>
                  <span className="absolute right-5 top-5 font-serif text-2xl font-bold text-caramel-500/50">
                    {step}
                  </span>
                  <h3 className="text-sm font-bold text-bark-900">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-bark-500">{body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
