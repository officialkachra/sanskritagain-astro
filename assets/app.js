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
                          question: birth.question || PICKED_Q || undefined,
                          muhurat: !!document.getElementById("muhurat")})
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
  renderTriptych();
  renderNavamsa();
  renderMuhurat();
  renderPandulipi();
  renderGate();
  renderCardTabs();
  drawShareCard();
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
           href="${productURL(r.key, LANG)}">${d["p.cta"]}</a>
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

let CHAKRA_RAF = null;

function renderChakra(){
  const svg = document.getElementById("chakra");
  if(!svg) return;
  if(CHAKRA_RAF) cancelAnimationFrame(CHAKRA_RAF);
  svg.textContent = "";
  const NS = "http://www.w3.org/2000/svg";
  const el = (t,a,txt)=>{ const n=document.createElementNS(NS,t);
    for(const k in a) n.setAttribute(k,a[k]);
    if(txt!=null) n.textContent=txt; return n; };

  const C = 260, R = 236;
  // rashis increase anti-clockwise, as the chakra is always drawn
  const pos = (lon, r)=>{
    const rad = (-lon - 90) * Math.PI/180;
    return [C + r*Math.cos(rad), C + r*Math.sin(rad)];
  };

  /* ---- static sky: rashi ring, spokes, labels ---- */
  const sky = el("g", {});
  sky.appendChild(el("circle",{cx:C,cy:C,r:R,class:"ck-ring"}));
  sky.appendChild(el("circle",{cx:C,cy:C,r:R-26,class:"ck-ring-gold"}));
  const rashis = RASHI_TEXT[LANG];
  for(let i=0;i<12;i++){
    const [x1,y1] = pos(i*30, R-26), [x2,y2] = pos(i*30, R);
    sky.appendChild(el("line",{x1,y1,x2,y2,class:"ck-spoke"}));
    const mid = i*30 + 15, [lx,ly] = pos(mid, R-13);
    sky.appendChild(el("text",{x:lx,y:ly,class:"ck-rashi","text-anchor":"middle",
      "dominant-baseline":"central", transform:`rotate(${-mid} ${lx} ${ly})`}, rashis[i]));
  }
  svg.appendChild(sky);

  /* ---- one orbit per graha; inner rings move fastest, as in the sky ---- */
  const SPEED = {Chandra:1, Budh:.42, Shukra:.31, Surya:.26,
                 Mangal:.19, Guru:.09, Shani:.055, Rahu:.04, Ketu:.04};
  const bodies = [];
  ORBIT_ORDER.forEach((key, i)=>{
    const p = STATE.planets.find(x=>x.key===key);
    if(!p) return;
    const r = 62 + i*18;
    svg.appendChild(el("circle",{cx:C,cy:C,r,class:"ck-orbit"}));

    const target = (p.lon != null) ? p.lon : p.rashi*30 + (p.degree || 15);
    const g = el("g", {});
    const spoke = el("line",{x1:C,y1:C,x2:C,y2:C,class:"ck-spoke-live"});
    const disc  = el("circle",{cx:C,cy:C,r:11,
      class:"ck-body" + (p.retro ? " retro" : "")});
    const glyph = el("text",{x:C,y:C,class:"ck-glyph" + (p.retro ? " retro" : "")}, p.dev);
    glyph.appendChild(el("title", null, p.key + (p.retro ? " (vakri)" : "")));
    g.appendChild(spoke); g.appendChild(disc); g.appendChild(glyph);
    svg.appendChild(g);

    // start a few turns away so it visibly travels to where it belongs
    const turns = 2 + i*0.35;
    bodies.push({r, target, spoke, disc, glyph,
                 from: target - 360*turns*(p.retro ? -1 : 1),
                 speed: SPEED[key] || .2});
  });

  /* ---- lagna marker + still centre ---- */
  const lagLon = STATE.lagna.rashi*30 + (STATE.lagna.degree || 0);
  const [mx1,my1] = pos(lagLon, R-30), [mx2,my2] = pos(lagLon, R+8);
  svg.appendChild(el("line",{x1:mx1,y1:my1,x2:mx2,y2:my2,class:"ck-lagna"}));

  const core = el("g",{class:"ck-breathe"});
  core.appendChild(el("text",{x:C,y:C-6,class:"ck-core-big"}, rashis[STATE.lagna.rashi]));
  core.appendChild(el("text",{x:C,y:C+18,class:"ck-core"},
    LANG === "hi" ? "लग्न" : "LAGNA"));
  svg.appendChild(core);

  /* ---- run the orbits, then let them settle where the chart says ---- */
  const reduce = window.matchMedia &&
                 window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const place = (b, lon, settled)=>{
    const [x,y] = pos(lon, b.r);
    b.disc.setAttribute("cx", x); b.disc.setAttribute("cy", y);
    b.glyph.setAttribute("x", x); b.glyph.setAttribute("y", y);
    b.spoke.setAttribute("x2", x); b.spoke.setAttribute("y2", y);
    b.spoke.style.opacity = settled ? .18 : .5;
  };
  if(reduce){ bodies.forEach(b=>place(b, b.target, true)); return; }

  const DUR = 3400, t0 = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);   // fast, then eases into place
  function frame(now){
    const t = Math.min(1, (now - t0) / DUR);
    const e = ease(t);
    bodies.forEach(b=>{
      const spread = (b.from - b.target) * b.speed / 1;
      place(b, b.target + spread*(1 - e), t >= 1);
    });
    if(t < 1) CHAKRA_RAF = requestAnimationFrame(frame);
    else { CHAKRA_RAF = null; svg.classList.add("settled"); }
  }
  CHAKRA_RAF = requestAnimationFrame(frame);
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
         href="${productURL(pr.key, LANG)}">${d["p.cta"]}</a>`;
  }
}


/* ================= share cards: five designs, 9:16 ================= */
const CARD_KEYS = ["nakshatra","rashi","kundli","dasha","paath"];
let CARD_PICK = "nakshatra";

const CARD_SKIN = {
  leaf: {a:"#EFE6D0", b:"#D8CAA6", ink:"#1A1710", soft:"rgba(42,36,24,.32)",
         gold:"#8A6E2A", red:"#A8390B"},
  ink:  {a:"#12130F", b:"#1C1D17", ink:"#E9DFC7", soft:"rgba(233,223,199,.22)",
         gold:"#C9A227", red:"#D4622B"}
};

function cardFonts(hi){
  return {
    disp: hi ? "'Tiro Devanagari Hindi', serif" : "'Cormorant Garamond', serif",
    dev:  "'Tiro Devanagari Sanskrit', serif",
    mono: "'IBM Plex Mono', monospace"
  };
}

function cardFrame(x, W, H, sk, title){
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, sk.a); g.addColorStop(1, sk.b);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = sk.soft; x.lineWidth = 3;
  x.strokeRect(58, 58, W-116, H-116);
  x.lineWidth = 1; x.strokeRect(78, 78, W-156, H-156);
  // corner marks — a manuscript convention, not decoration
  [[78,78,1,1],[W-78,78,-1,1],[78,H-78,1,-1],[W-78,H-78,-1,-1]].forEach(c=>{
    x.beginPath();
    x.moveTo(c[0]+c[2]*46, c[1]); x.lineTo(c[0], c[1]); x.lineTo(c[0], c[1]+c[3]*46);
    x.lineWidth = 3; x.strokeStyle = sk.gold; x.stroke();
  });
  x.textAlign = "center";
  x.fillStyle = sk.gold;
  x.font = "500 25px " + cardFonts(false).mono;
  x.fillText(title, W/2, 178);
}

function cardName(x, W, sk, name, hi, y){
  if(!name) return;
  x.fillStyle = sk.ink;
  x.font = (hi ? "400 " : "300 ") + "62px " + cardFonts(hi).disp;
  x.fillText(name, W/2, y);
}

function cardFooter(x, W, H, sk){
  x.fillStyle = sk.soft;
  x.font = "23px " + cardFonts(false).mono;
  x.fillText("ASTRO.SANSKRITAGAIN.COM", W/2, H - 140);
}

function ringOfGrahas(x, cx, cy, R, sk, small){
  const hi = LANG === "hi";
  x.strokeStyle = sk.soft; x.lineWidth = 1;
  x.beginPath(); x.arc(cx, cy, R, 0, Math.PI*2); x.stroke();
  x.beginPath(); x.arc(cx, cy, R-44, 0, Math.PI*2); x.stroke();

  const names = RASHI_TEXT[LANG];
  for(let i=0;i<12;i++){
    const a = (-i*30 - 90)*Math.PI/180;
    x.beginPath();
    x.moveTo(cx+Math.cos(a)*(R-44), cy+Math.sin(a)*(R-44));
    x.lineTo(cx+Math.cos(a)*R,      cy+Math.sin(a)*R);
    x.stroke();

    // rashi name, sitting in the band and turned to follow the ring
    const mid = -(i*30 + 15) - 90;
    const rad = mid*Math.PI/180, rr = R - 22;
    const lx = cx + Math.cos(rad)*rr, ly = cy + Math.sin(rad)*rr;
    x.save();
    x.translate(lx, ly);
    x.rotate(rad + Math.PI/2);
    x.fillStyle = sk.gold;
    x.font = (hi ? "400 " : "500 ") + (small ? 18 : 22) + "px " +
             (hi ? cardFonts(true).disp : cardFonts(false).mono);
    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(hi ? names[i] : names[i].slice(0,3).toUpperCase(), 0, 0);
    x.restore();
  }
  x.textAlign = "center"; x.textBaseline = "alphabetic";
  x.font = (small ? 46 : 58) + "px " + cardFonts(false).dev;
  (STATE.planets || []).forEach(p=>{
    const lon = (p.lon != null) ? p.lon : p.rashi*30 + (p.degree || 15);
    const a = (-lon - 90)*Math.PI/180, r = R - (small ? 86 : 106);
    x.fillStyle = p.retro ? sk.red : sk.ink;
    x.fillText(p.dev, cx+Math.cos(a)*r, cy+Math.sin(a)*r + (small ? 16 : 20));
  });
  // the lagna, marked in red on the rim
  const la = (-(STATE.lagna.rashi*30 + (STATE.lagna.degree || 0)) - 90)*Math.PI/180;
  x.strokeStyle = sk.red; x.lineWidth = 3;
  x.beginPath();
  x.moveTo(cx+Math.cos(la)*(R-50), cy+Math.sin(la)*(R-50));
  x.lineTo(cx+Math.cos(la)*(R+14), cy+Math.sin(la)*(R+14));
  x.stroke();
  x.lineWidth = 1;
  x.fillStyle = sk.red;
  x.beginPath(); x.arc(cx, cy, 8, 0, Math.PI*2); x.fill();
}

function northIndianChart(x, cx, cy, S, sk){
  const h = S/2, L = cx-h, T = cy-h;
  x.strokeStyle = sk.ink; x.lineWidth = 3;
  x.strokeRect(L, T, S, S);
  x.lineWidth = 1.6;
  x.beginPath();
  x.moveTo(L, T); x.lineTo(L+S, T+S);
  x.moveTo(L+S, T); x.lineTo(L, T+S);
  x.moveTo(L+h, T); x.lineTo(L+S, T+h); x.lineTo(L+h, T+S); x.lineTo(L, T+h); x.closePath();
  x.stroke();
  const cell = {1:[.50,.21],2:[.25,.09],3:[.09,.25],4:[.29,.50],5:[.09,.75],6:[.25,.93],
                7:[.50,.79],8:[.75,.93],9:[.91,.75],10:[.71,.50],11:[.91,.25],12:[.75,.09]};
  x.font = "40px " + cardFonts(false).dev;
  for(let hnum=1; hnum<=12; hnum++){
    const here = (STATE.planets||[]).filter(p=>p.house===hnum);
    here.forEach((p,k)=>{
      x.fillStyle = p.retro ? sk.red : sk.ink;
      x.fillText(p.dev, L + cell[hnum][0]*S, T + cell[hnum][1]*S + k*44);
    });
  }
}

function wrapText(x, text, cx, y, maxW, lh, lines){
  const words = text.split(" ");
  let line = "", out = [];
  words.forEach(w=>{
    const test = line ? line + " " + w : w;
    if(x.measureText(test).width > maxW && line){ out.push(line); line = w; }
    else line = test;
  });
  if(line) out.push(line);
  out.slice(0, lines).forEach((l,i)=> x.fillText(l, cx, y + i*lh));
  return out.length;
}

let FONTS_READY = false;
if(document.fonts && document.fonts.ready){
  document.fonts.ready.then(()=>{ FONTS_READY = true; drawShareCard(); });
}

function drawShareCard(){
  const cv = document.getElementById("shareCanvas");
  if(!cv) return;
  const W = 1080, H = 1920;
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d");
  const hi = LANG === "hi";
  const f = cardFonts(hi);
  const b = readBirth() || {};
  const name = (b.name || "").trim();
  const n = STATE.nakshatraCard;
  const rashi = RASHI_TEXT[LANG][STATE.lagna.rashi];
  const d = I18N[LANG];

  if(CARD_PICK === "nakshatra"){
    const sk = CARD_SKIN.leaf;
    cardFrame(x, W, H, sk, hi ? "जन्म नक्षत्र" : "BIRTH NAKSHATRA");
    cardName(x, W, sk, name, hi, 300);
    if(n){
      x.fillStyle = sk.ink;
      x.font = (hi ? "400 " : "300 ") + "136px " + f.disp;
      x.fillText(hi ? (n.nameHi || n.name) : n.name, W/2, 500);
      x.fillStyle = sk.gold; x.font = "500 28px " + f.mono;
      x.fillText(`${hi ? "पाद" : "PADA"} ${n.pada}  ·  ${hi ? n.lordHi : n.lord}`, W/2, 566);
      // constellation
      const pts = [[380,760],[520,690],[660,800],[760,730],[560,930],[430,1000],[690,1030]];
      x.strokeStyle = sk.soft; x.lineWidth = 1.4;
      x.beginPath(); pts.forEach((p,i)=> i ? x.lineTo(p[0],p[1]) : x.moveTo(p[0],p[1])); x.stroke();
      pts.forEach((p,i)=>{ x.fillStyle = sk.gold;
        x.beginPath(); x.arc(p[0], p[1], 5 + (i%3)*2.6, 0, Math.PI*2); x.fill(); });
      x.fillStyle = sk.ink; x.font = "34px " + f.disp; x.textAlign = "center";
      wrapText(x, (n[LANG]||"").split("—").pop().trim(), W/2, 1250, 800, 54, 4);
    }
    cardFooter(x, W, H, sk);
  }

  else if(CARD_PICK === "rashi"){
    const sk = CARD_SKIN.ink;
    cardFrame(x, W, H, sk, hi ? "लग्न राशि" : "ASCENDANT");
    cardName(x, W, sk, name, hi, 300);
    x.fillStyle = sk.ink;
    x.font = (hi ? "400 " : "300 ") + "160px " + f.disp;
    x.fillText(rashi, W/2, 520);
    ringOfGrahas(x, W/2, 1080, 330, sk, false);
    x.fillStyle = sk.gold; x.font = "500 27px " + f.mono;
    x.fillText(hi ? `चंद्र · ${RASHI_TEXT[LANG][(STATE.planets.find(p=>p.key==="Chandra")||{}).rashi ?? 0]}`
                  : `MOON · ${RASHI_TEXT.en[(STATE.planets.find(p=>p.key==="Chandra")||{}).rashi ?? 0]}`,
              W/2, 1560);
    cardFooter(x, W, H, sk);
  }

  else if(CARD_PICK === "kundli"){
    const sk = CARD_SKIN.leaf;
    cardFrame(x, W, H, sk, hi ? "जन्म कुंडली" : "JANMA KUNDLI");
    cardName(x, W, sk, name, hi, 300);
    northIndianChart(x, W/2, 1000, 720, sk);
    x.fillStyle = sk.gold; x.font = "500 27px " + f.mono;
    x.fillText(`${rashi.toUpperCase()} ${hi ? "लग्न" : "LAGNA"}`, W/2, 1500);
    if(b.date){ x.fillStyle = sk.soft; x.font = "25px " + f.mono;
      x.fillText(b.date + (b.time ? "  " + b.time : ""), W/2, 1552); }
    cardFooter(x, W, H, sk);
  }

  else if(CARD_PICK === "dasha"){
    const sk = CARD_SKIN.ink;
    cardFrame(x, W, H, sk, hi ? "वर्तमान दशा" : "CURRENT PERIOD");
    cardName(x, W, sk, name, hi, 300);
    const names = PLANET_TEXT[LANG];
    const m = STATE.currentDasha, a = STATE.antardasha;
    if(m){
      x.fillStyle = sk.ink;
      x.font = (hi ? "400 " : "300 ") + "112px " + f.disp;
      const lords = a ? `${names[m.lord][0]} / ${names[a.lord][0]}` : names[m.lord][0];
      x.fillText(lords, W/2, 560);
      x.fillStyle = sk.gold; x.font = "500 30px " + f.mono;
      if(a) x.fillText(`${a.start.slice(0,7)}  —  ${a.end.slice(0,7)}`, W/2, 630);
      // orbit motif
      x.strokeStyle = sk.soft; x.lineWidth = 1;
      [150, 230, 310].forEach(r=>{ x.beginPath(); x.arc(W/2, 1080, r, 0, Math.PI*2); x.stroke(); });
      x.fillStyle = sk.red;
      x.beginPath(); x.arc(W/2 + 230, 1080, 16, 0, Math.PI*2); x.fill();
      x.fillStyle = sk.ink; x.font = "88px " + f.dev;
      x.fillText((STATE.planets.find(p=>p.key===m.lord)||{}).dev || "", W/2, 1110);
    }
    cardFooter(x, W, H, sk);
  }

  else if(CARD_PICK === "paath"){
    const sk = CARD_SKIN.leaf;
    cardFrame(x, W, H, sk, hi ? "मेरा पाठ" : "MY RECITATION");
    cardName(x, W, sk, name, hi, 300);
    const r = (STATE.recommendations || [])[0];
    if(r){
      x.fillStyle = sk.ink;
      x.font = (hi ? "400 " : "300 ") + "104px " + f.disp;
      x.fillText(r.title[LANG], W/2, 520);
      x.fillStyle = sk.gold; x.font = "500 27px " + f.mono;
      x.fillText(r.sub[LANG], W/2, 586);
      // shri yantra motif
      const cx = W/2, cy = 1080;
      x.strokeStyle = sk.gold; x.lineWidth = 1.4;
      for(let i=0;i<16;i++){ const a=i*22.5*Math.PI/180;
        x.beginPath(); x.arc(cx+Math.cos(a)*300, cy+Math.sin(a)*300, 30, 0, Math.PI*2); x.stroke(); }
      x.strokeStyle = sk.soft;
      [[0,-250,-215,160,215,160],[0,250,-215,-160,215,-160],
       [0,-180,-155,115,155,115],[0,180,-155,-115,155,-115]].forEach(t=>{
        x.beginPath(); x.moveTo(cx+t[0],cy+t[1]); x.lineTo(cx+t[2],cy+t[3]);
        x.lineTo(cx+t[4],cy+t[5]); x.closePath(); x.stroke(); });
      x.fillStyle = sk.red;
      x.beginPath(); x.arc(cx, cy, 9, 0, Math.PI*2); x.fill();
      x.fillStyle = sk.ink; x.font = "32px " + f.disp;
      wrapText(x, (r.why[0]||{})[LANG] || "", W/2, 1520, 820, 50, 3);
    }
    cardFooter(x, W, H, sk);
  }
}

function renderCardTabs(){
  const host = document.getElementById("cardTabs");
  if(!host) return;
  const d = I18N[LANG];
  host.innerHTML = CARD_KEYS.map(k=>
    `<button class="chip" data-card="${k}" aria-pressed="${k === CARD_PICK}">${d["cd." + k]}</button>`
  ).join("");
  host.querySelectorAll(".chip").forEach(b=>
    b.addEventListener("click", ()=>{
      CARD_PICK = b.dataset.card;
      renderCardTabs();
      renderCardTabs();
  drawShareCard();
    }));
}

function downloadShare(){
  const cv = document.getElementById("shareCanvas");
  if(!cv) return;
  cv.toBlob(b=>{
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u; a.download = `meri-${CARD_PICK}.png`; a.click();
    setTimeout(()=>URL.revokeObjectURL(u), 4000);
  }, "image/png");
}

async function shareNative(){
  const cv = document.getElementById("shareCanvas");
  if(!cv) return downloadShare();
  cv.toBlob(async b=>{
    const file = new File([b], `meri-${CARD_PICK}.png`, {type:"image/png"});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      try{ await navigator.share({files:[file]}); return; }catch(e){}
    }
    downloadShare();
  }, "image/png");
}

/* ================= whatsapp number, asked once ================= */
function hasNumber(){
  try{ return !!sessionStorage.getItem("sa_wa"); }catch(e){ return false; }
}

function renderGate(){
  const host = document.getElementById("gate");
  if(!host) return;
  if(hasNumber() || !readBirth()){ host.innerHTML = ""; return; }
  const d = I18N[LANG];
  host.innerHTML = `<div class="gate">
    <h3>${d["g.h"]}</h3>
    <p>${d["g.p"]}</p>
    <div class="row">
      <input id="waNum" type="tel" inputmode="numeric" maxlength="10"
             placeholder="${d["g.ph"]}" aria-label="${d["g.ph"]}">
      <button class="cta" id="waGo">${d["g.cta"]}</button>
      <button class="skip" id="waSkip">${d["g.skip"]}</button>
    </div>
    <p class="note" id="waNote"></p>
  </div>`;

  document.getElementById("waGo").addEventListener("click", ()=>{
    const v = (document.getElementById("waNum").value || "").replace(/\D/g, "");
    const note = document.getElementById("waNote");
    if(v.length !== 10){ note.textContent = d["g.bad"]; return; }
    try{
      sessionStorage.setItem("sa_wa", v);
      const b = readBirth(); if(b){ b.wa = v; saveBirth(b); }
    }catch(e){}
    host.innerHTML = `<p class="lede" style="font-size:15px">${d["g.done"]}</p>`;

    const b = readBirth() || {}, rec = (STATE.recommendations || [])[0];
    fetch("/api/lead", {method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        wa: v, name: b.name || "", date: b.date || "", time: b.time || "",
        place: b.place || "", lang: LANG,
        lagna: STATE.lagna ? STATE.lagna.rashiName : "",
        nakshatra: STATE.nakshatraCard ? STATE.nakshatraCard.name : "",
        paath: rec ? rec.title.en : "",
        question: STATE.answer ? STATE.answer.id : ""
      })}).catch(()=>{});
  });
  document.getElementById("waSkip").addEventListener("click", ()=>{
    try{ sessionStorage.setItem("sa_wa", "skipped"); }catch(e){}
    host.innerHTML = "";
  });
}


/* ============ dasha triptych: what closed, where you are, what opens ============ */
function tripDisc(active){
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <circle class="t-ring" cx="50" cy="50" r="46"/>
    <circle class="t-disc" cx="50" cy="50" r="34" opacity="${active ? .8 : .4}"/>
    <g class="t-orbit">
      <circle class="t-ring" cx="50" cy="50" r="20"/>
      <circle class="t-dot" cx="70" cy="50" r="3.2"/>
      <circle class="t-dot" cx="50" cy="16" r="2.2" opacity=".6"/>
    </g>
    <circle class="t-dot" cx="50" cy="50" r="${active ? 4.5 : 3}"/>
  </svg>`;
}

