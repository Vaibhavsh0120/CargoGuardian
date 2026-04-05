import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatRelativeTime } from "@/lib/date";
import { eventCategoryLabels, type OperationalEvent } from "@/types/event";

export function HistoryTable({ events }: Readonly<{ events: OperationalEvent[] }>) {
  return (
    <div className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-panel">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Train</TableHead>
            <TableHead>Actor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{formatDateTime(event.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(event.createdAt)}</p>
                </div>
              </TableCell>
              <TableCell>{eventCategoryLabels[event.category]}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                </div>
              </TableCell>
              <TableCell>{event.trainCode ?? "Global"}</TableCell>
              <TableCell>{event.actorLabel ?? "System"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
