import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AddTrainForm } from "@/features/trains/components/AddTrainForm";

export default function AddTrainPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/fleet"
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to fleet
      </Link>

      <AddTrainForm />
    </div>
  );
}
