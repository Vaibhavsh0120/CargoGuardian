"use client";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from "firebase/auth";

import { getFirebaseClientAuth } from "@/services/firebase/client";
import type { LoginFormInput, SignupFormInput } from "@/features/auth/types/auth";

export async function loginWithEmailPassword(input: LoginFormInput) {
  const auth = getFirebaseClientAuth();
  return signInWithEmailAndPassword(auth, input.email, input.password);
}

export async function signupWithEmailPassword(input: SignupFormInput) {
  const auth = getFirebaseClientAuth();
  const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);

  if (input.displayName) {
    await updateProfile(credential.user, { displayName: input.displayName });
  }

  return credential;
}

export async function signInWithGooglePopup() {
  const auth = getFirebaseClientAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account"
  });

  return signInWithPopup(auth, provider);
}

export async function sendResetPasswordEmail(email: string) {
  const auth = getFirebaseClientAuth();
  return sendPasswordResetEmail(auth, email);
}

export async function logoutFirebaseUser() {
  return signOut(getFirebaseClientAuth());
}

export function subscribeToIdTokenChanges(callback: Parameters<typeof onIdTokenChanged>[1]) {
  return onIdTokenChanged(getFirebaseClientAuth(), callback);
}
