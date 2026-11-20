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
  FolderKanban,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { useAuth } from "../app/AuthContext";
import { useDemo } from "../app/DemoContext";
import { db, callFunction } from "../firebase/client";
import {
  DEMO_CATEGORIES,
  manageCategory,
  setAdminRole,
} from "../services/marketplace";
import type {
  ApproveStudentInput,
  ApproveStudentResponse,
  AdminModerateListingInput,
  Category,
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
  | { kind: "adminRole"; row: UserProfile }
  | { kind: "listing"; row: ListingSummary }
  | { kind: "category"; row: Category | null }
  | { kind: "zone"; row: Zone };

export function AdminPage() {
  const demo = useDemo();
  const session = useAuth();
  const [tab, setTab] = useState<
    "students" | "listings" | "categories" | "zones" | "reports"
  >("students");
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
  const [categories, setCategories] = useState<Category[]>(
    demo.enabled ? DEMO_CATEGORIES : [],
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
          : tab === "categories"
            ? "categories"
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
        if (tab === "categories")
          setCategories(
            snapshot.docs.map(
              (d) => ({ ...d.data(), categoryId: d.id }) as Category,
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
                      status === "suspended" ? "suspended" : "active",
                    rejectionReason: status === "rejected" ? reason : undefined,
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
      } else if (review.kind === "adminRole") {
        const makeAdmin = String(fields.get("adminAction")) === "grant";
        if (!demo.enabled && session.user?.uid === review.row.uid && !makeAdmin) {
          throw new Error("self-demote");
        }
        if (!demo.enabled) {
          const result = await setAdminRole({
            targetUid: review.row.uid,
            admin: makeAdmin,
          });
          if (!result.success) throw new Error("save");
        }
      } else if (review.kind === "listing") {
        const status = String(fields.get("status")) as "active" | "removed";
        if (demo.enabled)
          setListings((rows) =>
            rows.map((row) =>
              row.listingId === review.row.listingId
                ? { ...row, status, moderationReason: reason }
                : row,
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
      } else if (review.kind === "category") {
        const categoryId = String(fields.get("categoryId") || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-");
        const name = String(fields.get("name") || "").trim();
        const slug = String(fields.get("slug") || categoryId)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-");
        const description = String(fields.get("description") || "").trim();
        const active = String(fields.get("active")) === "true";

        if (!categoryId || name.length < 2 || description.length < 5) {
          throw new Error("category");
        }

        if (demo.enabled) {
          const nextCat: Category = {
            categoryId,
            name,
            slug,
            description,
            active,
          };
          setCategories((rows) => {
            const exists = rows.some((c) => c.categoryId === categoryId);
            return exists
              ? rows.map((c) => (c.categoryId === categoryId ? nextCat : c))
              : [...rows, nextCat];
          });
        } else {
          const result = await manageCategory({
            categoryId,
            name,
            slug,
            description,
            active,
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
          reviewedBy: session.user?.uid || "admin",
          reviewedAt: new Date().toISOString(),
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
          ? "Sample admin change saved for this preview."
          : "Admin action saved successfully.",
      );
    } catch (err) {
      if (err instanceof Error && err.message === "reason") {
        setError("Please add a reason with at least 5 characters.");
      } else if (err instanceof Error && err.message === "self-demote") {
        setError("Administrators cannot revoke their own admin privilege.");
      } else if (err instanceof Error && err.message === "category") {
        setError(
          "Provide a valid category ID, name (2+ chars), and description (5+ chars).",
        );
      } else {
        setError(readableError(err));
      }
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
  const filteredCategories = categories.filter((c) =>
    matches(`${c.name} ${c.categoryId} ${c.description}`),
  );
  const filteredZones = zones.filter((z) => matches(z.label));

  return (
    <>
      <PageHeading
        eyebrow="LOOKING AFTER OUR LITTLE COMMUNITY"
        title="Campus care console"
        description="Review student accounts, listings, categories, admin roles, and campus pickup zones."
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
            : "Admin actions enforce server-side admin claims and write immutable audit logs."}
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
            {
              key: "categories",
              label: "Categories",
              icon: FolderKanban,
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
                setMessage("");
                setError("");
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
                : tab === "categories"
                  ? "Marketplace categories"
                  : "Campus pickup zones"}
          </h2>
          <div className="button-row">
            {tab === "categories" && (
              <button
                type="button"
                className="button primary small-button"
                onClick={() => {
                  setError("");
                  setReview({ kind: "category", row: null });
                }}
              >
                <Plus size={15} />
                Add category
              </button>
            )}
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
                      {s.rejectionReason ? ` · Note: ${s.rejectionReason}` : ""}
                    </small>
                  </div>
                  <Badge
                    tone={
                      s.accountStatus === "suspended"
                        ? "neutral"
                        : s.verificationStatus === "verified"
                          ? "green"
                          : "amber"
                    }
                  >
                    {s.accountStatus === "suspended"
                      ? "suspended"
                      : s.verificationStatus}
                  </Badge>
                  <div className="button-row">
                    <button
                      className="button outline small-button"
                      onClick={() => {
                        setError("");
                        setReview({ kind: "student", row: s });
                      }}
                    >
                      Review
                    </button>
                    <button
                      className="button outline small-button"
                      onClick={() => {
                        setError("");
                        setReview({ kind: "adminRole", row: s });
                      }}
                    >
                      <UserCog size={14} />
                      Role
                    </button>
                  </div>
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
                    {l.moderationReason && (
                      <small>Moderation note: {l.moderationReason}</small>
                    )}
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
          {tab === "categories" &&
            (filteredCategories.length ? (
              filteredCategories.map((c) => (
                <article key={c.categoryId} className="admin-row">
                  <span className="empty-icon">
                    <FolderKanban size={22} />
                  </span>
                  <div>
                    <h3>{c.name}</h3>
                    <p>{c.description}</p>
                    <small>
                      ID: {c.categoryId} · Slug: {c.slug}
                    </small>
                  </div>
                  <Badge tone={c.active ? "green" : "neutral"}>
                    {c.active ? "active" : "inactive"}
                  </Badge>
                  <button
                    className="button outline small-button"
                    onClick={() => {
                      setError("");
                      setReview({ kind: "category", row: c });
                    }}
                  >
                    Edit
                  </button>
                </article>
              ))
            ) : (
              <Empty title="No categories found">
                Add campus marketplace categories or run the category seed
                script.
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
              Report review will open when Backend Developer 2’s moderation
              report workflow is connected. Student verification, listing
              moderation, categories, roles, and pickup zones are active in the
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
              : review.kind === "adminRole"
                ? `Manage admin role · ${review.row.displayName}`
                : review.kind === "listing"
                  ? "Review campus listing"
                  : review.kind === "category"
                    ? review.row
                      ? `Edit category · ${review.row.name}`
                      : "Create campus category"
                    : "Review pickup zone"
          }
          onClose={() => !busy && setReview(null)}
        >
          <form className="stack-form" onSubmit={submit}>
            {review.kind === "category" ? (
              <>
                <label>
                  Category ID (lowercase slug) *
                  <input
                    name="categoryId"
                    defaultValue={review.row?.categoryId || ""}
                    readOnly={Boolean(review.row)}
                    placeholder="e.g., lab-project-equipment"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </label>
                <label>
                  Display name *
                  <input
                    name="name"
                    defaultValue={review.row?.name || ""}
                    placeholder="e.g., Lab & Project Equipment"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </label>
                <label>
                  URL slug *
                  <input
                    name="slug"
                    defaultValue={review.row?.slug || ""}
                    placeholder="e.g., lab-project-equipment"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </label>
                <label>
                  Description *
                  <textarea
                    name="description"
                    defaultValue={review.row?.description || ""}
                    placeholder="Explain what campus items belong in this category."
                    minLength={5}
                    maxLength={500}
                    required
                  />
                </label>
                <label>
                  Status
                  <select
                    name="active"
                    defaultValue={String(review.row?.active ?? true)}
                  >
                    <option value="true">Active (selectable in listings)</option>
                    <option value="false">Inactive (hidden from new listings)</option>
                  </select>
                </label>
              </>
            ) : review.kind === "adminRole" ? (
              <>
                <p className="muted">{review.row.email}</p>
                <label>
                  Administrator privilege
                  <select name="adminAction" defaultValue="grant" required>
                    <option value="grant">Grant administrator role</option>
                    <option value="revoke">Revoke administrator role</option>
                  </select>
                </label>
                <p className="quiet-note">
                  Invokes server-side `setAdminRole` Cloud Function (`asia-south1`)
                  and records an immutable entry in `auditLogs`.
                </p>
              </>
            ) : (
              <>
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
                        <option value="pending_review">
                          Keep pending review
                        </option>
                        <option value="approved">
                          Approve public pickup zone
                        </option>
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
              </>
            )}
            <label className="checkbox-label">
              <input type="checkbox" required />
              <span>
                I confirm this administrative action complies with IGDTUW campus
                policy.
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
                {busy ? "Saving…" : "Confirm & save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
