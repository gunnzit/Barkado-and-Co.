// Re-mounts on every navigation, so each new page fades in instead of
// snapping. Opacity only: a transform here would break position: fixed
// bars (pay bar, bottom menu) inside pages while it runs.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
