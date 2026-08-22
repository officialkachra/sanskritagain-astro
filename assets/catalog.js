/* ============================================================
   catalog.js — the one file that connects the tool to the shop.
   Everything here is EDITABLE BY HAND. No code changes needed.

   For each product, per language:
     handle  — the Shopify product handle (the bit after /products/)
     variant — the variant id for a single copy. Optional.
               With it, buttons go straight to checkout.
               Without it, buttons go to the product page.

   Leave a language out and it falls back to `default`.
   ============================================================ */

const SHOP = "https://sanskritagain.com";

/* Which shop language to use for a given site language.
   Add rows as you add regional pages. */
const LANG_TO_SHOP = {
  hi: "hindi",
  en: "english"
};

const CATALOG = {
  sunderkand: {
    default: {handle: "sunderkand", variant: null},
    hindi:   {handle: "sunderkand", variant: null}
  },
  vishnu_sahasranama: {
    default: {handle: "vishnu-sahasranama", variant: null},
    english: {handle: "vishnu-sahasranama-english-edition", variant: 52676236476703},
    kannada: {handle: "kannada-vishnu-sahasranama", variant: null},
    telugu:  {handle: "telugu-vishnu-sahasranama", variant: null}
  },
  hanuman_chalisa: {
    default: {handle: "hanuman-chalisa", variant: null}
  },
  bajrang_baan: {
    default: {handle: "bajrang-baan", variant: null}
  },
  lalita_sahasranama: {
    default: {handle: "sri-lalitha-sahasranama", variant: null}
  },
  bhaktamar: {
    default: {handle: "bhaktamar-stotra", variant: null}
  },
  chalisa_sangrah: {
    default: {handle: "chalisa-sangrah", variant: null}
  },

  /* made-to-order: the visitor's own kundli, typeset by hand */
  kundli_pandulipi: {
    default: {handle: "kundli-pandulipi", variant: null}
  }
};

/* Build the link for a product key. Adds attribution so you can see in
   Shopify analytics which recitations the tool actually sells. */
function productURL(key, lang, extra){
  const entry = CATALOG[key];
  if(!entry) return SHOP;
  const shopLang = LANG_TO_SHOP[lang] || "default";
  const row = entry[shopLang] || entry.default;
  if(!row) return SHOP;

  const utm = "utm_source=astro&utm_medium=kundli&utm_campaign=" + key;
  if(row.variant){
    // straight into the cart, one step fewer
    return `${SHOP}/cart/${row.variant}:1?${utm}` + (extra ? "&" + extra : "");
  }
  return `${SHOP}/products/${row.handle}?${utm}` + (extra ? "&" + extra : "");
}
