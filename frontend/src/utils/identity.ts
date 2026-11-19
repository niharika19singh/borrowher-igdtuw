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
  const err = error as {
    code?: string;
    message?: string;
    details?: { issues?: Array<{ message?: string }> };
  };
  const code = err?.code;
  const issues = err?.details?.issues
    ?.map((issue) => issue.message)
    .filter(Boolean);
  if (issues && issues.length > 0) {
    return issues.join(" ");
  }
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
    "functions/failed-precondition":
      err?.message ||
      "This item cannot be modified right now. Refresh and try again.",
    "functions/invalid-argument":
      err?.message || "Please check your inputs and try again.",
    "storage/unauthorized":
      "You do not have permission to upload or view this photo. Only verified active students may upload images up to 5 MB.",
    "storage/canceled": "Photo upload was cancelled.",
  };
  return (
    (code && messages[code]) ||
    "Something went wrong. Please try again. If this continues, contact your campus administrator."
  );
}
