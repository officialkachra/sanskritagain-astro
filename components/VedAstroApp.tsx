"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CircleDot,
  Clock3,
  Compass,
  Gem,
  MapPin,
  Moon,
  PackageCheck,
  Share2,
  Sparkles,
  Star,
  Sun,
  UserRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AstrologyReading, BirthDetails, Placement } from "@/lib/vedicAstrology";

const rashis = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"];
const westernSigns = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const nakshatras = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati"
];

const planets = [
  { key: "sun", label: "Sun", tone: "#d9945c", meaning: "your dharma, authority, and visible life-force" },
  { key: "moon", label: "Moon", tone: "#8fa7ff", meaning: "your inner weather, safety, memory, and devotion" },
  { key: "mars", label: "Mars", tone: "#df725c", meaning: "your courage, discipline, argument, and protection style" },
  { key: "mercury", label: "Mercury", tone: "#96b6a5", meaning: "your speech, trade, learning speed, and pattern recognition" },
  { key: "jupiter", label: "Jupiter", tone: "#c8b36d", meaning: "your guru principle, wisdom, faith, and expansion" },
  { key: "venus", label: "Venus", tone: "#daa4c7", meaning: "your taste, affection, pleasure, and refinement" },
  { key: "saturn", label: "Saturn", tone: "#7c8581", meaning: "your karma, patience, structure, and slow mastery" },
  { key: "rahu", label: "Rahu", tone: "#b391ff", meaning: "your hunger, innovation, obsession, and unfamiliar path" },
  { key: "ketu", label: "Ketu", tone: "#bfc7ca", meaning: "your detachment, past mastery, intuition, and release" }
];

const products = [
  {
    title: "Vishnu Sahasranama",
    tag: "Stability",
    text: "Best when Moon, Saturn, or Rahu pressure makes the mind restless. Read in the morning or before sleep for 11, 21, or 40 days.",
    why: "It builds sattva, steadies fear, and gives the chart a devotional anchor."
  },
  {
    title: "Sunderkand",
    tag: "Courage",
    text: "Recommended when Mars is weak, confidence is low, or work needs protection. Tuesday and Saturday readings work especially well.",
    why: "It supports sankalp, removes hesitation, and brings Hanuman bhakti into action."
  },
  {
    title: "Bhagavad Gita",
    tag: "Clarity",
    text: "Use when Mercury or Jupiter themes are active: career decisions, study, ethical confusion, or leadership.",
    why: "It turns chart insight into vivek, not fatalism."
  },
  {
    title: "Lakshmi Narayan Puja Kit",
    tag: "Prosperity",
    text: "Helpful when Venus, Jupiter, or second-house themes point toward family, wealth, and graceful routine.",
    why: "It connects abundance with discipline and gratitude."
  }
];

const navItems: Array<{ label: string; Icon: LucideIcon; href: string }> = [
  { label: "Ved", Icon: Star, href: "#ved" },
  { label: "Today", Icon: CalendarDays, href: "#today" },
  { label: "Products", Icon: PackageCheck, href: "#products" },
  { label: "Charts", Icon: CircleDot, href: "#charts" }
];

const houseTopics = [
  "self, body, confidence, and first impression",
  "money, speech, food habits, and family values",
  "courage, siblings, skills, and daily effort",
  "home, mother, property, and emotional foundation",
  "education, creativity, children, and mantra shakti",
  "health, routine, service, debt, and competition",
  "marriage, partnerships, contracts, and public dealing",
  "sudden change, research, inheritance, and hidden matters",
  "dharma, guru, father, luck, and higher learning",
  "career, karma, reputation, and public work",
  "income, network, gains, and long-term desires",
  "sleep, moksha, foreign lands, loss, and retreat"
];

function hashBirth(input: BirthDetails) {
  const joined = `${input.name}|${input.place}|${input.date}|${input.time}`;
  return [...joined].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 17), 0);
}

function wrapIndex(value: number, length: number) {
  return ((value % length) + length) % length;
}

