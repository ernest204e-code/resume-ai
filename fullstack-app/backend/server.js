// backend/server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import PDFDocument from "pdfkit";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

/**
 * ✅ Generate Resume & Cover Letter using GroqCloud AI
 */
app.post("/api/generate", async (req, res) => {
  const { name, experience, jobDescription } = req.body;
  if (!name || !experience || !jobDescription) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768", // Groq model
        messages: [
          {
            role: "system",
            content: "You are an expert career coach and resume writer."
          },
          {
            role: "user",
            content: `Create a professional resume and cover letter for:
Name: ${name}
Experience: ${experience}
Job Description: ${jobDescription}

Return the result in JSON with keys: resumeText, coverLetterText.`
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await groqRes.json();

    let aiText = data.choices?.[0]?.message?.content || "";
    let resumeText = "";
    let coverLetterText = "";

    try {
      const parsed = JSON.parse(aiText);
      resumeText = parsed.resumeText || "";
      coverLetterText = parsed.coverLetterText || "";
    } catch {
      // Fallback if AI didn't return JSON
      const parts = aiText.split(/COVER LETTER:/i);
      resumeText = parts[0].replace(/RESUME:/i, "").trim();
      coverLetterText = parts[1]?.trim() || "";
    }

    res.json({ resumeText, coverLetterText });

  } catch (err) {
    console.error("Groq API error:", err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

/**
 * ✅ Paystack Payment Verification & PDF Generation
 */
app.post("/api/verify-payment", async (req, res) => {
  const { reference, name, resumeText, coverLetterText } = req.body;
  if (!reference) return res.status(400).json({ error: "Missing reference" });
  if (!name || !resumeText || !coverLetterText) {
    return res.status(400).json({ error: "Missing resume or cover letter content" });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` }
    });
    const data = await response.json();

    if (data.status && data.data.status === "success") {
      // Generate PDF with AI content
      const doc = new PDFDocument();
      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        let pdfData = Buffer.concat(buffers);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${name.replace(/\s+/g, "_")}_resume.pdf"`);
        res.send(pdfData);
      });

      doc.fontSize(20).text(`${name} — Resume & Cover Letter`, { align: "center" });
      doc.moveDown();
      doc.fontSize(16).text("Resume", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(resumeText);
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      doc.fontSize(16).text("Cover Letter", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(coverLetterText);
      doc.end();

    } else {
      res.status(400).json({ error: "Payment not verified" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
