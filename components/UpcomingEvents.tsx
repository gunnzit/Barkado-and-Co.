import { Calendar, MapPin } from "lucide-react";

// Sample events — replace with real local listings once you have a source
// (a partner API, manual entries, or a form for local organizers to submit).
const EVENTS = [
  { title: "City Dog Show", date: "Sat, 23 Aug", location: "Add venue", type: "Show" },
  { title: "Pawsome Café Meetup", date: "Sun, 31 Aug", location: "Add nearby café", type: "Meetup" },
  { title: "Pet Expo", date: "Sat, 6 Sep", location: "Add venue", type: "Expo" },
];

export default function UpcomingEvents() {
  return (
    <section className="max-w-6xl mx-auto px-6 mb-16">
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--terracotta)" }}>
        Happening nearby
      </p>
      <h2 className="text-2xl md:text-3xl font-bold mb-8">Dog shows, cafés, and expos.</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {EVENTS.map((e) => (
          <div key={e.title} className="card">
            <span className="trust-chip mb-3">{e.type}</span>
            <p className="font-bold text-sm mb-1">{e.title}</p>
            <p className="text-xs flex items-center gap-1 mb-1" style={{ color: "var(--muted)" }}>
              <Calendar size={12} /> {e.date}
            </p>
            <p className="text-xs flex items-center gap-1" style={{ color: "var(--muted)" }}>
              <MapPin size={12} /> {e.location}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
