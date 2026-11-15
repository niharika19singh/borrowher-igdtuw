import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { CATEGORIES, MOCK_LISTINGS } from '../../data/mockListings';
import type { ListingCondition } from '../../types/listing';

const CONDITIONS: { value: ListingCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

const PICKUP_ZONES = [
  'Main Gate / Library',
  'Block A Common Area',
  'Library Entrance',
  'Hostel Common Room',
  'Cafeteria Entrance',
  'Innovation Lab',
  'Seminar Hall Lobby',
];

interface FormState {
  title: string;
  description: string;
  categoryId: string;
  condition: ListingCondition;
  pricePerDay: string;
  depositAmount: string;
  minDays: string;
  maxDays: string;
  pickupZone: string;
  photos: File[];
}

const emptyForm: FormState = {
  title: '',
  description: '',
  categoryId: '',
  condition: 'good',
  pricePerDay: '',
  depositAmount: '',
  minDays: '1',
  maxDays: '7',
  pickupZone: '',
  photos: [],
};

export const CreateListingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      const existing = MOCK_LISTINGS.find((l) => l.id === id);
      if (existing) {
        setForm({
          title: existing.title,
          description: existing.description,
          categoryId: existing.categoryId,
          condition: existing.condition,
          pricePerDay: String(existing.pricePerDay),
          depositAmount: String(existing.depositAmount),
          minDays: String(existing.minDays),
          maxDays: String(existing.maxDays),
          pickupZone: existing.pickupZone,
          photos: [],
        });
      }
    }
  }, [isEdit, id]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim() || form.title.trim().length < 3) {
      next.title = 'Title must be at least 3 characters.';
    }
    if (!form.description.trim() || form.description.trim().length < 20) {
      next.description = 'Please provide a description of at least 20 characters.';
    }
    if (!form.categoryId) next.categoryId = 'Select a category.';
    if (!form.condition) next.condition = 'Select condition.';
    const price = Number(form.pricePerDay);
    if (!form.pricePerDay || isNaN(price) || price < 0) {
      next.pricePerDay = 'Enter a valid rental price (≥ 0).';
    }
    const deposit = Number(form.depositAmount);
    if (!form.depositAmount || isNaN(deposit) || deposit < 0) {
      next.depositAmount = 'Enter a valid deposit amount (≥ 0).';
    }
    const minD = Number(form.minDays);
    const maxD = Number(form.maxDays);
    if (!form.minDays || isNaN(minD) || minD < 1) {
      next.minDays = 'Minimum days must be at least 1.';
    }
    if (!form.maxDays || isNaN(maxD) || maxD < minD) {
      next.maxDays = 'Maximum days must be ≥ minimum days.';
    }
    if (!form.pickupZone) next.pickupZone = 'Select a pickup zone.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setStatus('error');
      setStatusMsg('Please fix the highlighted fields.');
      return;
    }
    // In production this would call a Cloud Function / Firestore write.
    setStatus('success');
    setStatusMsg(
      isEdit
        ? 'Listing updated successfully. (Demo — changes are not persisted.)'
        : 'Listing created successfully. (Demo — not saved to Firestore.)'
    );
    setTimeout(() => {
      navigate('/marketplace');
    }, 1800);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    update('photos', files);
  };

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-blush-200 bg-white text-sm text-[#2d1f24] placeholder:text-[#9a7a84] focus:outline-none focus:ring-2 focus:ring-[#e8a0b0] focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-[#2d1f24] mb-1.5';
  const errorClass = 'text-xs text-red-600 mt-1';

  return (
    <div className="min-h-screen bg-[#faf7f5]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to={isEdit ? `/items/${id}` : '/marketplace'}
          className="inline-flex items-center gap-1.5 text-sm text-[#c45a7c] hover:underline mb-6"
        >
          <ArrowLeft size={16} /> {isEdit ? 'Back to listing' : 'Back to Marketplace'}
        </Link>

        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2d1f24] mb-2">
          {isEdit ? 'Edit Listing' : 'List an Item'}
        </h1>
        <p className="text-sm text-[#6b4f57] mb-8">
          Share under-utilised essentials with verified IGDTUW students.
        </p>

        {status === 'success' && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 p-4">
            <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-green-800">{statusMsg}</p>
          </div>
        )}
        {status === 'error' && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-800">{statusMsg}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-blush-100 shadow-sm p-6 sm:p-8 space-y-5"
        >
          {/* Title */}
          <div>
            <label className={labelClass} htmlFor="title">
              Item name *
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Casio Scientific Calculator"
              className={inputClass}
              maxLength={80}
            />
            {errors.title && <p className={errorClass}>{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className={labelClass} htmlFor="description">
              Description *
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Condition, accessories included, any notes for borrowers..."
              rows={4}
              className={inputClass + ' resize-y'}
              maxLength={1000}
            />
            {errors.description && <p className={errorClass}>{errors.description}</p>}
          </div>

          {/* Category + Condition */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="category">
                Category *
              </label>
              <select
                id="category"
                value={form.categoryId}
                onChange={(e) => update('categoryId', e.target.value)}
                className={inputClass}
              >
                <option value="">Select category</option>
                {CATEGORIES.filter((c) => c.id !== 'safe').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className={errorClass}>{errors.categoryId}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="condition">
                Condition *
              </label>
              <select
                id="condition"
                value={form.condition}
                onChange={(e) => update('condition', e.target.value as ListingCondition)}
                className={inputClass}
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.condition && <p className={errorClass}>{errors.condition}</p>}
            </div>
          </div>

          {/* Price + Deposit */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="price">
                Rental price (₹/day) *
              </label>
              <input
                id="price"
                type="number"
                min={0}
                step={1}
                value={form.pricePerDay}
                onChange={(e) => update('pricePerDay', e.target.value)}
                placeholder="0"
                className={inputClass}
              />
              {errors.pricePerDay && <p className={errorClass}>{errors.pricePerDay}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="deposit">
                Refundable deposit (₹) *
              </label>
              <input
                id="deposit"
                type="number"
                min={0}
                step={1}
                value={form.depositAmount}
                onChange={(e) => update('depositAmount', e.target.value)}
                placeholder="0"
                className={inputClass}
              />
              <p className="text-[11px] text-[#9a7a84] mt-1">Simulated in MVP — no real money.</p>
              {errors.depositAmount && <p className={errorClass}>{errors.depositAmount}</p>}
            </div>
          </div>

          {/* Duration */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="minDays">
                Min borrow days *
              </label>
              <input
                id="minDays"
                type="number"
                min={1}
                max={30}
                value={form.minDays}
                onChange={(e) => update('minDays', e.target.value)}
                className={inputClass}
              />
              {errors.minDays && <p className={errorClass}>{errors.minDays}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="maxDays">
                Max borrow days *
              </label>
              <input
                id="maxDays"
                type="number"
                min={1}
                max={30}
                value={form.maxDays}
                onChange={(e) => update('maxDays', e.target.value)}
                className={inputClass}
              />
              {errors.maxDays && <p className={errorClass}>{errors.maxDays}</p>}
            </div>
          </div>

          {/* Pickup zone */}
          <div>
            <label className={labelClass} htmlFor="pickup">
              Pickup zone *
            </label>
            <select
              id="pickup"
              value={form.pickupZone}
              onChange={(e) => update('pickupZone', e.target.value)}
              className={inputClass}
            >
              <option value="">Select approved campus zone</option>
              {PICKUP_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#9a7a84] mt-1">
              Use only administrator-configured public zones. No hostel room numbers.
            </p>
            {errors.pickupZone && <p className={errorClass}>{errors.pickupZone}</p>}
          </div>

          {/* Photos */}
          <div>
            <label className={labelClass}>Item photographs</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blush-200 rounded-xl cursor-pointer hover:bg-blush-50/50 transition-colors">
              <Upload size={24} className="text-[#c45a7c] mb-2" />
              <span className="text-sm text-[#6b4f57]">
                {form.photos.length > 0
                  ? `${form.photos.length} file(s) selected`
                  : 'Click to upload (max 5 images)'}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
            <p className="text-[11px] text-[#9a7a84] mt-1">
              Photos will upload to Firebase Cloud Storage in production.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="flex-1 py-3 rounded-full bg-[#c45a7c] text-white font-medium text-sm hover:bg-[#a34463] transition-colors shadow-md shadow-[#c45a7c]/20"
            >
              {isEdit ? 'Save Changes' : 'Publish Listing'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-full border border-blush-200 text-[#6b4f57] text-sm font-medium hover:bg-blush-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListingPage;
