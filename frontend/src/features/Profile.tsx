import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import {
  BookHeart,
  CalendarDays,
  GraduationCap,
  Heart,
  Pencil,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useAuth } from "../app/AuthContext";
import { useDemo } from "../app/DemoContext";
import { db, callFunction } from "../firebase/client";
import type { PublicProfile } from "../types/backend";
import {
  Avatar,
  Empty,
  ErrorMessage,
  Loading,
  PageHeading,
  SuccessMessage,
  Verified,
} from "../components/ui";
import { Modal } from "../components/Modal";
import { readableError } from "../utils/identity";

export function ProfilePage() {
  const { uid } = useParams();
  const session = useAuth();
  const demo = useDemo();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(!demo.enabled);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [demoProgramme, setDemoProgramme] = useState(
    "B.Tech · Computer Science",
  );
  const [demoYear, setDemoYear] = useState("2");
  const own = demo.enabled ? uid === "me" : uid === session.user?.uid;
  useEffect(() => {
    if (demo.enabled || !db || !uid) return;
    setLoading(true);
    setError("");
    setProfile(null);
    return onSnapshot(
      doc(db, "publicProfiles", uid),
      (snapshot) => {
        setProfile(
          snapshot.exists() ? (snapshot.data() as PublicProfile) : null,
        );
        setLoading(false);
      },
      (err) => {
        setError(readableError(err));
        setLoading(false);
      },
    );
  }, [uid, demo.enabled]);
  if (loading) return <Loading />;
  const displayName = demo.enabled
    ? own
      ? demo.name
      : "Sample student"
    : profile?.displayName;
  if (!displayName)
    return (
      <>
        <PageHeading
          eyebrow="YOUR CAMPUS CIRCLE"
          title="Student profile"
          description="A little introduction goes a long way."
        />
        <ErrorMessage>{error}</ErrorMessage>
        <Empty title="This profile isn’t available">
          The student may not have completed their profile yet.
        </Empty>
      </>
    );
  const verified = demo.enabled || profile?.verificationBadge;
  const completed = demo.enabled
    ? demo.bookings.filter((b) => b.status === "completed").length
    : profile?.completedBorrowCount || 0;
  const reviews = demo.enabled ? 0 : profile?.ratingSummary.totalReviews || 0;
  const programme = demo.enabled ? demoProgramme : session.profile?.programme;
  const year = demo.enabled ? demoYear : session.profile?.year;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const fields = new FormData(event.currentTarget);
    const changes = {
      displayName: String(fields.get("displayName")).trim(),
      programme: String(fields.get("programme")).trim(),
      year: String(fields.get("year")),
    };
    try {
      if (demo.enabled) {
        demo.setName(changes.displayName);
        setDemoProgramme(changes.programme);
        setDemoYear(changes.year);
      } else {
        const response = await callFunction<
          typeof changes,
          { success: boolean }
        >("updateUserProfile", changes);
        if (!response.success) throw new Error("Profile update failed");
      }
      setEditing(false);
      setMessage(
        demo.enabled
          ? "Sample profile updated for this preview."
          : "Your profile is up to date.",
      );
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="A FAMILIAR FACE IN THE CIRCLE"
        title={own ? "Your little introduction." : "Meet your campus circle."}
        description="Good sharing starts with knowing a little about each other."
        action={
          own && (
            <button
              className="button outline"
              onClick={() => {
                setError("");
                setEditing(true);
              }}
            >
              <Pencil size={15} />
              Edit profile
            </button>
          )
        }
      />
      <SuccessMessage>{message}</SuccessMessage>
      <div className="profile-grid">
        <section className="panel profile-card">
          <div className="profile-cover">
            <span>✧</span>
            <Heart size={34} strokeWidth={1} />
            <span>✳</span>
          </div>
          <Avatar className="profile-avatar" name={displayName} />
          <h2>{displayName}</h2>
          {verified && <Verified />}
          {own && (
            <p className="muted">
              {programme || "Add your programme"}
              {year ? ` · Year ${year}` : ""}
            </p>
          )}
          <div className="profile-campus">
            <GraduationCap size={17} />
            IGDTUW, Delhi
          </div>
          <div className="profile-stats">
            <div>
              <strong>{completed}</strong>
              <span>Completed borrows</span>
            </div>
            <div>
              <strong>
                {reviews
                  ? profile!.ratingSummary.averageRating.toFixed(1)
                  : "—"}
              </strong>
              <span>{reviews ? `${reviews} reviews` : "No reviews yet"}</span>
            </div>
          </div>
        </section>
        <div>
          <section className="panel detail-panel">
            <h2>
              <BookHeart size={21} />A little trust, built together
            </h2>
            <p className="muted">
              Every completed exchange is another small connection in our campus
              community.
            </p>
            <div className="trust-row">
              <ShieldCheck size={21} />
              <div>
                <strong>
                  {verified
                    ? "Campus verification complete"
                    : "Verification pending"}
                </strong>
                <p>
                  Student status reviewed through the campus verification
                  process.
                </p>
              </div>
            </div>
            <div className="trust-row">
              <Star size={21} />
              <div>
                <strong>
                  {reviews
                    ? "Reviewed by the community"
                    : "A fresh start in the circle"}
                </strong>
                <p>
                  {reviews
                    ? "Reviews reflect completed exchanges."
                    : "Ratings appear after completed exchanges. Everyone starts with a clean slate."}
                </p>
              </div>
            </div>
            <div className="trust-row">
              <Heart size={21} />
              <div>
                <strong>Care makes the circle work</strong>
                <p>
                  Verification is a trust indicator. Always agree on terms and
                  meet in an approved public zone.
                </p>
              </div>
            </div>
          </section>
          {own && (
            <section className="panel detail-panel private-profile">
              <h2>Your private details</h2>
              <p className="quiet-note">
                Only you and authorised administrators can access these details.
              </p>
              <dl>
                <div>
                  <dt>College email</dt>
                  <dd>
                    {demo.enabled
                      ? "sample.student@igdtuw.ac.in"
                      : session.profile?.email}
                  </dd>
                </div>
                <div>
                  <dt>Account status</dt>
                  <dd>
                    <span className="verified">
                      <ShieldCheck size={15} />
                      {demo.enabled
                        ? "Sample verified account"
                        : session.profile?.verificationStatus}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>
                    <CalendarDays size={14} />
                    Joined the circle
                  </dt>
                  <dd>
                    {demo.enabled
                      ? "November 2026 · sample"
                      : session.profile?.createdAt
                        ? new Intl.DateTimeFormat("en-IN", {
                            month: "long",
                            year: "numeric",
                            timeZone: "Asia/Kolkata",
                          }).format(new Date(session.profile.createdAt))
                        : "Not available"}
                  </dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      </div>
      {editing && (
        <Modal
          title="A little more about you"
          onClose={() => !busy && setEditing(false)}
        >
          <form onSubmit={save} className="stack-form">
            <label>
              Your name
              <input
                name="displayName"
                minLength={2}
                maxLength={100}
                defaultValue={displayName}
                required
                autoFocus
              />
            </label>
            <label>
              Programme
              <input
                name="programme"
                maxLength={100}
                defaultValue={programme || ""}
                placeholder="B.Tech · Computer Science"
              />
            </label>
            <label>
              Year
              <select name="year" defaultValue={String(year || "1")}>
                {[1, 2, 3, 4, 5, 6].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </label>
            <p className="quiet-note">
              Your email and verification status are managed by campus
              administrators.
            </p>
            <ErrorMessage>{error}</ErrorMessage>
            <div className="button-row">
              <button
                className="button outline"
                type="button"
                onClick={() => setEditing(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button className="button primary" disabled={busy}>
                {busy ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