function buildReading(input: BirthDetails): AstrologyReading {
  const seed = hashBirth(input);
  const date = input.date ? new Date(`${input.date}T${input.time || "12:00"}`) : new Date("1998-01-01T12:00");
  const daySignal = Math.floor(date.getTime() / 86400000);
  const ascendantIndex = wrapIndex(seed + (input.time ? Number(input.time.replace(":", "")) : 720), 12);
  const moonIndex = wrapIndex(daySignal + seed, 12);
  const nakshatraIndex = wrapIndex(Math.floor((daySignal * 13 + seed) / 5), nakshatras.length);

  const placements: Placement[] = planets.map((planet, index) => {
    const signIndex = wrapIndex(seed + daySignal * (index + 3) + index * 47, 12);
    return {
      label: planet.label,
      rashi: rashis[signIndex],
      sign: westernSigns[signIndex],
      house: wrapIndex(signIndex - ascendantIndex, 12) + 1,
      degree: wrapIndex(seed / (index + 2) + daySignal * (index + 1), 30),
      longitude: signIndex * 30 + wrapIndex(seed / (index + 2) + daySignal * (index + 1), 30),
      tone: planet.tone,
      meaning: planet.meaning,
      retrograde: index > 3 && wrapIndex(seed + index, 4) === 0
    };
  });

  const moonPlacement = placements.find((placement) => placement.label === "Moon") ?? placements[1];
  const guidePlanet = placements[wrapIndex(seed, placements.length)];
  const element = ["Agni", "Prithvi", "Vayu", "Jala"][wrapIndex(moonIndex, 4)];
  const focus = ["self-mastery", "relationships", "work rhythm", "wealth discipline", "learning", "devotion"][wrapIndex(seed, 6)];

  return {
    name: input.name,
    place: input.place,
    coordinates: {
      latitude: 23.1765,
      longitude: 75.7885,
      timezone: "Asia/Kolkata",
      source: "local preview"
    },
    engine: "sidereal-preview",
    note: "Preview chart shown until the server engine responds.",
    ascendant: rashis[ascendantIndex],
    ascendantWestern: westernSigns[ascendantIndex],
    moon: moonPlacement,
    nakshatra: nakshatras[nakshatraIndex],
    element,
    focus,
    guidePlanet,
    placements
  };
}

