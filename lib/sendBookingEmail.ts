import { Resend } from "resend";

type BookingEmailType = "ACCEPTED" | "DECLINED" | "COMPLETED" | "NEW_REQUEST" | "EXPIRED";

const SUBJECTS: Record<BookingEmailType, string> = {
  ACCEPTED: "Your booking was accepted",
  DECLINED: "Update on your booking request",
  COMPLETED: "Your booking is complete",
  NEW_REQUEST: "New booking request",
  EXPIRED: "Your booking request expired",
};

// Same lazy-construction pattern as sendProviderApprovalEmail — the Resend
// client is built inside the try block, never at module load time, so a
// missing RESEND_API_KEY can never crash the build or the caller.
export async function sendBookingEmail(params: {
  type: BookingEmailType;
  to: string;
  recipientName: string;
  serviceLabel: string;
  otherPartyName: string;
  petName?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`RESEND_API_KEY not set — skipping ${params.type} email to`, params.to);
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://barkado-and-co.vercel.app";

  let heading = "";
  let body = "";
  let ctaHref = `${appUrl}/owner/bookings`;
  let ctaLabel = "View your bookings";

  switch (params.type) {
    case "ACCEPTED":
      heading = `${params.otherPartyName} accepted your booking! 🎉`;
      body = `Your ${params.serviceLabel}${params.petName ? ` for ${params.petName}` : ""} has been accepted.`;
      break;
    case "DECLINED":
      heading = `Update on your ${params.serviceLabel}`;
      body = `${params.otherPartyName} wasn't able to take this booking. You can find another provider anytime.`;
      break;
    case "COMPLETED":
      heading = `Your ${params.serviceLabel} is complete`;
      body = `${params.otherPartyName} marked this booking as complete. Don't forget to leave a rating!`;
      break;
    case "NEW_REQUEST":
      heading = "You have a new booking request";
      body = `${params.otherPartyName} just requested a ${params.serviceLabel}${params.petName ? ` for ${params.petName}` : ""}.`;
      ctaHref = `${appUrl}/provider`;
      ctaLabel = "Open your dashboard";
      break;
    case "EXPIRED":
      heading = `Your ${params.serviceLabel} request expired`;
      body = `Nobody responded to your request in time, so it's been automatically cancelled. You can book another provider anytime.`;
      break;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Barkado & Co. <onboarding@resend.dev>",
      to: params.to,
      subject: SUBJECTS[params.type],
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #16281f;">Hi ${params.recipientName},</h2>
          <h3 style="color: #16281f;">${heading}</h3>
          <p>${body}</p>
          <p>
            <a href="${ctaHref}" style="display:inline-block;background:#c97a56;color:white;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold;">
              ${ctaLabel}
            </a>
          </p>
          <p style="color:#888;font-size:12px;">Barkado &amp; Co.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error(`Failed to send ${params.type} booking email:`, err);
  }
}