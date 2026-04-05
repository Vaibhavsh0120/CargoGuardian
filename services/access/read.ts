import "server-only";

import type { Firestore } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { listOperationalEvents } from "@/services/history/read";
import { canUserReviewAccessRequest } from "@/services/trains/access";
import { listAccessibleTrains } from "@/services/trains/read";
import { getOptionalIsoString, getString } from "@/services/telemetry/derive";
import type {
  AccessGrantRecord,
  AccessRequest,
  AccessWorkspaceResponse,
  AccessWorkspaceTrain
} from "@/types/access";
import type { AppUser } from "@/types/user";

type RawRecord = Record<string, unknown>;

function normalizeAccessRequestStatus(value: unknown): AccessRequest["status"] {
  return value === "approved" || value === "rejected" ? value : "pending";
}

function mapAccessRequest(id: string, raw: RawRecord): AccessRequest {
  return {
    id,
    trainId: getString(raw.trainId) ?? id,
    trainCode: getString(raw.trainCode),
    userId: getString(raw.userId) ?? "",
    userEmail: getString(raw.userEmail),
    userName: getString(raw.userName),
    userRole: raw.role === "admin" || raw.role === "master" || raw.role === "worker" ? raw.role : "worker",
    reason: getString(raw.reason),
    status: normalizeAccessRequestStatus(raw.status),
    requestedAt: getOptionalIsoString(raw.requestedAt),
    reviewedAt: getOptionalIsoString(raw.reviewedAt),
    reviewedBy: getString(raw.reviewedBy),
    rejectionReason: getString(raw.rejectionReason)
  };
}

function sortRequestsByRequestedAtDesc(left: AccessRequest, right: AccessRequest) {
  const leftTime = left.requestedAt ? new Date(left.requestedAt).getTime() : 0;
  const rightTime = right.requestedAt ? new Date(right.requestedAt).getTime() : 0;
  return rightTime - leftTime;
}

function sortAssignmentsByGrantedAtDesc(left: AccessGrantRecord, right: AccessGrantRecord) {
  const leftTime = left.grantedAt ? new Date(left.grantedAt).getTime() : 0;
  const rightTime = right.grantedAt ? new Date(right.grantedAt).getTime() : 0;
  return rightTime - leftTime;
}

function mapWorkspaceTrain(train: {
  id: string;
  code: string;
  label: string;
  status: AccessWorkspaceTrain["status"];
  journeyStage: AccessWorkspaceTrain["journeyStage"];
  clearanceStatus: AccessWorkspaceTrain["clearanceStatus"];
}): AccessWorkspaceTrain {
  return {
    id: train.id,
    code: train.code,
    label: train.label,
    status: train.status,
    journeyStage: train.journeyStage,
    clearanceStatus: train.clearanceStatus
  };
}

async function loadUserDirectory(db: Firestore, userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];

  if (!uniqueIds.length) {
    return new Map<string, { email: string | null; displayName: string | null }>();
  }

  const snapshots = await Promise.all(uniqueIds.map((userId) => db.collection("users").doc(userId).get()));

  return new Map(
    snapshots
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) => {
        const data = snapshot.data() as RawRecord | undefined;
        return [
          snapshot.id,
          {
            email: getString(data?.email),
            displayName: getString(data?.displayName)
          }
        ] as const;
      })
  );
}

export async function listAccessRequestsForUser(user: AppUser): Promise<AccessRequest[]> {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return [];
  }

  const db = getFirebaseAdminDb();
  const snapshot =
    user.role === "admin" || user.role === "master"
      ? await db.collection("accessRequests").get()
      : await db.collection("accessRequests").where("userId", "==", user.uid).get();

  const requests = snapshot.docs.map((doc) => mapAccessRequest(doc.id, doc.data() as RawRecord));

  if (user.role !== "master") {
    return requests.sort(sortRequestsByRequestedAtDesc);
  }

  const visibleRequests = (
    await Promise.all(
      snapshot.docs.map(async (doc, index) =>
        (await canUserReviewAccessRequest(db, user, doc.data() as RawRecord)) ? requests[index] : null
      )
    )
  ).filter((request): request is AccessRequest => Boolean(request));

  return visibleRequests.sort(sortRequestsByRequestedAtDesc);
}

