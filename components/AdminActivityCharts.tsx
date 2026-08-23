"use client";

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const TERRACOTTA = "#c97a56";
const FOREST = "#16281f";

export function DailyTrendChart({ data }: { data: { date: string; pageViews: number; clicks: number }[] }) {
  const formatted = data.map((d) => ({ ...d, label: d.date.slice(5) })); // MM-DD
  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <LineChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8a7f6f" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#8a7f6f" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5ddd0" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="pageViews" name="Page views" stroke={TERRACOTTA} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="clicks" name="Clicks" stroke={FOREST} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopBarChart({ data, color = TERRACOTTA }: { data: { label: string; count: number }[]; color?: string }) {
  const truncated = data.map((d) => ({ ...d, shortLabel: d.label.length > 22 ? d.label.slice(0, 22) + "…" : d.label }));
  return (
    <div style={{ width: "100%", height: Math.max(120, truncated.length * 34) }}>
      <ResponsiveContainer>
        <BarChart data={truncated} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: "#8a7f6f" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="shortLabel" width={140} tick={{ fontSize: 11, fill: "#3a2f22" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5ddd0" }} />
          <Bar dataKey="count" fill={color} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}