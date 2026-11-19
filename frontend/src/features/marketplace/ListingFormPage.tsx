import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  MapPin,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { useAuth } from "../../app/AuthContext";
import { useDemo, useHref } from "../../app/DemoContext";
import {
  createListing,
  DEMO_CATEGORIES,
  DEMO_LISTINGS,
  DEMO_PICKUP_ZONES,
  getListingDetail,
  subscribeActiveCategories,
  subscribeApprovedPickupZones,
  updateListing,
  uploadListingPhoto,
} from "../../services/marketplace";
import type {
  Category,
  Listing,
  ListingCondition,
  ListingMode,
  PickupZone,
} from "../../types/backend";
import {
  buildCreateListingPayload,
  buildUpdateListingPayload,
  MAX_LISTING_IMAGES,
  validateImageFile,
  validateListingForm,
  type ListingFormErrors,
  type ListingFormValues,
} from "../../utils/marketplace";
import { readableError } from "../../utils/identity";
import {
  ErrorMessage,
  Loading,
  PageHeading,
  SuccessMessage,
} from "../../components/ui";
import { ListingPhoto } from "./ListingCard";

const INITIAL_VALUES: ListingFormValues = {
  title: "",
  description: "",
  categoryId: "",
  condition: "good",
  mode: "rental",
  pricePerDay: 20,
  depositAmount: 100,
  minDays: 1,
  maxDays: 7,
  pickupZoneIds: [],
  imagePaths: [],
  status: "active",
};

