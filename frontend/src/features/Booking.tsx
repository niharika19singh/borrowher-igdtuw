import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useDemo, useHref } from "../app/DemoContext";
import {
  Avatar,
  Empty,
  ItemArt,
  PageHeading,
  StatusBadge,
  formatDate,
  rupees,
} from "../components/ui";
import { confirmDemoSide } from "../utils/demoBooking";

export function BookingPage() {
  const { bookingId } = useParams();
  const demo = useDemo();
  const href = useHref();
  const booking = demo.bookings.find((b) => b.id === bookingId);
  if (!booking)
    return (
      <>
        <PageHeading
          eyebrow="YOUR SHARING STORY"
          title="Booking details"
          description="All the little details, in one place."
        />
        <Empty title="We couldn’t find this booking">
          {demo.enabled
            ? "This sample booking does not exist."
            : "Live booking details will be available when the campus booking service opens."}
        </Empty>
        <Link to={href("/bookings")} className="button outline">
          <ArrowLeft size={16} />
          Back to bookings
        </Link>
      </>
    );
  const pickupDone = booking.borrowerPickup && booking.lenderPickup;
  const complete = booking.status === "completed";
  const stage = booking.status === "accepted" ? "pickup" : "return";
  const meConfirmed =
    stage === "pickup"
      ? booking[`${booking.role}Pickup`]
      : booking[`${booking.role}Return`];
  const other = booking.role === "borrower" ? "lender" : "borrower";
  const otherConfirmed =
    stage === "pickup" ? booking[`${other}Pickup`] : booking[`${other}Return`];
  const actionable = ["accepted", "active", "return_pending"].includes(
    booking.status,
  );
  const days = Math.max(
    1,
    Math.ceil(
      (new Date(booking.due).getTime() - new Date(booking.start).getTime()) /
        86400000,
    ),
  );
  const steps = [
    { title: "Request sent", note: "Your sharing story begins.", done: true },
    {
      title: "Lender accepts",
      note: "Dates and terms agreed together.",
      done: !["requested", "rejected"].includes(booking.status),
    },
    {
      title: "Pickup confirmed",
      note: "Both students confirm the handover.",
      done: pickupDone,
    },
    {
      title: "Return confirmed",
      note: "Both students confirm a safe return.",
      done: complete,
    },
  ];
  return (
    <>
      <Link to={href("/bookings")} className="back-link">
        <ArrowLeft size={15} />
        Back to my bookings
      </Link>
      <PageHeading
        eyebrow="A LITTLE BORROWING, LOTS OF CARE"
        title={booking.title}
        description={`Sample booking · BH-${booking.id.toUpperCase()}`}
        action={<StatusBadge status={booking.status} />}
      />
      <div className="detail-grid">
        <div>
          <section className="panel booking-summary">
            <ItemArt kind={booking.art} />
            <div>
              <span className="category-label">{booking.category}</span>
              <h2>{booking.title}</h2>
              <p className="lender-line">
                <Avatar
                  name={
                    booking.role === "borrower"
                      ? booking.owner
                      : booking.borrower
                  }
                />
                {booking.role === "borrower" ? "Lent by" : "Borrowed by"}{" "}
                <strong>
                  {booking.role === "borrower"
                    ? booking.owner
                    : booking.borrower}
                </strong>
                <ShieldCheck size={15} />
              </p>
            </div>
          </section>
          <section className="panel detail-panel">
            <h2>The handover details</h2>
            <div className="info-row">
              <CalendarDays />
              <div>
                <span>Borrowing from</span>
                <strong>{formatDate(booking.start, true)} IST</strong>
              </div>
            </div>
            <div className="info-row">
              <Clock3 />
              <div>
                <span>Return by</span>
                <strong>{formatDate(booking.due, true)} IST</strong>
              </div>
            </div>
            <div className="info-row">
              <MapPin />
              <div>
                <span>Campus pickup & return</span>
                <strong>{booking.pickup}</strong>
                <small>
                  Sample location. Use an approved public zone for real
                  exchanges.
                </small>
              </div>
            </div>
            <div className="care-callout">
              <Heart size={19} />
              <p>
                Return the item in the condition you received it. Agree on a
                public campus handover, and keep your room number private.
              </p>
            </div>
          </section>
          <section className="panel detail-panel">
            <h2>A little clarity on costs</h2>
            <dl className="costs">
              <div>
                <dt>
                  Rental · {rupees(booking.price)} × {days} days
                </dt>
                <dd>{rupees(booking.price * days)}</dd>
              </div>
              <div>
                <dt>Refundable deposit · simulated</dt>
                <dd>{rupees(booking.deposit)}</dd>
              </div>
            </dl>
            <p className="quiet-note">
              This course demo does not collect payments or hold money.
            </p>
          </section>
        </div>
        <div>
          <section className="panel detail-panel">
            <h2>Your booking journey</h2>
            <ol className="booking-timeline">
              {steps.map((s, i) => (
                <li key={s.title} className={s.done ? "done" : ""}>
                  <span>{s.done ? <Check size={16} /> : i + 1}</span>
                  <div>
                    <strong>{s.title}</strong>
                    <p>{s.note}</p>
                  </div>
                </li>
              ))}
            </ol>
            {booking.status === "rejected" && (
              <p className="error-message">This sample request was declined.</p>
            )}
            {booking.status === "requested" && booking.role === "lender" && (
              <div className="button-row">
                <button
                  className="button primary"
                  onClick={() =>
                    demo.updateBooking(booking.id, { status: "accepted" })
                  }
                >
                  Accept request
                </button>
                <button
                  className="button outline"
                  onClick={() =>
                    demo.updateBooking(booking.id, { status: "rejected" })
                  }
                >
                  Decline
                </button>
              </div>
            )}
            {actionable && (
              <>
                <p className="quiet-note">
                  {meConfirmed
                    ? "Your side is confirmed. Waiting for the other student."
                    : `Confirm only after you have ${stage === "pickup" ? "exchanged" : "returned"} the item.`}
                </p>
                <button
                  className="button primary full"
                  disabled={meConfirmed}
                  onClick={() =>
                    demo.updateBooking(
                      booking.id,
                      confirmDemoSide(booking, booking.role, stage),
                    )
                  }
                >
                  {meConfirmed
                    ? "Your confirmation is saved"
                    : `Confirm ${stage === "pickup" ? "pickup" : "return"}`}
                  {meConfirmed && <Check size={16} />}
                </button>
              </>
            )}
            {complete && (
              <p className="success-message">
                <Heart size={17} />
                Returned with care. Thank you for sharing!
              </p>
            )}
          </section>
          {actionable && (
            <section className="demo-controls">
              <span className="eyebrow">DEMO SIMULATOR</span>
              <p>
                Try the two-student flow. This button represents the other
                student’s separate session.
              </p>
              <button
                className="button outline small-button"
                disabled={otherConfirmed}
                onClick={() =>
                  demo.updateBooking(
                    booking.id,
                    confirmDemoSide(booking, other, stage),
                  )
                }
              >
                {otherConfirmed
                  ? "Other student has confirmed"
                  : `Simulate ${other} ${stage}`}
              </button>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