function monthYear(iso, lang){
  const M_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const M_HI = ["जन","फ़र","मार्च","अप्रै","मई","जून","जुल","अग","सित","अक्तू","नव","दिस"];
  const [y, m] = iso.split("-");
  return `${(lang === "hi" ? M_HI : M_EN)[Number(m) - 1]} ${y}`;
}

function renderTriptych(){
  const host = document.getElementById("triptych");
  if(!host) return;
  const seq = STATE.antardashaSeq || [], now = STATE.antardasha, maha = STATE.currentDasha;
  if(!seq.length || !now || !maha){ host.innerHTML = ""; return; }

  const i = seq.findIndex(a => a.start === now.start && a.lord === now.lord);
  const prev = i > 0 ? seq[i-1] : null;
  const next = i >= 0 && i < seq.length - 1 ? seq[i+1] : null;
  const d = I18N[LANG], names = PLANET_TEXT[LANG];
  const nm = k => names[k] ? names[k][0] : k;

  const cell = (a, cap, active) => a ? `
    <div class="tcell${active ? " now" : ""}">
      ${tripDisc(active)}
      <p class="cap">${cap}</p>
      <div class="lords">${nm(maha.lord)} / ${nm(a.lord)}</div>
      <div class="when">${monthYear(a.start, LANG)} &ndash; ${monthYear(a.end, LANG)}</div>
    </div>` : `<div class="tcell"></div>`;

  host.innerHTML = `<div class="trip">
    ${cell(prev, d["tr.closed"], false)}
    ${cell(now,  d["tr.now"],    true)}
    ${cell(next, d["tr.opens"],  false)}
  </div>`;
}


