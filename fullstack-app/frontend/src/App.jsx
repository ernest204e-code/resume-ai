/* global PaystackPop */
import React, { useState } from "react";
import { generateResume, verifyPayment } from "./api";
import "./styles.css";

export default function App() {
  const [name, setName] = useState("");
  const [experience, setExperience] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const PRICE_NGN = Number(import.meta.env.VITE_PRICE_NGN || 5000);

  const handleGenerate = async () => {
    setError("");
    if (!name || !experience || !jobDescription) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const data = await generateResume({ name, experience, jobDescription });
      setResume(data.resumeText);
      setCoverLetter(data.coverLetterText);
    } catch (e) {
      setError("Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayAndDownload = () => {
    setError("");
    if (!resume || !coverLetter) {
      setError("Generate your resume first.");
      return;
    }

    const email = "customer@example.com"; // You can collect this from the user
    const handler = PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC,
      email,
      amount: PRICE_NGN * 100,
      currency: "NGN",
      callback: async (response) => {
        try {
          // ✅ Send AI content + payment reference to backend
          const blob = await verifyPayment({
            reference: response.reference,
            name,
            resumeText: resume,
            coverLetterText: coverLetter
          });

          // Trigger download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${name.replace(/\s+/g, "_")}_resume.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        } catch (e) {
          setError("Payment verified, but download failed. Contact support.");
        }
      },
      onClose: function () {
        console.log("Payment popup closed");
      }
    });
    handler.openIframe();
  };

  return (
    <div className="container">
      <h1>Nester's Resume AI</h1>
      <p className="subtitle">
        Create a tailored resume and cover letter. Pay ₦{PRICE_NGN} to download the PDF.
      </p>

      <div className="form">
        <input
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          placeholder="Your experience (roles, achievements, skills)"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          rows={6}
        />
        <textarea
          placeholder="Paste the job description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={6}
        />
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </button>
        {error && <div className="error">{error}</div>}
      </div>

      {resume && (
        <div className="preview">
          <h2>Preview</h2>
          <div className="panel">
            <h3>Resume</h3>
            <pre className="pre">{resume}</pre>
          </div>
          <div className="panel">
            <h3>Cover Letter</h3>
            <pre className="pre">{coverLetter}</pre>
          </div>
          <button className="pay" onClick={handlePayAndDownload}>
            Pay ₦{PRICE_NGN} and download PDF
          </button>
        </div>
      )}
    </div>
  );
}
