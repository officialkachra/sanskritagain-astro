/* ============================================================
   app.js — language switching + live chart from /api/chart
   ============================================================ */

/* Demo chart, shown until real birth details are entered. */
const DEMO = {
  lagna:{rashi:5, rashiName:"Kanya", nakshatra:"Hasta", degree:12.4},
  nakshatra:"Dhanishta",
  headline:{en:["Saturn sits in your","seventh house."],
            hi:["शनि आपके सातवें","भाव में बैठा है।"]},
  planets:[
    {key:"Surya", lon:47.4,  dev:"सू", rashi:1,  house:9, retro:false},
    {key:"Chandra", lon:286.2,dev:"चं", rashi:9,  house:5, retro:false},
    {key:"Mangal", lon:44.5, dev:"मं", rashi:1,  house:9, retro:false},
    {key:"Budh", lon:25.6,   dev:"बु", rashi:0,  house:8, retro:false},
    {key:"Guru", lon:253.6,   dev:"गु", rashi:8,  house:4, retro:true },
    {key:"Shukra", lon:43.0, dev:"शु", rashi:1,  house:9, retro:true },
    {key:"Shani", lon:346.6,  dev:"श",  rashi:11, house:7, retro:false},
    {key:"Rahu", lon:165.4,   dev:"रा", rashi:5,  house:1, retro:true },
    {key:"Ketu", lon:345.4,   dev:"के", rashi:11, house:7, retro:true }
  ],
  recommendations:[
    {key:"sunderkand", handle:"sunderkand", score:3,
     title:{en:"Sunderkand", hi:"सुंदरकांड"},
     sub:{en:"Hanuman · Mangal · Shani", hi:"हनुमान · मंगल · शनि"},
     why:[{en:"Saturn sits in your seventh house — partnerships and agreements take time. The effort lands; the result arrives late.",
           hi:"शनि आपके सातवें भाव में है — साझेदारी और समझौतों में समय लगता है। मेहनत पूरी होती है, फल देर से आता है।"}],
     vidhi:{en:"Tuesday or Saturday, after a morning bath. About <b>1 hour 30 minutes</b> — in one sitting, don't break in the middle. Ghee lamp, facing east.",
            hi:"मंगलवार या शनिवार, प्रातः स्नान के बाद। लगभग <b>1 घंटा 30 मिनट</b> — एक ही बैठक में, बीच में न उठें। घी का दीपक, मुख पूर्व की ओर।"}},
    {key:"vishnu_sahasranama", handle:"vishnu-sahasranama", score:2,
     title:{en:"Vishnu Sahasranama", hi:"विष्णु सहस्रनाम"},
     sub:{en:"Vishnu · Guru", hi:"विष्णु · गुरु"},
     why:[{en:"Your Jupiter sits in a strong house. This is not a weakness to fix — it is a strength to build on.",
           hi:"आपका गुरु शुभ स्थान में है। यह सुधारने वाली कमज़ोरी नहीं, बढ़ाने वाली शक्ति है।"}],
     vidhi:{en:"Thursday morning. About <b>35 minutes</b> for the full thousand names, in one sitting, facing east.",
            hi:"गुरुवार प्रातः। पूरे सहस्रनाम में लगभग <b>35 मिनट</b> — एक ही बैठक में, मुख पूर्व की ओर।"}}
  ]
};

