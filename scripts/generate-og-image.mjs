import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svgPath = path.join(root, "public", "favicon.svg");
const outPath = path.join(root, "public", "og-image.png");

await sharp(svgPath).resize(512, 512).png().toFile(outPath);
console.log("Wrote", outPath);
