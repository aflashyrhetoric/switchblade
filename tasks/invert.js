// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import jimp from "jimp";
import dotenv from "dotenv";
// const encoder = require("base-64");

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

export default async (req, res) => {
  console.log("Inverting image...");
  if (req.method === "GET") {
    res.status(500).json({
      data: {
        confirmation: "Wrong HTTP method",
      },
    });
  }

  // Grab the image from the request
  const {
    body: {
      data: { image: imageToInvertAsBase64Encoded },
    },
  } = req;

  console.log("...generating buffer from image");
  const buff = Buffer.from(imageToInvertAsBase64Encoded, "base64");
  let image;
  console.log("...converting buffer to Jimp instance");
  try {
    image = await jimp.read(buff);
  } catch (e) {
    return res.status(500).json({
      data: {
        confirmation: e.code,
        image: "",
      },
    });
  }

  console.log("...inverting image");
  image.invert();
  const imageEncoded = await image.getBase64Async(jimp.MIME_PNG);

  console.log("...stripping MIME metadata for compatibility with iOS");
  const withoutMIME = imageEncoded.substring("data:image/png;base64,".length);

  console.log("...Done!");
  res.status(500).json({
    data: {
      confirmation: "Successfully inverted.",
      image: withoutMIME,
    },
  });
};