const QUESTIONS = [
  {id:"job_change",      cat:"career", en:"Should I change my job or stay?",     hi:"नौकरी बदलूँ या टिका रहूँ?"},
  {id:"business",        cat:"career", en:"Should I start something of my own?", hi:"अपना काम शुरू करूँ?"},
  {id:"promotion",       cat:"career", en:"When will I move up at work?",        hi:"तरक्की कब मिलेगी?"},
  {id:"stuck_work",      cat:"career", en:"Why does my work keep getting stuck?",hi:"काम अटकते क्यों हैं?"},
  {id:"marriage_when",   cat:"vivah",  en:"When will I get married?",            hi:"शादी कब तक होगी?"},
  {id:"love",            cat:"vivah",  en:"Will it be a love marriage?",         hi:"प्रेम विवाह होगा?"},
  {id:"relation_tension",cat:"vivah",  en:"Why is there tension at home?",       hi:"रिश्ते में तनाव क्यों है?"},
  {id:"children",        cat:"vivah",  en:"What does the chart say about children?", hi:"संतान का योग क्या है?"},
  {id:"money_stay",      cat:"dhan",   en:"Why doesn't money stay with me?",     hi:"पैसा टिकता क्यों नहीं?"},
  {id:"loan",            cat:"dhan",   en:"When will my debt clear?",            hi:"कर्ज़ कब उतरेगा?"},
  {id:"property",        cat:"dhan",   en:"Is there a house or land in my chart?",hi:"घर या ज़मीन का योग है?"},
  {id:"foreign",         cat:"dhan",   en:"Is there foreign travel or settlement?",hi:"विदेश जाने का योग है?"},
  {id:"restless",        cat:"mann",   en:"Why does my mind stay restless?",     hi:"मन बेचैन क्यों रहता है?"},
  {id:"sleep",           cat:"mann",   en:"Why can't I sleep properly?",         hi:"नींद ठीक से क्यों नहीं आती?"},
  {id:"family",          cat:"mann",   en:"Why do family matters keep hurting?", hi:"घर की बातें क्यों चुभती हैं?"},
  {id:"health",          cat:"sehat",  en:"Why does my health stay weak?",       hi:"सेहत कमज़ोर क्यों रहती है?"},
  {id:"energy",          cat:"sehat",  en:"Why do I feel low on energy?",        hi:"थकान क्यों बनी रहती है?"},
  {id:"sadesati",        cat:"other",  en:"Is Sade Sati running, and until when?",hi:"साढ़ेसाती चल रही है? कब तक?"},
  {id:"paath",           cat:"other",  en:"Which paath is right for me?",        hi:"मेरे लिए कौन सा पाठ सही है?"}
];

let STATE = DEMO;
let LANG  = "en";

const CELLS = {
  1:[[200,52],[200,84]],    2:[[100,26],[100,56]],   3:[[34,96],[46,124]],
  4:[[128,196],[118,224]],  5:[[34,290],[46,318]],   6:[[100,352],[100,380]],
  7:[[200,306],[200,338]],  8:[[300,352],[300,380]], 9:[[366,290],[354,318]],
  10:[[272,196],[282,224]], 11:[[366,96],[354,124]], 12:[[300,26],[300,56]]
};
const RASHI_ABBR = ["Mes","Vrs","Mit","Kar","Sim","Kan","Tul","Vrc","Dha","Mak","Kum","Min"];

/* ======================= birth details + API ======================= */
function readBirth(){
  try{ return JSON.parse(sessionStorage.getItem("sa_birth") || "null"); }
  catch(e){ return null; }
}
function saveBirth(o){
  try{ sessionStorage.setItem("sa_birth", JSON.stringify(o)); }catch(e){}
}

/* Geocode a place name -> {lat, lon, tz, label}. Runs in the browser. */
async function geocode(place){
  const url = "https://geocoding-api.open-meteo.com/v1/search?count=1&format=json&name="
            + encodeURIComponent(place);
  const r = await fetch(url);
  if(!r.ok) throw new Error("geocode failed");
  const j = await r.json();
  if(!j.results || !j.results.length) throw new Error("place not found");
  const g = j.results[0];
  return {lat:g.latitude, lon:g.longitude, tzName:g.timezone,
          label:[g.name, g.admin1, g.country].filter(Boolean).join(", ")};
}

/* IANA zone -> offset in hours for that date (India has no DST, so exact). */
function tzOffsetHours(tzName, date, time){
  try{
    const d = new Date(`${date}T${time || "12:00"}:00Z`);
    const part = new Intl.DateTimeFormat("en-US",
      {timeZone:tzName, timeZoneName:"longOffset"})
      .formatToParts(d).find(p=>p.type==="timeZoneName").value;
    const m = part.match(/GMT([+-])(\d{2}):(\d{2})/);
    if(!m) return 5.5;
    return (m[1] === "-" ? -1 : 1) * (Number(m[2]) + Number(m[3])/60);
  }catch(e){ return 5.5; }
}

