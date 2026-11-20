import { describe, expect, it } from "vitest";
import {
  hasStudentAccess,
  isCollegeEmail,
  normalizeEmail,
  readableError,
} from "./identity";

describe("IGDTUW membership boundary", () => {
  it.each([
    "student@igdtuw.ac.in",
    " Student.Name@IGDTUW.AC.IN ",
    "student+lab@igdtuw.ac.in",
  ])("accepts the exact college domain: %s", (email) =>
    expect(isCollegeEmail(email)).toBe(true),
  );
  it.each([
    "student@gmail.com",
    "student@igdtuw.ac.in.evil.com",
    "student@sub.igdtuw.ac.in",
    "student@fakeigdtuw.ac.in",
    "student@igdtuwac.in",
    "student@igdtuw.ac.in@evil.com",
    "@igdtuw.ac.in",
    "student name@igdtuw.ac.in",
    "student@igdtuw.ac.in\nother@gmail.com",
  ])("rejects non-campus or malformed addresses: %s", (email) =>
    expect(isCollegeEmail(email)).toBe(false),
  );
  it("normalizes only surrounding whitespace and case", () =>
    expect(normalizeEmail(" Student@IGDTUW.AC.IN ")).toBe(
      "student@igdtuw.ac.in",
    ));
  const approved = {
    email: "student@igdtuw.ac.in",
    emailVerified: true,
    verifiedStudent: true,
    verificationStatus: "verified",
    accountStatus: "active",
  };
  it("admits an approved, email-verified active student", () =>
    expect(hasStudentAccess(approved)).toBe(true));
  it.each([
    { emailVerified: false },
    { verifiedStudent: false },
    { verificationStatus: "pending" },
    { verificationStatus: "rejected" },
    { verificationStatus: "suspended" },
    { accountStatus: "suspended" },
    { accountStatus: undefined },
    { email: "student@gmail.com" },
    { email: null },
  ])("denies stale claims or incomplete membership: %j", (patch) =>
    expect(hasStudentAccess({ ...approved, ...patch })).toBe(false),
  );
});

describe("readableError", () => {
  it("surfaces Cloud Function Zod validation issue messages", () => {
    const err = {
      code: "functions/invalid-argument",
      message: "Validation failed",
      details: {
        issues: [
          {
            message:
              "Maximum borrow days must be greater than or equal to minimum borrow days",
          },
        ],
      },
    };
    expect(readableError(err)).toContain("Maximum borrow days");
  });

  it("returns friendly message for Firebase Storage unauthorized errors", () => {
    expect(readableError({ code: "storage/unauthorized" })).toContain(
      "verified active students",
    );
  });
});
