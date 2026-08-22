"""
POST /api/chart
Body: {"date":"1994-08-14","time":"09:25","lat":26.9124,"lon":75.7873,"tz":5.5}
Returns the kundli plus ranked recitation suggestions in EN and HI.
"""
import json
import os
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler
import urllib.request

import swisseph as swe

swe.set_sid_mode(swe.SIDM_LAHIRI)

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "").strip()
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "openrouter/free").strip()

RASHIS = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
          "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"]
NAKSHATRAS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
              "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
              "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha",
              "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha",
              "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
              "Uttara Bhadrapada", "Revati"]
DASHA_LORDS = ["Ketu", "Shukra", "Surya", "Chandra", "Mangal",
               "Rahu", "Guru", "Shani", "Budh"]
DASHA_YEARS = {"Ketu": 7, "Shukra": 20, "Surya": 6, "Chandra": 10, "Mangal": 7,
               "Rahu": 18, "Guru": 16, "Shani": 19, "Budh": 17}
PLANETS = [("Surya", swe.SUN, "सू"), ("Chandra", swe.MOON, "चं"),
           ("Mangal", swe.MARS, "मं"), ("Budh", swe.MERCURY, "बु"),
           ("Guru", swe.JUPITER, "गु"), ("Shukra", swe.VENUS, "शु"),
           ("Shani", swe.SATURN, "श"), ("Rahu", swe.MEAN_NODE, "रा")]

GRAHA_EN = {"Surya":"Sun","Chandra":"Moon","Mangal":"Mars","Budh":"Mercury",
            "Guru":"Jupiter","Shukra":"Venus","Shani":"Saturn","Rahu":"Rahu","Ketu":"Ketu"}

GRAHA_HI = {"Surya":"सूर्य","Chandra":"चंद्र","Mangal":"मंगल","Budh":"बुध","Guru":"गुरु",
            "Shukra":"शुक्र","Shani":"शनि","Rahu":"राहु","Ketu":"केतु"}

DUSTHANA = {6, 8, 12}
KENDRA = {1, 4, 7, 10}
TRIKONA = {1, 5, 9}