async function fetchChart(birth){
  const r = await fetch("/api/chart", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({date:birth.date, time:birth.time, lat:birth.lat,
                          lon:birth.lon, tz:birth.tz, concern:birth.concern,
                          question: birth.question || PICKED_Q || undefined})
  });
  const j = await r.json();
  if(!r.ok) throw new Error(j.error || "chart failed");
  return j;
}

/* ============================== theme ============================== */
function currentTheme(){
  const q = new URLSearchParams(location.search).get("theme");
  if(q === "light" || q === "dark") return q;
  try{ const t = sessionStorage.getItem("sa_theme"); if(t) return t; }catch(e){}
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light" : "dark";
}
function applyTheme(t){
  document.documentElement.setAttribute("data-theme", t);
  try{ sessionStorage.setItem("sa_theme", t); }catch(e){}
  const btn = document.getElementById("themeBtn");
  if(btn){
    btn.textContent = t === "dark" ? "\u25D1" : "\u25D0";
    btn.setAttribute("aria-label", t === "dark" ? "Switch to light" : "Switch to dark");
  }
}

/* ============================ language ============================ */
function currentLang(){
  const q = new URLSearchParams(location.search).get("lang");
  if(q === "hi" || q === "en") return q;
  return document.documentElement.getAttribute("data-default-lang") || "en";
}

