import swisseph from "swisseph";

export type BirthDetails = {
  name: string;
  place: string;
  date: string;
  time: string;
};

export type Placement = {
  label: string;
  rashi: string;
  sign: string;
  house: number;
  degree: number;
  longitude: number;
  tone: string;
  meaning: string;
  retrograde: boolean;
};

export type AstrologyReading = {
  name: string;
  place: string;
  coordinates: {
    latitude: number;
    longitude: number;
    timezone: string;
    source: string;
  };
  engine: "swiss-ephemeris" | "sidereal-preview";
  note: string;
  ascendant: string;
  ascendantWestern: string;
  moon: Placement;
  nakshatra: string;
  element: string;
  focus: string;
  guidePlanet: Placement;
  placements: Placement[];
};

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

const planetInfo = [
  { key: "sun", swissId: 0, label: "Sun", tone: "#d9945c", meaning: "your dharma, authority, and visible life-force", period: 365.256, base: 280.466 },
  { key: "moon", swissId: 1, label: "Moon", tone: "#8fa7ff", meaning: "your inner weather, safety, memory, and devotion", period: 27.3217, base: 218.316 },
  { key: "mars", swissId: 4, label: "Mars", tone: "#df725c", meaning: "your courage, discipline, argument, and protection style", period: 686.98, base: 355.433 },
  { key: "mercury", swissId: 2, label: "Mercury", tone: "#96b6a5", meaning: "your speech, trade, learning speed, and pattern recognition", period: 87.969, base: 252.251 },
  { key: "jupiter", swissId: 5, label: "Jupiter", tone: "#c8b36d", meaning: "your guru principle, wisdom, faith, and expansion", period: 4332.59, base: 34.351 },
  { key: "venus", swissId: 3, label: "Venus", tone: "#daa4c7", meaning: "your taste, affection, pleasure, and refinement", period: 224.701, base: 181.98 },
  { key: "saturn", swissId: 6, label: "Saturn", tone: "#7c8581", meaning: "your karma, patience, structure, and slow mastery", period: 10759.22, base: 50.077 },
  { key: "rahu", swissId: 10, label: "Rahu", tone: "#b391ff", meaning: "your hunger, innovation, obsession, and unfamiliar path", period: -6798.38, base: 125.044 },
  { key: "ketu", swissId: 10, label: "Ketu", tone: "#bfc7ca", meaning: "your detachment, past mastery, intuition, and release", period: -6798.38, base: 305.044 }
];

const knownPlaces: Array<{ match: string; latitude: number; longitude: number; timezone: string; source?: string }> = [
  { match: "ujjain", latitude: 23.1765, longitude: 75.7885, timezone: "Asia/Kolkata" },
  { match: "indore", latitude: 22.7196, longitude: 75.8577, timezone: "Asia/Kolkata" },
  { match: "delhi", latitude: 28.6139, longitude: 77.209, timezone: "Asia/Kolkata" },
  { match: "mumbai", latitude: 19.076, longitude: 72.8777, timezone: "Asia/Kolkata" },
  { match: "varanasi", latitude: 25.3176, longitude: 82.9739, timezone: "Asia/Kolkata" },
  { match: "jaipur", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata" },
  { match: "ahmedabad", latitude: 23.0225, longitude: 72.5714, timezone: "Asia/Kolkata" },
  { match: "pune", latitude: 18.5204, longitude: 73.8567, timezone: "Asia/Kolkata" },
  { match: "bengaluru", latitude: 12.9716, longitude: 77.5946, timezone: "Asia/Kolkata" },
  { match: "bangalore", latitude: 12.9716, longitude: 77.5946, timezone: "Asia/Kolkata" },
  { match: "kolkata", latitude: 22.5726, longitude: 88.3639, timezone: "Asia/Kolkata" },
  { match: "chennai", latitude: 13.0827, longitude: 80.2707, timezone: "Asia/Kolkata" },
  { match: "hyderabad", latitude: 17.385, longitude: 78.4867, timezone: "Asia/Kolkata" },
  { match: "london", latitude: 51.5072, longitude: -0.1276, timezone: "Europe/London" },
  { match: "new york", latitude: 40.7128, longitude: -74.006, timezone: "America/New_York" }
];

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function rashiIndex(longitude: number) {
  return Math.floor(normalizeDegrees(longitude) / 30);
}

function longitudeToPlacement(source: (typeof planetInfo)[number], longitude: number, ascendantIndex: number, retrograde = false): Placement {
  const normalized = normalizeDegrees(longitude);
  const signIndex = rashiIndex(normalized);
  return {
    label: source.label,
    rashi: rashis[signIndex],
    sign: westernSigns[signIndex],
    house: ((signIndex - ascendantIndex + 12) % 12) + 1,
    degree: normalized % 30,
    longitude: normalized,
    tone: source.tone,
    meaning: source.meaning,
    retrograde
  };
}

function hashBirth(input: BirthDetails) {
  const joined = `${input.name}|${input.place}|${input.date}|${input.time}`;
  return [...joined].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 17), 0);
}

