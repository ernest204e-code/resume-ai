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

// ✅ Generate Resume & Cover Letter (Mock AI for now)
app.post("/api/generate", async (req, res) => {
  const { name, experience, jobDescription } = req.body;
  if (!name || !experience || !jobDescription) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Simulate AI output (replace with real API later)
  const resumeText = `Resume for ${name}\nExperience: ${experience}\nTailored for: ${jobDescription}`;
  const coverLetterText = `Dear Hiring Manager,\nI am excited to apply for the role described as "${jobDescription}".\nSincerely,\n${name}`;

  res.json({ resumeText, coverLetterText });
});

// ✅ Paystack Payment Verification
app.post("/api/verify-payment", async (req, res) => {
  const { reference } = req.body;
  if (!reference) return res.status(400).json({ error: "Missing reference" });

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` }
    });
    const data = await response.json();

    if (data.status && data.data.status === "success") {
      // Generate PDF
      const doc = new PDFDocument();
      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        let pdfData = Buffer.concat(buffers);
        res.setHeader("Content-Type", "application/pdf");
        res.send(pdfData);
      });

      doc.fontSize(20).text("Your AI-Generated Resume", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text("This is your final, watermark-free resume.");
      doc.end();
    } else {
      res.status(400).json({ error: "Payment not verified" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));