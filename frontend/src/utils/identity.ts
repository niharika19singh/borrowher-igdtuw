export const COLLEGE_DOMAIN = "igdtuw.ac.in";

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isCollegeEmail(value: string): boolean {
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@igdtuw\.ac\.in$/i.test(value.trim());
}

export interface AccessState {
  email: string | null;
  emailVerified: boolean;
  verifiedStudent: boolean;
  verificationStatus?: string;
  accountStatus?: string;
}

export function hasStudentAccess(state: AccessState): boolean {
  return (
    !!state.email &&
    isCollegeEmail(state.email) &&
    state.emailVerified &&
    state.verifiedStudent &&
    state.verificationStatus === "verified" &&
    state.accountStatus === "active"
  );
}

export function readableError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    "auth/invalid-credential":
      "The email or password is incorrect. Please try again.",
    "auth/email-already-in-use":
      "An account with this email already exists. Try signing in.",
    "auth/weak-password":
      "Choose a stronger password with at least 8 characters.",
    "auth/password-does-not-meet-requirements":
      "Your password does not meet the campus password policy. Please choose a stronger password.",
    "auth/too-many-requests":
      "Too many attempts. Please wait a little before trying again.",
    "auth/network-request-failed":
      "We could not connect. Check your internet connection and try again.",
    "permission-denied":
      "You do not have permission to view or change this information.",
    "functions/permission-denied":
      "This action is not available for your account.",
    "functions/not-found":
      "This service is not available yet. Please try again later.",
    "functions/unavailable":
      "The service is temporarily unavailable. Please try again.",
  };
  return (
    (code && messages[code]) ||
    "Something went wrong. Please try again. If this continues, contact your campus administrator."
  );
}