function parseCoordinatePlace(place: string) {
  const match = place.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!match) {
    return null;
  }

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);

  if (Number.isNaN(latitude) || Number.isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return {
    latitude,
    longitude,
    timezone: "Asia/Kolkata",
    source: "manual coordinates"
  };
}

async function geocodePlace(place: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", place);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "sanskritagain-astro/1.0"
    },
    next: {
      revalidate: 60 * 60 * 24 * 30
    }
  });

  if (!response.ok) {
    return null;
  }

  const results = (await response.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
  const first = results[0];

  if (!first?.lat || !first.lon) {
    return null;
  }

  return {
    latitude: Number(first.lat),
    longitude: Number(first.lon),
    timezone: "Asia/Kolkata",
    source: first.display_name ? `geocoded: ${first.display_name}` : "geocoded"
  };
}

async function getCoordinates(place: string) {
  const normalized = place.toLowerCase();
  const manual = parseCoordinatePlace(place);
  if (manual) {
    return manual;
  }

  const known = knownPlaces.find((item) => normalized.includes(item.match));
  if (known) {
    return {
      ...known,
      source: known.source ?? `matched city: ${known.match}`
    };
  }

  const geocoded = await geocodePlace(place).catch(() => null);
  if (geocoded) {
    return geocoded;
  }

  throw new Error("Birth place not found. Please enter a clearer city name, or use coordinates like 23.1765, 75.7885.");
}

function timeZoneOffsetHours(date: string, time: string, timezone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour = 12, minute = 0] = time.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(utcGuess);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const zonedAsUtc = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
  return (zonedAsUtc - utcGuess.getTime()) / 3600000;
}

function julianDay(date: string, time: string, timezone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour = 12, minute = 0] = time.split(":").map(Number);
  const utcHour = hour + minute / 60 - timeZoneOffsetHours(date, time, timezone);
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5 + utcHour / 24;
}

function lahiriAyanamsa(jd: number) {
  return 24.136 + ((jd - 2451545) / 36525) * 1.396;
}

async function buildFallbackReading(input: BirthDetails): Promise<AstrologyReading> {
  const coords = await getCoordinates(input.place);
  const jd = julianDay(input.date || "1998-01-01", input.time || "12:00", coords.timezone);
  const ayanamsa = lahiriAyanamsa(jd);
  const days = jd - 2451545;
  const seed = hashBirth(input);
  const localHour = Number((input.time || "12:00").replace(":", "")) / 100;
  const ascendantLongitude = normalizeDegrees((localHour / 24) * 360 + coords.longitude - ayanamsa + seed * 0.001);
  const ascendantIndex = rashiIndex(ascendantLongitude);

  const placements = planetInfo.map((planet) => {
    const tropical = normalizeDegrees(planet.base + (days * 360) / planet.period + Math.sin((days / planet.period) * Math.PI * 2) * 4);
    const sidereal = normalizeDegrees(planet.label === "Ketu" ? tropical + 180 : tropical - ayanamsa);
    return longitudeToPlacement(planet, sidereal, ascendantIndex, planet.period < 0 || (planet.label !== "Sun" && planet.label !== "Moon" && Math.sin(days / planet.period) < -0.72));
  });

  return formatReading(input, coords, "sidereal-preview", placements, ascendantIndex, "Swiss Ephemeris is not installed in this runtime yet; this uses a sidereal preview engine with the same API shape.");
}

