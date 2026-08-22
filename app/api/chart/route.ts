import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateVedicChart, type Placement } from "@/lib/vedicAstrology";

export const runtime = "nodejs";
export const maxDuration = 10;

const rashis = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"];

const planetNames: Record<string, { key: string; dev: string }> = {
  Sun: { key: "Surya", dev: "सू" },
  Moon: { key: "Chandra", dev: "चं" },
  Mars: { key: "Mangal", dev: "मं" },
  Mercury: { key: "Budh", dev: "बु" },
  Jupiter: { key: "Guru", dev: "गु" },
  Venus: { key: "Shukra", dev: "शु" },
  Saturn: { key: "Shani", dev: "श" },
  Rahu: { key: "Rahu", dev: "रा" },
  Ketu: { key: "Ketu", dev: "के" }
};

const chartRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional().default("12:00"),
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  tz: z.coerce.number().min(-12).max(14).optional().default(5.5),
  concern: z.string().optional()
});

function rashiNumber(rashi: string) {
  return Math.max(0, rashis.indexOf(rashi));
}

function toGraha(placement: Placement) {
  const mapped = planetNames[placement.label] ?? { key: placement.label, dev: placement.label.slice(0, 2) };

  return {
    key: mapped.key,
    lon: Number(placement.longitude.toFixed(4)),
    dev: mapped.dev,
    rashi: rashiNumber(placement.rashi),
    house: placement.house,
    retro: placement.retrograde
  };
}

function buildHeadline(planets: ReturnType<typeof toGraha>[]) {
  const priority = ["Shani", "Mangal", "Guru", "Chandra", "Rahu"];
  const selected = priority.map((key) => planets.find((planet) => planet.key === key)).find(Boolean) ?? planets[0];
  const ordinal = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
  const hiOrdinal = ["पहले", "दूसरे", "तीसरे", "चौथे", "पाँचवें", "छठे", "सातवें", "आठवें", "नवें", "दसवें", "ग्यारहवें", "बारहवें"];
  const englishName = selected.key === "Shani" ? "Saturn" : selected.key === "Mangal" ? "Mars" : selected.key === "Guru" ? "Jupiter" : selected.key;

  return {
    en: [`${englishName} sits in your`, `${ordinal[selected.house - 1]} house.`],
    hi: [`${selected.key} आपके ${hiOrdinal[selected.house - 1]}`, "भाव में बैठा है।"]
  };
}

function buildRecommendations(planets: ReturnType<typeof toGraha>[]) {
  const byKey = Object.fromEntries(planets.map((planet) => [planet.key, planet]));
  const shani = byKey.Shani;
  const mangal = byKey.Mangal;
  const guru = byKey.Guru;
  const dusthana = new Set([6, 8, 12]);

  const recommendations = [
    {
      key: "sunderkand",
      handle: "sunderkand",
      score: shani && (dusthana.has(shani.house) || [1, 7, 10].includes(shani.house)) ? 3 : 2,
      title: { en: "Sunderkand", hi: "सुंदरकांड" },
      sub: { en: "Hanuman · Mangal · Shani", hi: "हनुमान · मंगल · शनि" },
      why: [
        {
          en: shani ? `Saturn sits in house ${shani.house}; Sunderkand supports patience, protection, and steady effort.` : "Sunderkand supports courage, protection, and steady effort.",
          hi: shani ? `शनि ${shani.house} भाव में है; सुंदरकांड धैर्य, रक्षा और स्थिर प्रयास में सहायक है।` : "सुंदरकांड साहस, रक्षा और स्थिर प्रयास में सहायक है।"
        }
      ],
      vidhi: {
        en: "Tuesday or Saturday, after a morning bath. About <b>1 hour 30 minutes</b>, in one sitting, facing east.",
        hi: "मंगलवार या शनिवार, प्रातः स्नान के बाद। लगभग <b>1 घंटा 30 मिनट</b>, एक ही बैठक में, मुख पूर्व की ओर।"
      }
    },
    {
      key: "vishnu_sahasranama",
      handle: "vishnu-sahasranama",
      score: guru && dusthana.has(guru.house) ? 3 : 2,
      title: { en: "Vishnu Sahasranama", hi: "विष्णु सहस्रनाम" },
      sub: { en: "Vishnu · Guru", hi: "विष्णु · गुरु" },
      why: [
        {
          en: guru ? `Jupiter sits in house ${guru.house}; Vishnu Sahasranama strengthens guidance, faith, and clarity.` : "Vishnu Sahasranama strengthens guidance, faith, and clarity.",
          hi: guru ? `गुरु ${guru.house} भाव में है; विष्णु सहस्रनाम मार्गदर्शन, श्रद्धा और स्पष्टता को बल देता है।` : "विष्णु सहस्रनाम मार्गदर्शन, श्रद्धा और स्पष्टता को बल देता है।"
        }
      ],
      vidhi: {
        en: "Thursday morning. About <b>35 minutes</b> for the full thousand names, in one sitting, facing east.",
        hi: "गुरुवार प्रातः। पूरे सहस्रनाम में लगभग <b>35 मिनट</b>, एक ही बैठक में, मुख पूर्व की ओर।"
      }
    },
    {
      key: "hanuman_chalisa",
      handle: "hanuman-chalisa",
      score: mangal && [1, 4, 7, 8, 12].includes(mangal.house) ? 3 : 1,
      title: { en: "Hanuman Chalisa", hi: "हनुमान चालीसा" },
      sub: { en: "Hanuman · daily practice", hi: "हनुमान · नित्य पाठ" },
      why: [
        {
          en: mangal ? `Mars sits in house ${mangal.house}; Hanuman Chalisa is an easy daily anchor for courage and discipline.` : "Hanuman Chalisa is an easy daily anchor for courage and discipline.",
          hi: mangal ? `मंगल ${mangal.house} भाव में है; हनुमान चालीसा साहस और अनुशासन के लिए सरल नित्य नियम है।` : "हनुमान चालीसा साहस और अनुशासन के लिए सरल नित्य नियम है।"
        }
      ],
      vidhi: {
        en: "Daily, and 11 or 108 times on Tuesday. Five minutes, so the practice is easy to keep.",
        hi: "रोज़, और मंगलवार को 11 या 108 बार। पाँच मिनट, इसलिए नियम निभाना सरल है।"
      }
    }
  ];

  return recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDasha(date: string, planets: ReturnType<typeof toGraha>[]) {
  const lords = ["Ketu", "Shukra", "Surya", "Chandra", "Mangal", "Rahu", "Guru", "Shani", "Budh"];
  const years: Record<string, number> = { Ketu: 7, Shukra: 20, Surya: 6, Chandra: 10, Mangal: 7, Rahu: 18, Guru: 16, Shani: 19, Budh: 17 };
  const moon = planets.find((planet) => planet.key === "Chandra") ?? planets[0];
  const startIndex = Math.floor((moon.lon % 360) / (360 / 27)) % lords.length;
  let cursor = new Date(`${date}T00:00:00.000Z`);

  return Array.from({ length: 5 }, (_, index) => {
    const lord = lords[(startIndex + index) % lords.length];
    const start = cursor;
    const end = addDays(start, years[lord] * 365);
    cursor = end;

    return {
      lord,
      start: isoDate(start),
      end: isoDate(end),
      years: years[lord]
    };
  });
}

function currentDasha(dasha: ReturnType<typeof buildDasha>) {
  const today = isoDate(new Date());
  return dasha.find((item) => item.start <= today && today <= item.end) ?? dasha[0];
}

function buildPanchang(planets: ReturnType<typeof toGraha>[]) {
  const moon = planets.find((planet) => planet.key === "Chandra") ?? planets[0];
  const sun = planets.find((planet) => planet.key === "Surya") ?? planets[0];
  const tithiIndex = Math.floor((((moon.lon - sun.lon + 360) % 360) / 12) % 30);
  const nakshatraIndex = Math.floor((moon.lon % 360) / (360 / 27));
  const tithis = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima"];
  const nakshatras = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];

  return {
    tithi: tithis[tithiIndex % 15],
    paksha: tithiIndex < 15 ? { en: "Shukla", hi: "शुक्ल" } : { en: "Krishna", hi: "कृष्ण" },
    nakshatra: nakshatras[nakshatraIndex] ?? "Ashwini",
    yoga: "Shubha",
    karana: "Bava"
  };
}

