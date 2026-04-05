import type { OperationalEvent } from "@/types/event";
import type { ClearanceStatus, JourneyStage, TrainStatus } from "@/types/train";
import type { UserRole } from "@/types/user";

export const ACCESS_REQUEST_STATUS_VALUES = ["pending", "approved", "rejected"] as const;

export type AccessRequestStatus = (typeof ACCESS_REQUEST_STATUS_VALUES)[number];

export type AccessRequest = {
  id: string;
  trainId: string;
  trainCode: string | null;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  userRole: UserRole;
  reason: string | null;
  status: AccessRequestStatus;
  requestedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
};

export type AccessRequestListResponse = {
  requests: AccessRequest[];
  fetchedAt: string;
};

export type AccessWorkspaceTrain = {
  id: string;
  code: string;
  label: string;
  status: TrainStatus;
  journeyStage: JourneyStage;
  clearanceStatus: ClearanceStatus;
};

export type AccessGrantRecord = {
  id: string;
  trainId: string;
  trainCode: string | null;
  trainLabel: string | null;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  role: UserRole;
  grantedBy: string | null;
  grantedByEmail: string | null;
  grantedByName: string | null;
  grantedAt: string | null;
  canRevoke: boolean;
};

export type AccessWorkspaceSummary = {
  pendingRequests: number;
  activeAssignments: number;
  manageableTrains: number;
  visibleTrains: number;
};

export type AccessWorkspaceResponse = {
  viewerRole: UserRole;
  manageableTrains: AccessWorkspaceTrain[];
  visibleTrains: AccessWorkspaceTrain[];
  requests: AccessRequest[];
  assignments: AccessGrantRecord[];
  recentActivity: OperationalEvent[];
  summary: AccessWorkspaceSummary;
  fetchedAt: string;
};

export const accessRequestStatusLabels: Record<AccessRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected"
};