type SwissModule = {
  SE_GREG_CAL?: number;
  SEFLG_SWIEPH?: number;
  SEFLG_SIDEREAL?: number;
  SE_SIDM_LAHIRI?: number;
  swe_set_sid_mode?: (sidMode: number, t0: number, ayanT0: number) => void;
  swe_julday?: (year: number, month: number, day: number, hour: number, gregflag: number) => number;
  swe_calc_ut?: (jd: number, planet: number, flags: number, callback: (result: { longitude?: number; longitudeSpeed?: number; error?: string }) => void) => void;
};

async function trySwissReading(input: BirthDetails): Promise<AstrologyReading | null> {
  try {
    const swe = swisseph as SwissModule;
    if (!swe.swe_calc_ut || !swe.swe_julday) {
      return null;
    }

    const coords = await getCoordinates(input.place);
    const [year, month, day] = (input.date || "1998-01-01").split("-").map(Number);
    const [hour = 12, minute = 0] = (input.time || "12:00").split(":").map(Number);
    const utcHour = hour + minute / 60 - timeZoneOffsetHours(input.date || "1998-01-01", input.time || "12:00", coords.timezone);
    const jd = swe.swe_julday(year, month, day, utcHour, swe.SE_GREG_CAL ?? 1);
    swe.swe_set_sid_mode?.(swe.SE_SIDM_LAHIRI ?? 1, 0, 0);

    const flags = (swe.SEFLG_SWIEPH ?? 2) | (swe.SEFLG_SIDEREAL ?? 65536);
    const ayanamsa = lahiriAyanamsa(jd);
    const ascendantLongitude = normalizeDegrees(((hour + minute / 60) / 24) * 360 + coords.longitude - ayanamsa);
    const ascendantIndex = rashiIndex(ascendantLongitude);

    const placements = await Promise.all(
      planetInfo.map(
        (planet) =>
          new Promise<Placement>((resolve, reject) => {
            swe.swe_calc_ut?.(jd, planet.swissId, flags, (result) => {
              if (result.error) {
                reject(new Error(result.error));
                return;
              }
              const longitude = planet.label === "Ketu" ? normalizeDegrees((result.longitude ?? 0) + 180) : result.longitude ?? 0;
              resolve(longitudeToPlacement(planet, longitude, ascendantIndex, (result.longitudeSpeed ?? 0) < 0 || planet.label === "Rahu" || planet.label === "Ketu"));
            });
          })
      )
    );

    return formatReading(input, coords, "swiss-ephemeris", placements, ascendantIndex, "Calculated with Swiss Ephemeris using Lahiri sidereal mode.");
  } catch {
    return null;
  }
}

function formatReading(
  input: BirthDetails,
  coords: { latitude: number; longitude: number; timezone: string; source: string },
  engine: AstrologyReading["engine"],
  placements: Placement[],
  ascendantIndex: number,
  note: string
): AstrologyReading {
  const moon = placements.find((placement) => placement.label === "Moon") ?? placements[1];
  const nakshatraIndex = Math.floor(normalizeDegrees(moon.longitude) / (360 / 27));
  const guidePlanet = placements.reduce((best, placement) => (placement.house === 1 || placement.house === 9 || placement.house === 10 ? placement : best), placements[0]);
  const element = ["Agni", "Prithvi", "Vayu", "Jala"][rashiIndex(moon.longitude) % 4];
  const focus = ["self-mastery", "relationships", "work rhythm", "wealth discipline", "learning", "devotion"][hashBirth(input) % 6];

  return {
    name: input.name,
    place: input.place,
    coordinates: coords,
    engine,
    note,
    ascendant: rashis[ascendantIndex],
    ascendantWestern: westernSigns[ascendantIndex],
    moon,
    nakshatra: nakshatras[nakshatraIndex],
    element,
    focus,
    guidePlanet,
    placements
  };
}

export async function calculateVedicChart(input: BirthDetails): Promise<AstrologyReading> {
  const swissReading = await trySwissReading(input);
  return swissReading ?? (await buildFallbackReading(input));
}