function applyLang(lang){
  LANG = lang;
  const dict = I18N[lang];
  document.body.setAttribute("data-lang", lang);
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach(n=>{
    const v = dict[n.dataset.i18n];
    if(v != null) n.innerHTML = v;
  });
  document.querySelectorAll(".langtog button").forEach(b=>
    b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  document.querySelectorAll("nav a, a[data-keeplang]").forEach(a=>{
    const u = new URL(a.getAttribute("href"), location.href);
    u.searchParams.set("lang", lang);
    a.setAttribute("href", u.pathname.split("/").pop() + u.search);
  });
  renderAll();
}

/* ============================== render ============================== */
function renderAll(){
  renderChart();
  renderPlanets();
  renderRecs();
  renderHeadline();
  renderChakra();
  renderStatus();
  renderDasha();
  renderPanchang();
  renderConcern();
  renderQuestions();
  renderNakshatra();
  renderToday();
  renderYantra();
  if(window.onLangChange) window.onLangChange(LANG);
}

function renderChart(){
  const frame = document.getElementById("k-frame");
  if(frame) frame.querySelectorAll("rect,path").forEach(n=>{
    n.setAttribute("pathLength", "1");
    n.classList.add("k-draw");
  });
  const host = document.getElementById("k-cells");
  if(!host) return;
  host.textContent = "";
  const NS = "http://www.w3.org/2000/svg";
  const el = (t,a,txt)=>{ const n=document.createElementNS(NS,t);
    for(const k in a) n.setAttribute(k,a[k]);
    if(txt!=null) n.textContent=txt; return n; };

  for(let h=1; h<=12; h++){
    const [[rx,ry],[gx,gy]] = CELLS[h];
    host.appendChild(el("text",{x:rx,y:ry,"text-anchor":"middle",class:"k-rashi"},
      RASHI_ABBR[(STATE.lagna.rashi + h - 1) % 12]));
    if(h === 1)
      host.appendChild(el("text",{x:rx,y:ry-15,"text-anchor":"middle",class:"k-lagna"},"LAGNA"));

    STATE.planets.filter(p=>p.house===h).forEach((p,i)=>{
      const t = el("text",{x:gx, y:gy+i*22, "text-anchor":"middle",
        style:`animation-delay:${1.6 + h*0.07 + i*0.05}s`,
        class:"k-graha" + (p.retro ? " k-retro" : "")}, p.dev);
      t.appendChild(el("title", null, p.key + (p.retro ? " (vakri)" : "")));
      host.appendChild(t);
    });
  }
}

function renderPlanets(){
  const host = document.getElementById("planets");
  if(!host) return;
  const names = PLANET_TEXT[LANG], rashis = RASHI_TEXT[LANG];
  const retro = LANG === "hi" ? "वक्री" : "R";
  host.innerHTML = STATE.planets.map(p=>{
    const [name, desc] = names[p.key];
    return `<div class="prow">
      <div>
        <div class="pname"><span class="dev">${p.dev}</span> ${name}${
          p.retro ? `<span class="r">${retro}</span>` : ""}</div>
        <div class="pdesc">${desc}</div>
      </div>
      <div class="prashi">${rashis[p.rashi]}</div>
      <div class="phouse">H${p.house}</div>
    </div>`;
  }).join("");
}

function renderRecs(){
  const host = document.getElementById("recs");
  if(!host) return;
  const d = I18N[LANG];
  host.innerHTML = (STATE.recommendations || []).map((r,i)=>`
    <section class="rec">
      <div class="rec-rank">${String(i+1).padStart(2,"0")}</div>
      <div>
        <h3 class="display">${r.title[LANG]}</h3>
        <div class="eyebrow dim">${r.sub[LANG]}</div>
        <ul class="why">${r.why.map(w=>`<li>${w[LANG]}</li>`).join("")}</ul>
        <div class="vidhi"><span>${d["p.vidhi"]}</span>${r.vidhi[LANG]}</div>
        <a class="cta" style="margin-top:26px"
           href="https://sanskritagain.com/products/${r.handle}">${d["p.cta"]}</a>
      </div>
    </section>`).join("");
}

/* headline on the chart page reflects the actual chart */
function renderHeadline(){
  const h = STATE.headline;
  const a = document.getElementById("headA"), b = document.getElementById("headB");
  if(a && b && h){ a.textContent = h[LANG][0]; b.textContent = h[LANG][1]; }

  const eb = document.getElementById("chartEyebrow");
  if(!eb) return;
  const rashis = RASHI_TEXT[LANG];
  const lagnaName = rashis[STATE.lagna.rashi];
  eb.textContent = LANG === "hi"
    ? `${lagnaName} लग्न · ${STATE.nakshatra}`
    : `${lagnaName} lagna · ${STATE.nakshatra}`;
}

/* ============================== chakra ==============================
   Rashi wheel with each graha on its own orbit at its true longitude.
   The wheel turns slowly; glyphs counter-rotate so they stay upright.
   ==================================================================== */
const ORBIT_ORDER = ["Chandra","Budh","Shukra","Surya","Mangal","Guru","Shani","Rahu","Ketu"];

function renderChakra(){
  const svg = document.getElementById("chakra");
  if(!svg) return;
  svg.textContent = "";
  const NS = "http://www.w3.org/2000/svg";
  const el = (t,a,txt)=>{ const n=document.createElementNS(NS,t);
    for(const k in a) n.setAttribute(k,a[k]);
    if(txt!=null) n.textContent=txt; return n; };

  const C = 260, R = 236;                 // centre, outer radius
  const pos = (lon, r)=>{                 // 0 Mesha at top, clockwise
    const rad = (lon - 90) * Math.PI / 180;
    return [C + r*Math.cos(rad), C + r*Math.sin(rad)];
  };

  const spin = el("g",{class:"ck-spin"});

  spin.appendChild(el("circle",{cx:C,cy:C,r:R,class:"ck-ring"}));
  spin.appendChild(el("circle",{cx:C,cy:C,r:R-26,class:"ck-ring-gold"}));

  const rashis = RASHI_TEXT[LANG];
  for(let i=0;i<12;i++){
    const [x1,y1] = pos(i*30, R-26), [x2,y2] = pos(i*30, R);
    spin.appendChild(el("line",{x1,y1,x2,y2,class:"ck-spoke"}));

    // sector label, rotated to sit along the ring
    const mid = i*30 + 15;
    const [lx,ly] = pos(mid, R-13);
    const t = el("text",{x:lx, y:ly, class:"ck-rashi",
      "text-anchor":"middle","dominant-baseline":"central",
      transform:`rotate(${mid} ${lx} ${ly})`}, rashis[i]);
    spin.appendChild(t);
  }

  // one orbit per graha, innermost = fastest mover
  ORBIT_ORDER.forEach((key, i)=>{
    const p = STATE.planets.find(x=>x.key===key);
    if(!p) return;
    const r = 62 + i*18;
    spin.appendChild(el("circle",{cx:C,cy:C,r,class:"ck-orbit"}));

    const lon = (p.lon != null) ? p.lon : p.rashi*30 + (p.degree||15);
    const [x,y] = pos(lon, r);
    const g = el("g",{});
    g.appendChild(el("circle",{cx:x, cy:y, r:11,
      class:"ck-body" + (p.retro ? " retro" : "")}));
    // counter-rotate the glyph so it never appears upside down
    const glyph = el("text",{x, y, class:"ck-glyph" + (p.retro ? " retro" : ""),
      transform:`rotate(0 ${x} ${y})`}, p.dev);
    glyph.setAttribute("class", glyph.getAttribute("class"));
    const holder = el("g",{class:"ck-spin-back", style:`transform-origin:${x}px ${y}px`});
    holder.appendChild(glyph);
    g.appendChild(holder);
    g.appendChild(el("title",null, p.key + (p.retro ? " (vakri)" : "")));
    spin.appendChild(g);
  });

  // lagna marker
  const lagLon = STATE.lagna.rashi*30 + (STATE.lagna.degree || 0);
  const [mx1,my1] = pos(lagLon, R-30), [mx2,my2] = pos(lagLon, R+8);
  spin.appendChild(el("line",{x1:mx1,y1:my1,x2:mx2,y2:my2,class:"ck-lagna"}));

  svg.appendChild(spin);

  // still centre
  const core = el("g",{class:"ck-breathe"});
  core.appendChild(el("text",{x:C,y:C-6,class:"ck-core-big"},
    RASHI_TEXT[LANG][STATE.lagna.rashi]));
  core.appendChild(el("text",{x:C,y:C+18,class:"ck-core"},
    LANG === "hi" ? "लग्न" : "LAGNA"));
  svg.appendChild(core);
}


/* ===================== sade sati · doshas · dasha ===================== */
function saturnMark(active){
  const c = active ? "var(--sindoor)" : "var(--quiet)";
  return `<svg class="flag-mark" viewBox="0 0 44 44" aria-hidden="true">
    <circle cx="22" cy="22" r="19" fill="none" stroke="${c}" stroke-width="1"
            opacity=".4"/>
    <circle cx="22" cy="22" r="9" fill="none" stroke="${c}" stroke-width="1.2"
            style="transform-box:view-box;transform-origin:22px 22px;
                   animation:om-breathe 6s ease-in-out infinite"/>
    <ellipse cx="22" cy="22" rx="19" ry="6" fill="none" stroke="${c}"
             stroke-width="1" transform="rotate(-22 22 22)"/>
  </svg>`;
}

function renderStatus(){
  const host = document.getElementById("status-flags");
  if(!host) return;
  const d = I18N[LANG];
  let html = "";

  const ss = STATE.sadeSati;
  if(ss){
    html += `<div class="flag${ss.active ? "" : " calm"}">
      ${saturnMark(ss.active)}
      <div>
        <h3>${d["s.sadesati"]}</h3>
        <p>${ss[LANG]}</p>
      </div></div>`;
  }
  (STATE.doshas || []).forEach(x=>{
    html += `<div class="flag">
      ${saturnMark(true)}
      <div><h3>${x.name[LANG]}</h3><p>${x[LANG]}</p></div>
    </div>`;
  });
  if(ss && !ss.active && !(STATE.doshas || []).length){
    html += `<div class="flag calm">${saturnMark(false)}
      <div><h3>${d["s.clear"]}</h3><p>${d["s.clearBody"]}</p></div></div>`;
  }
  host.innerHTML = html;
}

function renderDasha(){
  const host = document.getElementById("dasha");
  if(!host) return;
  const seq = STATE.dasha || [];
  const now = STATE.currentDasha;
  const names = PLANET_TEXT[LANG];
  const today = new Date().toISOString().slice(0,10);

  host.innerHTML = seq.map(m=>{
    const running = now && m.lord === now.lord && m.start === now.start;
    let pct = 0;
    if(running){
      const a = new Date(m.start), b = new Date(m.end), t = new Date(today);
      pct = Math.max(0, Math.min(1, (t - a) / (b - a)));
    } else if(m.end < today){ pct = 1; }
    return `<div class="dbar${running ? " now" : ""}">
      <span class="lord">${names[m.lord] ? names[m.lord][0] : m.lord}</span>
      <span class="track"><span class="fill" style="transform:scaleX(${pct.toFixed(3)})"></span></span>
      <span class="yrs">${m.start.slice(0,4)}\u2013${m.end.slice(0,4)}</span>
    </div>`;
  }).join("");

  const sub = document.getElementById("antardasha");
  if(sub && STATE.antardasha && now){
    const m = names[now.lord] ? names[now.lord][0] : now.lord;
    const a = names[STATE.antardasha.lord] ? names[STATE.antardasha.lord][0] : STATE.antardasha.lord;
    sub.textContent = LANG === "hi"
      ? `${m} \u092e\u0939\u093e\u0926\u0936\u093e \u092e\u0947\u0902 ${a} \u0915\u0940 \u0905\u0902\u0924\u0930\u0926\u0936\u093e \u2014 ${STATE.antardasha.end.slice(0,7)} \u0924\u0915\u0964`
      : `${a} antardasha inside the ${m} mahadasha \u2014 until ${STATE.antardasha.end.slice(0,7)}.`;
  }
}

function renderPanchang(){
  const host = document.getElementById("panchang");
  if(!host || !STATE.panchang) return;
  const p = STATE.panchang, d = I18N[LANG];
  host.innerHTML = `
    <div class="pcell"><dt>${d["pa.vara"]}</dt><dd>${p.vara[LANG]}</dd></div>
    <div class="pcell"><dt>${d["pa.tithi"]}</dt><dd>${p.tithi}</dd></div>
    <div class="pcell"><dt>${d["pa.paksha"]}</dt><dd>${p.paksha[LANG]}</dd></div>
    <div class="pcell"><dt>${d["pa.nak"]}</dt><dd>${p.nakshatra}</dd></div>`;
}

const CONCERN_KEYS = ["career","vivah","dhan","mann","sehat"];
const CAT_ORDER = ["career","vivah","dhan","mann","sehat","other"];
let PICKED_Q = "";

function renderConcern(){
  const host = document.getElementById("answer");
  if(!host) return;
  const d = I18N[LANG];
  const ans = STATE.answer;

  if(ans){
    host.innerHTML = `<ul>${ans.lines[LANG].map(l=>`<li>${l}</li>`).join("")}</ul>`;
    host.style.borderLeftColor = "var(--gold)";
    host.style.paddingLeft = "24px";
    const ht = document.getElementById("answerTopic");
    if(ht) ht.textContent = ans.q[LANG];
    const hd = document.getElementById("answerDash");
    if(hd) hd.style.display = "";
    return;
  }

  const c = STATE.concern;
  const chosen = c ? c.key : "";

  // pickable chips, so the question can be changed right here
  const chips = `<div class="chips" id="answerChips" role="group"
      style="margin-bottom:${c ? "26px" : "0"}">` +
    CONCERN_KEYS.map(k=>`<button class="chip" data-concern="${k}"
      aria-pressed="${k === chosen}">${d["c." + k]}</button>`).join("") + `</div>`;

  const body = c
    ? `<ul>${c.lines[LANG].map(l=>`<li>${l}</li>`).join("")}</ul>`
    : `<p class="lede" style="margin:0">${d["c.lede"]}</p>`;

  host.innerHTML = chips + body;
  host.style.borderLeftColor = c ? "var(--gold)" : "transparent";
  host.style.paddingLeft = c ? "24px" : "0";

  const h = document.getElementById("answerTopic");
  if(h) h.textContent = c ? c.topic[LANG] : "";
  const dash = document.getElementById("answerDash");
  if(dash) dash.style.display = c ? "" : "none";

  host.querySelectorAll("#answerChips .chip").forEach(b=>
    b.addEventListener("click", ()=> pickConcern(b.dataset.concern)));
}

/* ---- the question list: everything people actually ask ---- */
function renderQuestions(){
  const host = document.getElementById("questions");
  if(!host) return;
  const qs = QUESTIONS;
  const d = I18N[LANG];

  host.innerHTML = `<div class="qcols">` + CAT_ORDER.map(cat=>{
    const rows = qs.filter(q=>q.cat === cat);
    if(!rows.length) return "";
    const label = cat === "other" ? d["q.other"] : d["c." + cat];
    return `<div class="qgroup">
      <p class="qcat">${label}</p>
      <div class="qlist">${rows.map(q=>`
        <button class="qrow" data-q="${q.id}" aria-pressed="${q.id === PICKED_Q}">
          <span>${q[LANG]}</span><span class="go">&rarr;</span>
        </button>`).join("")}</div>
    </div>`;
  }).join("") + `</div>`;

  host.querySelectorAll(".qrow").forEach(b=>
    b.addEventListener("click", ()=> askQuestion(b.dataset.q)));
}

async function askQuestion(qid){
  const birth = readBirth();
  if(!birth){
    try{ sessionStorage.setItem("sa_pendingQ", qid); }catch(e){}
    location.href = "index.html?lang=" + LANG + "#birth";
    return;
  }
  PICKED_Q = qid;
  const host = document.getElementById("answer");
  if(host) host.innerHTML = loaderHTML(I18N[LANG]["status.loading"]);
  document.getElementById("answerBlock").scrollIntoView({behavior:"smooth", block:"start"});
  try{
    const r = await fetch("/api/chart", {method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({date:birth.date, time:birth.time, lat:birth.lat,
                            lon:birth.lon, tz:birth.tz, question:qid})});
    const j = await r.json();
    if(!r.ok) throw new Error(j.error);
    STATE = j;
    renderAll();
  }catch(e){
    if(host) host.textContent = I18N[LANG]["status.error"];
  }
}

async function pickConcern(key){
  const birth = readBirth();
  if(!birth) return;
  birth.concern = (birth.concern === key) ? "" : key;
  saveBirth(birth);

  const host = document.getElementById("answer");
  if(host) host.innerHTML = loaderHTML(I18N[LANG]["status.loading"]);
  try{
    STATE = await fetchChart(birth);
    renderAll();
    document.getElementById("answerBlock")
      .scrollIntoView({behavior:"smooth", block:"start"});
  }catch(e){
    if(host) host.textContent = I18N[LANG]["status.error"];
  }
}


/* Dharma Chakra loader (motion library) — shown while the chart is calculated */
function loaderHTML(text){
  return `<span class="loader">
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <g class="wheel" fill="none" stroke="var(--gold)" stroke-width="1.4">
        <circle cx="30" cy="30" r="22"/><circle cx="30" cy="30" r="5"/>
        <line x1="30" y1="8" x2="30" y2="52"/><line x1="8" y1="30" x2="52" y2="30"/>
        <line x1="14" y1="14" x2="46" y2="46"/><line x1="46" y1="14" x2="14" y2="46"/>
      </g>
      <circle cx="30" cy="30" r="26" fill="none" stroke="var(--sindoor)" stroke-width="2"
              stroke-linecap="round" pathLength="1" stroke-dasharray=".7 .3"
              stroke-dashoffset="1" class="arc"/>
    </svg>
    <span>${text}</span>
  </span>`;
}


/* ---- Shri Yantra + Nakshatra (motion library) ---- */
function yantraSVG(){
  const up = [[110,34,44,168,176,168],[110,58,58,152,162,152],[110,80,70,140,150,140]];
  const dn = [[110,186,44,52,176,52],[110,162,58,68,162,68],[110,140,70,80,150,80]];
  const tri = a => `<polygon class="y-tri" points="${a[0]},${a[1]} ${a[2]},${a[3]} ${a[4]},${a[5]}"/>`;
  let lotus = "";
  for(let i=0;i<16;i++){
    const a = i*22.5*Math.PI/180;
    const x = 110+Math.cos(a)*96, y = 110+Math.sin(a)*96;
    lotus += `<circle class="y-lotus" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9"/>`;
  }
  return `<svg class="yantra" viewBox="0 0 220 220" role="img" aria-hidden="true">
    <g class="y-spin">${lotus}</g>
    <rect class="y-frame" x="18" y="18" width="184" height="184"/>
    <circle class="y-frame" cx="110" cy="110" r="82"/>
    <g class="y-pulse">${up.map(tri).join("")}${dn.map(tri).join("")}</g>
    <circle class="y-bindu" cx="110" cy="110" r="3.4"/>
  </svg>`;
}

function renderYantra(){
  const host = document.getElementById("yantra");
  if(host) host.innerHTML = yantraSVG();
}

function renderNakshatra(){
  const host = document.getElementById("nakshatra");
  if(!host) return;
  const n = STATE.nakshatraCard;
  if(!n){ host.innerHTML = ""; return; }
  const d = I18N[LANG];
  const pts = [[20,26],[38,14],[56,30],[70,20],[46,48],[28,58],[58,64],[40,76]];
  const stars = pts.map((p,i)=>
    `<circle class="n-star n-twinkle" cx="${p[0]}" cy="${p[1]}" r="${1.6 + (i%3)*0.7}"
       style="animation-delay:${(i*0.31).toFixed(2)}s"/>`).join("");
  const links = pts.slice(1).map((p,i)=>
    `<line class="n-link" x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${p[0]}" y2="${p[1]}"/>`).join("");
  const name = LANG === "hi" ? (n.nameHi || n.name) : n.name;
  const lord = LANG === "hi" ? n.lordHi : n.lord;

  host.innerHTML = `<div class="nak">
    <svg viewBox="0 0 90 90" aria-hidden="true">${links}${stars}</svg>
    <div>
      <p class="meta">${d["nk.label"]} &middot; ${d["nk.pada"]} ${n.pada} &middot; ${lord}</p>
      <h3>${name}</h3>
      <p>${n[LANG]}</p>
    </div></div>`;
}

function renderToday(){
  const host = document.getElementById("todayBody");
  if(!host || !STATE.today) return;
  host.textContent = STATE.today[LANG];
  const pr = STATE.today.practice, d = I18N[LANG];
  const box = document.getElementById("todayPractice");
  if(box && pr){
    box.innerHTML = `
      <div class="eyebrow">${d["t.do.eyebrow"]}</div>
      <h2 class="display" style="margin:12px 0 14px">${pr.title[LANG]}</h2>
      <div class="vidhi" style="margin-top:0"><span>${d["p.vidhi"]}</span>${pr.vidhi[LANG]}</div>
      <a class="cta" style="margin-top:24px"
         href="https://sanskritagain.com/products/${pr.handle}">${d["p.cta"]}</a>`;
  }
}

/* =============================== boot =============================== */
async function boot(){
  applyTheme(currentTheme());
  const tb = document.getElementById("themeBtn");
  if(tb) tb.addEventListener("click", ()=>
    applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"));

  document.querySelectorAll(".langtog button").forEach(b=>
    b.addEventListener("click", ()=> applyLang(b.dataset.lang)));
  applyLang(currentLang());

  const birth = readBirth();
  if(!birth){
    // no birth details yet — still show today's panchang and transits
    try{
      const r = await fetch("/api/chart", {method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({date:"2000-01-01", time:"12:00",
                              lat:26.9124, lon:75.7873, tz:5.5})});
      if(r.ok){
        const j = await r.json();
        STATE = Object.assign({}, DEMO,
          {panchang:j.panchang, transits:j.transits});
        renderPanchang();
        if(window.onLangChange) window.onLangChange(LANG);
      }
    }catch(e){}
    return;
  }                       // stay on the demo chart

  let pending = "";
  try{
    pending = sessionStorage.getItem("sa_pendingQ") || "";
    if(pending) sessionStorage.removeItem("sa_pendingQ");
  }catch(e){}
  if(pending){ PICKED_Q = pending; birth.question = pending; }

  const status = document.getElementById("status");
  if(status) status.innerHTML = loaderHTML(I18N[LANG]["status.loading"]);
  try{
    STATE = await fetchChart(birth);
    if(status) status.innerHTML = "";
    renderAll();
  }catch(e){
    if(status) status.textContent = I18N[LANG]["status.error"];
  }
}
document.addEventListener("DOMContentLoaded", boot);