/* ============ made-to-order: their own kundli, typeset ============ */
function renderPandulipi(){
  const host = document.getElementById("pandulipi");
  if(!host) return;
  const d = I18N[LANG], b = readBirth() || {};
  const name = (b.name || "").trim();
  const hi = LANG === "hi";

  // a preview of the leaf that would be typeset
  const C = 220, S = 300, L = C - S/2, T = 96;
  const cell = {1:[.50,.20],2:[.25,.08],3:[.08,.24],4:[.28,.50],5:[.08,.76],6:[.25,.94],
                7:[.50,.80],8:[.75,.94],9:[.92,.76],10:[.72,.50],11:[.92,.24],12:[.75,.08]};
  let glyphs = "";
  for(let h = 1; h <= 12; h++){
    (STATE.planets || []).filter(p=>p.house===h).forEach((p,k)=>{
      glyphs += `<text class="pl-glyph${p.retro ? " pl-retro" : ""}" font-size="15"
        text-anchor="middle" x="${(L + cell[h][0]*S).toFixed(1)}"
        y="${(T + cell[h][1]*S + k*17).toFixed(1)}">${p.dev}</text>`;
    });
  }
  const lagna = RASHI_TEXT[LANG][STATE.lagna.rashi];

  host.innerHTML = `<div class="mto">
    <div class="leaf-panel">
      <p class="leaf-cap">${hi ? "पांडुलिपि · नमूना" : "PANDULIPI · PREVIEW"}</p>
      <svg class="pl-chart" viewBox="0 0 440 520" role="img"
           aria-label="Preview of the manuscript page">
        <text class="pl-small" font-size="9" letter-spacing="3"
              text-anchor="middle" x="220" y="52">${hi ? "जन्म कुंडली" : "JANMA KUNDLI"}</text>
        ${name ? `<text class="pl-name" font-size="26" text-anchor="middle"
                        x="220" y="82">${name}</text>` : ""}
        <g class="pl-line" stroke-width="1.4">
          <rect x="${L}" y="${T}" width="${S}" height="${S}" stroke-width="2"/>
          <path d="M${L} ${T} L${L+S} ${T+S}"/><path d="M${L+S} ${T} L${L} ${T+S}"/>
          <path d="M${L+S/2} ${T} L${L+S} ${T+S/2} L${L+S/2} ${T+S} L${L} ${T+S/2} Z"/>
        </g>
        ${glyphs}
        <text class="pl-small" font-size="9" letter-spacing="2.5"
              text-anchor="middle" x="220" y="${T+S+42}">${lagna.toUpperCase()} ${hi ? "लग्न" : "LAGNA"}</text>
        ${b.date ? `<text class="pl-small" font-size="8.5" letter-spacing="1.5"
              text-anchor="middle" x="220" y="${T+S+62}">${b.date}${b.time ? " · " + b.time : ""}</text>` : ""}
      </svg>
    </div>

    <div>
      <div class="eyebrow">${d["mto.eyebrow"]}</div>
      <h2 class="display">${d["mto.h"]}</h2>
      <p class="lede" style="margin:0">${d["mto.p"]}</p>
      <ul>
        <li>${d["mto.l1"]}</li>
        <li>${d["mto.l2"]}</li>
        <li>${d["mto.l3"]}</li>
        <li>${d["mto.l4"]}</li>
      </ul>
      <p class="price">${d["mto.price"]}<small>${d["mto.made"]}</small></p>
      <a class="cta" style="margin-top:18px"
         href="${productURL("kundli_pandulipi", LANG, kundliParams())}">${d["mto.cta"]}</a>
      <p class="lede" style="font-size:13px;margin-top:16px">${d["mto.note"]}</p>
    </div>
  </div>`;
}

