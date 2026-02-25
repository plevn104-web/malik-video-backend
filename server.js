import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Replicate from "replicate";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Backend is running" });
});

// Generate video endpoint
app.post("/api/generate-video", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.length < 5) {
      return res.status(400).json({ error: "Valid prompt required" });
    }

    // 🔥 LTX model version
    const modelVersion =
      "8c47da666861d081eeb4d1261853087de23923a268a69b63febdf5dc1dee08e4";

    // 1️⃣ Create prediction
    let prediction = await replicate.predictions.create({
      version: modelVersion,
      input: {
        prompt: prompt,
        aspect_ratio: "16:9",
        negative_prompt: "low quality, worst quality, watermark",
      },
    });

    // 2️⃣ Wait until video ready
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      prediction = await replicate.predictions.get(prediction.id);
    }

    if (prediction.status === "failed") {
      return res.status(500).json({ error: "Video generation failed" });
    }

    const video_url = prediction.output[0];

    res.json({ video_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
