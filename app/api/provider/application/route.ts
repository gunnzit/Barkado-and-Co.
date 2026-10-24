import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { normalizeIndianMobile } from "@/lib/phone";
import { SERVICE_CITIES, PROVIDER_TERMS_VERSION, SERVICE_CITY_LABEL } from "@/lib/providerApplication";
import { sendAdminNewApplicationEmail } from "@/lib/sendAdminNewApplicationEmail";

const schema = z.object({
  bio: z.string().trim().max(300).optional(),
  serviceCity: z.enum(SERVICE_CITIES).optional(),
  // submit=false saves a draft (so the form can resume); submit=true sends it for review.
  submit: z.boolean().default(false),
  acceptTerms: z.boolean().optional(),
});

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });
  if (provider.verified) return NextResponse.json({ ok: true, alreadyApproved: true });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Please check the details you entered." }, { status: 400 });
  const { bio, serviceCity, submit, acceptTerms } = parsed.data;

  const bioFinal = bio ?? provider.bio ?? "";
  const cityFinal = serviceCity ?? provider.serviceCity ?? null;

  if (!submit) {
    await prisma.provider.update({
      where: { id: provider.id },
      data: { ...(bio !== undefined ? { bio } : {}), ...(serviceCity ? { serviceCity } : {}) },
    });
    return NextResponse.json({ ok: true, submitted: false });
  }

  // Final submission — every requirement is re-checked here on the server,
  // never trusted from the form.
  const problems: string[] = [];
  if (provider.servicesOffered.length === 0) problems.push("Pick at least one service.");
  if (!provider.photoUrl) problems.push("Add a profile photo.");
  if (!user.phone || !normalizeIndianMobile(user.phone)) problems.push("Add a valid phone number.");
  if (provider.verificationDocs.length === 0) problems.push("Upload your ID.");
  if (!cityFinal) problems.push("Choose your service area.");
  if (bioFinal.trim().length < 20) problems.push("Write a short bio (at least 20 characters).");
  if (!acceptTerms) problems.push("Accept the terms to continue.");
  if (problems.length > 0) return NextResponse.json({ error: problems[0], problems }, { status: 400 });

  const firstSubmission = !provider.applicationSubmittedAt;
  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      bio: bioFinal.trim(),
      serviceCity: cityFinal,
      termsAcceptedAt: new Date(),
      termsVersion: PROVIDER_TERMS_VERSION,
      ...(firstSubmission ? { applicationSubmittedAt: new Date() } : {}),
    },
  });

  // Only the first submission notifies the admin — re-submitting doesn't spam.
  if (firstSubmission) {
    await sendAdminNewApplicationEmail({
      name: user.name,
      email: user.email,
      phone: user.phone as string,
      services: provider.servicesOffered,
      city: SERVICE_CITY_LABEL[cityFinal as keyof typeof SERVICE_CITY_LABEL],
    });
  }

  return NextResponse.json({ ok: true, submitted: true });
}