/* the chart travels to the product page as line-item properties,
   so the order arrives with everything needed to typeset it */
function kundliParams(){
  const b = readBirth() || {};
  const p = new URLSearchParams();
  if(b.name)  p.set("properties[Name]", b.name);
  if(b.date)  p.set("properties[Birth date]", b.date);
  if(b.time)  p.set("properties[Birth time]", b.time);
  if(b.place) p.set("properties[Birth place]", b.place);
  if(STATE.lagna) p.set("properties[Lagna]", STATE.lagna.rashiName);
  if(STATE.nakshatraCard) p.set("properties[Nakshatra]",
    STATE.nakshatraCard.name + " pada " + STATE.nakshatraCard.pada);
  return p.toString();
}


/* ================= navamsa + muhurat (their own page) ================= */
function drawSquareChart(svgId, lagnaRashi, planets){
  const svg = document.getElementById(svgId);
  if(!svg) return;
  svg.textContent = "";
  const NS = "http://www.w3.org/2000/svg";
  const el = (t,a,txt)=>{ const n=document.createElementNS(NS,t);
    for(const k in a) n.setAttribute(k,a[k]);
    if(txt!=null) n.textContent=txt; return n; };

  const g = el("g",{fill:"none",stroke:"var(--panel-ink)","stroke-width":1.1});
  g.appendChild(el("rect",{x:0,y:0,width:400,height:400,"stroke-width":2}));
  g.appendChild(el("path",{d:"M0 0 L400 400"}));
  g.appendChild(el("path",{d:"M400 0 L0 400"}));
  g.appendChild(el("path",{d:"M200 0 L400 200 L200 400 L0 200 Z"}));
  svg.appendChild(g);

  for(let h=1; h<=12; h++){
    const [[rx,ry],[gx,gy]] = CELLS[h];
    svg.appendChild(el("text",{x:rx,y:ry,"text-anchor":"middle",class:"k-rashi"},
      RASHI_ABBR[(lagnaRashi + h - 1) % 12]));
    if(h === 1)
      svg.appendChild(el("text",{x:rx,y:ry-15,"text-anchor":"middle",class:"k-lagna"},"LAGNA"));
    planets.filter(p=>p.house===h).forEach((p,i)=>{
      const t = el("text",{x:gx, y:gy+i*22, "text-anchor":"middle",
        class:"k-graha" + (p.retro ? " k-retro" : "")}, p.dev);
      t.appendChild(el("title", null, p.key + (p.retro ? " (vakri)" : "")));
      svg.appendChild(t);
    });
  }
}