export async function getAccessWorkspaceForUser(user: AppUser): Promise<AccessWorkspaceResponse> {
  const fetchedAt = new Date().toISOString();

  if (!process.env.FIREBASE_PROJECT_ID) {
    return {
      viewerRole: user.role,
      manageableTrains: [],
      visibleTrains: [],
      requests: [],
      assignments: [],
      recentActivity: [],
      summary: {
        pendingRequests: 0,
        activeAssignments: 0,
        manageableTrains: 0,
        visibleTrains: 0
      },
      fetchedAt
    };
  }

  const db = getFirebaseAdminDb();
  const [visibleTrainsRaw, requests, recentActivity, assignmentSnapshot] = await Promise.all([
    listAccessibleTrains(
      {
        limit: 200,
        sortBy: "label",
        sortDir: "asc"
      },
      user
    ),
    listAccessRequestsForUser(user),
    listOperationalEvents(
      {
        category: "access",
        limit: 12
      },
      user
    ).then((response) => response.events),
    user.role === "worker"
      ? db.collection("trainAssignments").where("userId", "==", user.uid).get()
      : db.collection("trainAssignments").get()
  ]);

  const visibleTrains = visibleTrainsRaw.map(mapWorkspaceTrain);
  const manageableTrains = user.role === "admin" || user.role === "master" ? visibleTrains : [];
  const visibleTrainIds = new Set(visibleTrains.map((train) => train.id));
  const manageableTrainIds = new Set(manageableTrains.map((train) => train.id));
  const trainDirectory = new Map(
    [...visibleTrains, ...manageableTrains].map((train) => [
      train.id,
      {
        code: train.code,
        label: train.label
      }
    ])
  );

  const assignmentDocs = assignmentSnapshot.docs.filter((doc) => {
    const data = doc.data();
    if (data.revokedAt) {
      return false;
    }

    const trainId = getString(data.trainId);
    const role = data.role === "master" || data.role === "worker" ? data.role : "worker";

    if (!trainId) {
      return false;
    }

    if (user.role === "admin") {
      return manageableTrainIds.has(trainId);
    }

    if (user.role === "master") {
      return manageableTrainIds.has(trainId) && role === "worker";
    }

    return getString(data.userId) === user.uid && visibleTrainIds.has(trainId);
  });

  const userDirectory = await loadUserDirectory(
    db,
    assignmentDocs.flatMap((doc) => {
      const data = doc.data();
      return [getString(data.userId), getString(data.grantedBy)].filter((value): value is string => Boolean(value));
    })
  );

  const assignments = assignmentDocs
    .map((doc) => {
      const data = doc.data() as RawRecord;
      const trainId = getString(data.trainId) ?? doc.id;
      const userId = getString(data.userId) ?? "";
      const grantedBy = getString(data.grantedBy);
      const targetUser = userDirectory.get(userId);
      const grantingUser = grantedBy ? userDirectory.get(grantedBy) : null;
      const role = data.role === "master" || data.role === "worker" ? data.role : "worker";
      const train = trainDirectory.get(trainId);

      return {
        id: doc.id,
        trainId,
        trainCode: train?.code ?? null,
        trainLabel: train?.label ?? null,
        userId,
        userEmail: targetUser?.email ?? getString(data.userEmail),
        userName: targetUser?.displayName ?? getString(data.userName),
        role,
        grantedBy,
        grantedByEmail: grantingUser?.email ?? getString(data.grantedByEmail),
        grantedByName: grantingUser?.displayName ?? null,
        grantedAt: getOptionalIsoString(data.grantedAt),
        canRevoke: user.role === "admin" || (user.role === "master" && role === "worker" && grantedBy === user.uid)
      } satisfies AccessGrantRecord;
    })
    .sort(sortAssignmentsByGrantedAtDesc);

  return {
    viewerRole: user.role,
    manageableTrains,
    visibleTrains,
    requests,
    assignments,
    recentActivity,
    summary: {
      pendingRequests: requests.filter((request) => request.status === "pending").length,
      activeAssignments: assignments.length,
      manageableTrains: manageableTrains.length,
      visibleTrains: visibleTrains.length
    },
    fetchedAt
  };
}
