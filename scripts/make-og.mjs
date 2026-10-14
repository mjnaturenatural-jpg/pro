// One-time generator for public/og.jpg (1200x630). Re-run if the logo changes.
import sharp from "sharp";
import path from "node:path";

const root = process.cwd();
const W = 1200;
const H = 630;

const logo = await sharp(path.join(root, "public", "images", "logo.png"))
  .resize(240, 240, { fit: "inside" })
  .toBuffer();

const svg = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FDFAF5"/>
      <stop offset="1" stop-color="#F6EDDD"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="14" fill="#C53E1F"/>
  <rect width="${W}" height="6" y="${H - 6}" fill="#C53E1F"/>
  <text x="600" y="392" text-anchor="middle" font-family="Georgia, serif" font-size="76" font-weight="bold" fill="#1A1208">MJ Nature Natural</text>
  <text x="600" y="452" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="36" fill="#55463F">Homemade Goodness, Delivered to Your Door.</text>
  <text x="600" y="516" text-anchor="middle" font-family="Arial, sans-serif" font-size="27" font-weight="bold" letter-spacing="3" fill="#C53E1F">100% EGGLESS • NO MAIDA • NO REFINED SUGAR</text>
</svg>`);

await sharp(svg)
  .composite([{ input: logo, top: 64, left: Math.round(W / 2 - 120) }])
  .jpeg({ quality: 88 })
  .toFile(path.join(root, "public", "og.jpg"));

console.log("public/og.jpg written");
