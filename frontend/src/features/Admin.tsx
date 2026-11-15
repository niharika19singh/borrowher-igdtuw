import { useEffect, useState, type FormEvent } from "react";
import {
  collection,
  limit,
  onSnapshot,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  Check,
  ClipboardCheck,
  Flag,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useDemo } from "../app/DemoContext";
import { db, callFunction } from "../firebase/client";
import type {
  ApproveStudentInput,
  ApproveStudentResponse,
  AdminModerateListingInput,
  UserProfile,
  ListingSummary,
} from "../types/backend";
import {
  Avatar,
  Badge,
  Empty,
  ErrorMessage,
  Loading,
  PageHeading,
  SuccessMessage,
} from "../components/ui";
import { Modal } from "../components/Modal";
import { readableError } from "../utils/identity";

type Zone = {
  zoneId: string;
  label: string;
  campusArea: string;
  active: boolean;
  approvalStatus: "pending_review" | "approved" | "rejected";
  guidance: string;
  accessNote: string;
};
const sampleStudents: UserProfile[] = [
  {
    uid: "s1",
    displayName: "Isha Mehta",
    email: "sample.isha@igdtuw.ac.in",
    programme: "B.Tech CSE",
    year: 2,
    verificationStatus: "pending",
    accountStatus: "active",
    createdAt: "2026-11-15T09:00:00Z",
    updatedAt: "2026-11-15T09:00:00Z",
  },
  {
    uid: "s2",
    displayName: "Tanya Arora",
    email: "sample.tanya@igdtuw.ac.in",
    programme: "B.Tech ECE",
    year: 1,
    verificationStatus: "pending",
    accountStatus: "active",
    createdAt: "2026-11-15T08:00:00Z",
    updatedAt: "2026-11-15T08:00:00Z",
  },
];
type Review =
  | { kind: "student"; row: UserProfile }
  | { kind: "listing"; row: ListingSummary }
  | { kind: "zone"; row: Zone };