# ------------------------------------------------------------------ chart
def _place(lon):
    lon %= 360
    nak = 360 / 27
    return {"longitude": round(lon, 4), "rashi": int(lon // 30),
            "rashiName": RASHIS[int(lon // 30)], "degree": round(lon % 30, 4),
            "nakshatra": NAKSHATRAS[int(lon // nak)],
            "pada": int((lon % nak) // (nak / 4)) + 1}


def calculate(birth_local, tz, lat, lon_geo):
    utc = birth_local - timedelta(hours=tz)
    jd = swe.julday(utc.year, utc.month, utc.day,
                    utc.hour + utc.minute / 60 + utc.second / 3600)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED

    planets = {}
    for name, pid, dev in PLANETS:
        vals, _ = swe.calc_ut(jd, pid, flags)
        p = _place(vals[0])
        p["dev"] = dev
        p["retro"] = vals[3] < 0 and name not in ("Surya", "Chandra")
        planets[name] = p

    ketu = _place(planets["Rahu"]["longitude"] + 180)
    ketu.update(dev="के", retro=True)
    planets["Ketu"] = ketu
    planets["Rahu"]["retro"] = True

    _, ascmc = swe.houses_ex(jd, lat, lon_geo, b'W', swe.FLG_SIDEREAL)
    lagna = _place(ascmc[0])
    for p in planets.values():
        p["house"] = ((p["rashi"] - lagna["rashi"]) % 12) + 1

    return {"lagna": lagna, "planets": planets,
            "dasha": vimshottari(planets["Chandra"]["longitude"], birth_local)}


def vimshottari(moon_lon, birth, count=9):
    nak = 360 / 27
    i = int((moon_lon % 360) // nak)
    lord = DASHA_LORDS[i % 9]
    elapsed = ((moon_lon % 360) % nak) / nak
    start = DASHA_LORDS.index(lord)
    remaining = DASHA_YEARS[lord] * (1 - elapsed)

    seq, cursor = [], birth
    for n in range(count):
        l = DASHA_LORDS[(start + n) % 9]
        yrs = remaining if n == 0 else DASHA_YEARS[l]
        end = cursor + timedelta(days=yrs * 365.25)
        seq.append({"lord": l, "start": cursor.date().isoformat(),
                    "end": end.date().isoformat(), "years": round(yrs, 2)})
        cursor = end
    return seq


def current_dasha(dasha, today=None):
    d = (today or datetime.now()).date().isoformat()
    for m in dasha:
        if m["start"] <= d <= m["end"]:
            return m
    return None


# ------------------------------------------------- catalogue + paath vidhi
PRODUCTS = {
    "sunderkand": {
        "handle": "sunderkand",
        "title": {"en": "Sunderkand", "hi": "सुंदरकांड"},
        "sub": {"en": "Hanuman · Mangal · Shani", "hi": "हनुमान · मंगल · शनि"},
        "vidhi": {
            "en": "Tuesday or Saturday, after a morning bath. The full recitation "
                  "runs about <b>1 hour 30 minutes</b> — do it in one sitting, don't "
                  "break in the middle. Ghee lamp, facing east. If this is your first "
                  "time, begin with the Hanuman Chalisa.",
            "hi": "मंगलवार या शनिवार, प्रातः स्नान के बाद। पूरा पाठ लगभग <b>1 घंटा 30 मिनट</b> "
                  "का है — एक ही बैठक में करें, बीच में न उठें। घी का दीपक, मुख पूर्व की ओर। "
                  "पहली बार कर रहे हों तो हनुमान चालीसा से आरंभ करें।"}},
    "vishnu_sahasranama": {
        "handle": "vishnu-sahasranama",
        "title": {"en": "Vishnu Sahasranama", "hi": "विष्णु सहस्रनाम"},
        "sub": {"en": "Vishnu · Guru", "hi": "विष्णु · गुरु"},
        "vidhi": {
            "en": "Thursday morning, after bathing. About <b>35 minutes</b> for the "
                  "full thousand names, in one sitting, facing east. Ekadashi is "
                  "considered especially good.",
            "hi": "गुरुवार प्रातः, स्नान के बाद। पूरे सहस्रनाम में लगभग <b>35 मिनट</b> लगते हैं "
                  "— एक ही बैठक में, मुख पूर्व की ओर। एकादशी पर विशेष फल माना गया है।"}},
    "hanuman_chalisa": {
        "handle": "hanuman-chalisa",
        "title": {"en": "Hanuman Chalisa", "hi": "हनुमान चालीसा"},
        "sub": {"en": "Hanuman · daily practice", "hi": "हनुमान · नित्य पाठ"},
        "vidhi": {
            "en": "Daily, and 11 or 108 times on Tuesday. Five minutes — which is "
                  "why it is the easiest recitation to actually keep up.",
            "hi": "रोज़, और मंगलवार को 11 या 108 बार। पाँच मिनट — इसीलिए नित्य नियम "
                  "के लिए यह सबसे सरल पाठ है।"}},
    "bajrang_baan": {
        "handle": "bajrang-baan",
        "title": {"en": "Bajrang Baan", "hi": "बजरंग बाण"},
        "sub": {"en": "Hanuman · for acute difficulty", "hi": "हनुमान · तीव्र बाधा हेतु"},
        "vidhi": {
            "en": "Tuesday night. The Hanuman Chalisa must open and close it. Once "
                  "begun, keep it for 40 days. This is an intense recitation — take "
                  "it up at need, not out of curiosity.",
            "hi": "मंगलवार रात्रि। आरंभ और अंत में हनुमान चालीसा अनिवार्य है। एक बार शुरू "
                  "करें तो 40 दिन का नियम रखें। यह उग्र पाठ है — आवश्यकता पर करें, शौक से नहीं।"}},
    "lalita_sahasranama": {
        "handle": "sri-lalitha-sahasranama",
        "title": {"en": "Sri Lalita Sahasranama", "hi": "श्री ललिता सहस्रनाम"},
        "sub": {"en": "Devi · Shukra · Chandra", "hi": "देवी · शुक्र · चंद्र"},
        "vidhi": {
            "en": "Friday or Purnima. About <b>45 minutes</b> for the full recitation. "
                  "Daily through Navratri is considered best of all.",
            "hi": "शुक्रवार या पूर्णिमा। पूरा पाठ लगभग <b>45 मिनट</b> का है। नवरात्रि में "
                  "रोज़ — सर्वोत्तम माना गया है।"}},
    "bhaktamar": {
        "handle": "bhaktamar-stotra",
        "title": {"en": "Bhaktamar Stotra", "hi": "भक्तामर स्तोत्र"},
        "sub": {"en": "Adinath · for obstacles", "hi": "आदिनाथ · संकट-मोचन"},
        "vidhi": {
            "en": "Daily in the morning, all 48 verses in order. Each verse carries "
                  "its own traditional purpose, so particular verses may also be "
                  "recited for a particular difficulty.",
            "hi": "रोज़ प्रातः, सभी 48 काव्य क्रमशः। हर काव्य का अपना फल है — संकट के "
                  "अनुसार विशेष काव्य भी किए जा सकते हैं।"}},
    "chalisa_sangrah": {
        "handle": "chalisa-sangrah",
        "title": {"en": "Chalisa Sangrah Box", "hi": "चालीसा संग्रह बॉक्स"},
        "sub": {"en": "A weekly cycle", "hi": "साप्ताहिक नियम"},
        "vidhi": {
            "en": "One deity per day — Hanuman on Tuesday, Devi on Friday, Shani on "
                  "Saturday, and so on through the week.",
            "hi": "हर दिन के देवता के अनुसार — मंगलवार हनुमान, शुक्रवार देवी, शनिवार शनि, "
                  "इसी क्रम में पूरा सप्ताह।"}},
}


# ------------------------------------------------------------------ rules
def build_hits(chart):
    """(product_key, weight, {en, hi} reason). `basis` is for astrologer review."""
    P, hits = chart["planets"], []
    lagna = chart["lagna"]
    guru, shani, mangal = P["Guru"], P["Shani"], P["Mangal"]
    shukra, chandra, rahu, ketu = P["Shukra"], P["Chandra"], P["Rahu"], P["Ketu"]
    ordinal = {1: "first", 2: "second", 3: "third", 4: "fourth", 5: "fifth",
               6: "sixth", 7: "seventh", 8: "eighth", 9: "ninth", 10: "tenth",
               11: "eleventh", 12: "twelfth"}
    hi_ord = {1: "पहले", 2: "दूसरे", 3: "तीसरे", 4: "चौथे", 5: "पाँचवें", 6: "छठे",
              7: "सातवें", 8: "आठवें", 9: "नवें", 10: "दसवें", 11: "ग्यारहवें", 12: "बारहवें"}

    def add(key, w, en, hi, basis, head=None):
        hits.append((key, w, {"en": en, "hi": hi}, basis, head))

    # --- Guru
    if guru["house"] in DUSTHANA:
        add("vishnu_sahasranama", 3,
            f"Your Jupiter is in the {ordinal[guru['house']]} house — knowledge, "
            "guidance and stability meet resistance. Vishnu Sahasranama is Jupiter's "
            "principal recitation.",
            f"आपका गुरु {hi_ord[guru['house']]} भाव में है — ज्ञान, मार्गदर्शन और स्थिरता "
            "के क्षेत्र में रुकावट आती है। विष्णु सहस्रनाम गुरु का मूल पाठ है।",
            "Guru in dusthana (6/8/12)",
            {"en": ["Jupiter sits in your", f"{ordinal[guru['house']]} house."],
             "hi": [f"गुरु आपके {hi_ord[guru['house']]}", "भाव में बैठा है।"]})
    elif guru["house"] in KENDRA | TRIKONA:
        add("vishnu_sahasranama", 2,
            "Your Jupiter sits in a strong house. This is not a weakness to fix — "
            "it is a strength to build on, and Vishnu Sahasranama works as growth "
            "rather than remedy.",
            "आपका गुरु शुभ स्थान में है। यह सुधारने वाली कमज़ोरी नहीं, बढ़ाने वाली शक्ति है — "
            "विष्णु सहस्रनाम यहाँ उपाय नहीं, वृद्धि का पाठ है।",
            "Guru in kendra/trikona — strengthening",
            {"en": ["Your Jupiter is", "well placed."],
             "hi": ["आपका गुरु", "बलवान है।"]})
    if lagna["rashiName"] in ("Dhanu", "Meena"):
        add("vishnu_sahasranama", 2,
            f"{lagna['rashiName']} rises, so Jupiter rules your chart. Vishnu's "
            "recitation suits your nature directly.",
            f"{lagna['rashiName']} लग्न पर गुरु का स्वामित्व है — विष्णु की उपासना "
            "आपकी प्रकृति के अनुकूल है।",
            "Guru as lagnesha")

    # --- Shani / Mangal
    if shani["house"] in DUSTHANA or shani["house"] in (1, 7, 10):
        add("sunderkand", 3,
            f"Saturn sits in your {ordinal[shani['house']]} house — things take "
            "time, effort lands but results arrive late. Sunderkand is the recitation "
            "classically prescribed for Saturn's pressure.",
            f"शनि आपके {hi_ord[shani['house']]} भाव में है — काम अटकते हैं, मेहनत पूरी "
            "होती है पर फल देर से आता है। शनि की पीड़ा के लिए सुंदरकांड शास्त्रों में बताया "
            "गया पाठ है।",
            "Shani in dusthana or kendra",
            {"en": ["Saturn sits in your", f"{ordinal[shani['house']]} house."],
             "hi": [f"शनि आपके {hi_ord[shani['house']]}", "भाव में बैठा है।"]})
    if mangal["house"] in (1, 4, 7, 8, 12):
        add("sunderkand", 3,
            f"Mars is in the {ordinal[mangal['house']]} house — one of the placements "
            "traditionally called Mangal dosha. Hanuman's recitation is its direct "
            "remedy.",
            f"मंगल {hi_ord[mangal['house']]} भाव में है — यह मंगल दोष का स्थान है। "
            "हनुमान की उपासना इसका सीधा उपाय है।",
            "Mangal dosha houses 1/4/7/8/12",
            {"en": ["Mars sits in your", f"{ordinal[mangal['house']]} house."],
             "hi": [f"मंगल आपके {hi_ord[mangal['house']]}", "भाव में बैठा है।"]})
        add("hanuman_chalisa", 2,
            "For a daily habit, the Hanuman Chalisa — Sunderkand can't be done every "
            "day, but five minutes can.",
            "रोज़ाना नियम के लिए हनुमान चालीसा — सुंदरकांड हर दिन नहीं हो पाता, "
            "पाँच मिनट हो जाते हैं।",
            "Daily companion to Sunderkand")
    if mangal["rashiName"] == "Karka" or mangal["house"] in DUSTHANA:
        add("bajrang_baan", 2,
            "Your Mars is weakly placed. Bajrang Baan is the intense option — take "
            "it up as a 40-day practice when difficulty is acute.",
            "आपका मंगल कमज़ोर स्थिति में है। बजरंग बाण तीव्र पाठ है — संकट के समय "
            "40 दिन के नियम के रूप में करें।",
            "Mangal debilitated or in dusthana")

    # --- Shukra / Chandra
    for name, p, en_word, hi_word in (("Shukra", shukra, "Venus", "शुक्र"),
                                      ("Chandra", chandra, "Moon", "चंद्र")):
        if p["house"] in DUSTHANA:
            add("lalita_sahasranama", 3,
                f"Your {en_word} is in a difficult house — restlessness of mind, "
                "unevenness in relationships. Lalita Sahasranama steadies these areas.",
                f"आपका {hi_word} कठिन भाव में है — मन की चंचलता, संबंधों में उतार-चढ़ाव। "
                "ललिता सहस्रनाम इन क्षेत्रों को स्थिर करता है।",
                f"{name} in dusthana",
                {"en": [f"Your {en_word} is in", "a difficult house."],
                 "hi": [f"आपका {hi_word} कठिन", "भाव में है।"]})
    if chandra["rashiName"] == "Vrishchika":
        add("lalita_sahasranama", 2,
            "The Moon is debilitated in Scorpio — the mind carries weight. Devi's "
            "recitation is most often prescribed here.",
            "चंद्र वृश्चिक में नीच है — मन पर भार रहता है। यहाँ देवी उपासना सबसे अधिक "
            "मानी जाती है।",
            "Chandra debilitated")

    # --- Rahu / Ketu
    if rahu["house"] in KENDRA or ketu["house"] in KENDRA:
        add("bhaktamar", 2,
            "Rahu or Ketu occupies one of your main houses — confusion, sudden "
            "change, a sense of being tied down. Bhaktamar Stotra is for removing "
            "obstacles.",
            "राहु या केतु आपके मुख्य भाव में है — भ्रम, अचानक बदलाव और बंधन की स्थिति "
            "बनती है। भक्तामर स्तोत्र संकट-मोचन के लिए है।",
            "Rahu/Ketu in kendra",
            {"en": ["Rahu or Ketu holds", "one of your main houses."],
             "hi": ["राहु या केतु आपके", "मुख्य भाव में है।"]})

    # --- current mahadasha carries the most weight
    cd = current_dasha(chart["dasha"])
    dasha_map = {"Guru": "vishnu_sahasranama", "Shani": "sunderkand",
                 "Mangal": "sunderkand", "Ketu": "bhaktamar", "Rahu": "bhaktamar",
                 "Shukra": "lalita_sahasranama", "Chandra": "lalita_sahasranama",
                 "Surya": "vishnu_sahasranama", "Budh": "chalisa_sangrah"}
    if cd and cd["lord"] in dasha_map:
        add(dasha_map[cd["lord"]], 4,
            f"You are running the {cd['lord']} mahadasha right now "
            f"({cd['start'][:4]}–{cd['end'][:4]}). This is when a recitation tied to "
            f"{cd['lord']} does the most work.",
            f"अभी आप {GRAHA_HI[cd['lord']]} की महादशा में हैं ({cd['start'][:4]}–{cd['end'][:4]})। "
            f"यही वह समय है जब {GRAHA_HI[cd['lord']]} से जुड़ा पाठ सबसे अधिक असर करता है।",
            f"Current mahadasha {cd['lord']}",
            {"en": [f"You are in the {cd['lord']}", "mahadasha now."],
             "hi": [f"अभी आप {GRAHA_HI[cd['lord']]} की", "महादशा में हैं।"]})
    return hits


def recommend(chart, top_n=2):
    scores, reasons, basis = {}, {}, {}
    best_head, best_w = None, -1
    for key, w, reason, why, head in build_hits(chart):
        scores[key] = scores.get(key, 0) + w
        reasons.setdefault(key, []).append(reason)
        basis.setdefault(key, []).append(why)
        if head and w > best_w:
            best_head, best_w = head, w

    if not scores:
        scores["chalisa_sangrah"] = 1
        reasons["chalisa_sangrah"] = [{
            "en": "No single graha dominates your chart, so a weekly cycle suits you "
                  "better than one long recitation.",
            "hi": "आपकी कुंडली में कोई एक ग्रह प्रबल नहीं है — इसलिए एक लंबे पाठ से "
                  "बेहतर साप्ताहिक नियम रहेगा।"}]
        basis["chalisa_sangrah"] = ["no rule fired — fallback"]

    out = []
    for key, score in sorted(scores.items(), key=lambda x: -x[1])[:top_n]:
        p = PRODUCTS[key]
        out.append({"key": key, "handle": p["handle"], "title": p["title"],
                    "sub": p["sub"], "vidhi": p["vidhi"], "score": score,
                    "why": reasons[key], "basis": basis[key]})
    return out, best_head or DEFAULT_HEADLINE



# ------------------------------------------------------------- question bank
QUESTIONS = [
 {"id":"job_change","cat":"career","houses":[10,6,11],"grahas":["Shani","Surya"],
  "en":"Should I change my job or stay?","hi":"नौकरी बदलूँ या टिका रहूँ?"},
 {"id":"business","cat":"career","houses":[10,3,11],"grahas":["Mangal","Budh"],
  "en":"Should I start something of my own?","hi":"अपना काम शुरू करूँ?"},
 {"id":"promotion","cat":"career","houses":[10,11],"grahas":["Surya","Guru"],
  "en":"When will I move up at work?","hi":"तरक्की कब मिलेगी?"},
 {"id":"stuck_work","cat":"career","houses":[10,6],"grahas":["Shani","Mangal"],
  "en":"Why does my work keep getting stuck?","hi":"काम अटकते क्यों हैं?"},

 {"id":"marriage_when","cat":"vivah","houses":[7,2],"grahas":["Guru","Shukra"],
  "en":"When will I get married?","hi":"शादी कब तक होगी?"},
 {"id":"love","cat":"vivah","houses":[5,7],"grahas":["Shukra","Mangal"],
  "en":"Will it be a love marriage?","hi":"प्रेम विवाह होगा?"},
 {"id":"relation_tension","cat":"vivah","houses":[7,4],"grahas":["Mangal","Shani"],
  "en":"Why is there tension at home?","hi":"रिश्ते में तनाव क्यों है?"},
 {"id":"children","cat":"vivah","houses":[5],"grahas":["Guru","Chandra"],
  "en":"What does the chart say about children?","hi":"संतान का योग क्या है?"},

 {"id":"money_stay","cat":"dhan","houses":[2,12,11],"grahas":["Shukra","Guru"],
  "en":"Why doesn't money stay with me?","hi":"पैसा टिकता क्यों नहीं?"},
 {"id":"loan","cat":"dhan","houses":[6,8],"grahas":["Shani","Mangal"],
  "en":"When will my debt clear?","hi":"कर्ज़ कब उतरेगा?"},
 {"id":"property","cat":"dhan","houses":[4],"grahas":["Chandra","Mangal"],
  "en":"Is there a house or land in my chart?","hi":"घर या ज़मीन का योग है?"},
 {"id":"foreign","cat":"dhan","houses":[12,9],"grahas":["Rahu","Guru"],
  "en":"Is there foreign travel or settlement?","hi":"विदेश जाने का योग है?"},

 {"id":"restless","cat":"mann","houses":[4,12],"grahas":["Chandra","Rahu"],
  "en":"Why does my mind stay restless?","hi":"मन बेचैन क्यों रहता है?"},
 {"id":"sleep","cat":"mann","houses":[12,4],"grahas":["Chandra","Shani"],
  "en":"Why can't I sleep properly?","hi":"नींद ठीक से क्यों नहीं आती?"},
 {"id":"family","cat":"mann","houses":[4,2],"grahas":["Chandra","Guru"],
  "en":"Why do family matters keep hurting?","hi":"घर की बातें क्यों चुभती हैं?"},

 {"id":"health","cat":"sehat","houses":[6,1],"grahas":["Surya","Shani"],
  "en":"Why does my health stay weak?","hi":"सेहत कमज़ोर क्यों रहती है?"},
 {"id":"energy","cat":"sehat","houses":[1,3],"grahas":["Mangal","Surya"],
  "en":"Why do I feel low on energy?","hi":"थकान क्यों बनी रहती है?"},

 {"id":"sadesati","cat":"other","houses":[],"grahas":[],
  "en":"Is Sade Sati running, and until when?","hi":"साढ़ेसाती चल रही है? कब तक?"},
 {"id":"paath","cat":"other","houses":[],"grahas":[],
  "en":"Which paath is right for me?","hi":"मेरे लिए कौन सा पाठ सही है?"},
]
Q_BY_ID = {q["id"]: q for q in QUESTIONS}

CONCERNS = {
    "career": {"houses": [10, 6, 2], "grahas": ["Surya", "Shani", "Budh"],
               "en": "work and direction", "hi": "\u0915\u093e\u092e \u0914\u0930 \u0926\u093f\u0936\u093e"},
    "vivah":  {"houses": [7, 5, 2],  "grahas": ["Shukra", "Guru", "Mangal"],
               "en": "marriage and relationships", "hi": "\u0935\u093f\u0935\u093e\u0939 \u0914\u0930 \u0938\u0902\u092c\u0902\u0927"},
    "dhan":   {"houses": [2, 11, 9], "grahas": ["Guru", "Shukra", "Budh"],
               "en": "money and stability", "hi": "\u0927\u0928 \u0914\u0930 \u0938\u094d\u0925\u093f\u0930\u0924\u093e"},
    "mann":   {"houses": [4, 1, 12], "grahas": ["Chandra", "Guru"],
               "en": "peace of mind", "hi": "\u092e\u0928 \u0915\u0940 \u0936\u093e\u0902\u0924\u093f"},
    "sehat":  {"houses": [6, 1, 8],  "grahas": ["Surya", "Chandra", "Shani"],
               "en": "health and energy", "hi": "\u0938\u094d\u0935\u093e\u0938\u094d\u0925\u094d\u092f \u0914\u0930 \u090a\u0930\u094d\u091c\u093e"},
}

TITHIS = ["Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi",
          "Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi",
          "Trayodashi","Chaturdashi","Purnima/Amavasya"]
VARAS = {0:("Monday","\u0938\u094b\u092e\u0935\u093e\u0930","Chandra"), 1:("Tuesday","\u092e\u0902\u0917\u0932\u0935\u093e\u0930","Mangal"),
         2:("Wednesday","\u092c\u0941\u0927\u0935\u093e\u0930","Budh"), 3:("Thursday","\u0917\u0941\u0930\u0941\u0935\u093e\u0930","Guru"),
         4:("Friday","\u0936\u0941\u0915\u094d\u0930\u0935\u093e\u0930","Shukra"), 5:("Saturday","\u0936\u0928\u093f\u0935\u093e\u0930","Shani"),
         6:("Sunday","\u0930\u0935\u093f\u0935\u093e\u0930","Surya")}

DEFAULT_HEADLINE = {
    "en": ["Your chart is", "evenly balanced."],
    "hi": ["आपकी कुंडली", "संतुलित है।"]}



HOUSE_PLAIN = {
    1:  {"en": "your own health, nature and how you come across",
         "hi": "आपकी सेहत, स्वभाव और छवि"},
    2:  {"en": "money you save, family, what you say",
         "hi": "जमा पैसा, परिवार, आपकी बात"},
    4:  {"en": "home, mother, and peace of mind",
         "hi": "घर, माँ, और मन का चैन"},
    5:  {"en": "children, love, and what you learn",
         "hi": "संतान, प्रेम, और पढ़ाई"},
    6:  {"en": "illness, loans, and the people who oppose you",
         "hi": "बीमारी, कर्ज़, और विरोध करने वाले लोग"},
    7:  {"en": "marriage, partnership, and any deal you make",
         "hi": "विवाह, साझेदारी, और हर सौदा"},
    8:  {"en": "sudden change, and things that stay hidden",
         "hi": "अचानक बदलाव, और छुपी हुई बातें"},
    9:  {"en": "luck, father, faith, and long journeys",
         "hi": "भाग्य, पिता, श्रद्धा, और लंबी यात्रा"},
    10: {"en": "your work, your name, and where you reach",
         "hi": "आपका काम, नाम, और आप कहाँ पहुँचते हैं"},
    11: {"en": "income, gains, and older siblings",
         "hi": "आमदनी, लाभ, और बड़े भाई-बहन"},
    12: {"en": "expense, sleep, and letting go",
         "hi": "खर्च, नींद, और छोड़ना"},
    3:  {"en": "courage, effort, and younger siblings",
         "hi": "हिम्मत, मेहनत, और छोटे भाई-बहन"},
}

GRAHA_PLAIN = {
    "Surya":   {"en": "confidence and standing", "hi": "आत्मविश्वास और मान"},
    "Chandra": {"en": "your mood and peace",     "hi": "आपका मन और शांति"},
    "Mangal":  {"en": "energy and fight",        "hi": "जोश और लड़ने की ताकत"},
    "Budh":    {"en": "thinking and talking",    "hi": "सोच और बोलचाल"},
    "Guru":    {"en": "growth and good sense",   "hi": "बढ़ोतरी और समझ"},
    "Shukra":  {"en": "comfort and relationships","hi": "आराम और रिश्ते"},
    "Shani":   {"en": "patience and slow work",  "hi": "धैर्य और धीमा काम"},
    "Rahu":    {"en": "restlessness and wanting more", "hi": "बेचैनी और और पाने की चाह"},
    "Ketu":    {"en": "detachment and letting go","hi": "मोह छूटना"},
}

ORD_EN = {1:"first",2:"second",3:"third",4:"fourth",5:"fifth",6:"sixth",
          7:"seventh",8:"eighth",9:"ninth",10:"tenth",11:"eleventh",12:"twelfth"}
ORD_HI = {1:"पहले",2:"दूसरे",3:"तीसरे",4:"चौथे",5:"पाँचवें",6:"छठे",
          7:"सातवें",8:"आठवें",9:"नवें",10:"दसवें",11:"ग्यारहवें",12:"बारहवें"}


# ---------------------------------------------------------- transits & doshas
def transits(when=None):
    """Where the grahas are right now (sidereal)."""
    d = when or datetime.utcnow()
    jd = swe.julday(d.year, d.month, d.day, d.hour + d.minute / 60)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED
    out = {}
    for name, pid, dev in PLANETS:
        vals, _ = swe.calc_ut(jd, pid, flags)
        p = _place(vals[0])
        p["dev"] = dev
        p["retro"] = vals[3] < 0 and name not in ("Surya", "Chandra")
        out[name] = p
    k = _place(out["Rahu"]["longitude"] + 180)
    k.update(dev="के", retro=True)
    out["Ketu"] = k
    out["Rahu"]["retro"] = True
    return out


def sade_sati(natal_moon_rashi, tr):
    """Shani over the 12th, 1st or 2nd from the natal Moon."""
    offset = (tr["Shani"]["rashi"] - natal_moon_rashi) % 12
    phases = {11: ("first", "पहला"), 0: ("peak", "शिखर"), 1: ("last", "अंतिम")}
    if offset in phases:
        en_ph, hi_ph = phases[offset]
        return {"active": True, "phase": en_ph,
                "en": f"Saturn is in the {en_ph} phase of your Sade Sati — the "
                      "seven-and-a-half-year passage over your Moon. Effort feels heavier "
                      "than it should; results still come, just later than you expect.",
                "hi": f"शनि आपकी साढ़ेसाती के {hi_ph} चरण में है — चंद्रमा पर साढ़े "
                      "सात साल का गोचर। मेहनत ज़्यादा लगती है; फल मिलता है, पर देर से।"}
    if offset in (3, 7):
        return {"active": True, "phase": "dhaiya",
                "en": "Saturn is in Dhaiya — the two-and-a-half-year phase from your Moon. "
                      "Lighter than Sade Sati, but the same slowness applies.",
                "hi": "शनि ढैय्या में है — चंद्रमा से ढाई साल का चरण। साढ़ेसाती से "
                      "हल्का, पर धीमापन वैसा ही है।"}
    return {"active": False,
            "en": "Saturn is not in Sade Sati or Dhaiya for you right now.",
            "hi": "अभी आपकी साढ़ेसाती या ढैय्या नहीं चल रही।"}


def doshas(P):
    out = []
    if P["Mangal"]["house"] in (1, 2, 4, 7, 8, 12):
        out.append({"key": "mangal",
            "name": {"en": "Mangal dosha", "hi": "मंगल दोष"},
            "en": f"Mars sits in house {P['Mangal']['house']}, one of the six placements "
                  "traditionally counted as Mangal dosha. The classical texts also list "
                  "cancellations — an astrologer should check those against your chart "
                  "before you treat this as settled.",
            "hi": f"मंगल {ORD_HI[P['Mangal']['house']]} भाव में है, जो मंगल दोष के छह "
                  "स्थानों में एक है। शास्त्रों में इसके भंग भी बताए गए हैं — इसे "
                  "अंतिम मानने से पहले किसी ज्योतिषी से ज़रूर जाँच करवाएँ।"})

    ra, ke = P["Rahu"]["longitude"], P["Ketu"]["longitude"]
    lo, hi = min(ra, ke), max(ra, ke)
    others = [v["longitude"] for k, v in P.items() if k not in ("Rahu", "Ketu")]
    if all(lo < x < hi for x in others) or all(not (lo < x < hi) for x in others):
        out.append({"key": "kaalsarp",
            "name": {"en": "Kaal Sarp yoga", "hi": "काल सर्प योग"},
            "en": "All seven grahas fall on one side of the Rahu–Ketu axis. This is "
                  "commonly read as blocked momentum — though it is a modern reading "
                  "rather than a classical one, and many charts carry it without incident.",
            "hi": "सातों ग्रह राहु–केतु की एक ही ओर हैं। इसे रुकी हुई गति माना "
                  "जाता है — पर यह आधुनिक मान्यता है, शास्त्रीय नहीं, और बहुत लोगों "
                  "की कुंडली में बिना किसी असर के मौजूद रहता है।"})
    return out


def antardasha(maha):
    """Sub-period inside the running mahadasha."""
    lord = maha["lord"]
    cursor = datetime.fromisoformat(maha["start"])
    total = DASHA_YEARS[lord]
    i = DASHA_LORDS.index(lord)
    seq = []
    for n in range(9):
        sub = DASHA_LORDS[(i + n) % 9]
        yrs = total * DASHA_YEARS[sub] / 120
        end = cursor + timedelta(days=yrs * 365.25)
        seq.append({"lord": sub, "start": cursor.date().isoformat(),
                    "end": end.date().isoformat()})
        cursor = end
    today = datetime.now().date().isoformat()
    for a in seq:
        if a["start"] <= today <= a["end"]:
            return a, seq
    return None, seq


NAK_HI = {"Ashwini":"अश्विनी","Bharani":"भरणी","Krittika":"कृत्तिका","Rohini":"रोहिणी",
"Mrigashira":"मृगशिरा","Ardra":"आर्द्रा","Punarvasu":"पुनर्वसु","Pushya":"पुष्य",
"Ashlesha":"आश्लेषा","Magha":"मघा","Purva Phalguni":"पूर्वा फाल्गुनी",
"Uttara Phalguni":"उत्तरा फाल्गुनी","Hasta":"हस्त","Chitra":"चित्रा","Swati":"स्वाति",
"Vishakha":"विशाखा","Anuradha":"अनुराधा","Jyeshtha":"ज्येष्ठा","Mula":"मूल",
"Purva Ashadha":"पूर्वाषाढ़ा","Uttara Ashadha":"उत्तराषाढ़ा","Shravana":"श्रवण",
"Dhanishta":"धनिष्ठा","Shatabhisha":"शतभिषा","Purva Bhadrapada":"पूर्व भाद्रपद",
"Uttara Bhadrapada":"उत्तर भाद्रपद","Revati":"रेवती"}


def panchang(tr, when=None):
    d = when or datetime.now()
    diff = (tr["Chandra"]["longitude"] - tr["Surya"]["longitude"]) % 360
    ti = int(diff // 12)
    paksha = ("Shukla", "शुक्ल") if ti < 15 else ("Krishna", "कृष्ण")
    v_en, v_hi, v_lord = VARAS[d.weekday()]
    return {"tithi": TITHIS[ti % 15], "paksha": {"en": paksha[0], "hi": paksha[1]},
            "nakshatra": tr["Chandra"]["nakshatra"],
            "nakshatraHi": NAK_HI.get(tr["Chandra"]["nakshatra"], tr["Chandra"]["nakshatra"]),
            "vara": {"en": v_en, "hi": v_hi, "lord": v_lord},
            "moonRashi": tr["Chandra"]["rashi"]}


def concern_reading(concern, P, dasha_lord=None):
    """A longer, plainer answer to the one thing they asked about."""
    c = CONCERNS.get(concern)
    if not c:
        return None

    en, hi = [], []

    # 1. name the house, say what it means, say who sits there
    for h in c["houses"]:
        occ = [k for k, v in P.items() if v["house"] == h]
        hm = HOUSE_PLAIN[h]
        if occ:
            who_en = " and ".join(GRAHA_EN[o] for o in occ)
            who_hi = " और ".join(GRAHA_HI[o] for o in occ)
            en.append(f"This question is read from your {ORD_EN[h]} house — "
                      f"that house stands for {hm['en']}. {who_en} sits there.")
            hi.append(f"यह सवाल आपके {ORD_HI[h]} भाव से देखा जाता है — "
                      f"वह भाव {hm['hi']} देखता है। वहाँ {who_hi} बैठा है।")
            for o in occ[:2]:
                gp = GRAHA_PLAIN[o]
                en.append(f"{GRAHA_EN[o]} brings {gp['en']} into that part of your life. "
                          "Whatever happens there will carry that flavour.")
                hi.append(f"{GRAHA_HI[o]} उस हिस्से में {gp['hi']} लेकर आता है। "
                          "वहाँ जो भी होगा, उसमें यही रंग रहेगा।")
            break
    else:
        h = c["houses"][0]
        hm = HOUSE_PLAIN[h]
        en.append(f"Your {ORD_EN[h]} house — the house of {hm['en']} — has no graha "
                  "in it. That is not bad news. An empty house simply means this part "
                  "of life is quieter, and is read from its lord instead.")
        hi.append(f"आपके {ORD_HI[h]} भाव में — जो {hm['hi']} देखता है — कोई ग्रह "
                  "नहीं है। यह बुरी खबर नहीं। खाली भाव का मतलब है कि यह हिस्सा "
                  "शांत है, और उसे भाव के स्वामी से पढ़ा जाता है।")

    # 2. the graha that owns this subject, and how it is sitting
    for g in c["grahas"][:2]:
        p = P[g]
        gp, hm = GRAHA_PLAIN[g], HOUSE_PLAIN[p["house"]]
        if p["house"] in DUSTHANA:
            en.append(f"{GRAHA_EN[g]} is the graha in charge of this subject — it runs {gp['en']}. "
                      f"In your chart it sits in the {ORD_EN[p['house']]} house, the house "
                      f"of {hm['en']}. That is a hard spot. Things here take longer and "
                      "cost more effort than they should. This is where the difficulty "
                      "you are feeling actually starts.")
            hi.append(f"{GRAHA_HI[g]} इस विषय का ग्रह है — यह {gp['hi']} चलाता है। "
                      f"आपकी कुंडली में यह {ORD_HI[p['house']]} भाव में है, जो {hm['hi']} "
                      "का भाव है। यह कठिन जगह है। यहाँ काम देर से बनते हैं और मेहनत "
                      "ज़्यादा लगती है। जो दिक्कत आप महसूस कर रहे हैं, वह यहीं से शुरू होती है।")
        else:
            en.append(f"{GRAHA_EN[g]} runs {gp['en']} for you, and it sits in the "
                      f"{ORD_EN[p['house']]} house — the house of {hm['en']}. This is a "
                      "workable position. The support is there in the chart, even if the "
                      "last few months have not felt like it.")
            hi.append(f"{GRAHA_HI[g]} आपके लिए {gp['hi']} चलाता है, और यह "
                      f"{ORD_HI[p['house']]} भाव में है, जो {hm['hi']} देखता है। यह ठीक "
                      "स्थिति है। कुंडली का साथ मौजूद है, भले पिछले कुछ महीने ऐसा न लगा हो।")

    # 3. tie it to the period they are actually running
    if dasha_lord:
        gp = GRAHA_PLAIN.get(dasha_lord)
        if gp:
            on_topic = dasha_lord in c["grahas"]
            if on_topic:
                en.append(f"Right now you are running the {GRAHA_EN[dasha_lord]} period, and "
                          f"{GRAHA_EN[dasha_lord]} is one of the grahas that governs this very "
                          "subject. That is why this question is on your mind now and "
                          "not two years ago.")
                hi.append(f"अभी आप {GRAHA_HI[dasha_lord]} की दशा में चल रहे हैं, और "
                          f"{GRAHA_HI[dasha_lord]} इसी विषय के ग्रहों में से एक है। इसीलिए "
                          "यह सवाल अभी आपके मन में है, दो साल पहले नहीं।")
            else:
                en.append(f"You are running the {GRAHA_EN[dasha_lord]} period, which mainly moves "
                          f"{gp['en']}. So this subject is not the main thing your chart "
                          "is working on right now — expect slow, steady movement rather "
                          "than a sudden turn.")
                hi.append(f"अभी {GRAHA_HI[dasha_lord]} की दशा चल रही है, जो मुख्य रूप से "
                          f"{gp['hi']} चलाती है। यानी अभी कुंडली का मुख्य काम यह विषय "
                          "नहीं है — अचानक बदलाव नहीं, धीरे-धीरे हलचल की उम्मीद रखें।")

    return {"key": concern, "topic": {"en": c["en"], "hi": c["hi"]},
            "lines": {"en": en, "hi": hi}}




def _join(names, lang):
    if len(names) == 1:
        return names[0]
    joiner = " और " if lang == "hi" else " and "
    return ", ".join(names[:-1]) + joiner + names[-1]



def answer_question(qid, P, dasha, maha, ss, recs):
    """Answer one specific question from the chart. Varied phrasing, no repeats."""
    q = Q_BY_ID.get(qid)
    if not q:
        return None
    en, hi = [], []

    if qid == "sadesati":
        en.append(ss["en"]); hi.append(ss["hi"])
        if ss["active"]:
            en.append("Sade Sati runs about seven and a half years in total, in three "
                      "phases. It is not a punishment — it is the period the old texts "
                      "say forces you to slow down and build properly.")
            hi.append("साढ़ेसाती कुल मिलाकर लगभग साढ़े सात साल की होती है, तीन चरणों में। "
                      "यह सज़ा नहीं है — शास्त्र कहते हैं कि यह वह समय है जो आपको धीरे "
                      "चलने और नींव मज़बूत करने पर मजबूर करता है।")
        return {"id": qid, "q": {"en": q["en"], "hi": q["hi"]},
                "lines": {"en": en, "hi": hi}}

    if qid == "paath":
        for r in recs:
            en.append(f"{r['title']['en']} — " + r["why"][0]["en"])
            hi.append(f"{r['title']['hi']} — " + r["why"][0]["hi"])
        en.append("Full method for each is on the Recitations page.")
        hi.append("दोनों की पूरी पाठ विधि 'पाठ' वाले पन्ने पर है।")
        return {"id": qid, "q": {"en": q["en"], "hi": q["hi"]},
                "lines": {"en": en, "hi": hi}}

    # --- which house answers this, and who sits there
    for h in q["houses"]:
        occ = [k for k, v in P.items() if v["house"] == h]
        hm = HOUSE_PLAIN[h]
        if occ:
            who_en = _join([GRAHA_EN[o] for o in occ], "en")
            who_hi = _join([GRAHA_HI[o] for o in occ], "hi")
            verb_en = "sits" if len(occ) == 1 else "sit"
            verb_hi = "बैठा है" if len(occ) == 1 else "बैठे हैं"
            lead = "This is read from" if h == q["houses"][0] else \
                   "Your main house for this is empty, so it is read from"
            lead_hi = "यह आपके" if h == q["houses"][0] else \
                      "इसका मुख्य भाव खाली है, इसलिए यह आपके"
            en.append(f"{lead} your {ORD_EN[h]} house, which covers "
                      f"{hm['en']}. {who_en} {verb_en} there.")
            hi.append(f"{lead_hi} {ORD_HI[h]} भाव से देखा जाता है, जो {hm['hi']} "
                      f"देखता है। वहाँ {who_hi} {verb_hi}।")
            o = occ[0]
            gp = GRAHA_PLAIN[o]
            hard = o in ("Shani", "Rahu", "Ketu", "Mangal")
            if hard:
                en.append(f"{GRAHA_EN[o]} there means {gp['en']} colours this area. "
                          "That usually shows up as delay or friction — not failure, "
                          "but nothing here comes easily or on the first try.")
                hi.append(f"वहाँ {GRAHA_HI[o]} होने का मतलब है कि इस हिस्से पर "
                          f"{gp['hi']} का रंग है। यह आम तौर पर देरी या रगड़ बनकर आता "
                          "है — नाकामी नहीं, पर यहाँ कुछ भी पहली बार में आसानी से नहीं होता।")
            else:
                en.append(f"{GRAHA_EN[o]} there brings {gp['en']} to this area. That is "
                          "a helpful placement — it softens whatever else is going on here.")
                hi.append(f"वहाँ {GRAHA_HI[o]} होने से इस हिस्से में {gp['hi']} आता है। "
                          "यह मददगार स्थिति है — यहाँ जो और चल रहा हो, यह उसे हल्का करता है।")
            break
    else:
        h = q["houses"][0]
        hm = HOUSE_PLAIN[h]
        en.append(f"Your {ORD_EN[h]} house, which covers {hm['en']}, has no graha in "
                  "it. That is neutral, not bad — it means this area moves quietly "
                  "rather than dramatically.")
        hi.append(f"आपके {ORD_HI[h]} भाव में, जो {hm['hi']} देखता है, कोई ग्रह नहीं "
                  "है। यह बुरा नहीं — इसका मतलब है कि यह हिस्सा शोर मचाए बिना, "
                  "चुपचाप चलता है।")

    # --- the graha that owns the subject. Two grahas, two different sentences.
    for idx, g in enumerate(q["grahas"][:2]):
        pl = P[g]
        gp, hm = GRAHA_PLAIN[g], HOUSE_PLAIN[pl["house"]]
        weak = pl["house"] in DUSTHANA or g in ("Rahu", "Ketu", "Shani")
        if idx == 0:
            if weak:
                en.append(f"{GRAHA_EN[g]} decides this matter, and in your chart it is "
                          f"in the {ORD_EN[pl['house']]} house — {hm['en']}. That is a "
                          "weak spot, and it is the main reason this question troubles you.")
                hi.append(f"इस मामले का फैसला {GRAHA_HI[g]} करता है, और आपकी कुंडली में "
                          f"यह {ORD_HI[pl['house']]} भाव में है — {hm['hi']}। यह कमज़ोर "
                          "जगह है, और यही मुख्य वजह है कि यह सवाल आपको परेशान करता है।")
            else:
                en.append(f"{GRAHA_EN[g]} decides this matter, and it sits in the "
                          f"{ORD_EN[pl['house']]} house — {hm['en']}. It is not under "
                          "pressure. Whatever is going wrong here is circumstance, not "
                          "your chart.")
                hi.append(f"इस मामले का फैसला {GRAHA_HI[g]} करता है, और यह "
                          f"{ORD_HI[pl['house']]} भाव में है — {hm['hi']}। यह दबाव में "
                          "नहीं है। यहाँ जो गड़बड़ हो रही है, वह हालात की है, कुंडली की नहीं।")
        else:
            if weak:
                en.append(f"{GRAHA_EN[g]} also has a say here, and it is placed in the "
                          f"{ORD_EN[pl['house']]} house. Two weak signals on one question "
                          "means patience, not panic — this is a long fix, not a quick one.")
                hi.append(f"{GRAHA_HI[g]} का भी इसमें हाथ है, और वह {ORD_HI[pl['house']]} "
                          "भाव में है। एक ही सवाल पर दो कमज़ोर संकेत का मतलब है धैर्य, "
                          "घबराहट नहीं — यह लंबा सुधार है, जल्दी वाला नहीं।")
            else:
                en.append(f"{GRAHA_EN[g]} supports this side of your life from the "
                          f"{ORD_EN[pl['house']]} house. So the chart is not against you "
                          "here, even when the last stretch has felt otherwise.")
                hi.append(f"{GRAHA_HI[g]} इस पक्ष को {ORD_HI[pl['house']]} भाव से सहारा "
                          "देता है। यानी कुंडली आपके खिलाफ नहीं है, भले पिछला दौर ऐसा "
                          "महसूस हुआ हो।")

    # --- when. This is what people actually came for.
    if maha:
        lord = maha["lord"]
        on_topic = lord in q["grahas"]
        gp = GRAHA_PLAIN.get(lord, {"en": "its own themes", "hi": "अपने विषय"})
        if on_topic:
            en.append(f"You are running the {GRAHA_EN[lord]} period until "
                      f"{maha['end'][:4]}, and {GRAHA_EN[lord]} is one of the grahas "
                      "behind this very question. This is the window where movement "
                      "here is most likely.")
            hi.append(f"आप {maha['end'][:4]} तक {GRAHA_HI[lord]} की दशा में हैं, और "
                      f"{GRAHA_HI[lord]} इसी सवाल के ग्रहों में से एक है। हलचल की सबसे "
                      "ज़्यादा संभावना इसी दौर में है।")
        else:
            nxt = None
            for m in dasha:
                if m["start"] > maha["start"] and m["lord"] in q["grahas"]:
                    nxt = m; break
            en.append(f"The {GRAHA_EN[lord]} period runs until {maha['end'][:4]} and "
                      f"mostly moves {gp['en']} — not this. "
                      + (f"The {GRAHA_EN[nxt['lord']]} period from {nxt['start'][:4]} "
                         "is the one that touches this question directly."
                         if nxt else "Expect steady, unhurried movement here for now."))
            hi.append(f"{GRAHA_HI[lord]} की दशा {maha['end'][:4]} तक है और वह मुख्य रूप "
                      f"से {gp['hi']} चलाती है — यह नहीं। "
                      + (f"{nxt['start'][:4]} से शुरू होने वाली {GRAHA_HI[nxt['lord']]} "
                         "की दशा इस सवाल को सीधे छूती है।"
                         if nxt else "फ़िलहाल यहाँ धीमी, बिना जल्दबाज़ी वाली हलचल की उम्मीद रखें।"))

    return {"id": qid, "q": {"en": q["en"], "hi": q["hi"]},
            "lines": {"en": en, "hi": hi}}


def openrouter_answer(answer, P, chart, maha, lang):
    if not OPENROUTER_API_KEY or not answer:
        return answer

    q = answer["q"].get(lang) or answer["q"]["en"]
    base = answer["lines"].get(lang) or answer["lines"]["en"]
    planets = [
        f"{k}: {v['rashiName']} rashi, house {v['house']}, "
        f"{'retrograde' if v.get('retro') else 'direct'}"
        for k, v in P.items()
    ]
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a careful Vedic astrology assistant for SanskritAgain. "
                    "Use only the chart facts provided. Do not invent exact events, "
                    "medical/legal/financial guarantees, or fear-based claims. "
                    "Answer warmly in Hindi if lang=hi, otherwise English. "
                    "Return JSON only: {\"lines\":[\"...\", \"...\", \"...\"]}. "
                    "Each line should be plain, useful, and under 220 characters."
                )
            },
            {
                "role": "user",
                "content": json.dumps({
                    "lang": lang,
                    "question": q,
                    "lagna": chart["lagna"]["rashiName"],
                    "moon_nakshatra": P["Chandra"]["nakshatra"],
                    "current_dasha": maha,
                    "planets": planets,
                    "base_answer": base
                }, ensure_ascii=False)
            }
        ],
        "temperature": 0.55,
        "max_tokens": 420
    }
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://astro.sanskritagain.com",
            "X-Title": "SanskritAgain Astro"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            data = json.loads(r.read().decode("utf-8"))
        content = data["choices"][0]["message"]["content"]
        if "thinking process" in content.lower():
            return answer
        try:
            cleaned = content.strip()
            if cleaned.startswith("```"):
                start = cleaned.find("{")
                end = cleaned.rfind("}") + 1
                cleaned = cleaned[start:end] if start >= 0 and end > start else cleaned
            parsed = json.loads(cleaned)
            raw_lines = parsed.get("lines", [])
        except json.JSONDecodeError:
            raw_lines = [line for line in content.splitlines()
                         if line.strip() and not line.strip().startswith("```")]
        lines = [str(x).strip(" -•\t")[:320] for x in raw_lines if str(x).strip(" -•\t")]
        if len(lines) >= 2:
            enriched = dict(answer)
            enriched["lines"] = dict(answer["lines"])
            enriched["lines"][lang] = lines[:5]
            enriched["engine"] = "openrouter"
            return enriched
    except Exception as e:
        print("OPENROUTER answer failed:", e)
    return answer


# 27 nakshatras: ruling graha and what the old texts say the person is like
NAK_INFO = {
"Ashwini":("Ketu","quick to start, quick to heal","शुरू करने और सँभलने में तेज़"),
"Bharani":("Shukra","carries weight others put down","जो बोझ दूसरे छोड़ देते हैं, वह उठाते हैं"),
"Krittika":("Surya","sharp, cuts through pretence","तेज़, दिखावा काट देते हैं"),
"Rohini":("Chandra","draws people and comfort in","लोगों और आराम को खींचते हैं"),
"Mrigashira":("Mangal","always searching for the next thing","हमेशा अगली चीज़ की खोज में"),
"Ardra":("Rahu","storms first, clarity after","पहले तूफ़ान, फिर साफ़ाई"),
"Punarvasu":("Guru","returns and rebuilds, again and again","बार-बार लौटकर फिर से बनाते हैं"),
"Pushya":("Shani","feeds and protects others","दूसरों को पालते और बचाते हैं"),
"Ashlesha":("Budh","reads people before they speak","बोलने से पहले लोगों को पढ़ लेते हैं"),
"Magha":("Ketu","carries the family name","परिवार का नाम ढोते हैं"),
"Purva Phalguni":("Shukra","made for rest and pleasure","आराम और सुख के लिए बने"),
"Uttara Phalguni":("Surya","keeps the promise given","दिया हुआ वचन निभाते हैं"),
"Hasta":("Chandra","builds with the hands","हाथों से बनाते हैं"),
"Chitra":("Mangal","makes things beautiful","चीज़ों को सुंदर बनाते हैं"),
"Swati":("Rahu","bends but does not break","झुकते हैं, टूटते नहीं"),
"Vishakha":("Guru","fixed on one goal","एक लक्ष्य पर टिके"),
"Anuradha":("Shani","keeps friendships alive","दोस्ती निभाते हैं"),
"Jyeshtha":("Budh","takes charge, carries the cost","कमान लेते हैं, कीमत भी चुकाते हैं"),
"Mula":("Ketu","digs down to the root","जड़ तक खोदते हैं"),
"Purva Ashadha":("Shukra","cannot be talked out of it","बात से टाले नहीं जाते"),
"Uttara Ashadha":("Surya","wins slowly and keeps it","धीरे जीतते हैं, टिकाए रखते हैं"),
"Shravana":("Chandra","listens more than speaks","बोलने से ज़्यादा सुनते हैं"),
"Dhanishta":("Mangal","keeps rhythm, gets things done","लय बनाए रखते हैं, काम करवा लेते हैं"),
"Shatabhisha":("Rahu","heals, and keeps distance","चंगा करते हैं, दूरी भी रखते हैं"),
"Purva Bhadrapada":("Guru","intense, sees the other side","गहरे, दूसरा पहलू देख लेते हैं"),
"Uttara Bhadrapada":("Shani","calm on top, deep underneath","ऊपर से शांत, भीतर गहरे"),
"Revati":("Budh","sees people safely across","लोगों को पार लगाते हैं"),
}


def nakshatra_card(P):
    ch = P["Chandra"]
    name = ch["nakshatra"]
    lord, en, hi = NAK_INFO.get(name, ("Chandra", "", ""))
    return {"name": name, "pada": ch["pada"], "lord": lord,
            "lordHi": GRAHA_HI.get(lord, lord),
            "en": f"Your Moon sits in {name}, pada {ch['pada']}. Its lord is "
                  f"{GRAHA_EN.get(lord, lord)}. People born under it are said to be {en}.",
            "nameHi": NAK_HI.get(name, name),
            "hi": f"आपका चंद्रमा {NAK_HI.get(name, name)} नक्षत्र, {ch['pada']} पाद में है। इसका स्वामी "
                  f"{GRAHA_HI.get(lord, lord)} है। इस नक्षत्र वालों के बारे में कहा जाता है — {hi}।"}


def today_reading(P, tr, pan, ss):
    """What today actually is for this chart. No fixed text."""
    natal = P["Chandra"]["rashi"]
    off = (tr["Chandra"]["rashi"] - natal) % 12
    # the Moon's distance from your natal Moon is the oldest daily indicator
    mood = {
        0:  ("The Moon is back on your own Moon today. You will feel more like "
             "yourself than usual — a good day to decide something.",
             "आज चंद्रमा आपके अपने चंद्र पर है। आज आप ज़्यादा अपने जैसे महसूस करेंगे — "
             "कुछ तय करने के लिए अच्छा दिन।"),
        3:  ("The Moon sits fourth from yours — home pulls at you today. Small "
             "domestic things will take more attention than they deserve.",
             "चंद्रमा आपके चंद्र से चौथे है — आज घर खींचेगा। घर की छोटी बातें ज़रूरत "
             "से ज़्यादा ध्यान माँगेंगी।"),
        5:  ("The Moon is sixth from yours. Friction is likely — with people, with "
             "paperwork, with the body. Nothing lasting; it moves in a day.",
             "चंद्रमा आपके चंद्र से छठे है। आज रगड़ की संभावना है — लोगों से, कागज़ों "
             "से, या शरीर से। टिकने वाली बात नहीं, एक दिन में बदल जाएगी।"),
        7:  ("The Moon is eighth from yours — the day feels heavier than it is. "
             "Postpone anything that can wait.",
             "चंद्रमा आपके चंद्र से आठवें है — दिन असल से ज़्यादा भारी लगेगा। जो टल "
             "सकता है, टाल दीजिए।"),
        11: ("The Moon is twelfth from yours. Energy runs low and sleep matters "
             "more today. Do less, and do it slowly.",
             "चंद्रमा आपके चंद्र से बारहवें है। आज ऊर्जा कम रहेगी और नींद ज़्यादा "
             "मायने रखेगी। कम कीजिए, और धीरे कीजिए।"),
    }
    if off in mood:
        en, hi = mood[off]
    elif off in (2, 6, 10):
        en = ("The Moon is in a supportive spot from yours today — conversations "
              "land better than usual. Use it for the call you have been avoiding.")
        hi = ("आज चंद्रमा आपके चंद्र से अच्छी जगह पर है — बातचीत आम दिनों से बेहतर "
              "बनेगी। जो बात टाल रहे थे, आज कर लीजिए।")
    else:
        en = ("The Moon is in a neutral position from yours today. An ordinary day "
              "— which the old texts treat as the best kind.")
        hi = ("आज चंद्रमा आपके चंद्र से सामान्य स्थिति में है। साधारण दिन — और "
              "शास्त्र साधारण दिन को ही सबसे अच्छा मानते हैं।")

    # today's weekday lord decides today's short practice
    vara_lord = pan["vara"]["lord"]
    practice = {"Mangal": "hanuman_chalisa", "Shani": "sunderkand",
                "Guru": "vishnu_sahasranama", "Shukra": "lalita_sahasranama",
                "Chandra": "lalita_sahasranama", "Surya": "vishnu_sahasranama",
                "Budh": "chalisa_sangrah"}.get(vara_lord, "hanuman_chalisa")
    pr = PRODUCTS[practice]

    retro = [GRAHA_EN[k] for k, v in tr.items() if v["retro"] and k not in ("Rahu", "Ketu")]
    retro_hi = [GRAHA_HI[k] for k, v in tr.items() if v["retro"] and k not in ("Rahu", "Ketu")]
    if retro:
        en += (f" {_join(retro, 'en')} " + ("is" if len(retro) == 1 else "are")
               + " retrograde right now — expect old matters to come back for a second look.")
        hi += (f" अभी {_join(retro_hi, 'hi')} वक्री " + ("है" if len(retro) == 1 else "हैं")
               + " — पुरानी बातें दोबारा सामने आ सकती हैं।")

    return {"en": en, "hi": hi,
            "practice": {"key": practice, "handle": pr["handle"],
                         "title": pr["title"], "vidhi": pr["vidhi"],
                         "varaLord": vara_lord}}

# ============================================================== guna milan
# Ashtakoot: eight kootas, 36 points. One traditional method among several.

VARNA_BY_RASHI = {3: 4, 7: 4, 11: 4,        # water  -> Brahmin
                  0: 3, 4: 3, 8: 3,          # fire   -> Kshatriya
                  1: 2, 5: 2, 9: 2,          # earth  -> Vaishya
                  2: 1, 6: 1, 10: 1}         # air    -> Shudra

VASHYA_GROUP = {0: "chatush", 1: "chatush", 2: "manava", 3: "jala", 4: "vana",
                5: "manava", 6: "manava", 7: "keeta", 8: "manava", 9: "jala",
                10: "manava", 11: "jala"}
VASHYA_PTS = {
    ("chatush", "chatush"): 2, ("manava", "manava"): 2, ("jala", "jala"): 2,
    ("vana", "vana"): 2, ("keeta", "keeta"): 2,
    ("chatush", "jala"): 1, ("jala", "chatush"): 1,
    ("manava", "jala"): 1, ("jala", "manava"): 1,
    ("chatush", "manava"): 1, ("manava", "chatush"): 1,
    ("chatush", "vana"): 0, ("vana", "chatush"): 0,
    ("keeta", "jala"): 1, ("jala", "keeta"): 1,
}

# nakshatra index -> yoni animal
YONI = ["horse","elephant","sheep","snake","snake","dog","cat","sheep","cat",
        "rat","rat","cow","buffalo","tiger","buffalo","tiger","deer","deer",
        "dog","monkey","mongoose","monkey","lion","horse","lion","cow","elephant"]
YONI_ENEMY = {("cow","tiger"),("elephant","lion"),("horse","buffalo"),
              ("dog","deer"),("snake","mongoose"),("monkey","sheep"),
              ("cat","rat"),("lion","elephant"),("tiger","cow")}

RASHI_LORD = ["Mangal","Shukra","Budh","Chandra","Surya","Budh",
              "Shukra","Mangal","Guru","Shani","Shani","Guru"]
FRIENDS = {
    "Surya":   {"f": {"Chandra","Mangal","Guru"},  "e": {"Shukra","Shani"}},
    "Chandra": {"f": {"Surya","Budh"},             "e": set()},
    "Mangal":  {"f": {"Surya","Chandra","Guru"},   "e": {"Budh"}},
    "Budh":    {"f": {"Surya","Shukra"},           "e": {"Chandra"}},
    "Guru":    {"f": {"Surya","Chandra","Mangal"}, "e": {"Budh","Shukra"}},
    "Shukra":  {"f": {"Budh","Shani"},             "e": {"Surya","Chandra"}},
    "Shani":   {"f": {"Budh","Shukra"},            "e": {"Surya","Chandra","Mangal"}},
}

GANA = (["dev","manushya","rakshasa","manushya","dev","manushya","dev","dev",
         "rakshasa","rakshasa","manushya","manushya","dev","rakshasa","dev",
         "rakshasa","dev","rakshasa","rakshasa","manushya","manushya","dev",
         "rakshasa","rakshasa","manushya","manushya","dev"])

NADI = ["adi","madhya","antya","adi","madhya","antya","adi","madhya","antya",
        "antya","madhya","adi","antya","madhya","adi","antya","madhya","adi",
        "adi","madhya","antya","adi","madhya","antya","adi","madhya","antya"]


def _varna(b, g):
    pts = 1 if VARNA_BY_RASHI[g] >= VARNA_BY_RASHI[b] else 0
    return pts, 1


def _vashya(b, g):
    pair = (VASHYA_GROUP[g], VASHYA_GROUP[b])
    return VASHYA_PTS.get(pair, 0.5), 2


def _tara(bn, gn):
    def ok(frm, to):
        return ((to - frm) % 27 + 1) % 9 not in (3, 5, 7)
    good = ok(bn, gn) + ok(gn, bn)
    return {2: 3, 1: 1.5, 0: 0}[good], 3


def _yoni(bn, gn):
    a, b = YONI[bn], YONI[gn]
    if a == b:
        return 4, 4
    if (a, b) in YONI_ENEMY or (b, a) in YONI_ENEMY:
        return 0, 4
    return 2, 4


def _maitri(b, g):
    lb, lg = RASHI_LORD[b], RASHI_LORD[g]
    if lb == lg:
        return 5, 5

    def rel(x, y):
        if y in FRIENDS[x]["f"]:
            return "f"
        if y in FRIENDS[x]["e"]:
            return "e"
        return "n"
    r1, r2 = rel(lb, lg), rel(lg, lb)
    table = {("f","f"):5, ("f","n"):4, ("n","f"):4, ("n","n"):3,
             ("f","e"):1, ("e","f"):1, ("n","e"):0.5, ("e","n"):0.5, ("e","e"):0}
    return table[(r1, r2)], 5


def _gana(bn, gn):
    a, b = GANA[bn], GANA[gn]
    if a == b:
        return 6, 6
    pair = {a, b}
    if pair == {"dev", "manushya"}:
        return 5, 6
    if pair == {"manushya", "rakshasa"}:
        return 1, 6
    return 0, 6


def _bhakoot(b, g):
    d1, d2 = (g - b) % 12 + 1, (b - g) % 12 + 1
    bad = {(6, 8), (8, 6), (9, 5), (5, 9), (12, 2), (2, 12)}
    return (0 if (d1, d2) in bad else 7), 7


def _nadi(bn, gn):
    return (0 if NADI[bn] == NADI[gn] else 8), 8


KOOT_NAMES = {
    "varna":   ("Varna", "वर्ण", "temperament and outlook",
                "स्वभाव और सोच"),
    "vashya":  ("Vashya", "वश्य", "who gives way to whom",
                "कौन किसकी बात मानेगा"),
    "tara":    ("Tara", "तारा", "health and general fortune",
                "सेहत और भाग्य"),
    "yoni":    ("Yoni", "योनि", "physical compatibility",
                "शारीरिक अनुकूलता"),
    "maitri":  ("Graha Maitri", "ग्रह मैत्री", "mental friendship",
                "मानसिक मेल"),
    "gana":    ("Gana", "गण", "nature and conduct",
                "स्वभाव और व्यवहार"),
    "bhakoot": ("Bhakoot", "भकूट", "prosperity of the household",
                "घर की समृद्धि"),
    "nadi":    ("Nadi", "नाड़ी", "health of children and lineage",
                "संतान और वंश का स्वास्थ्य"),
}


def guna_milan(bride, groom):
    """bride/groom: dicts with moon rashi index and nakshatra index."""
    b, g = bride["rashi"], groom["rashi"]
    bn, gn = bride["nak"], groom["nak"]

    scores = {
        "varna":   _varna(b, g),
        "vashya":  _vashya(b, g),
        "tara":    _tara(bn, gn),
        "yoni":    _yoni(bn, gn),
        "maitri":  _maitri(b, g),
        "gana":    _gana(bn, gn),
        "bhakoot": _bhakoot(b, g),
        "nadi":    _nadi(bn, gn),
    }
    total = sum(v[0] for v in scores.values())

    rows = []
    for k, (got, mx) in scores.items():
        en, hi, den, dhi = KOOT_NAMES[k]
        rows.append({"key": k, "name": {"en": en, "hi": hi},
                     "about": {"en": den, "hi": dhi},
                     "got": got, "max": mx})

    if total >= 32:
        verdict = {"en": "An unusually high score. On this method the match is "
                         "considered excellent.",
                   "hi": "बहुत ऊँचा अंक। इस पद्धति के अनुसार मिलान उत्तम माना जाता है।"}
    elif total >= 25:
        verdict = {"en": "A strong score. Most astrologers treat anything above 25 "
                         "as a good match.",
                   "hi": "अच्छा अंक। ज़्यादातर ज्योतिषी 25 से ऊपर को अच्छा मिलान मानते हैं।"}
    elif total >= 18:
        verdict = {"en": "An acceptable score. Above 18 is the usual line for going "
                         "ahead, though the individual kootas matter more than the total.",
                   "hi": "स्वीकार्य अंक। 18 से ऊपर को आम तौर पर आगे बढ़ने लायक माना "
                         "जाता है, पर कुल अंक से ज़्यादा अलग-अलग कूट मायने रखते हैं।"}
    else:
        verdict = {"en": "Below the usual threshold of 18. This does not settle the "
                         "matter — it means an astrologer should look at both charts "
                         "properly rather than at this number.",
                   "hi": "आम सीमा 18 से नीचे। इससे बात तय नहीं होती — इसका मतलब है कि "
                         "किसी ज्योतिषी को इस अंक की जगह दोनों कुंडलियाँ ठीक से देखनी चाहिए।"}

    doshas = []
    if scores["nadi"][0] == 0:
        doshas.append({"key": "nadi",
            "en": "Nadi dosha — both have the same nadi. This is the koot most "
                  "astrologers take seriously. Classical texts also list cancellations "
                  "for it, so have someone check the full charts.",
            "hi": "नाड़ी दोष — दोनों की नाड़ी एक है। ज़्यादातर ज्योतिषी इसी कूट को सबसे "
                  "गंभीरता से लेते हैं। शास्त्रों में इसके भंग भी बताए गए हैं, इसलिए "
                  "पूरी कुंडलियाँ किसी से ज़रूर दिखवाएँ।"})
    if scores["bhakoot"][0] == 0:
        doshas.append({"key": "bhakoot",
            "en": "Bhakoot dosha — the two Moon signs fall in a difficult count from "
                  "each other. It is commonly cancelled when the sign lords are "
                  "friends or the same.",
            "hi": "भकूट दोष — दोनों की चंद्र राशियाँ एक-दूसरे से कठिन गिनती में हैं। "
                  "राशि स्वामी मित्र हों या एक ही हों तो यह आम तौर पर भंग हो जाता है।"})

    return {"total": total, "max": 36, "rows": rows,
            "verdict": verdict, "doshas": doshas}



# ------------------------------------------------------------- navamsa (D9)
def navamsa(P, lagna_lon):
    """Each rashi split into nine. The chart astrologers read for marriage."""
    span = 30 / 9
    def d9(lon):
        return int((lon % 360) // span) % 12
    lag = d9(lagna_lon)
    out = []
    for k, v in P.items():
        r = d9(v["longitude"])
        out.append({"key": k, "dev": v["dev"], "rashi": r, "retro": v["retro"],
                    "house": ((r - lag) % 12) + 1})
    return {"lagna": lag, "lagnaName": RASHIS[lag], "planets": out}


# ---------------------------------------------------------------- muhurat
RIKTA = {3, 7, 12}          # 4th, 8th, 14th tithi — traditionally avoided


def muhurat(P, days=30):
    """Days in the next month that suit this chart. Moon-based, as tradition has it."""
    natal_moon = P["Chandra"]["rashi"]
    good_offsets = {0, 2, 5, 6, 9, 10}      # 1,3,6,7,10,11 from natal Moon
    hard_offsets = {3, 7, 11}               # 4,8,12 from natal Moon
    out = []
    for i in range(days):
        d = datetime.now() + timedelta(days=i)
        tr = transits(d.replace(hour=8, minute=0))
        off = (tr["Chandra"]["rashi"] - natal_moon) % 12
        diff = (tr["Chandra"]["longitude"] - tr["Surya"]["longitude"]) % 360
        ti = int(diff // 12)

        score = 0
        why_en, why_hi = [], []
        if off in good_offsets:
            score += 2
            why_en.append("Moon well placed from yours")
            why_hi.append("चंद्रमा आपके चंद्र से शुभ स्थान पर")
        elif off in hard_offsets:
            score -= 2
            why_en.append("Moon in a hard spot from yours")
            why_hi.append("चंद्रमा आपके चंद्र से कठिन स्थान पर")
        if (ti % 15) in RIKTA:
            score -= 2
            why_en.append("Rikta tithi")
            why_hi.append("रिक्ता तिथि")
        if ti == 14 or ti == 29:
            score -= 1
            why_en.append("Purnima/Amavasya")
            why_hi.append("पूर्णिमा/अमावस्या")
        if ti == 10:
            score += 1
            why_en.append("Ekadashi")
            why_hi.append("एकादशी")

        v_en, v_hi, v_lord = VARAS[d.weekday()]
        out.append({
            "date": d.date().isoformat(),
            "vara": {"en": v_en, "hi": v_hi},
            "tithi": TITHIS[ti % 15],
            "nakshatra": tr["Chandra"]["nakshatra"],
            "nakshatraHi": NAK_HI.get(tr["Chandra"]["nakshatra"], tr["Chandra"]["nakshatra"]),
            "score": score,
            "why": {"en": ", ".join(why_en) or "Ordinary day",
                    "hi": ", ".join(why_hi) or "सामान्य दिन"},
        })
    best = sorted(out, key=lambda x: (-x["score"], x["date"]))[:6]
    return {"best": sorted(best, key=lambda x: x["date"]), "all": out}


# ----------------------------------------------------------------- handler
def _moon_of(person):
    birth = datetime.strptime(f"{person['date']} {person.get('time') or '12:00'}",
                              "%Y-%m-%d %H:%M")
    ch = calculate(birth, float(person.get("tz", 5.5)),
                   float(person["lat"]), float(person["lon"]))["planets"]["Chandra"]
    return {"rashi": ch["rashi"], "rashiName": ch["rashiName"],
            "nak": NAKSHATRAS.index(ch["nakshatra"]), "nakshatra": ch["nakshatra"],
            "nakshatraHi": NAK_HI.get(ch["nakshatra"], ch["nakshatra"])}


def build_milan(body):
    b, g = body.get("bride"), body.get("groom")
    if not b or not g:
        raise ValueError("need both bride and groom")
    bm, gm = _moon_of(b), _moon_of(g)
    out = guna_milan(bm, gm)
    out["bride"], out["groom"] = bm, gm
    return out


def build_response(body):
    if body.get("mode") == "milan":
        return build_milan(body)
    for f in ("date", "lat", "lon"):
        if body.get(f) in (None, ""):
            raise ValueError(f"missing field: {f}")

    t = body.get("time") or "12:00"
    birth = datetime.strptime(f"{body['date']} {t}", "%Y-%m-%d %H:%M")
    chart = calculate(birth, float(body.get("tz", 5.5)),
                      float(body["lat"]), float(body["lon"]))

    recs, headline = recommend(chart)
    P = chart["planets"]
    tr = transits()
    pan = panchang(tr)
    maha = current_dasha(chart["dasha"])
    anta, anta_seq = antardasha(maha) if maha else (None, [])

    lang = body.get("lang") if body.get("lang") in ("en", "hi") else "en"
    ans = answer_question(body.get("question"), P, chart["dasha"], maha,
                          sade_sati(P["Chandra"]["rashi"], tr), recs)
    ans = openrouter_answer(ans, P, chart, maha, lang)

    return {
        "sadeSati": sade_sati(P["Chandra"]["rashi"], tr),
        "doshas": doshas(P),
        "antardasha": anta,
        "antardashaSeq": anta_seq[:9],
        "panchang": pan,
        "nakshatraCard": nakshatra_card(P),
        "navamsa": navamsa(P, chart["lagna"]["longitude"]),
        "muhurat": muhurat(P) if body.get("muhurat") else None,
        "today": today_reading(P, tr, pan, sade_sati(P["Chandra"]["rashi"], tr)),
        "transits": [{"key": k, "dev": v["dev"], "rashi": v["rashi"],
                      "retro": v["retro"], "lon": round(v["longitude"], 2)}
                     for k, v in tr.items()],
        "concern": concern_reading(body.get("concern"), P, maha["lord"] if maha else None),
        "questions": [{"id": q["id"], "cat": q["cat"],
                       "en": q["en"], "hi": q["hi"]} for q in QUESTIONS],
        "answer": ans,
        "lagna": {"rashi": chart["lagna"]["rashi"],
                  "rashiName": chart["lagna"]["rashiName"],
                  "degree": chart["lagna"]["degree"],
                  "nakshatra": chart["lagna"]["nakshatra"]},
        "nakshatra": chart["planets"]["Chandra"]["nakshatra"],
        "exactTime": bool(body.get("time")),
        "planets": [{"key": k, "dev": v["dev"], "rashi": v["rashi"],
                     "house": v["house"], "retro": v["retro"],
                     "degree": v["degree"], "nakshatra": v["nakshatra"],
                     "lon": round(v["longitude"], 2)}
                    for k, v in chart["planets"].items()],
        "dasha": chart["dasha"][:5],
        "currentDasha": current_dasha(chart["dasha"]),
        "recommendations": recs,
        "headline": headline,
    }


class handler(BaseHTTPRequestHandler):
    def _send(self, code, payload):
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(n) or "{}")
            self._send(200, build_response(body))
        except ValueError as e:
            self._send(400, {"error": str(e)})
        except Exception as e:                      # noqa: BLE001
            self._send(500, {"error": "chart calculation failed",
                             "detail": str(e)})

    def do_GET(self):
        self._send(200, {"ok": True,
                         "usage": "POST {date,time,lat,lon,tz}"})
