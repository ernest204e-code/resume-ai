import { useState } from "react";
import { generateResume, verifyPayment } from "./api";
import "./styles.css";

export default function App() {
  const [name, setName] = useState("");
  const [experience, setExperience] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const data = await generateResume({ name, experience, jobDescription });
    setResume(data.resumeText);
    setCoverLetter(data.coverLetterText);
    setLoading(false);
  };

  const handlePay = () => {
    const handler = PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC,
      email: "customer@example.com",
      amount: 500 * 100, // ₦500 or $5 equivalent
      currency: "NGN",
      callback: async (response) => {
        const pdfBlob = await verifyPayment(response.reference);
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "resume.pdf";
        a.click();
      }
    });
    handler.openIframe();
  };

  return (
    <div className="container">
      <h1>AI Resume & Cover Letter Builder</h1>
      <input placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} />
      <textarea placeholder="Your Experience" value={experience} onChange={(e) => setExperience(e.target.value)} />
      <textarea placeholder="Job Description" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>

      {resume && (
        <div className="preview">
          <h2>Preview</h2>
          <pre>{resume}</pre>
          <pre>{coverLetter}</pre>
          <button onClick={handlePay}>Download for $5</button>
        </div>
      )}
    </div>
  );
}