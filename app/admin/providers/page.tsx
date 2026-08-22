import { Star, ShieldCheck, Clock, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import AdminTabs from "@/components/AdminTabs";
import AdminProviderVerifyButton from "@/components/AdminProviderVerifyButton";

const SERVICE_SHORT: Record<string, string> = {
  WALKING: "Walk", SITTING: "Sit", GROOMING: "Groom", TRAINING: "Train",
};

export default async function AdminProvidersPage() {
  await requireAdmin();

  const providers = await prisma.provider.findMany({
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: [{ verified: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-2xl mx-auto">
        <div className="px-6 pt-4 pb-5">
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Admin</p>
          <h1 className="text-xl font-bold">Providers</h1>
        </div>

        <AdminTabs />

        <div className="px-6 space-y-3">
          {providers.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--muted)" }}>No providers yet.</p>
          ) : (
            providers.map((p) => (
              <div key={p.id} className="card">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{p.user.name}</p>
                      {p.verified ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "var(--cream)", color: "var(--terracotta)" }}>
                          <ShieldCheck size={10} /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "#fdece0", color: "#a5652a" }}>
                          <Clock size={10} /> Pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{p.user.email}{p.user.phone ? ` · ${p.user.phone}` : ""}</p>
                  </div>
                  <AdminProviderVerifyButton providerId={p.id} verified={p.verified} />
                </div>
                <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "var(--muted)" }}>
                  <span>{p.servicesOffered.map((s) => SERVICE_SHORT[s]).join(", ") || "No services set"}</span>
                  <span className="flex items-center gap-1"><Star size={11} fill="var(--gold)" color="var(--gold)" /> {p.ratingAvg.toFixed(1)}</span>
                </div>
                {p.verificationDocs.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                    {p.verificationDocs.map((url, i) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs tap-scale"
                        style={{ color: "var(--terracotta)" }}
                      >
                        <FileText size={12} /> Document {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}