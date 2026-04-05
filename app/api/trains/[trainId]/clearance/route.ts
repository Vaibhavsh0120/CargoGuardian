import { z } from "zod";

import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { syncTrainClearanceLed } from "@/services/blynk/device";
import { recordOperationalEvent } from "@/services/events/write";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { canUserManageTrain } from "@/services/trains/access";
import { getOptionalIsoString, getString } from "@/services/telemetry/derive";

const clearanceSchema = z.object({
  method: z.enum(["remote", "rfid"])
});

export async function POST(request: Request, { params }: { params: Promise<{ trainId: string }> }) {
  try {
    const user = await getCurrentSessionUser();

    if (!user) {
      return failure("Authentication required.", 401);
    }

    if (user.role !== "admin" && user.role !== "master") {
      return failure("Only admins and masters can grant clearance.", 403);
    }

    const body = clearanceSchema.parse(await request.json());
    const { trainId } = await params;
    const db = getFirebaseAdminDb();
    const trainDoc = await db.collection("trains").doc(trainId).get();

    if (!trainDoc.exists) {
      return failure("Train not found.", 404);
    }

    const trainData = trainDoc.data() as Record<string, unknown>;
    const ownerId = getString(trainData.ownerId);
    const canManage = await canUserManageTrain(db, user, trainId, ownerId);

    if (!canManage) {
      return failure("You do not have access to clear this train.", 403);
    }

    const telemetryDoc = await db.collection("telemetry_current").doc(trainId).get();
    const telemetryData = telemetryDoc.exists ? (telemetryDoc.data() as Record<string, unknown>) : null;
    const rfidLastScan = getOptionalIsoString(telemetryData?.rfidLastScan);
    const rfidLastTag = getString(telemetryData?.rfidLastTag);

    if (body.method === "rfid" && !rfidLastScan) {
      return failure("RFID-backed clearance requires a recorded RFID scan on this train.", 400);
    }

    const now = new Date().toISOString();
    await db.collection("trains").doc(trainId).set(
      {
        clearanceStatus: "granted",
        clearanceGrantedAt: now,
        clearanceGrantedBy: user.displayName ?? user.email ?? user.uid,
        clearanceMethod: body.method,
        journeyStage: "cleared",
        updatedAt: now
      },
      { merge: true }
    );

    try {
      await syncTrainClearanceLed(
        {
          code: getString(trainData.code) ?? trainId,
          blynkAuthToken: getString(trainData.blynkAuthToken)
        },
        true
      );
    } catch {
      return failure("Clearance was granted in CargoGuardian, but syncing the hardware LED failed.", 502);
    }

    await recordOperationalEvent({
      category: "clearance",
      action: body.method === "rfid" ? "clearance-granted-rfid" : "clearance-granted-remote",
      severity: "info",
      title: "Clearance granted",
      description:
        body.method === "rfid"
          ? `Clearance granted with RFID confirmation${rfidLastTag ? ` for tag ${rfidLastTag}` : ""}.`
          : "Clearance granted remotely from CargoGuardian.",
      trainId,
      trainCode: getString(trainData.code),
      trainLabel: getString(trainData.label) ?? getString(trainData.code),
      actorId: user.uid,
      actorLabel: user.displayName ?? user.email ?? "Operator",
      actorRole: user.role,
      metadata: {
        clearanceMethod: body.method,
        rfidLastScan,
        rfidLastTag
      }
    });

    return ok({ success: true, clearedAt: now });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure(error.issues[0]?.message ?? "Invalid clearance payload.", 400);
    }

    return failure(error instanceof Error ? error.message : "Failed to grant clearance.", 500);
  }
}