function buildSadeSati(planets: ReturnType<typeof toGraha>[]) {
  const moon = planets.find((planet) => planet.key === "Chandra");
  const shani = planets.find((planet) => planet.key === "Shani");
  if (!moon || !shani) {
    return { active: false, phase: "none" };
  }

  const distance = (shani.rashi - moon.rashi + 12) % 12;
  return distance === 11 || distance === 0 || distance === 1
    ? { active: true, phase: distance === 11 ? "first" : distance === 0 ? "middle" : "last" }
    : { active: false, phase: "none" };
}

function buildQuestions() {
  return [
    { id: "career", cat: "Work", en: "What does my chart say about work?", hi: "मेरे काम के बारे में कुंडली क्या कहती है?" },
    { id: "marriage", cat: "Marriage", en: "What should I know about relationships?", hi: "संबंधों के बारे में मुझे क्या जानना चाहिए?" },
    { id: "money", cat: "Money", en: "Where should I be careful with money?", hi: "धन के मामले में कहाँ सावधानी रखनी चाहिए?" }
  ];
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = chartRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid date, time, latitude, and longitude." }, { status: 400 });
  }

  try {
    const { date, time, lat, lon } = parsed.data;
    const reading = await calculateVedicChart({
      name: "Guest",
      place: `${lat}, ${lon}`,
      date,
      time
    });
    const planets = reading.placements.map(toGraha);
    const dasha = buildDasha(date, planets);
    const maha = currentDasha(dasha);
    const panchang = buildPanchang(planets);
    const transits = planets.map((planet) => ({
      key: planet.key,
      dev: planet.dev,
      rashi: planet.rashi,
      retro: planet.retro,
      lon: planet.lon
    }));

    return NextResponse.json({
      sadeSati: buildSadeSati(planets),
      doshas: [],
      antardasha: maha,
      antardashaSeq: dasha,
      panchang,
      transits,
      concern: null,
      questions: buildQuestions(),
      answer: null,
      lagna: {
        rashi: rashiNumber(reading.ascendant),
        rashiName: reading.ascendant,
        nakshatra: reading.nakshatra,
        degree: 0
      },
      nakshatra: reading.nakshatra,
      exactTime: Boolean(time),
      headline: buildHeadline(planets),
      planets,
      dasha,
      currentDasha: maha,
      recommendations: buildRecommendations(planets)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chart calculation failed." },
      { status: 400 }
    );
  }
}
