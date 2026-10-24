import { Resend } from "resend";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Tells the admin a provider has finished the join form. Failures are logged,
// never thrown — an email hiccup must never block someone's application.
// Set ADMIN_NOTIFY_EMAIL in Vercel to choose where these go.
export async function sendAdminNewApplicationEmail(p: {
  name: string;
  email: string;
  phone: string;
  services: string[];
  city: string;
}) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!process.env.RESEND_API_KEY || !to) {
    console.warn("RESEND_API_KEY or ADMIN_NOTIFY_EMAIL not set — skipping new-application email for", p.email);
    return;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.barkadoandco.com";
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Barkado & Co. <hello@barkadoandco.com>",
      to,
      subject: `New provider application: ${p.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #16281f;">New provider application</h2>
          <p><b>${esc(p.name)}</b><br/>${esc(p.email)} · ${esc(p.phone)}</p>
          <p>Services: ${esc(p.services.join(", "))}<br/>Area: ${esc(p.city)}</p>
          <p>
            <a href="${appUrl}/admin/providers" style="display:inline-block;background:#904c2c;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Review application
            </a>
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send new-application email:", err);
  }
}