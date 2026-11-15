import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BookHeart,
  CalendarDays,
  ChevronRight,
  Clock3,
  Heart,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useDemo, useHref } from "../app/DemoContext";
import { useAuth } from "../app/AuthContext";
import {
  ArrowLink,
  Avatar,
  Badge,
  Bow,
  Empty,
  ItemArt,
  StatusBadge,
  formatDate,
  rupees,
} from "../components/ui";
import type { BookingView } from "../types/workflows";

export function BookingCard({ booking }: { booking: BookingView }) {
  const href = useHref();
  return (
    <article className="booking-card">
      <Link
        to={href(`/bookings/${booking.id}`)}
        tabIndex={-1}
        aria-hidden="true"
      >
        <ItemArt kind={booking.art} />
      </Link>
      <div className="booking-card-body">
        <div className="card-topline">
          <span className="category-label">{booking.category}</span>
          <StatusBadge status={booking.status} />
        </div>
        <h3>
          <Link to={href(`/bookings/${booking.id}`)}>{booking.title}</Link>
        </h3>
        <p className="lender-line">
          <Avatar
            name={
              booking.role === "borrower" ? booking.owner : booking.borrower
            }
          />
          {booking.role === "borrower" ? "From" : "Requested by"}{" "}
          <strong>
            {booking.role === "borrower" ? booking.owner : booking.borrower}
          </strong>
          <ShieldCheck size={13} />
        </p>
        <div className="booking-dates">
          <CalendarDays size={14} />
          {formatDate(booking.start)}
          <span>—</span>
          {formatDate(booking.due)}
        </div>
        <div className="booking-card-footer">
          <span>
            {booking.price ? (
              <>
                <strong>{rupees(booking.price)}</strong>
                <small> / day</small>
              </>
            ) : (
              <strong>Shared with love</strong>
            )}
          </span>
          <Link to={href(`/bookings/${booking.id}`)} className="card-action">
            {booking.status === "requested"
              ? "Review request"
              : booking.status === "active"
                ? "View borrowing"
                : "View details"}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function Dashboard({
  bookingsOnly = false,
}: {
  bookingsOnly?: boolean;
}) {
  const demo = useDemo();
  const href = useHref();
  const session = useAuth();
  const [tab, setTab] = useState<"borrower" | "lender">("borrower");
  const [search, setSearch] = useState("");
  const name = (
    demo.enabled ? demo.name : session.profile?.displayName || "friend"
  ).split(" ")[0];
  const borrowing = demo.bookings.filter(
    (b) =>
      b.role === "borrower" && !["completed", "rejected"].includes(b.status),
  );
  const lending = demo.bookings.filter(
    (b) => b.role === "lender" && !["completed", "rejected"].includes(b.status),
  );
  const pending = demo.bookings.filter(
    (b) => b.role === "lender" && b.status === "requested",
  );
  const rows = demo.bookings.filter(
    (b) =>
      b.role === tab &&
      `${b.title} ${b.owner} ${b.borrower}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="dashboard-page">
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">
            <span className="tiny-flower">✳</span>YOUR EVERYDAY, A LITTLE EASIER
          </p>
          <h1>
            {bookingsOnly ? (
              "Your sharing story."
            ) : (
              <>
                Hello, {name}
                <span className="greeting-flower">✿</span>
              </>
            )}
          </h1>
          <p className="muted">
            {bookingsOnly
              ? "Every borrow, every lend, all in one little place."
              : "A little borrowing. A little lending. A whole lot of community."}
          </p>
        </div>
        <span className="date-label">
          <CalendarDays size={16} />
          {demo.enabled
            ? "Sunday, 15 November · sample"
            : new Intl.DateTimeFormat("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "Asia/Kolkata",
              }).format(new Date())}
        </span>
      </header>
      {!bookingsOnly && (
        <>
          <section className="welcome-banner">
            <div className="welcome-copy">
              <span className="eyebrow">YOUR CAMPUS SHARING CIRCLE</span>
              <h2>
                Small things.
                <br />
                <em>Shared possibilities.</em>
              </h2>
              <p>
                Keep track of what you borrow, care for what you lend,
                <br className="desktop-only" />
                and make a little room for kindness.
              </p>
              <Link to={href("/emergency")} className="button primary">
                Lend a helping hand <ArrowRight size={15} />
              </Link>
            </div>
            <div className="welcome-art" aria-hidden="true">
              <span className="welcome-oval" />
              <span className="art-spark spark-one">✧</span>
              <span className="art-spark spark-two">✳</span>
              <ItemArt kind="book" />
              <ItemArt kind="umbrella" />
              <Bow className="banner-bow" />
              <span className="handwritten">better together</span>
              <span className="welcome-heart">♡</span>
            </div>
          </section>
          <section className="stats-grid" aria-label="Your sharing overview">
            {[
              {
                label: "Currently borrowing",
                value: borrowing.length.toString().padStart(2, "0"),
                sub: "Little things, big help",
                icon: ArrowDownLeft,
                color: "rose",
              },
              {
                label: "Currently lending",
                value: lending.length.toString().padStart(2, "0"),
                sub: "Making someone’s day",
                icon: ArrowUpRight,
                color: "sage",
              },
              {
                label: "Requests to review",
                value: pending.length.toString().padStart(2, "0"),
                sub: "A little hello from campus",
                icon: Clock3,
                color: "peach",
              },
              {
                label: "Completed exchanges",
                value: demo.bookings
                  .filter((b) => b.status === "completed")
                  .length.toString()
                  .padStart(2, "0"),
                sub: "Shared with care",
                icon: Heart,
                color: "lavender",
              },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <article className="stat-card" key={label}>
                <div>
                  <p>{label}</p>
                  <strong>{value}</strong>
                  <small>{sub}</small>
                </div>
                <span className={`stat-icon ${color}`}>
                  <Icon size={22} strokeWidth={1.5} />
                </span>
              </article>
            ))}
          </section>
        </>
      )}
      <div className="dashboard-columns">
        <div className="dashboard-main">
          <section className="bookings-section">
            <div className="section-heading">
              <h2>
                <BookHeart size={21} strokeWidth={1.5} />
                {bookingsOnly
                  ? "All your bookings"
                  : "Your little borrowing corner"}
              </h2>
              {!bookingsOnly && (
                <ArrowLink to={href("/bookings")}>View all</ArrowLink>
              )}
            </div>
            <div className="booking-controls">
              <div className="segmented" aria-label="Booking role">
                <button
                  aria-pressed={tab === "borrower"}
                  className={tab === "borrower" ? "selected" : ""}
                  onClick={() => setTab("borrower")}
                >
                  I’m borrowing <span>{borrowing.length}</span>
                </button>
                <button
                  aria-pressed={tab === "lender"}
                  className={tab === "lender" ? "selected" : ""}
                  onClick={() => setTab("lender")}
                >
                  I’m lending <span>{lending.length}</span>
                </button>
              </div>
              <label className="search-field">
                <Search size={16} />
                <input
                  aria-label="Search my bookings"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a booking…"
                />
              </label>
            </div>
            <div className="booking-list">
              {rows.length ? (
                rows.map((booking) => (
                  <BookingCard booking={booking} key={booking.id} />
                ))
              ) : (
                <Empty
                  title={
                    search
                      ? "No little matches yet"
                      : "Your next sharing story starts here"
                  }
                >
                  {search
                    ? "Try a different item or student name."
                    : demo.enabled
                      ? "Your bookings will appear here as you borrow and lend."
                      : "Your bookings will appear here when the campus booking service opens."}
                </Empty>
              )}
            </div>
          </section>
          {!bookingsOnly && (
            <section className="care-strip">
              <span className="care-icon">
                <Heart size={22} strokeWidth={1.3} />
              </span>
              <div>
                <h3>A little care goes a long way.</h3>
                <p>
                  Return on time, keep in touch, and treat every item like your
                  own.
                </p>
              </div>
              <Link to={href("/help")} aria-label="Read sharing tips">
                <ArrowRight size={20} />
              </Link>
            </section>
          )}
        </div>
        <aside className="dashboard-aside">
          <section className="up-next panel">
            <div className="section-heading">
              <h2>
                <CalendarDays size={18} />
                Coming up
              </h2>
              <span className="tiny-flower">✧</span>
            </div>
            {borrowing.length ? (
              [...borrowing]
                .sort(
                  (a, b) =>
                    new Date(
                      a.status === "accepted" ? a.start : a.due,
                    ).getTime() -
                    new Date(
                      b.status === "accepted" ? b.start : b.due,
                    ).getTime(),
                )
                .map((b) => (
                  <Link
                    key={b.id}
                    to={href(`/bookings/${b.id}`)}
                    className="up-next-row"
                  >
                    <span className="date-tile">
                      <small>NOV</small>
                      <strong>
                        {new Date(
                          b.status === "accepted" ? b.start : b.due,
                        ).getUTCDate()}
                      </strong>
                    </span>
                    <span>
                      <strong>
                        {b.status === "accepted"
                          ? "Pick up your lab coat"
                          : `Return ${b.art === "calculator" ? "calculator" : b.title}`}
                      </strong>
                      <small>
                        {formatDate(
                          b.status === "accepted" ? b.start : b.due,
                          true,
                        )}
                      </small>
                      <Badge tone={b.status === "accepted" ? "pink" : "amber"}>
                        {b.status === "accepted" ? "Pickup" : "Return reminder"}
                      </Badge>
                    </span>
                    <ChevronRight size={15} />
                  </Link>
                ))
            ) : (
              <p className="quiet-note">
                A clear calendar, a little breathing room. Your upcoming
                exchanges will appear here.
              </p>
            )}
          </section>
          <section className="emergency-promo">
            <div className="emergency-icon">
              <Zap size={26} strokeWidth={1.3} />
            </div>
            <span className="eyebrow">
              A LITTLE HELP, RIGHT WHEN IT MATTERS
            </span>
            <h2>
              Campus has <br />
              your back.
            </h2>
            <p>
              Last-minute exam essentials?
              <br />A sudden downpour?
              <br />
              Someone nearby might have just the thing.
            </p>
            <Link to={href("/emergency")} className="button primary">
              Emergency Essentials <ArrowRight size={14} />
            </Link>
            <span className="promo-flower" aria-hidden="true">
              ✳
            </span>
          </section>
          <div className="community-note">
            <span>
              <Sparkles size={17} />
            </span>
            <p>
              Every little exchange makes
              <br />
              our campus feel more like home.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
