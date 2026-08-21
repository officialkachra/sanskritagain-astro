import type { Metadata } from "next";
import VedAstroApp from "@/components/VedAstroApp";

export const metadata: Metadata = {
  title: "Sanskritagain Astro",
  description: "A Sanskritagain Vedic astrology experience with birth-chart guidance and spiritual product recommendations."
};

export default function VedPage() {
  return <VedAstroApp />;
}
