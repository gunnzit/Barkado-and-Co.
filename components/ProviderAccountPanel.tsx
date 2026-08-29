"use client";

import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Star, Store, Wallet, ShieldCheck, MapPin, Bell, LogOut, User, Pencil } from "lucide-react";

// "5 Yrs Exp." / "Top Rated" style badges from the reference design are
// deliberately NOT shown here — unlike sample data on a browsable list
// (where an owner has no way to know it's fake), showing a provider a made
// -up stat about THEIR OWN experience would look like a visible bug to the
// one person who actually knows the real number.
//
// Payment Methods, Service Area, and Notification Preferences are shown
// but disabled — no backing feature exists yet for the first and third;
// Service Area's backend fields already exist but there's no editor UI,
// so it's grouped with the other two rather than half-built.

function SettingsRow({
  icon: Icon,
  title,
  subtitle,
  badge,
  disabled,
  onClick,
}: {
  icon: any;
  title: string;
  subtitle: string;
  badge?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-4 p-4 rounded-xl text-left ${disabled ? "" : "tap-scale"}`}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
        <Icon size={18} color="var(--forest, #16281f)" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm flex items-center gap-2 flex-wrap">
          {title}
          {badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide" style={{ background: "var(--cream)", color: "var(--muted)" }}>
              {badge}
            </span>
          )}
          {disabled && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide" style={{ background: "var(--cream)", color: "var(--muted)" }}>
              Coming soon
            </span>
          )}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{subtitle}</p>
      </div>
      {!disabled && <span style={{ color: "var(--muted)" }}>›</span>}
    </button>
  );
}

export default function ProviderAccountPanel({
  providerId,
  providerName,
  photoUrl,
  ratingAvg,
  completedCount,
  isTrainingProvider,
  onNavigateTab,
}: {
  providerId: string;
  providerName: string;
  photoUrl: string | null;
  ratingAvg: number;
  completedCount: number;
  isTrainingProvider: boolean;
  onNavigateTab: (tab: "services" | "verification") => void;
}) {
  const router = useRouter();
  const { signOut } = useClerk();

  return (
    <div className="space-y-4">
      <div className="card text-center py-8">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div
            className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: "var(--cream)", border: "1px solid var(--border)" }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt={providerName} className="w-full h-full object-cover" />
            ) : (
              <User size={32} color="var(--muted)" />
            )}
          </div>
          <button
            onClick={() => onNavigateTab("services")}
            className="tap-scale absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--panel-dark)", color: "white" }}
            aria-label="Edit photo in Business Profile"
          >
            <Pencil size={14} />
          </button>
        </div>
        <h2 className="text-xl font-bold mb-1">{providerName}</h2>
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "var(--cream)" }}>
            <Star size={13} fill="var(--gold)" color="var(--gold)" /> {ratingAvg.toFixed(1)} · {completedCount} completed
          </span>
        </div>
        <button
          onClick={() => isTrainingProvider && router.push(`/provider/${providerId}`)}
          disabled={!isTrainingProvider}
          className="btn-primary inline-block"
          style={{ opacity: isTrainingProvider ? 1 : 0.5, cursor: isTrainingProvider ? "pointer" : "not-allowed" }}
          title={isTrainingProvider ? undefined : "Public profiles for this service are coming soon"}
        >
          View Public Profile
        </button>
      </div>

      <div className="space-y-3">
        <SettingsRow
          icon={Store}
          title="Business Profile"
          subtitle="Edit your services, pricing, photo, and bio"
          onClick={() => onNavigateTab("services")}
        />
        <SettingsRow
          icon={Wallet}
          title="Payment Methods"
          subtitle="Manage payouts and bank details"
          badge="Razorpay"
          disabled
        />
        <SettingsRow
          icon={ShieldCheck}
          title="Certifications & Documents"
          subtitle="Upload verification documents"
          onClick={() => onNavigateTab("verification")}
        />
        <SettingsRow
          icon={MapPin}
          title="Service Area"
          subtitle="Update your working radius and locations"
          disabled
        />
        <SettingsRow
          icon={Bell}
          title="Notification Preferences"
          subtitle="Manage SMS and email alerts"
          disabled
        />
      </div>

      <button
        onClick={() => signOut(() => router.push("/"))}
        className="tap-scale w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
        style={{ color: "#ba1a1a", border: "1px solid rgba(186,26,26,0.3)", background: "rgba(186,26,26,0.05)" }}
      >
        <LogOut size={16} /> Log Out
      </button>
    </div>
  );
}