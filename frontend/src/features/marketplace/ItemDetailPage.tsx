import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  PauseCircle,
  Pencil,
  PlayCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useAuth } from "../../app/AuthContext";
import { useDemo, useHref } from "../../app/DemoContext";
import {
  DEMO_CATEGORIES,
  DEMO_LENDER_PROFILES,
  DEMO_LISTINGS,
  DEMO_PICKUP_ZONES,
  getListingDetail,
  pauseListing,
  subscribeActiveCategories,
  subscribeApprovedPickupZones,
} from "../../services/marketplace";
import type {
  Category,
  Listing,
  PickupZone,
  PublicProfile,
} from "../../types/backend";
import { CONDITION_LABELS } from "../../utils/marketplace";
import { readableError } from "../../utils/identity";
import {
  Avatar,
  Badge,
  Empty,
  ErrorMessage,
  Loading,
  SuccessMessage,
  Verified,
  rupees,
} from "../../components/ui";
import { ListingPhoto } from "./ListingCard";

export function ItemDetailPage() {
  const { listingId } = useParams();
  const demo = useDemo();
  const href = useHref();
  const session = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [lender, setLender] = useState<PublicProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>(
    demo.enabled ? DEMO_CATEGORIES : [],
  );
  const [zones, setZones] = useState<PickupZone[]>(
    demo.enabled ? DEMO_PICKUP_ZONES : [],
  );
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [borrowDays, setBorrowDays] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setMessage("");
    setActivePhotoIndex(0);

    if (!listingId) {
      setListing(null);
      setLoading(false);
      return;
    }

    if (demo.enabled) {
      const found = DEMO_LISTINGS.find((l) => l.listingId === listingId) || null;
      setListing(found);
      setLender(found ? DEMO_LENDER_PROFILES[found.ownerUid] || null : null);
      setBorrowDays(found ? found.minDays : 1);
      setLoading(false);
      return;
    }

    getListingDetail(listingId)
      .then((res) => {
        if (!active) return;
        setListing(res.listing);
        setLender(res.lenderProfile);
        setBorrowDays(res.listing.minDays);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(readableError(err));
        setListing(null);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [listingId, demo.enabled]);

  useEffect(() => {
    if (demo.enabled) return;
    const unsubCat = subscribeActiveCategories(setCategories, () => {});
    const unsubZones = subscribeApprovedPickupZones(setZones, () => {});
    return () => {
      unsubCat();
      unsubZones();
    };
  }, [demo.enabled]);

  if (loading) return <Loading />;

  if (!listing) {
    return (
      <div className="listing-detail-page">
        <Link to={href("/marketplace")} className="text-link">
          <ArrowLeft size={15} /> Back to marketplace
        </Link>
        <ErrorMessage>{error}</ErrorMessage>
        <Empty
          title="This listing isn’t available"
          action={
            <Link to={href("/marketplace")} className="button primary">
              Browse marketplace
            </Link>
          }
        >
          The item may have been paused, removed, or restricted to verified
          campus students.
        </Empty>
      </div>
    );
  }

  const isOwner = demo.enabled
    ? listing.ownerUid === "me"
    : listing.ownerUid === session.user?.uid;
  const canEdit = isOwner || (!demo.enabled && session.isAdmin);
  const categoryName =
    categories.find((c) => c.categoryId === listing.categoryId)?.name ||
    listing.categoryId;
  const matchedZones = listing.pickupZoneIds.map((zoneId) => {
    const found = zones.find((z) => z.zoneId === zoneId);
    return (
      found || {
        zoneId,
        label: zoneId,
        campusArea: "IGDTUW Campus",
        guidance: "Meet in the approved public campus area.",
        accessNote: "",
      }
    );
  });

  const clampedDays = Math.min(
    listing.maxDays,
    Math.max(listing.minDays, borrowDays),
  );
  const estimatedRental =
    listing.mode === "free_peer" ? 0 : listing.pricePerDay * clampedDays;

  async function togglePause() {
    if (!listing || demo.enabled) {
      if (listing) {
        setListing({
          ...listing,
          status: listing.status === "paused" ? "active" : "paused",
        });
        setMessage("Sample listing status updated in preview.");
      }
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const nextPaused = listing.status !== "paused";
      const res = await pauseListing(listing.listingId, nextPaused);
      setListing({ ...listing, status: res.status });
      setMessage(
        res.status === "paused"
          ? "Listing paused. It is hidden from campus search until you resume it."
          : "Listing resumed and visible on the campus marketplace.",
      );
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="listing-detail-page">
      <div className="detail-top-bar">
        <Link to={href("/marketplace")} className="text-link">
          <ArrowLeft size={15} /> Back to marketplace
        </Link>
        {canEdit && listing.status !== "removed" && (
          <div className="button-row">
            <Link
              to={href(`/listings/${listing.listingId}/edit`)}
              className="button outline"
            >
              <Pencil size={15} />
              Edit listing
            </Link>
            <button
              type="button"
              className="button outline"
              onClick={togglePause}
              disabled={busy}
            >
              {listing.status === "paused" ? (
                <>
                  <PlayCircle size={15} />
                  {busy ? "Updating…" : "Resume listing"}
                </>
              ) : (
                <>
                  <PauseCircle size={15} />
                  {busy ? "Updating…" : "Pause listing"}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <ErrorMessage>{error}</ErrorMessage>
      <SuccessMessage>{message}</SuccessMessage>

      <div className="listing-detail-grid">
        <div className="listing-detail-main">
          <div className="panel listing-gallery-panel">
            <ListingPhoto
              path={listing.imagePaths[activePhotoIndex]}
              title={listing.title}
              className="listing-hero-photo"
            />
            {listing.imagePaths.length > 1 && (
              <div className="listing-thumb-row">
                {listing.imagePaths.map((path, index) => (
                  <button
                    key={path}
                    type="button"
                    className={`listing-thumb-btn ${
                      index === activePhotoIndex ? "active" : ""
                    }`}
                    onClick={() => setActivePhotoIndex(index)}
                    aria-label={`Show photo ${index + 1}`}
                  >
                    <ListingPhoto path={path} title={`${listing.title} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <section className="panel detail-section">
            <div className="card-topline">
              <span className="category-label">{categoryName}</span>
              <div className="listing-badges">
                <Badge tone={listing.mode === "free_peer" ? "green" : "pink"}>
                  {listing.mode === "free_peer"
                    ? "Free peer lending"
                    : "Campus rental"}
                </Badge>
                <Badge
                  tone={
                    listing.status === "active"
                      ? "green"
                      : listing.status === "paused" || listing.status === "draft"
                        ? "amber"
                        : "neutral"
                  }
                >
                  {listing.status}
                </Badge>
              </div>
            </div>
            <h1>{listing.title}</h1>
            <p className="detail-description">{listing.description}</p>

            <dl className="detail-specs">
              <div>
                <dt>Condition</dt>
                <dd>{CONDITION_LABELS[listing.condition]}</dd>
              </div>
              <div>
                <dt>Borrow window</dt>
                <dd>
                  {listing.minDays} to {listing.maxDays} days
                </dd>
              </div>
              <div>
                <dt>Daily rate</dt>
                <dd>
                  {listing.mode === "free_peer" || listing.pricePerDay === 0
                    ? "Free (₹0/day)"
                    : `${rupees(listing.pricePerDay)} / day`}
                </dd>
              </div>
              <div>
                <dt>Refundable deposit (simulated)</dt>
                <dd>
                  {listing.depositAmount > 0
                    ? rupees(listing.depositAmount)
                    : "No deposit"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="panel detail-section">
            <h2>
              <MapPin size={18} /> Approved campus pickup zones
            </h2>
            <div className="zone-list">
              {matchedZones.map((zone) => (
                <div key={zone.zoneId} className="zone-card">
                  <strong>{zone.label}</strong>
                  <span className="muted">{zone.campusArea}</span>
                  {zone.guidance && <p>{zone.guidance}</p>}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="listing-detail-side">
          <section className="panel detail-section">
            <p className="eyebrow">BORROW ESTIMATE</p>
            <div className="detail-price-headline">
              {listing.mode === "free_peer" || listing.pricePerDay === 0 ? (
                <strong>Free peer lend</strong>
              ) : (
                <>
                  <strong>{rupees(listing.pricePerDay)}</strong>
                  <span> / day</span>
                </>
              )}
            </div>

            <div className="stack-form">
              <label>
                Duration ({listing.minDays}–{listing.maxDays} days)
                <input
                  type="number"
                  min={listing.minDays}
                  max={listing.maxDays}
                  value={clampedDays}
                  onChange={(e) => setBorrowDays(Number(e.target.value) || listing.minDays)}
                />
              </label>
            </div>

            <dl className="detail-summary-rows">
              <div>
                <dt>
                  <CalendarDays size={14} /> Rental ({clampedDays} day
                  {clampedDays === 1 ? "" : "s"})
                </dt>
                <dd>{estimatedRental === 0 ? "Free" : rupees(estimatedRental)}</dd>
              </div>
              <div>
                <dt>Refundable deposit (simulated)</dt>
                <dd>{rupees(listing.depositAmount)}</dd>
              </div>
            </dl>

            {demo.enabled ? (
              <Link to="/demo/bookings" className="button primary full-width">
                <CheckCircle2 size={16} />
                Preview booking workflow
              </Link>
            ) : isOwner ? (
              <p className="quiet-note">
                You own this listing. Use Edit or Pause above to manage its
                campus availability.
              </p>
            ) : (
              <div className="care-callout">
                <ShieldCheck size={18} />
                <p>
                  Live booking submission activates once Backend Developer 2’s
                  booking workflow service is connected. Deposits are simulated
                  in the MVP.
                </p>
              </div>
            )}
          </section>

          <section className="panel detail-section">
            <p className="eyebrow">CAMPUS LENDER</p>
            <div className="lender-summary-row">
              <Avatar name={lender?.displayName || "IGDTUW Student"} />
              <div>
                <strong>{lender?.displayName || "Verified IGDTUW Student"}</strong>
                <div className="lender-meta-sub">
                  {lender?.verificationBadge && <Verified small />}
                  <span className="muted">
                    <Star size={12} />{" "}
                    {lender
                      ? `${lender.ratingSummary.averageRating.toFixed(1)} (${lender.ratingSummary.totalReviews})`
                      : "New lender"}
                  </span>
                </div>
              </div>
            </div>
            <p className="quiet-note">
              {lender?.completedBorrowCount || 0} completed campus exchange
              {(lender?.completedBorrowCount || 0) === 1 ? "" : "s"}.
            </p>
            <Link
              to={href(`/profile/${listing.ownerUid}`)}
              className="button outline full-width"
            >
              View lender profile
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