export default function VedAstroApp() {
  const [birth, setBirth] = useState<BirthDetails>({
    name: "",
    place: "",
    date: "",
    time: ""
  });
  const [submitted, setSubmitted] = useState<BirthDetails | null>(null);
  const [reading, setReading] = useState<AstrologyReading | null>(null);
  const [activeLens, setActiveLens] = useState("Self");
  const [openPlanet, setOpenPlanet] = useState("Moon");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const hasReading = Boolean(reading && submitted);

  function updateField(key: keyof BirthDetails, value: string) {
    setBirth((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const currentBirth: BirthDetails = {
      name: String(formData.get("name") ?? "").trim(),
      place: String(formData.get("place") ?? "").trim(),
      date: String(formData.get("date") ?? "").trim(),
      time: String(formData.get("time") ?? "").trim()
    };

    setBirth(currentBirth);
    setIsLoading(true);
    setError("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("/api/astro/chart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(currentBirth),
        signal: controller.signal
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Chart calculation failed.");
      }

      const nextReading = (await response.json()) as AstrologyReading;
      setSubmitted(currentBirth);
      setReading(nextReading);
      setOpenPlanet("Moon");
    } catch (submitError) {
      setSubmitted(null);
      setReading(null);
      setError(
        submitError instanceof DOMException && submitError.name === "AbortError"
          ? "Chart request timeout ho gaya. Birth place city/state/country format me likho, ya coordinates use karo: 23.1765, 75.7885."
          : submitError instanceof Error
            ? submitError.message
            : "Chart generate nahi hua. Please check DOB, time, and birth place."
      );
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050805] text-[#e9e1cf]">
      <header className="sticky top-0 z-30 border-b border-[#27261d] bg-[#050805]/95 px-5 py-5 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-[1780px] items-center justify-between gap-6">
          <a className="flex items-center gap-3" href="#ved" aria-label="SanskritAgain Astro">
            <Compass className="h-7 w-7 text-[#c7a83b]" />
            <span className="font-serif text-3xl tracking-[0.16em] text-[#eee7d7]">
              Sanskrit<span className="text-[#c7a83b]">Again</span>
            </span>
          </a>
          <nav className="hidden items-center gap-10 text-xs font-semibold uppercase tracking-[0.32em] text-[#7d7a70] md:flex">
            {navItems.map(({ label, href }) => (
              <a key={label} className="border-b border-transparent pb-2 transition hover:border-[#c7a83b] hover:text-[#e9e1cf]" href={href}>
                {label === "Products" ? "Recitations" : label === "Ved" ? "Chart" : label}
              </a>
            ))}
          </nav>
          <div className="flex border border-[#2a2a21] text-sm uppercase tracking-[0.18em]">
            <span className="bg-[#c7a83b] px-4 py-3 font-semibold text-[#070806]">EN</span>
            <span className="px-4 py-3 text-[#777268]">हिं</span>
          </div>
        </div>
      </header>

      <div>
        <section id="ved" className="mx-auto grid max-w-[1780px] gap-10 px-5 py-12 md:px-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:py-20">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,0.95fr)_520px] xl:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.38em] text-[#c7a83b]">Chart-based guidance</p>
              <h1 className="mt-8 max-w-4xl font-serif text-[clamp(3.8rem,8vw,9.5rem)] leading-[0.88] tracking-normal text-[#e9e1cf]">
                {hasReading && reading ? (
                  <>
                    Moon in <span className="italic text-[#aebcff]">{reading.moon.rashi}</span>
                  </>
                ) : (
                  <>
                    Enter birth details for a <span className="italic text-[#aebcff]">personal kundli.</span>
                  </>
                )}
              </h1>
              <p className="mt-8 max-w-2xl text-xl leading-9 text-[#8d897f]">
                {hasReading && reading && submitted
                  ? `${submitted.name} ka chart ${submitted.date} ${submitted.time} at ${submitted.place} se generate hua hai. Moon ${reading.moon.rashi} me hai, aur ${reading.guidePlanet.label} house H${reading.guidePlanet.house} par focus la raha hai.`
                  : "Har user apna naam, birthplace, DOB, aur birth time dalega. Tab Swiss Ephemeris se usi person ka chart aur house reading generate hogi."}
              </p>
            </div>

            <div>
              <OrbitChart ascendant={reading?.ascendant ?? "Lagna"} placements={reading?.placements ?? []} />
            </div>
          </div>

          <form className="h-fit border border-[#2b2a21] bg-[#090b08] p-5 shadow-[0_0_90px_rgba(199,168,59,0.06)] md:p-7" onSubmit={handleSubmit}>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#c7a83b]">Create your chart</p>
            <h2 className="mt-4 font-serif text-4xl text-[#e9e1cf]">Birth details</h2>
            <div className="mt-7 grid gap-4">
                <Field fieldName="name" icon={UserRound} label="Name" value={birth.name} onChange={(value) => updateField("name", value)} placeholder="Full name" />
                <Field fieldName="place" icon={MapPin} label="Birth place" value={birth.place} onChange={(value) => updateField("place", value)} placeholder="City, State, Country" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field fieldName="date" icon={CalendarDays} label="Date" value={birth.date} onChange={(value) => updateField("date", value)} placeholder="YYYY-MM-DD" type="date" />
                  <Field fieldName="time" icon={Clock3} label="Time" value={birth.time} onChange={(value) => updateField("time", value)} placeholder="HH:MM" type="time" />
                </div>
              </div>
              <button className="mt-7 flex w-full items-center justify-center gap-2 rounded-none bg-[#c7a83b] px-4 py-4 font-semibold uppercase tracking-[0.18em] text-[#070806] transition hover:bg-[#e6d186] disabled:cursor-wait disabled:opacity-70" type="submit" disabled={isLoading}>
                {isLoading ? "Calculating chart" : "Generate reading"} <ArrowRight className="h-4 w-4" />
              </button>
              {isLoading ? (
                <p className="mt-3 text-xs leading-6 text-[#aebcff]">Swiss Ephemeris se chart calculate ho raha hai. Usually 2-5 seconds lagte hain.</p>
              ) : null}
              <p className="mt-4 text-xs leading-6 text-[#777268]">
                {reading ? `Engine: ${reading.engine === "swiss-ephemeris" ? "Swiss Ephemeris" : "Sidereal fallback"}. Location: ${reading.coordinates.source}. ${reading.note}` : "No default chart is shown. Every result is generated from the details entered above."}
              </p>
              {error ? <p className="mt-3 text-xs leading-6 text-[#d9945c]">{error}</p> : null}
            </form>
          </section>

          {reading && submitted ? (
            <section className="mx-auto grid max-w-[1780px] gap-8 px-5 pb-12 md:px-10 xl:grid-cols-[420px_1fr]">
              <BirthCard name={submitted.name} moon={reading.moon.rashi} nakshatra={reading.nakshatra} />
              <div className="grid content-start gap-5">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: "Moon", value: reading.moon.rashi, Icon: Moon },
                    { label: "Nakshatra", value: reading.nakshatra, Icon: Star },
                    { label: "Ascendant", value: reading.ascendant, Icon: Sun }
                  ].map(({ label, value, Icon }) => (
                    <div key={label} className="border border-[#2b2a21] bg-[#090b08] p-5">
                      <Icon className="h-5 w-5 text-[#c7a83b]" />
                      <p className="mt-5 font-serif text-3xl text-[#e9e1cf]">{value}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#777268]">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="border border-[#2b2a21] bg-[#090b08] p-5 text-sm leading-7 text-[#aaa49a]">
                  <p>
                    <span className="font-semibold text-[#e9e1cf]">Generated for:</span> {submitted.name} / {submitted.place} / {submitted.date} / {submitted.time}
                  </p>
                  <p className="text-[#777268]">Note: name se kundli nahi badalti. Kundli DOB, exact birth time, aur birthplace se change hoti hai.</p>
                </div>
              </div>
            </section>
          ) : (
            <section className="mx-auto max-w-[1780px] px-5 pb-12 md:px-10">
              <div className="border border-[#2b2a21] bg-[#090b08] p-6 text-sm leading-7 text-[#8d897f]">
                <p className="font-semibold text-[#e9e1cf]">No sample kundli is loaded.</p>
                <p className="mt-2">Form submit karne ke baad hi kundli card, rashi map, planet list aur house-wise text reading dikhegi.</p>
                <p className="mt-2 text-[#777268]">Agar sirf naam badloge aur DOB/time/place same rakhega, chart same aayega. Astrology chart birth details se calculate hota hai.</p>
              </div>
            </section>
          )}

          <section id="charts" className="mx-auto grid max-w-[1780px] gap-8 px-5 pb-10 md:px-10 lg:grid-cols-[0.8fr_1fr]">
            <div className="border-y border-[#2b2a21] py-14">
              <p className="text-xs uppercase tracking-[0.34em] text-[#c7a83b]">Precise chart</p>
              <h2 className="mt-5 font-serif text-5xl leading-none text-[#e9e1cf] md:text-7xl">
                The kundli stays <span className="italic text-[#aebcff]">close.</span>
              </h2>
              <p className="mt-6 max-w-xl leading-7 text-[#8d897f]">
                Switch chart lenses, inspect placements, and keep Sanskritagain recommendations attached to the actual birth context.
              </p>
            </div>
            <div className="border-y border-[#2b2a21] py-14">
              <div className="mb-6 flex gap-2">
                {["Self", "Bonds", "Work"].map((lens) => (
                  <button
                    key={lens}
                    className={`border px-5 py-3 uppercase tracking-[0.14em] ${activeLens === lens ? "border-[#c7a83b] bg-[#171408] text-[#c7a83b]" : "border-[#2b2a21] text-[#777268]"}`}
                    type="button"
                    onClick={() => setActiveLens(lens)}
                  >
                    {lens}
                  </button>
                ))}
              </div>
              {reading ? <NorthIndianChart placements={reading.placements} lens={activeLens} /> : <EmptyChart />}
            </div>
          </section>

          {reading ? <HouseSummary reading={reading} /> : null}

          <section id="today" className="mx-auto max-w-[1780px] px-5 pb-10 md:px-10">
            <div className="border border-[#2b2a21] bg-[#090b08] p-6 md:p-10">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <p className="text-xs uppercase tracking-[0.34em] text-[#c7a83b]">Your planets</p>
                  <h2 className="mt-3 font-serif text-4xl text-[#e9e1cf]">Tap any grah to learn more</h2>
                </div>
                <p className="text-sm uppercase tracking-[0.22em] text-[#777268]">Rashi / House / Degree</p>
              </div>
              <div className="mt-8 divide-y divide-[#242319]">
                {(reading?.placements ?? []).map((placement) => (
                  <button
                    key={placement.label}
                    className="group grid w-full gap-3 py-5 text-left transition hover:bg-[#0f100b] md:grid-cols-[1fr_150px_80px_90px_28px] md:items-center"
                    type="button"
                    onClick={() => setOpenPlanet(openPlanet === placement.label ? "" : placement.label)}
                  >
                    <span>
                        <span className="font-serif text-xl text-[#e9e1cf]">
                        {placement.label} {placement.retrograde ? <span className="text-sm text-[#d9945c]">R</span> : null}
                      </span>
                      <span className="mt-1 block text-sm text-[#777268]">{placement.meaning}</span>
                      {openPlanet === placement.label ? (
                        <span className="mt-3 block max-w-2xl text-sm leading-6 text-[#aaa49a]">
                          {placement.label} in {placement.rashi} asks for a remedy that is repeatable, simple, and devotional. Keep the reading practical: one text, one time slot, one sankalp.
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[#aaa49a]">{placement.sign}</span>
                    <span className="text-[#aaa49a]">H{placement.house}</span>
                    <span className="flex items-center gap-2 text-[#aaa49a]">
                      <span className="h-2 w-2 rounded-full grah-pulse" style={{ backgroundColor: placement.tone }} />
                      {placement.degree.toFixed(1)}°
                    </span>
                    <ChevronDown className={`h-4 w-4 text-[#777268] transition ${openPlanet === placement.label ? "rotate-180" : ""}`} />
                  </button>
                ))}
                {!reading ? (
                  <div className="py-10 text-sm leading-7 text-[#777268]">
                    Fill the birth form and generate a chart. Planet placement text will appear here for that exact user.
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section id="products" className="mx-auto max-w-[1780px] px-5 pb-16 md:px-10">
            <div className="grid gap-6 lg:grid-cols-[0.75fr_1fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.34em] text-[#c7a83b]">Sanskritagain recommendations</p>
                <h2 className="mt-4 font-serif text-5xl leading-none text-[#e9e1cf]">
                  What to read, <span className="italic text-[#aebcff]">when and why.</span>
                </h2>
                <p className="mt-6 leading-7 text-[#8d897f]">
                  Product recommendations should feel like remedies with context, not random upsells. Each suggestion explains timing, reason, and the emotional state it supports.
                </p>
                <button className="mt-7 inline-flex items-center gap-2 border border-[#c7a83b] px-5 py-3 text-[#c7a83b]" type="button">
                  <Share2 className="h-4 w-4" />
                  Share identity
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {products.map((product) => (
                  <article key={product.title} className="border border-[#2b2a21] bg-[#090b08] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <Gem className="h-5 w-5 text-[#c7a83b]" />
                      <span className="text-xs uppercase tracking-[0.22em] text-[#aebcff]">{product.tag}</span>
                    </div>
                    <h3 className="mt-5 font-serif text-3xl text-[#e9e1cf]">{product.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#aaa49a]">{product.text}</p>
                    <p className="mt-4 border-t border-[#242319] pt-4 text-sm leading-6 text-[#777268]">{product.why}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
      </div>
    </main>
  );
}

function OrbitChart({ ascendant, placements }: { ascendant: string; placements: Placement[] }) {
  const movingPlanets = placements.length > 0 ? placements.slice(0, 7) : planets.slice(0, 7).map((planet, index) => ({ ...planet, degree: index * 47, label: planet.label }));

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden">
      <div className="absolute inset-2 rounded-full border border-[#26324d] bg-[radial-gradient(circle,#11120d_0_30%,#080b0a_31%_54%,#050805_55%)] shadow-[0_0_90px_rgba(94,117,178,0.18)]" />
      <div className="chakra-spin absolute inset-[5%] rounded-full border border-dashed border-[#c7a83b]/25" />
      {[0, 1, 2, 3].map((ring) => (
        <div
          key={ring}
          className="absolute rounded-full border border-[#2a3351]/80"
          style={{ inset: `${9 + ring * 10}%`, animation: `chakraBreath ${5 + ring}s ease-in-out infinite` }}
        />
      ))}
      {movingPlanets.map((placement, index) => {
        const longitude = "longitude" in placement ? placement.longitude : placement.degree;
        const angle = longitude - 90;
        const radius = 22 + (index % 4) * 7;
        const x = 50 + Math.cos((angle * Math.PI) / 180) * radius;
        const y = 50 + Math.sin((angle * Math.PI) / 180) * radius;
        return (
          <span
            key={placement.label}
            className="grah-float absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border bg-[#090b08] text-[10px] font-semibold shadow-[0_0_24px_rgba(199,168,59,0.18)]"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              borderColor: "tone" in placement ? placement.tone : "#c7a83b",
              color: "tone" in placement ? placement.tone : "#c7a83b",
              animationDelay: `${index * 0.22}s`
            }}
          >
            {placement.label.slice(0, 2)}
          </span>
        );
      })}
      {rashis.map((rashi, index) => {
        const angle = index * 30 - 90;
        const x = 50 + Math.cos((angle * Math.PI) / 180) * 43;
        const y = 50 + Math.sin((angle * Math.PI) / 180) * 43;
        return (
          <button
            key={rashi}
            className="absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#38372a] bg-[#080a07] text-xs text-[#d9d3c7] shadow-lg transition hover:border-[#c7a83b] hover:text-[#c7a83b]"
            style={{ left: `${x}%`, top: `${y}%` }}
            type="button"
            aria-label={`Explore ${rashi}`}
          >
            {rashi.slice(0, 2)}
          </button>
        );
      })}
      <div className="absolute left-1/2 top-1/2 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#c7a83b]/40 bg-[#070806] text-center shadow-[0_0_35px_rgba(199,168,59,0.12)]">
        <div>
          <Sparkles className="mx-auto h-5 w-5 text-[#c7a83b]" />
          <p className="mt-2 font-serif text-2xl text-[#e9e1cf]">{ascendant}</p>
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#c7a83b]">Lagna</p>
        </div>
      </div>
    </div>
  );
}

function HouseSummary({ reading }: { reading: AstrologyReading }) {
  const byHouse = Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    return {
      house,
      topic: houseTopics[index],
      placements: reading.placements.filter((placement) => placement.house === house)
    };
  });

  return (
    <section className="mx-auto max-w-[1780px] px-5 pb-10 md:px-10">
      <div className="border border-[#2b2a21] bg-[#090b08] p-6 md:p-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-[#c7a83b]">Clear house reading</p>
            <h2 className="mt-3 font-serif text-4xl text-[#e9e1cf]">Kis house me kya hai</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#777268]">
            Lagna is {reading.ascendant}. Houses are counted from the ascendant, so this is the user-specific house map.
          </p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {byHouse.map(({ house, topic, placements }) => (
            <article key={house} className="border border-[#242319] bg-[#060806] p-4 transition hover:border-[#c7a83b]/50">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-serif text-2xl text-[#e9e1cf]">House {house}</h3>
                <span className="border border-[#3c371f] px-2 py-1 text-xs text-[#c7a83b]">H{house}</span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#777268]">{topic}</p>
              {placements.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {placements.map((placement) => (
                    <p key={placement.label} className="text-sm leading-6 text-[#aaa49a]">
                      <span className="font-semibold text-[#e9e1cf]">{placement.label}</span>
                      {placement.retrograde ? <span className="text-[#d9945c]"> retrograde</span> : null} is in {placement.rashi} ({placement.sign}) at {placement.degree.toFixed(1)} degree.
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[#777268]">No major planet placed here. Judge this house through its rashi lord and aspects in the full reading.</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="mx-auto grid aspect-square w-full max-w-[430px] place-items-center border border-[#2b2a21] bg-[#090b08] p-8 text-center">
      <div>
        <CircleDot className="chakra-spin mx-auto h-8 w-8 text-[#c7a83b]" />
        <p className="mt-4 font-serif text-3xl text-[#e9e1cf]">Chart pending</p>
        <p className="mt-3 text-sm leading-6 text-[#777268]">Enter birth details to generate the kundli, house positions, and product recommendations.</p>
      </div>
    </div>
  );
}

function Field({
  fieldName,
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  fieldName: keyof BirthDetails;
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#aaa49a]">
        <Icon className="h-4 w-4 text-[#c7a83b]" />
        {label}
      </span>
      <input
        className="w-full rounded-none border border-[#2b2a21] bg-[#050805] px-3 py-3 text-[#e9e1cf] outline-none transition placeholder:text-[#59564d] focus:border-[#c7a83b]"
        data-testid={`birth-${fieldName}`}
        name={fieldName}
        placeholder={placeholder}
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function BirthCard({ name, moon, nakshatra }: { name: string; moon: string; nakshatra: string }) {
  return (
    <div className="relative aspect-[3/4] border-4 border-[#e7dfd0] bg-[#eee9dc] p-4 text-[#111710] shadow-2xl">
      <div className="birth-card-rays absolute inset-6 rounded-full opacity-30" />
      <div className="relative h-full border border-[#1f3150] p-5">
        <div className="grid h-full place-items-center border border-[#aeb7cc] text-center">
          <div>
            <div className="mx-auto grid h-44 w-44 place-items-center rounded-full border border-[#1f3150] bg-[#0c110d] text-[#eee9dc] shadow-[0_0_30px_rgba(31,49,80,0.2)]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.26em] text-[#c58f72]">Celestial identity</p>
                <p className="mt-3 font-serif text-3xl">{name || "Guest"}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#8da0ed]">Moon / {moon}</p>
              </div>
            </div>
            <div className="mt-12">
              <Star className="mx-auto h-9 w-9 text-[#1f3150]" />
              <p className="mt-4 font-serif text-2xl">{nakshatra}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#9a5c45]">Nakshatra</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NorthIndianChart({ placements, lens }: { placements: Placement[]; lens: string }) {
  const focusPlacement = placements.find((placement) => placement.house === (lens === "Self" ? 1 : lens === "Bonds" ? 7 : 10)) ?? placements[0];

  return (
    <div className="mx-auto grid aspect-square w-full max-w-[430px] place-items-center border border-[#2b2a21] bg-[#090b08]">
      <div className="relative aspect-square w-[82%] border border-[#35405f] shadow-[0_0_50px_rgba(94,117,178,0.08)]">
        <div className="absolute inset-0 rotate-45 border border-[#35405f]" />
        <div className="kundli-line absolute left-1/2 top-0 h-full w-px -translate-x-1/2 rotate-45 bg-[#35405f]" />
        <div className="kundli-line absolute left-1/2 top-0 h-full w-px -translate-x-1/2 -rotate-45 bg-[#35405f]" />
        {placements.slice(0, 8).map((placement, index) => {
          const spots = [
            ["50%", "11%"],
            ["79%", "25%"],
            ["83%", "61%"],
            ["59%", "82%"],
            ["25%", "78%"],
            ["13%", "53%"],
            ["21%", "24%"],
            ["50%", "48%"]
          ];
          return (
            <div
              key={placement.label}
              className="grah-float absolute -translate-x-1/2 -translate-y-1/2 text-center text-[11px]"
              style={{ left: spots[index][0], top: spots[index][1], color: placement.tone, animationDelay: `${index * 0.18}s` }}
            >
              <span className="block text-[#777268]">{placement.rashi.slice(0, 3)}</span>
              <span>{placement.label.slice(0, 2)}</span>
            </div>
          );
        })}
        <div className="absolute left-1/2 top-1/2 w-28 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#777268]">{lens}</p>
          <p className="mt-1 font-serif text-lg text-[#e9e1cf]">{focusPlacement.label}</p>
          <p className="text-xs text-[#c7a83b]">H{focusPlacement.house}</p>
        </div>
      </div>
    </div>
  );
}
