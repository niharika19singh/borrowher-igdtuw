import { useState, type ReactNode } from "react";
import { ArrowRight, Check, PackageOpen, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import type { BookingStatus } from "../types/workflows";

export function Bow({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 70 76"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M34 28C19 7 5 11 10 25c3 9 16 8 24 3Zm3 0C50 7 67 11 61 25c-4 9-16 8-24 3Z"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <path
        d="M34 31 18 67l9-4 4 8 5-39M39 31l14 35-9-4-3 8-3-39"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <ellipse
        cx="35.5"
        cy="29"
        rx="4"
        ry="5"
        stroke="currentColor"
        strokeWidth="2.2"
      />
    </svg>
  );
}
export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="BorrowHer home">
      <Bow />
      <span>
        <strong>
          BorrowHer<span className="brand-dot">.</span>
        </strong>
        <small>THE IGDTUW CAMPUS SHARING ECONOMY</small>
      </span>
    </Link>
  );
}
export function Badge({
  children,
  tone = "pink",
}: {
  children: ReactNode;
  tone?: "pink" | "green" | "amber" | "neutral";
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
const labels: Record<BookingStatus, string> = {
  requested: "Request pending",
  accepted: "Ready for pickup",
  active: "Currently borrowed",
  return_pending: "Return confirmation",
  completed: "Returned",
  rejected: "Request declined",
};
export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge
      tone={
        status === "active" || status === "completed"
          ? "green"
          : status === "requested" || status === "return_pending"
            ? "amber"
            : "pink"
      }
    >
      <span className="status-dot" />
      {labels[status]}
    </Badge>
  );
}
export function Verified({ small = false }: { small?: boolean }) {
  return (
    <span className={`verified ${small ? "small" : ""}`}>
      <ShieldCheck size={small ? 13 : 16} />
      Verified student
    </span>
  );
}
export function Avatar({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span className={`avatar ${className}`} aria-hidden="true">
      {name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </header>
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <PackageOpen size={30} strokeWidth={1.3} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div role="status" className="loading">
      <span className="spinner" />
      Getting everything ready…
    </div>
  );
}
export function ErrorMessage({ children }: { children: ReactNode }) {
  return children ? (
    <p className="error-message" role="alert">
      {children}
    </p>
  ) : null;
}
export function SuccessMessage({ children }: { children: ReactNode }) {
  return children ? (
    <p className="success-message" role="status">
      <Check size={17} />
      {children}
    </p>
  ) : null;
}
export function ArrowLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link className="text-link" to={to}>
      {children}
      <ArrowRight size={16} />
    </Link>
  );
}
export const formatDate = (value: string, time = false) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    ...(time ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
export const rupees = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const itemPhotos = {
  calculator: {
    src: "/images/calculator.jpg",
    alt: "Casio scientific calculator",
  },
  coat: { src: "/images/lab-coat.jpg", alt: "Folded white laboratory coat" },
  book: { src: "/images/books.jpg", alt: "A stack of second-hand books" },
  umbrella: { src: "/images/umbrella.jpg", alt: "An open burgundy umbrella" },
};

export function ItemPhoto({
  kind,
  className = "",
}: {
  kind: keyof typeof itemPhotos;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const photo = itemPhotos[kind];
  return (
    <div className={`item-art item-photo photo-${kind} ${className}`}>
      {failed ? (
        <span className="photo-unavailable">
          <PackageOpen size={28} />
          <span>Photo unavailable</span>
        </span>
      ) : (
        <img
          key={photo.src}
          src={photo.src}
          alt={photo.alt}
          width={400}
          height={400}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
