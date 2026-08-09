"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("pawconnect-theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("pawconnect-theme", next ? "dark" : "light");
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      className="tap-scale w-9 h-9 rounded-full flex items-center justify-center"
      style={{ background: "var(--cream)", border: "1px solid var(--border)" }}
      aria-label="Toggle dark mode"
    >
      {dark ? <Sun size={16} color="var(--gold)" /> : <Moon size={16} color="var(--forest)" />}
    </button>
  );
}
