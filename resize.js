import fs from "fs";
import path from "path";
import sharp from "sharp";

async function main() {
  const srcDir = "./input";
  const destDir = "./output";

  const inputFileNames = await fs.promises.readdir(srcDir);

  for (let i = 0; i < inputFileNames.length; i++) {
    const fileFullName = inputFileNames[i];
    const extension = path.extname(fileFullName);
    const fileName = fileFullName.replace(extension, "");

    const src = path.join(srcDir, fileFullName);
    const destOpenGraph = path.join(destDir, `${fileName}.open-graph.webp`);
    const destTwitter = path.join(destDir, `${fileName}.twitter.webp`);

    console.debug({ src, destOpenGraph, destTwitter });

    // Open Graph
    await transform(src, destOpenGraph, 1200, 628);

    // Twitter
    await transform(src, destTwitter, 800, 418);
  }
}

async function transform(src, dest, width, height) {
  const metadata = await sharp(src).metadata();

  // Calculate the source and the target aspect ratio
  const srcAspectRatio = metadata.width / metadata.height;
  const destAspectRatio = width / height;

  // Resize the image so that it covers the target dimensions, apply blur and
  // store the result in memory
  const backgroundBuffer = await sharp(src)
    .resize({ width, height, fit: "cover" })
    .blur(10)
    .toBuffer();

  // Resize the image so that it's contained within the target dimensions and
  // store the result in memory
  const foregroundBuffer = await sharp(src)
    .resize(srcAspectRatio > destAspectRatio ? { width } : { height })
    .toBuffer();

  // Combine the background and the foreground and store the result in a file
  await sharp(backgroundBuffer)
    .composite([{ input: foregroundBuffer, gravity: "center" }])
    .webp({ quality: 80 })
    .toFile(dest);
}

main().catch((err) => console.error(err));
