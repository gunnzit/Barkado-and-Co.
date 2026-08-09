import { Suspense } from "react";
import BookFlow from "@/components/BookFlow";

export const dynamic = "force-dynamic";

export default function BookPage() {
  return (
    <Suspense fallback={null}>
      <BookFlow />
    </Suspense>
  );
}