function renderNavamsa(){
  if(!document.getElementById("d9-chart")) return;
  drawSquareChart("d1-chart", STATE.lagna.rashi, STATE.planets);
  if(STATE.navamsa)
    drawSquareChart("d9-chart", STATE.navamsa.lagna, STATE.navamsa.planets);

  const note = document.getElementById("d9-note");
  if(note && STATE.navamsa){
    const r = RASHI_TEXT[LANG];
    note.textContent = LANG === "hi"
      ? `नवांश लग्न ${r[STATE.navamsa.lagna]} है, जन्म लग्न ${r[STATE.lagna.rashi]}।`
      : `Navamsa rises in ${r[STATE.navamsa.lagna]}; the birth chart rises in ${r[STATE.lagna.rashi]}.`;
  }
}

function renderMuhurat(){
  const host = document.getElementById("muhurat");
  if(!host) return;
  const m = STATE.muhurat;
  if(!m || !m.best){ host.innerHTML = ""; return; }
  const M_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const M_HI = ["जन","फ़र","मार्च","अप्रै","मई","जून","जुल","अग","सित","अक्तू","नव","दिस"];

  host.innerHTML = m.best.map(x=>{
    const [y, mo, dd] = x.date.split("-");
    const mon = (LANG === "hi" ? M_HI : M_EN)[Number(mo) - 1];
    const pips = [0,1,2].map(i=>
      `<i class="${x.score > i ? "on" : ""}"></i>`).join("");
    const nak = LANG === "hi" ? (x.nakshatraHi || x.nakshatra) : x.nakshatra;
    return `<div class="mu-row">
      <span class="dt">${Number(dd)} ${mon}<small>${x.vara[LANG]}</small></span>
      <span class="mid">${x.tithi} &middot; ${nak}<em>${x.why[LANG]}</em></span>
      <span class="pip">${pips}</span>
    </div>`;
  }).join("");
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
        renderChakra();
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
