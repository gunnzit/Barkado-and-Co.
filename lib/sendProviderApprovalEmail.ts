import { Resend } from "resend";

// Failures here are logged, never thrown — an email hiccup should never
// block the actual approval action from completing. The client is built
// lazily, inside this function, rather than at module load time: Resend's
// constructor throws immediately on a missing key, and constructing it at
// import time would crash the whole build before RESEND_API_KEY is set.
export async function sendProviderApprovalEmail(to: string, name: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping approval email to", to);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://barkado-and-co.vercel.app";

  try {
    await resend.emails.send({
      from: "Barkado & Co. <onboarding@resend.dev>",
      to,
      subject: "You're approved! Welcome to Barkado & Co.",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #16281f;">You're approved, ${name}! 🎉</h2>
          <p>Your provider profile has been reviewed and approved. You can now start receiving booking requests on Barkado &amp; Co.</p>
          <p>
            <a href="${appUrl}/provider" style="display:inline-block;background:#c97a56;color:white;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold;">
              Open your dashboard
            </a>
          </p>
          <p style="color:#888;font-size:12px;">If you weren't expecting this, you can ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send provider approval email:", err);
  }
}