export function ListingFormPage() {
  const { listingId } = useParams();
  const isEdit = Boolean(listingId);
  const navigate = useNavigate();
  const session = useAuth();
  const demo = useDemo();
  const href = useHref();
  const uploadFolderRef = useRef(
    listingId || `upload-${Date.now().toString(36)}`,
  );

  const [values, setValues] = useState<ListingFormValues>(INITIAL_VALUES);
  const [originalListing, setOriginalListing] = useState<Listing | null>(null);
  const [categories, setCategories] = useState<Category[]>(
    demo.enabled ? DEMO_CATEGORIES : [],
  );
  const [zones, setZones] = useState<PickupZone[]>(
    demo.enabled ? DEMO_PICKUP_ZONES : [],
  );
  const [errors, setErrors] = useState<ListingFormErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (demo.enabled) {
      setCategories(DEMO_CATEGORIES);
      setZones(DEMO_PICKUP_ZONES);
      return;
    }
    const unsubCat = subscribeActiveCategories(setCategories, (err) =>
      setSubmitError(readableError(err)),
    );
    const unsubZones = subscribeApprovedPickupZones(setZones, (err) =>
      setSubmitError(readableError(err)),
    );
    return () => {
      unsubCat();
      unsubZones();
    };
  }, [demo.enabled]);

  useEffect(() => {
    if (!isEdit || !listingId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setSubmitError("");

    if (demo.enabled) {
      const found = DEMO_LISTINGS.find((l) => l.listingId === listingId) || null;
      if (found) {
        setOriginalListing(found);
        setValues({
          title: found.title,
          description: found.description,
          categoryId: found.categoryId,
          condition: found.condition,
          mode: found.mode,
          pricePerDay: found.pricePerDay,
          depositAmount: found.depositAmount,
          minDays: found.minDays,
          maxDays: found.maxDays,
          pickupZoneIds: found.pickupZoneIds,
          imagePaths: found.imagePaths,
          status:
            found.status === "paused" || found.status === "draft"
              ? found.status
              : "active",
        });
      }
      setLoading(false);
      return;
    }

    getListingDetail(listingId)
      .then(({ listing }) => {
        if (!active) return;
        setOriginalListing(listing);
        setValues({
          title: listing.title,
          description: listing.description,
          categoryId: listing.categoryId,
          condition: listing.condition,
          mode: listing.mode,
          pricePerDay: listing.pricePerDay,
          depositAmount: listing.depositAmount,
          minDays: listing.minDays,
          maxDays: listing.maxDays,
          pickupZoneIds: listing.pickupZoneIds,
          imagePaths: listing.imagePaths,
          status:
            listing.status === "paused" || listing.status === "draft"
              ? listing.status
              : "active",
        });
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setSubmitError(readableError(err));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isEdit, listingId, demo.enabled]);

  function setField<K extends keyof ListingFormValues>(
    field: K,
    value: ListingFormValues[K],
  ) {
    setValues((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "mode" && value === "free_peer") {
        next.pricePerDay = 0;
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError("");
  }

  function toggleZone(zoneId: string) {
    setValues((prev) => {
      const exists = prev.pickupZoneIds.includes(zoneId);
      const nextZones = exists
        ? prev.pickupZoneIds.filter((id) => id !== zoneId)
        : [...prev.pickupZoneIds, zoneId];
      return { ...prev, pickupZoneIds: nextZones };
    });
    setErrors((prev) => ({ ...prev, pickupZoneIds: undefined }));
  }

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;

    const remaining = MAX_LISTING_IMAGES - values.imagePaths.length;
    if (remaining <= 0) {
      setErrors((prev) => ({
        ...prev,
        imagePaths: `Maximum ${MAX_LISTING_IMAGES} photos allowed per listing.`,
      }));
      return;
    }

    const selected = files.slice(0, remaining);
    for (const file of selected) {
      const fileError = validateImageFile(file);
      if (fileError) {
        setErrors((prev) => ({ ...prev, imagePaths: fileError }));
        return;
      }
    }

    if (demo.enabled) {
      setSubmitError(
        "Photo uploads to Firebase Cloud Storage are disabled in demo preview mode.",
      );
      return;
    }

    if (!session.user?.uid) {
      setSubmitError("Sign in as a verified IGDTUW student to upload photos.");
      return;
    }

    setUploading(true);
    setSubmitError("");
    setErrors((prev) => ({ ...prev, imagePaths: undefined }));

    try {
      const uploadedPaths: string[] = [];
      for (const file of selected) {
        const res = await uploadListingPhoto(
          session.user.uid,
          uploadFolderRef.current,
          file,
        );
        uploadedPaths.push(res.path);
      }
      setValues((prev) => ({
        ...prev,
        imagePaths: [...prev.imagePaths, ...uploadedPaths].slice(
          0,
          MAX_LISTING_IMAGES,
        ),
      }));
    } catch (err) {
      setSubmitError(readableError(err));
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(index: number) {
    setValues((prev) => ({
      ...prev,
      imagePaths: prev.imagePaths.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateListingForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitError("Please review the highlighted fields before saving.");
      return;
    }

    if (demo.enabled) {
      setSuccessMessage(
        isEdit
          ? "Sample listing changes validated in preview mode (not saved to Firebase)."
          : "Sample listing validated in preview mode (not saved to Firebase).",
      );
      return;
    }

    setSaving(true);
    setSubmitError("");
    setSuccessMessage("");

    try {
      if (isEdit && listingId && originalListing) {
        const payload = buildUpdateListingPayload(
          listingId,
          originalListing,
          values,
        );
        const updated = await updateListing(payload);
        setOriginalListing(updated);
        setSuccessMessage("Listing updated atomically and saved.");
        navigate(`/items/${updated.listingId}`);
      } else {
        const payload = buildCreateListingPayload(values);
        const created = await createListing(payload);
        setSuccessMessage("Listing published on the IGDTUW marketplace.");
        navigate(`/items/${created.listingId}`);
      }
    } catch (err) {
      setSubmitError(readableError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="listing-form-page">
      <Link
        to={
          isEdit && listingId
            ? href(`/items/${listingId}`)
            : href("/marketplace")
        }
        className="text-link"
      >
        <ArrowLeft size={15} /> Back
      </Link>

      <PageHeading
        eyebrow={isEdit ? "UPDATE CAMPUS LISTING" : "SHARE ON CAMPUS"}
        title={isEdit ? "Edit your listing" : "List an item on BorrowHer"}
        description="Validated by BorrowHer Cloud Functions (`asia-south1`). Listing edits execute atomically via Firestore transactions."
      />

      <form className="panel stack-form listing-form" onSubmit={handleSubmit} noValidate>
        <label>
          Item title *
          <input
            type="text"
            value={values.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="e.g., Casio Scientific Calculator fx-991EX"
            minLength={3}
            maxLength={100}
            required
          />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </label>

        <label>
          Description *
          <textarea
            rows={4}
            value={values.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="Describe condition, accessories included, and care notes…"
            minLength={10}
            maxLength={2000}
            required
          />
          {errors.description && (
            <span className="field-error">{errors.description}</span>
          )}
        </label>

        <div className="form-two-col">
          <label>
            Campus category *
            <select
              value={values.categoryId}
              onChange={(e) => setField("categoryId", e.target.value)}
              required
            >
              <option value="">Select active category</option>
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <span className="field-error">{errors.categoryId}</span>
            )}
          </label>

          <label>
            Item condition *
            <select
              value={values.condition}
              onChange={(e) =>
                setField("condition", e.target.value as ListingCondition)
              }
            >
              <option value="new">New</option>
              <option value="like-new">Like new</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </label>
        </div>

        <div className="form-three-col">
          <label>
            Lending mode *
            <select
              value={values.mode}
              onChange={(e) => setField("mode", e.target.value as ListingMode)}
            >
              <option value="rental">Paid rental (₹/day)</option>
              <option value="free_peer">Free peer lending (₹0/day)</option>
            </select>
          </label>

          <label>
            Price per day (₹) *
            <input
              type="number"
              min={0}
              step={1}
              value={values.mode === "free_peer" ? 0 : values.pricePerDay}
              disabled={values.mode === "free_peer"}
              onChange={(e) =>
                setField("pricePerDay", Number(e.target.value) || 0)
              }
            />
            {errors.pricePerDay && (
              <span className="field-error">{errors.pricePerDay}</span>
            )}
          </label>

          <label>
            Refundable deposit (₹) *
            <input
              type="number"
              min={0}
              step={1}
              value={values.depositAmount}
              onChange={(e) =>
                setField("depositAmount", Number(e.target.value) || 0)
              }
            />
            <span className="quiet-note">Simulated in MVP — no online payment.</span>
            {errors.depositAmount && (
              <span className="field-error">{errors.depositAmount}</span>
            )}
          </label>
        </div>

        <div className="form-three-col">
          <label>
            Minimum borrow days (1–30) *
            <input
              type="number"
              min={1}
              max={30}
              value={values.minDays}
              onChange={(e) =>
                setField("minDays", Math.trunc(Number(e.target.value) || 1))
              }
            />
            {errors.minDays && (
              <span className="field-error">{errors.minDays}</span>
            )}
          </label>

          <label>
            Maximum borrow days (1–30) *
            <input
              type="number"
              min={1}
              max={30}
              value={values.maxDays}
              onChange={(e) =>
                setField("maxDays", Math.trunc(Number(e.target.value) || 1))
              }
            />
            {errors.maxDays && (
              <span className="field-error">{errors.maxDays}</span>
            )}
          </label>

          <label>
            Visibility status *
            <select
              value={values.status}
              onChange={(e) =>
                setField(
                  "status",
                  e.target.value as "draft" | "active" | "paused",
                )
              }
            >
              <option value="active">Active (visible on campus)</option>
              <option value="draft">Draft (only visible to you)</option>
              {isEdit && <option value="paused">Paused</option>}
            </select>
          </label>
        </div>

        <fieldset className="zone-fieldset">
          <legend>
            <MapPin size={15} /> Approved campus pickup zones * (select 1–10)
          </legend>
          {zones.length === 0 ? (
            <p className="quiet-note">
              No administrator-approved pickup zones are loaded yet. Ask an
              IGDTUW administrator to seed and approve public campus zones.
            </p>
          ) : (
            <div className="zone-checkbox-grid">
              {zones.map((zone) => {
                const checked = values.pickupZoneIds.includes(zone.zoneId);
                return (
                  <label
                    key={zone.zoneId}
                    className={`zone-option ${checked ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleZone(zone.zoneId)}
                    />
                    <span>
                      <strong>{zone.label}</strong>
                      <small>{zone.campusArea}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {errors.pickupZoneIds && (
            <span className="field-error">{errors.pickupZoneIds}</span>
          )}
        </fieldset>

        <div className="photo-upload-section">
          <span className="photo-upload-label">
            Item photographs (JPEG, PNG, WebP · max 5 MB each · up to{" "}
            {MAX_LISTING_IMAGES})
          </span>
          <label className="upload-dropzone">
            <Upload size={20} />
            <span>
              {uploading
                ? "Uploading to Firebase Storage…"
                : values.imagePaths.length >= MAX_LISTING_IMAGES
                  ? "Maximum 5 photos attached"
                  : "Click to upload item photos"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={uploading || values.imagePaths.length >= MAX_LISTING_IMAGES}
              onChange={handleFileSelect}
            />
          </label>
          {errors.imagePaths && (
            <span className="field-error">{errors.imagePaths}</span>
          )}
          {values.imagePaths.length > 0 && (
            <div className="uploaded-photo-grid">
              {values.imagePaths.map((path, index) => (
                <div key={path} className="uploaded-photo-tile">
                  <ListingPhoto path={path} title={`Uploaded photo ${index + 1}`} />
                  <button
                    type="button"
                    className="icon-button remove-photo-btn"
                    onClick={() => removePhoto(index)}
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="care-callout">
          <ShieldCheck size={18} />
          <p>
            Use only approved public campus pickup zones. Never include hostel
            room numbers, phone numbers, or personal addresses in listing text.
          </p>
        </div>

        <ErrorMessage>{submitError}</ErrorMessage>
        <SuccessMessage>{successMessage}</SuccessMessage>

        <div className="button-row">
          <button
            type="button"
            className="button outline"
            onClick={() => navigate(-1)}
            disabled={saving || uploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button primary"
            disabled={saving || uploading}
          >
            <Check size={16} />
            {saving
              ? isEdit
                ? "Saving changes…"
                : "Publishing…"
              : isEdit
                ? "Save changes"
                : "Publish listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
