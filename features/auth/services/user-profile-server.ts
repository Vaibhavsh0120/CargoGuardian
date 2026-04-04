import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/services/firebase/admin";
import { isRoleSelectionRequired, type AppUser, type UserRole } from "@/types/user";

type EnsureUserProfileOptions = {
  defaultRole?: UserRole;
  forceCreate?: boolean;
};

type AuthOnlyProfileOptions = {
  defaultRole?: UserRole;
  defaultReadOnly?: boolean;
};

export async function ensureUserProfile(
  uid: string,
  options: EnsureUserProfileOptions = {}
): Promise<AppUser> {
  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();
  const authUser = await auth.getUser(uid);
  const userRef = db.collection("users").doc(uid);
  const snapshot = await userRef.get();
  const existingData = snapshot.data();

  if (!snapshot.exists) {
    const matchedProfile = !options.forceCreate && authUser.email
      ? await findExistingProfileByEmail(uid, authUser.email.toLowerCase())
      : null;

    const role = normalizeRole(options.defaultRole ?? matchedProfile?.role);
    const readOnly =
      typeof matchedProfile?.readOnly === "boolean" && !options.forceCreate
        ? matchedProfile.readOnly
        : isReadOnlyRole(role);

    await userRef.set(
      {
        uid,
        email: authUser.email ?? null,
        displayName: authUser.displayName ?? null,
        role,
        readOnly,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    await auth.setCustomUserClaims(uid, {
      role,
      readOnly
    });

    return {
      uid,
      email: authUser.email ?? null,
      displayName: authUser.displayName ?? null,
      role,
      readOnly,
      isNewProfile: true
    };
  }

  const profileRole = options.forceCreate
    ? normalizeRole(options.defaultRole ?? existingData?.role)
    : normalizeStoredRole(existingData?.role, existingData?.roleSelected);
  const profileReadOnly =
    typeof existingData?.readOnly === "boolean" && !options.forceCreate
      ? existingData.readOnly
      : isReadOnlyRole(profileRole);
  const shouldDeleteRoleSelected = typeof existingData?.roleSelected === "boolean";
  const roleChanged = existingData?.role !== profileRole;
  const readOnlyChanged = existingData?.readOnly !== profileReadOnly;

  if (options.forceCreate || roleChanged || readOnlyChanged || shouldDeleteRoleSelected) {
    await userRef.set(
      {
        role: profileRole,
        readOnly: profileReadOnly,
        updatedAt: FieldValue.serverTimestamp(),
        ...(shouldDeleteRoleSelected ? { roleSelected: FieldValue.delete() } : {})
      },
      { merge: true }
    );
  }

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
    isNewProfile: false
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
  const role = normalizeStoredRole(data?.role, data?.roleSelected);
  const readOnly =
    typeof data?.readOnly === "boolean" ? data.readOnly : isReadOnlyRole(role);

  return {
    uid,
    email: authUser.email ?? null,
    displayName: authUser.displayName ?? null,
    role,
    readOnly
  };
}

export async function getAuthOnlyUserProfile(
  uid: string,
  options: AuthOnlyProfileOptions = {}
): Promise<AppUser> {
  const auth = getFirebaseAdminAuth();
  const authUser = await auth.getUser(uid);
  const role = normalizeRole(options.defaultRole);
  const readOnly =
    typeof options.defaultReadOnly === "boolean"
      ? options.defaultReadOnly
      : isReadOnlyRole(role);

  return {
    uid,
    email: authUser.email ?? null,
    displayName: authUser.displayName ?? null,
    role,
    readOnly
  };
}

export function normalizeRole(role: unknown): UserRole {
  return role === "admin" || role === "worker" || role === "master" || role === "not-set"
    ? role
    : "not-set";
}

function normalizeStoredRole(role: unknown, roleSelected: unknown): UserRole {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "admin") {
    return "admin";
  }

  if (typeof roleSelected === "boolean") {
    return roleSelected ? normalizedRole : "not-set";
  }

  return normalizedRole;
}

function isReadOnlyRole(role: UserRole) {
  return role !== "admin" && role !== "master";
}

async function findExistingProfileByEmail(
  uid: string,
  email: string
): Promise<Pick<AppUser, "role" | "readOnly"> | null> {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("users").where("email", "==", email).limit(5).get();

  const matchedDoc = snapshot.docs.find((doc) => doc.id !== uid);
  if (!matchedDoc) {
    return null;
  }

  const data = matchedDoc.data();
  const role = normalizeStoredRole(data.role, data.roleSelected);

  return {
    role,
    readOnly:
      typeof data.readOnly === "boolean" ? data.readOnly : isReadOnlyRole(role)
  };
}

export function requiresRoleSelection(user: AppUser | null | undefined) {
  return Boolean(user && isRoleSelectionRequired(user.role));
}
