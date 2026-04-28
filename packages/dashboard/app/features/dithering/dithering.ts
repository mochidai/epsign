import { Jimp, JimpMime } from "jimp";

export const ditherImageBuffer = async (inputBuffer: Buffer) => {
  try {
    const image = await Jimp.read(inputBuffer);

    // サイズは1360×480のままにする
    image.resize({ w: 1360, h: 480 });

    // 白黒2値化
    image.greyscale();

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const v = this.bitmap.data[idx];
      const bw = v < 160 ? 0 : 255;

      this.bitmap.data[idx] = bw;
      this.bitmap.data[idx + 1] = bw;
      this.bitmap.data[idx + 2] = bw;
      this.bitmap.data[idx + 3] = 255;
    });

    return await image.getBuffer(JimpMime.png);
  } catch (err) {
    console.error("Error processing image:", err);
    throw err;
  }
};