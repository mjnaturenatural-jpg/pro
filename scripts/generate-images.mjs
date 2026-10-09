/**
 * Generates real photographic images for MJ Nature Naturals using the
 * Pollinations.ai image API (keyless, flux model), saving them under
 * public/images/ and recording progress in scripts/image-manifest.json.
 *
 * Every image produced by this script is AI-generated (label: "AI-generated",
 * source: "pollinations.ai/flux"). The manifest is the record of truth for
 * provenance and enables resumable runs (completed files are skipped).
 *
 * Usage:
 *   node scripts/generate-images.mjs                 # everything not yet done
 *   node scripts/generate-images.mjs --only=products
 *   node scripts/generate-images.mjs --only=categories
 *   node scripts/generate-images.mjs --only=site
 *   node scripts/generate-images.mjs --limit=5
 *   node scripts/generate-images.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, "scripts", "image-manifest.json");
const PUBLIC_IMAGES = path.join(ROOT, "public", "images");
const DELAY_MS = 7000;
const MAX_ATTEMPTS = 4;
const MIN_BYTES = 15 * 1024;

const args = process.argv.slice(2);
const getArg = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : undefined;
};
const ONLY = getArg("only") || "all";
const LIMIT = Number(getArg("limit") || 0);
const DRY_RUN = args.includes("--dry-run");

const STYLE =
  "professional commercial food photography, soft natural daylight, shallow depth of field, cream linen and light stone surface, appetizing premium editorial look, crisp detail, no text, no watermark, no logos, no packaging labels, unbranded";

const PRODUCT_PROMPTS = {
  "bajra-jaggery-cookies": "a small stack of rustic golden bajra pearl millet jaggery cookies on a cream ceramic plate, crumbs scattered around",
  "black-sesame-almond-chikki": "square pieces of black sesame and almond jaggery brittle chikki arranged on parchment paper, glossy dark bars studded with almonds",
  "black-sesame-kaju-chikki": "square bars of black sesame cashew brittle chikki on a small wooden board, pale cashew pieces visible in the dark sesame matrix",
  "coconut-oil": "a clear glass bottle of virgin coconut oil beside fresh coconut halves and white coconut flesh on a light stone counter",
  "coconut-powder": "a small ceramic bowl of fine white desiccated coconut powder with a wooden spoon, fresh coconut pieces beside it",
  "double-choco-chip-brownie": "fudgy double chocolate chip brownie squares stacked on a cream plate, melty chocolate chips visible, rich dark cocoa color",
  "dry-amla": "sun-dried amla indian gooseberry pieces in a small ceramic bowl, golden-green dried fruit with rustic texture",
  "dry-fruit-mixture-spicy": "spicy roasted dry fruit and nut mixture in a rustic bowl, cashews almonds peanuts with a red chilli coating and curry leaves",
  "dry-fruit-pumpkin-seeds-badam-kaju": "a mix of pumpkin seeds almonds and cashews in a small bowl, raw and lightly roasted nuts close up",
  "dry-fruits-mix-jaggery-cookies": "crunchy jaggery cookies loaded with chopped dry fruits on a cream plate, nuts visible inside the cookies",
  "elaichi-black-pepper-dry-ginger-jaggery": "small pieces of traditional indian spiced jaggery candy with cardamom pods black pepper and dry ginger powder on a wooden spoon",
  "flax-seeds-jaggery-almond-chikki": "flax seed and almond jaggery brittle squares on parchment paper, seeded golden bars",
  "jowar-chocolate-almond-cookies": "chocolate cookies with almond slivers made with jowar flour on a light ceramic plate",
  "jowar-chocolate-dry-fruits-brownie": "chocolate brownie squares loaded with dry fruits on a cream plate, fudgy texture",
  "jowar-jaggery-cookies": "light crisp golden jowar jaggery cookies arranged on a small plate, rustic millet cookies",
  "kaju-jaggery-chikki": "golden cashew jaggery brittle squares kaju chikki stacked on a wooden board, whole cashews embedded in the brittle",
  "millet-jaggery-cookies": "wholesome golden-brown millet jaggery cookies on a cream ceramic plate",
  "oats-jaggery-dry-fruit-cookies": "oats cookies with dry fruits and jaggery on a plate, visible toasted oats texture and nuts",
  "original-jaggery": "blocks and shards of golden organic jaggery gur in a wooden bowl, natural unrefined cane sweetener",
  "peanuts-pistachio-jaggery-chikki": "peanut and pistachio jaggery chikki squares on parchment, green pistachio pieces and peanuts set in golden brittle",
  "poha-coconut-dry-fruit-mixture-spicy": "crispy spicy poha mixture with coconut flakes and dry fruits in a bowl, indian savoury snack",
  "poha-dry-fruit-chikki": "poha flattened rice and dry fruit jaggery brittle squares on a plate, crisp white poha flakes in golden jaggery",
  "ragi-elaichi-dry-fruit-jaggery-cookies": "dark ragi finger millet cookies with cardamom and dry fruits on a cream plate",
  "ragi-jaggery-dry-fruits-brownie": "rustic ragi jaggery brownie squares loaded with chopped dry fruits on a plate",
  "ragi-millet-jaggery-chocolate-cookies": "dark cocoa chocolate millet cookies made with ragi and jaggery on a light plate",
  "ragi-millet-jaggery-mini-chocolate-cookies": "small bite-size mini chocolate millet cookies scattered on a cream plate",
  "red-chilli-powder-with-masala": "vibrant red chilli masala powder in a small bowl with a wooden spoon, dried red chillies beside it",
  "red-velvet-chocolate-cookies": "soft deep-red velvet cookies with chocolate chips on a cream plate",
  "roasted-coconut-dry-fruit-jaggery-laddu": "round roasted coconut and dry fruit jaggery laddu balls on a plate, textured sweet balls with visible nuts",
  "roasted-coconut-jaggery-laddu": "round roasted coconut jaggery laddu balls stacked on a small plate, golden coconut laddus",
  "white-chocolate-black-chocolate-brownie": "marbled white and dark chocolate brownie squares on a cream plate, two-tone indulgent brownie",
  "white-sesame-pistachio-almond-chikki": "white sesame pistachio and almond jaggery brittle squares on parchment, pale bars dotted with green pistachios",
};

const CATEGORY_PROMPTS = {
  laddus: "an assortment of traditional indian laddu balls in a brass bowl on ivory linen",
  brownies: "a stack of fudgy chocolate brownies on a wooden board with a few chocolate pieces",
  cookies: "an assortment of golden cookies spread on a light wooden board",
  "millet-cookies": "rustic millet flour cookies on a ceramic plate with scattered millet grains",
  "jaggery-products": "blocks powder and balls of golden jaggery on a wooden table, unrefined cane sweetener",
  chikki: "assorted indian nut and seed chikki brittle bars stacked on parchment paper",
  mixtures: "indian namkeen savoury mixture snack in a bowl with nuts sev and roasted pulses",
  "pantry-staples": "glass jars of spices coconut powder and oil with wooden spoons on a bright kitchen counter",
};

const SITE_PROMPTS = {
  hero: {
    w: 1024,
    h: 1024,
    prompt:
      "top-down flat lay of an assorted spread of indian natural sweets and snacks — laddu balls chikki bars cookies nuts and dried fruits — arranged on ivory linen with a few fresh green leaves, bright airy daylight, premium editorial food photography, square composition",
  },
  story: {
    w: 1280,
    h: 960,
    prompt:
      "overhead view of hands preparing traditional indian sweets at a wooden kitchen counter, bowls of jaggery nuts ghee and flour, warm natural window light, lifestyle documentary food photography, no faces",
  },
  highlight: {
    w: 1280,
    h: 960,
    prompt:
      "moody dark food photography, close-up of jaggery laddu balls and millet cookies on dark slate with scattered nuts, dramatic side lighting, deep shadows, premium editorial mood",
  },
};

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveManifest(manifest) {
  const tmp = MANIFEST_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2));
  fs.renameSync(tmp, MANIFEST_PATH);
}

function seedFrom(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % 100000;
}

function detectMagic(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "jpg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "png";
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return "webp";
  return null;
}

async function fetchImage(url, key) {
  let lastErr = "unknown";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(180000) });
      if (res.status === 402 || res.status === 429 || res.status === 529) {
        lastErr = `HTTP ${res.status} (quota/rate limited)`;
        const wait = 25000 * attempt;
        console.log(`  quota limited (HTTP ${res.status}), waiting ${wait / 1000}s (attempt ${attempt}/${MAX_ATTEMPTS})`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (!res.ok) {
        lastErr = `HTTP ${res.status}`;
        await new Promise((r) => setTimeout(r, 6000 * attempt));
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const fmt = detectMagic(buf);
      if (!fmt) {
        lastErr = "response was not a recognizable image";
        await new Promise((r) => setTimeout(r, 6000 * attempt));
        continue;
      }
      if (buf.length < MIN_BYTES) {
        lastErr = `image too small (${buf.length} bytes)`;
        await new Promise((r) => setTimeout(r, 6000 * attempt));
        continue;
      }
      return { buf, fmt };
    } catch (e) {
      lastErr = e.message || String(e);
      await new Promise((r) => setTimeout(r, 6000 * attempt));
    }
  }
  throw new Error(`${key}: failed after ${MAX_ATTEMPTS} attempts (${lastErr})`);
}

async function buildPlan() {
  const uriLine = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  const uri = (uriLine.match(/^MONGODB_URI=(.+)$/m) || [])[1];
  if (!uri) throw new Error("MONGODB_URI not found in .env.local");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.getClient().db();

  const plan = [];
  const products = await db
    .collection("products")
    .find({}, { projection: { slug: 1 } })
    .sort({ slug: 1 })
    .toArray();
  for (const p of products) {
    plan.push({
      key: `product:${p.slug}`,
      kind: "product",
      id: p.slug,
      file: path.join(PUBLIC_IMAGES, "products", `${p.slug}.jpg`),
      publicPath: `/images/products/${p.slug}.jpg`,
      w: 1024,
      h: 1024,
      prompt: PRODUCT_PROMPTS[p.slug]
        ? `${PRODUCT_PROMPTS[p.slug]}, ${STYLE}`
        : `a serving of ${p.slug.replace(/-/g, " ")} on a cream ceramic plate, ${STYLE}`,
      label: "AI-generated",
      source: "pollinations.ai (flux)",
    });
  }

  const cats = await db
    .collection("categories")
    .find({}, { projection: { slug: 1 } })
    .sort({ order: 1 })
    .toArray();
  for (const c of cats) {
    plan.push({
      key: `category:${c.slug}`,
      kind: "category",
      id: c.slug,
      file: path.join(PUBLIC_IMAGES, "categories", `${c.slug}.jpg`),
      publicPath: `/images/categories/${c.slug}.jpg`,
      w: 1280,
      h: 960,
      prompt: `${CATEGORY_PROMPTS[c.slug] || c.slug.replace(/-/g, " ")}, ${STYLE}`,
      label: "AI-generated",
      source: "pollinations.ai (flux)",
    });
  }

  for (const [id, spec] of Object.entries(SITE_PROMPTS)) {
    plan.push({
      key: `site:${id}`,
      kind: "site",
      id,
      file: path.join(PUBLIC_IMAGES, "site", `${id}.jpg`),
      publicPath: `/images/site/${id}.jpg`,
      w: spec.w,
      h: spec.h,
      prompt: `${spec.prompt}, ${STYLE}`,
      label: "AI-generated",
      source: "pollinations.ai (flux)",
    });
  }

  await mongoose.disconnect();
  return plan;
}

function isDone(entry, manifest, planned) {
  const rec = manifest[entry.key];
  if (!rec || rec.status !== "done") return false;
  const file = rec.file || planned;
  try {
    const st = fs.statSync(file);
    return st.size >= MIN_BYTES;
  } catch {
    return false;
  }
}

async function main() {
  const plan = (await buildPlan()).filter(
    (e) => ONLY === "all" || (ONLY === "products" && e.kind === "product") ||
      (ONLY === "categories" && e.kind === "category") || (ONLY === "site" && e.kind === "site")
  );
  const manifest = loadManifest();
  const todo = plan.filter((e) => !isDone(e, manifest, e.file));

  console.log(`Plan: ${plan.length} total, ${plan.length - todo.length} already done, ${todo.length} to generate`);
  if (DRY_RUN) {
    todo.slice(0, LIMIT || todo.length).forEach((e) => console.log(`  TODO ${e.key} -> ${e.file}`));
    return;
  }

  const queue = LIMIT ? todo.slice(0, LIMIT) : todo;
  const failures = [];
  for (let i = 0; i < queue.length; i++) {
    const entry = queue[i];
    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(entry.prompt)}` +
      `?width=${entry.w}&height=${entry.h}&seed=${seedFrom(entry.key)}&nologo=true&model=flux`;
    process.stdout.write(`[${i + 1}/${queue.length}] ${entry.key} ... `);
    try {
      const { buf, fmt } = await fetchImage(url, entry.key);
      const actualFile = fmt === "jpg" ? entry.file : entry.file.replace(/\.jpg$/, `.${fmt}`);
      fs.mkdirSync(path.dirname(actualFile), { recursive: true });
      fs.writeFileSync(actualFile, buf);
      manifest[entry.key] = {
        status: "done",
        file: actualFile,
        publicPath: entry.publicPath.replace(/\.jpg$/, `.${fmt}`),
        label: entry.label,
        source: entry.source,
        prompt: entry.prompt,
        width: entry.w,
        height: entry.h,
        bytes: buf.length,
        generatedAt: new Date().toISOString(),
      };
      saveManifest(manifest);
      console.log(`OK (${(buf.length / 1024).toFixed(0)} KB, ${fmt})`);
    } catch (e) {
      failures.push(entry.key);
      manifest[entry.key] = { ...(manifest[entry.key] || {}), status: "failed", error: e.message };
      saveManifest(manifest);
      console.log(`FAILED (${e.message})`);
    }
    if (i < queue.length - 1) await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  const doneCount = Object.values(manifest).filter((m) => m.status === "done").length;
  console.log(`\nDone: ${doneCount} images in manifest. Failures: ${failures.length}`);
  if (failures.length) console.log("Failed keys:", failures.join(", "));
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
