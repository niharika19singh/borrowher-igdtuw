import type { ReactNode } from "react";
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
        <small>THE IGDTUW SHARING CIRCLE</small>
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
  completed: "Returned with care",
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

export function ItemArt({
  kind,
  className = "",
}: {
  kind: "calculator" | "coat" | "book" | "umbrella";
  className?: string;
}) {
  return (
    <div className={`item-art art-${kind} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 180 150" fill="none">
        {kind === "calculator" && (
          <g transform="rotate(-13 90 75)">
            <rect
              x="49"
              y="17"
              width="81"
              height="119"
              rx="12"
              fill="#4e5658"
            />
            <rect x="53" y="20" width="73" height="110" rx="9" fill="#363e41" />
            <rect x="60" y="31" width="59" height="31" rx="3" fill="#b9c6ad" />
            <text
              x="112"
              y="53"
              textAnchor="end"
              fontSize="15"
              fontFamily="monospace"
              fill="#3e4c3e"
            >
              3.14159
            </text>
            <text x="60" y="27" fontSize="5" fill="#eee">
              SCIENTIFIC
            </text>
            {Array.from({ length: 20 }, (_, i) => (
              <rect
                key={i}
                x={60 + (i % 4) * 15}
                y={71 + Math.floor(i / 4) * 11}
                width="11"
                height="7"
                rx="2"
                fill={i === 19 ? "#c78387" : i < 4 ? "#999e98" : "#d4d5d0"}
              />
            ))}
          </g>
        )}
        {kind === "coat" && (
          <g>
            <path
              d="m72 28 18-7 18 7 13 12 20 57-18 7-15-36 5 66H67l5-66-15 36-18-7 20-57Z"
              fill="#fffaf3"
              stroke="#d6cfc6"
              strokeWidth="1.5"
            />
            <path d="m72 28 18 31 18-31-10-5-8 14-8-14Z" fill="#e6e0d6" />
            <path
              d="m90 59 1 75M72 78h12v16H72M100 78h12v16h-12"
              stroke="#d2c9bf"
            />
            {[67, 82, 99, 116].map((y) => (
              <circle key={y} cx="94" cy={y} r="1.5" fill="#b0a69e" />
            ))}
          </g>
        )}
        {kind === "book" && (
          <g transform="rotate(-13 90 75)">
            <path d="M47 25h80v108H47c-9 0-10-10-3-13V29Z" fill="#dcc8a8" />
            <path d="M44 19h82v107H44Z" fill="#304d44" />
            <path d="M48 19v107" stroke="#a9b08e" />
            <path d="M58 35h53M58 102h53" stroke="#bcbb92" strokeWidth=".6" />
            <text
              x="85"
              y="55"
              textAnchor="middle"
              fill="#e2dbb5"
              fontFamily="Georgia"
              fontSize="10"
            >
              Data Structures
            </text>
            <text
              x="85"
              y="71"
              textAnchor="middle"
              fill="#e2dbb5"
              fontFamily="Georgia"
              fontSize="9"
            >
              & Algorithms
            </text>
            <path d="m75 86 10-6 10 6-10 6Z" stroke="#a6ae88" />
          </g>
        )}
        {kind === "umbrella" && (
          <g>
            <path
              d="M90 25v98c0 17 21 13 21 2"
              stroke="#6e4e54"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M22 82c6-67 128-67 136 0-19-15-26-7-34 0-17-13-23-11-34 0-13-13-20-11-34 0-9-11-20-13-34 0Z"
              fill="#d991b0"
            />
            <path
              d="M90 31C66 35 58 55 56 82M90 31c25 4 32 28 34 51M90 31v51"
              stroke="#bc6b91"
              strokeWidth="1.3"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
