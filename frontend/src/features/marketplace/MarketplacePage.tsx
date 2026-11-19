import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PlusCircle, Search, SlidersHorizontal } from "lucide-react";
import { useAuth } from "../../app/AuthContext";
import { useDemo, useHref } from "../../app/DemoContext";
import {
  DEMO_CATEGORIES,
  DEMO_LISTINGS,
  DEMO_PICKUP_ZONES,
  subscribeActiveCategories,
  subscribeActiveListings,
  subscribeApprovedPickupZones,
  subscribeMyListings,
} from "../../services/marketplace";
import type {
  Category,
  Listing,
  ListingCondition,
  ListingMode,
  PickupZone,
} from "../../types/backend";
import {
  filterAndSortListings,
  type MarketplaceSort,
} from "../../utils/marketplace";
import { readableError } from "../../utils/identity";
import {
  Empty,
  ErrorMessage,
  Loading,
  PageHeading,
} from "../../components/ui";
import { ListingCard } from "./ListingCard";

export function MarketplacePage() {
  const demo = useDemo();
  const href = useHref();
  const session = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [scope, setScope] = useState<"campus" | "mine">("campus");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [categoryId, setCategoryId] = useState(
    searchParams.get("category") || "",
  );
  const [mode, setMode] = useState<"all" | ListingMode>("all");
  const [condition, setCondition] = useState<"all" | ListingCondition>("all");
  const [sort, setSort] = useState<MarketplaceSort>("newest");

  const [campusListings, setCampusListings] = useState<Listing[]>(
    demo.enabled ? DEMO_LISTINGS : [],
  );
  const [myListings, setMyListings] = useState<Listing[]>(
    demo.enabled ? DEMO_LISTINGS.filter((l) => l.ownerUid === "me") : [],
  );
  const [categories, setCategories] = useState<Category[]>(
    demo.enabled ? DEMO_CATEGORIES : [],
  );
  const [zones, setZones] = useState<PickupZone[]>(
    demo.enabled ? DEMO_PICKUP_ZONES : [],
  );
  const [loading, setLoading] = useState(!demo.enabled);
  const [error, setError] = useState("");

  useEffect(() => {
    if (demo.enabled) {
      setCampusListings(DEMO_LISTINGS);
      setMyListings(DEMO_LISTINGS.filter((l) => l.ownerUid === "me"));
      setCategories(DEMO_CATEGORIES);
      setZones(DEMO_PICKUP_ZONES);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const unsubCampus = subscribeActiveListings(
      (items) => {
        setCampusListings(items);
        setLoading(false);
      },
      (err) => {
        setError(readableError(err));
        setLoading(false);
      },
    );
    const unsubMine = session.user?.uid
      ? subscribeMyListings(
          session.user.uid,
          setMyListings,
          (err) => setError(readableError(err)),
        )
      : () => {};
    const unsubCategories = subscribeActiveCategories(setCategories, () => {});
    const unsubZones = subscribeApprovedPickupZones(setZones, () => {});

    return () => {
      unsubCampus();
      unsubMine();
      unsubCategories();
      unsubZones();
    };
  }, [demo.enabled, session.user?.uid]);

  function handleCategorySelect(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    const next = new URLSearchParams(searchParams);
    if (nextCategoryId) next.set("category", nextCategoryId);
    else next.delete("category");
    setSearchParams(next, { replace: true });
  }

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.categoryId, c.name])),
    [categories],
  );
  const zoneMap = useMemo(
    () => new Map(zones.map((z) => [z.zoneId, z.label])),
    [zones],
  );

  const sourceList = scope === "campus" ? campusListings : myListings;
  const visibleListings = useMemo(
    () =>
      filterAndSortListings(sourceList, {
        query,
        categoryId,
        mode,
        condition,
        sort,
      }),
    [sourceList, query, categoryId, mode, condition, sort],
  );

  return (
    <div className="marketplace-page">
      <PageHeading
        eyebrow="IGDTUW CAMPUS MARKETPLACE"
        title="Browse campus essentials"
        description="Discover verified student listings across IGDTUW or share something you are not using."
        action={
          <Link to={href("/listings/new")} className="button primary">
            <PlusCircle size={16} />
            List an item
          </Link>
        }
      />

      <div className="marketplace-toolbar panel">
        <div className="marketplace-toolbar-top">
          <div className="segmented" role="tablist" aria-label="Listing scope">
            <button
              type="button"
              role="tab"
              aria-selected={scope === "campus"}
              className={scope === "campus" ? "selected" : ""}
              onClick={() => setScope("campus")}
            >
              Campus listings <span>{campusListings.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scope === "mine"}
              className={scope === "mine" ? "selected" : ""}
              onClick={() => setScope("mine")}
            >
              My listings <span>{myListings.length}</span>
            </button>
          </div>

          <label className="search-field marketplace-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search calculators, textbooks, lab coats…"
              aria-label="Search marketplace listings"
            />
          </label>
        </div>

        <div className="marketplace-filters">
          <div className="filter-chips" aria-label="Filter by category">
            <button
              type="button"
              className={!categoryId ? "selected" : ""}
              onClick={() => handleCategorySelect("")}
            >
              All categories
            </button>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.categoryId}
                className={categoryId === cat.categoryId ? "selected" : ""}
                onClick={() => handleCategorySelect(cat.categoryId)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="marketplace-select-row">
            <label className="compact-select">
              <SlidersHorizontal size={14} aria-hidden="true" />
              <select
                aria-label="Lending mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as "all" | ListingMode)}
              >
                <option value="all">All modes</option>
                <option value="free_peer">Free peer lending</option>
                <option value="rental">Paid rental</option>
              </select>
            </label>

            <label className="compact-select">
              <select
                aria-label="Condition"
                value={condition}
                onChange={(e) =>
                  setCondition(e.target.value as "all" | ListingCondition)
                }
              >
                <option value="all">Any condition</option>
                <option value="new">New</option>
                <option value="like-new">Like new</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </label>

            <label className="compact-select">
              <select
                aria-label="Sort listings"
                value={sort}
                onChange={(e) => setSort(e.target.value as MarketplaceSort)}
              >
                <option value="newest">Newest first</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      {loading ? (
        <Loading />
      ) : visibleListings.length === 0 ? (
        <Empty
          title={
            scope === "mine"
              ? "You haven’t published any listings yet"
              : "No matching campus listings found"
          }
          action={
            <div className="button-row">
              {(query || categoryId || mode !== "all" || condition !== "all") && (
                <button
                  type="button"
                  className="button outline"
                  onClick={() => {
                    setQuery("");
                    handleCategorySelect("");
                    setMode("all");
                    setCondition("all");
                  }}
                >
                  Clear filters
                </button>
              )}
              <Link to={href("/listings/new")} className="button primary">
                <PlusCircle size={16} />
                List an item
              </Link>
            </div>
          }
        >
          {scope === "mine"
            ? "Share spare textbooks, lab coats, or calculators with fellow IGDTUW students."
            : "Try adjusting your filters or be the first student to list this item on campus."}
        </Empty>
      ) : (
        <div className="marketplace-grid">
          {visibleListings.map((item) => (
            <ListingCard
              key={item.listingId}
              listing={item}
              categoryName={categoryMap.get(item.categoryId)}
              zoneLabel={zoneMap.get(item.pickupZoneIds[0])}
              isOwner={
                demo.enabled
                  ? item.ownerUid === "me"
                  : item.ownerUid === session.user?.uid
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
