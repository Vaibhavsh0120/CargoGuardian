import { Button } from "@/components/ui/button";

export function AccessRequestActions({
  disabled = false,
  onApprove,
  onReject
}: Readonly<{
  disabled?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}>) {
  return (
    <div className="flex flex-wrap gap-2">
      {onApprove ? (
        <Button size="sm" onClick={onApprove} disabled={disabled}>
          Approve
        </Button>
      ) : null}
      {onReject ? (
        <Button size="sm" variant="outline" onClick={onReject} disabled={disabled}>
          Reject
        </Button>
      ) : null}
    </div>
  );
}