export function AdminPage() {
  const demo = useDemo();
  const [tab, setTab] = useState<"students" | "listings" | "zones" | "reports">(
    "students",
  );
  const [students, setStudents] = useState<UserProfile[]>(
    demo.enabled ? sampleStudents : [],
  );
  const [listings, setListings] = useState<ListingSummary[]>(
    demo.enabled
      ? [
          {
            listingId: "sample1",
            title: "Sample scientific calculator",
            status: "active",
          },
        ]
      : [],
  );
  const [zones, setZones] = useState<Zone[]>(
    demo.enabled
      ? [
          {
            zoneId: "z1",
            label: "Library entrance · sample",
            campusArea: "Academic area",
            active: false,
            approvalStatus: "pending_review",
            guidance: "Public handover only. Confirm access before meeting.",
            accessNote: "No hostel rooms or private residences.",
          },
        ]
      : [],
  );
  const [loading, setLoading] = useState(!demo.enabled);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (demo.enabled || !db || tab === "reports") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const name =
      tab === "students"
        ? "users"
        : tab === "listings"
          ? "listings"
          : "pickupZones";
    return onSnapshot(
      query(collection(db, name), limit(50)),
      (snapshot) => {
        if (tab === "students")
          setStudents(
            snapshot.docs.map(
              (d) => ({ ...d.data(), uid: d.id }) as UserProfile,
            ),
          );
        if (tab === "listings")
          setListings(
            snapshot.docs.map(
              (d) => ({ ...d.data(), listingId: d.id }) as ListingSummary,
            ),
          );
        if (tab === "zones")
          setZones(
            snapshot.docs.map((d) => ({ ...d.data(), zoneId: d.id }) as Zone),
          );
        setLoading(false);
      },
      (err) => {
        setError(readableError(err));
        setLoading(false);
      },
    );
  }, [tab, demo.enabled]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!review) return;
    setBusy(true);
    setError("");
    setMessage("");
    const fields = new FormData(event.currentTarget);
    const reason = String(fields.get("reason") || "").trim();
    try {
      if (review.kind === "student") {
        const status = String(
          fields.get("status"),
        ) as ApproveStudentInput["status"];
        if (status !== "verified" && reason.length < 5)
          throw new Error("reason");
        if (demo.enabled)
          setStudents((rows) =>
            rows.map((row) =>
              row.uid === review.row.uid
                ? {
                    ...row,
                    verificationStatus: status,
                    accountStatus:
                      status === "suspended" ? "suspended" : row.accountStatus,
                  }
                : row,
            ),
          );
        else {
          const result = await callFunction<
            ApproveStudentInput,
            ApproveStudentResponse
          >("approveStudent", {
            uid: review.row.uid,
            status,
            ...(reason ? { reason } : {}),
          });
          if (!result.success) throw new Error("save");
        }
      } else if (review.kind === "listing") {
        const status = String(fields.get("status")) as "active" | "removed";
        if (demo.enabled)
          setListings((rows) =>
            rows.map((row) =>
              row.listingId === review.row.listingId ? { ...row, status } : row,
            ),
          );
        else {
          const result = await callFunction<
            AdminModerateListingInput,
            { success: boolean }
          >("adminModerateListing", {
            listingId: review.row.listingId,
            status,
            moderationReason: reason,
          });
          if (!result.success) throw new Error("save");
        }
      } else {
        const approvalStatus = String(
          fields.get("status"),
        ) as Zone["approvalStatus"];
        const patch = {
          approvalStatus,
          active: approvalStatus === "approved",
          guidance: String(fields.get("guidance")).trim(),
        };
        if (demo.enabled)
          setZones((rows) =>
            rows.map((row) =>
              row.zoneId === review.row.zoneId ? { ...row, ...patch } : row,
            ),
          );
        else await updateDoc(doc(db!, "pickupZones", review.row.zoneId), patch);
      }
      setReview(null);
      setMessage(
        demo.enabled
          ? "Sample review saved for this preview."
          : "Review saved successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error && err.message === "reason"
          ? "Please add a reason with at least 5 characters."
          : readableError(err),
      );
    } finally {
      setBusy(false);
    }
  }
  const matches = (value: string) =>
    value.toLowerCase().includes(search.toLowerCase());
  const filteredStudents = students.filter((s) =>
    matches(`${s.displayName} ${s.email}`),
  );
  const filteredListings = listings.filter((l) => matches(l.title));
  const filteredZones = zones.filter((z) => matches(z.label));
  return (
    <>
      <PageHeading
        eyebrow="LOOKING AFTER OUR LITTLE COMMUNITY"
        title="Campus care console"
        description="Review student accounts, keep listings helpful, and make campus sharing a little safer."
        action={
          <Badge tone="green">
            <ShieldCheck size={14} />
            {demo.enabled ? "Sample admin view" : "Administrator"}
          </Badge>
        }
      />
      <div className="admin-notice">
        <ShieldCheck size={21} />
        <p>
          {demo.enabled
            ? "You’re exploring a sample admin screen. These actions only change the preview."
            : "Admin actions require trusted server permissions. Review evidence before approving an account or pickup zone."}
        </p>
      </div>
      <div className="filter-bar">
        <div className="filter-chips">
          {[
            {
              key: "students",
              label: "Student verification",
              icon: ShieldCheck,
            },
            {
              key: "listings",
              label: "Listing moderation",
              icon: ClipboardCheck,
            },
            { key: "zones", label: "Pickup zones", icon: MapPin },
            { key: "reports", label: "Reports", icon: Flag },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={tab === key ? "selected" : ""}
              aria-pressed={tab === key}
              onClick={() => {
                setTab(key as typeof tab);
                setSearch("");
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>
      <SuccessMessage>{message}</SuccessMessage>
      {!review && <ErrorMessage>{error}</ErrorMessage>}
      {tab !== "reports" && (
        <div className="admin-list-heading">
          <h2>
            {tab === "students"
              ? "Student accounts"
              : tab === "listings"
                ? "Campus listings"
                : "Campus pickup zones"}
          </h2>
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Search admin records"
              placeholder="Search this list…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
      )}
      {loading ? (
        <Loading />
      ) : (
        <section className="panel admin-list">
          {tab === "students" &&
            (filteredStudents.length ? (
              filteredStudents.map((s) => (
                <article key={s.uid} className="admin-row">
                  <Avatar name={s.displayName} />
                  <div>
                    <h3>{s.displayName}</h3>
                    <p>{s.email}</p>
                    <small>
                      {s.programme || "Programme not provided"} ·{" "}
                      {s.year ? `Year ${s.year}` : "Year not provided"}
                    </small>
                  </div>
                  <Badge
                    tone={
                      s.verificationStatus === "verified" ? "green" : "amber"
                    }
                  >
                    {s.verificationStatus}
                  </Badge>
                  <button
                    className="button outline small-button"
                    onClick={() => {
                      setError("");
                      setReview({ kind: "student", row: s });
                    }}
                  >
                    Review
                  </button>
                </article>
              ))
            ) : (
              <Empty title="No accounts found">
                Try another search or check back when new students join.
              </Empty>
            ))}
          {tab === "listings" &&
            (filteredListings.length ? (
              filteredListings.map((l) => (
                <article key={l.listingId} className="admin-row">
                  <span className="empty-icon">
                    <ClipboardCheck size={22} />
                  </span>
                  <div>
                    <h3>{l.title}</h3>
                    <p>Listing · {l.listingId}</p>
                  </div>
                  <Badge tone={l.status === "active" ? "green" : "neutral"}>
                    {l.status}
                  </Badge>
                  <button
                    className="button outline small-button"
                    onClick={() => {
                      setError("");
                      setReview({ kind: "listing", row: l });
                    }}
                  >
                    Review
                  </button>
                </article>
              ))
            ) : (
              <Empty title="No listings found">
                Campus listings will appear here for review.
              </Empty>
            ))}
          {tab === "zones" &&
            (filteredZones.length ? (
              filteredZones.map((z) => (
                <article key={z.zoneId} className="admin-row">
                  <span className="empty-icon">
                    <MapPin size={22} />
                  </span>
                  <div>
                    <h3>{z.label}</h3>
                    <p>{z.campusArea}</p>
                    <small>{z.accessNote}</small>
                  </div>
                  <Badge tone={z.active ? "green" : "amber"}>
                    {z.approvalStatus.replace("_", " ")}
                  </Badge>
                  <button
                    className="button outline small-button"
                    onClick={() => {
                      setError("");
                      setReview({ kind: "zone", row: z });
                    }}
                  >
                    Review
                  </button>
                </article>
              ))
            ) : (
              <Empty title="No pickup zones found">
                New locations must be reviewed before campus exchanges use them.
              </Empty>
            ))}
          {tab === "reports" && (
            <Empty title="A place for campus concerns">
              Report review will open when the moderation workflow is connected.
              Student verification and listing moderation are available in the
              other tabs.
            </Empty>
          )}
        </section>
      )}
      {!demo.enabled && tab !== "reports" && (
        <p className="quiet-note">
          Showing up to 50 records. Search filters this loaded set.
        </p>
      )}
      {review && (
        <Modal
          title={
            review.kind === "student"
              ? `Review ${review.row.displayName}`
              : review.kind === "listing"
                ? "Review campus listing"
                : "Review pickup zone"
          }
          onClose={() => !busy && setReview(null)}
        >
          <form className="stack-form" onSubmit={submit}>
            <p className="muted">
              {review.kind === "student"
                ? review.row.email
                : review.kind === "listing"
                  ? review.row.title
                  : review.row.label}
            </p>
            <label>
              Decision
              <select
                name="status"
                required
                defaultValue={
                  review.kind === "zone"
                    ? review.row.approvalStatus
                    : review.kind === "listing"
                      ? review.row.status === "removed"
                        ? "removed"
                        : "active"
                      : "verified"
                }
              >
                {review.kind === "student" ? (
                  <>
                    <option value="verified">Approve student</option>
                    <option value="rejected">Reject verification</option>
                    <option value="suspended">Suspend account</option>
                  </>
                ) : review.kind === "listing" ? (
                  <>
                    <option value="active">Keep / restore listing</option>
                    <option value="removed">Remove listing</option>
                  </>
                ) : (
                  <>
                    <option value="pending_review">Keep pending review</option>
                    <option value="approved">Approve public pickup zone</option>
                    <option value="rejected">Reject zone</option>
                  </>
                )}
              </select>
            </label>
            {review.kind === "zone" ? (
              <label>
                Public handover guidance
                <textarea
                  name="guidance"
                  defaultValue={review.row.guidance}
                  minLength={10}
                  maxLength={500}
                  required
                />
              </label>
            ) : (
              <label>
                Review reason
                <textarea
                  name="reason"
                  minLength={5}
                  maxLength={500}
                  required={review.kind === "listing"}
                  placeholder="Explain the review decision."
                />
              </label>
            )}
            <label className="checkbox-label">
              <input type="checkbox" required />
              <span>
                I have reviewed{" "}
                {review.kind === "zone"
                  ? "campus access and the safety of this public location"
                  : "the account or listing and the relevant evidence"}
                .
              </span>
            </label>
            <ErrorMessage>{error}</ErrorMessage>
            <div className="button-row">
              <button
                type="button"
                className="button outline"
                onClick={() => setReview(null)}
                disabled={busy}
              >
                Cancel
              </button>
              <button className="button primary" disabled={busy}>
                <Check size={16} />
                {busy ? "Saving review…" : "Save review"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
