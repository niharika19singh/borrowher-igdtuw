import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, PackageOpen } from "lucide-react";
import type { Listing } from "../../types/backend";
import { resolveListingImageUrl } from "../../services/marketplace";
import { CONDITION_LABELS } from "../../utils/marketplace";
import { useHref } from "../../app/DemoContext";
import { Badge, rupees } from "../../components/ui";

export function ListingPhoto({
  path,
  title,
  className = "",
}: {
  path?: string;
  title: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(
    path && (path.startsWith("/") || path.startsWith("http")) ? path : null,
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    if (!path) {
      setUrl(null);
      return;
    }
    if (path.startsWith("/") || path.startsWith("http")) {
      setUrl(path);
      return;
    }
    resolveListingImageUrl(path)
      .then((resolved) => {
        if (active) setUrl(resolved);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [path]);

  return (
    <div className={`item-art item-photo listing-card-photo ${className}`}>
      {url && !failed ? (
        <img
          src={url}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="photo-unavailable">
          <PackageOpen size={28} />
          <span>No photo yet</span>
        </span>
      )}
    </div>
  );
}

export function ListingCard({
  listing,
  categoryName,
  zoneLabel,
  isOwner = false,
}: {
  listing: Listing;
  categoryName?: string;
  zoneLabel?: string;
  isOwner?: boolean;
}) {
  const href = useHref();
  const statusTone =
    listing.status === "active"
      ? "green"
      : listing.status === "paused" || listing.status === "draft"
        ? "amber"
        : "neutral";

  return (
    <article className="booking-card listing-card">
      <Link
        to={href(`/items/${listing.listingId}`)}
        tabIndex={-1}
        aria-hidden="true"
      >
        <ListingPhoto path={listing.imagePaths[0]} title={listing.title} />
      </Link>
      <div className="booking-card-body">
        <div className="card-topline">
          <span className="category-label">
            {categoryName || listing.categoryId}
          </span>
          <div className="listing-badges">
            <Badge tone={listing.mode === "free_peer" ? "green" : "pink"}>
              {listing.mode === "free_peer" ? "Free peer" : "Rental"}
            </Badge>
            {(isOwner || listing.status !== "active") && (
              <Badge tone={statusTone}>{listing.status}</Badge>
            )}
          </div>
        </div>
        <h3>
          <Link to={href(`/items/${listing.listingId}`)}>{listing.title}</Link>
        </h3>
        <p className="listing-meta-line">
          <MapPin size={13} />
          <span>{zoneLabel || listing.pickupZoneIds[0] || "IGDTUW Campus"}</span>
          <span aria-hidden="true">·</span>
          <span>{CONDITION_LABELS[listing.condition]}</span>
        </p>
        <p className="listing-duration-line">
          {listing.minDays}–{listing.maxDays} days
          {listing.depositAmount > 0
            ? ` · ${rupees(listing.depositAmount)} refundable deposit`
            : " · No deposit"}
        </p>
        <div className="booking-card-footer">
          <span>
            {listing.mode === "free_peer" || listing.pricePerDay === 0 ? (
              <strong>Free to borrow</strong>
            ) : (
              <>
                <strong>{rupees(listing.pricePerDay)}</strong>
                <small> / day</small>
              </>
            )}
          </span>
          <Link
            to={href(`/items/${listing.listingId}`)}
            className="card-action"
          >
            View item
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
