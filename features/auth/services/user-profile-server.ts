import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/services/firebase/admin";
import type { AppUser, UserRole } from "@/types/user";

type EnsureUserProfileOptions = {
  defaultRole?: UserRole;
  forceCreate?: boolean;
};

export async function ensureUserProfile(
  uid: string,
  options: EnsureUserProfileOptions = {}
): Promise<AppUser> {
  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();
  const authUser = await auth.getUser(uid);
  const role = options.defaultRole ?? "worker";
  const readOnly = role === "worker";
  const userRef = db.collection("users").doc(uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists || options.forceCreate) {
    await userRef.set(
      {
        uid,
        email: authUser.email ?? null,
        displayName: authUser.displayName ?? null,
        role,
        readOnly,
        roleSelected: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  }

  const existingData = snapshot.exists ? snapshot.data() : null;
  const profileRole = normalizeRole(existingData?.role ?? role);
  const profileReadOnly =
    typeof existingData?.readOnly === "boolean" ? existingData.readOnly : profileRole === "worker";
  const profileRoleSelected =
    typeof existingData?.roleSelected === "boolean" ? existingData.roleSelected : false;

  await auth.setCustomUserClaims(uid, {
    role: profileRole,
    readOnly: profileReadOnly
  });

  return {
    uid,
    email: authUser.email ?? null,
    displayName: authUser.displayName ?? null,
    role: profileRole,
    readOnly: profileReadOnly,
    isNewProfile: !snapshot.exists,
    roleSelected: profileRoleSelected
  };
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();
  const [authUser, snapshot] = await Promise.all([
    auth.getUser(uid),
    db.collection("users").doc(uid).get()
  ]);

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();
  const role = normalizeRole(data?.role);
  const readOnly = typeof data?.readOnly === "boolean" ? data.readOnly : role === "worker";
  const roleSelected = typeof data?.roleSelected === "boolean" ? data.roleSelected : false;

  return {
    uid,
    email: authUser.email ?? null,
    displayName: authUser.displayName ?? null,
    role,
    readOnly,
    roleSelected
  };
}

export async function getAuthOnlyUserProfile(
  uid: string,
  options: {
    defaultRole?: UserRole;
    defaultReadOnly?: boolean;
    defaultRoleSelected?: boolean;
  } = {}
): Promise<AppUser> {
  const auth = getFirebaseAdminAuth();
  const authUser = await auth.getUser(uid);
  const role = normalizeRole(options.defaultRole);
  const readOnly = typeof options.defaultReadOnly === "boolean" ? options.defaultReadOnly : role === "worker";
  const roleSelected = typeof options.defaultRoleSelected === "boolean" ? options.defaultRoleSelected : false;

  return {
    uid,
    email: authUser.email ?? null,
    displayName: authUser.displayName ?? null,
    role,
    readOnly,
    roleSelected
  };
}

export function normalizeRole(role: unknown): UserRole {
  return role === "admin" || role === "worker" || role === "master" ? role : "worker";
}
