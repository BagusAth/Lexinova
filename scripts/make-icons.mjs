// Buat ikon PNG PWA dari public/icons/icon.svg. Jalankan: node scripts/make-icons.mjs
import sharp from "sharp";
const src = "public/icons/icon.svg";
for (const size of [192, 512]) {
  await sharp(src).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
}
// Ikon maskable: planet diperkecil supaya aman dipotong lingkaran oleh launcher.
const inner = await sharp(src).resize(400, 400).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: "#111326" } })
  .composite([{ input: inner, gravity: "center" }])
  .png()
  .toFile("public/icons/maskable-512.png");
await sharp(src).resize(180, 180).png().toFile("src/app/apple-icon.png");
console.log("ikon dibuat");
