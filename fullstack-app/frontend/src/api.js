export async function generateResume(payload) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function verifyPayment(reference) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference })
  });
  if (!res.ok) throw new Error("Payment verification failed");
  return res.blob();
}