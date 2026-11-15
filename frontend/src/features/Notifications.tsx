import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  BookHeart,
  CheckCheck,
  ChevronRight,
  Clock3,
  Heart,
} from "lucide-react";
import { useDemo, useHref } from "../app/DemoContext";
import { Empty, PageHeading, formatDate } from "../components/ui";

export function NotificationsPage() {
  const demo = useDemo();
  const href = useHref();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const rows = demo.notifications.filter((n) => !unreadOnly || !n.read);
  const unread = demo.notifications.filter((n) => !n.read).length;
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE HEADS-UP FROM YOUR CIRCLE"
        title="Your notifications"
        description="Borrowing updates, gentle reminders, and the good things happening around you."
        action={
          <button
            className="button outline"
            disabled={!unread}
            onClick={() => demo.markRead()}
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        }
      />
      <div className="segmented notification-tabs">
        <button
          className={!unreadOnly ? "selected" : ""}
          aria-pressed={!unreadOnly}
          onClick={() => setUnreadOnly(false)}
        >
          All updates
        </button>
        <button
          className={unreadOnly ? "selected" : ""}
          aria-pressed={unreadOnly}
          onClick={() => setUnreadOnly(true)}
        >
          Unread <span>{unread}</span>
        </button>
      </div>
      <section className="panel notifications-list">
        {rows.length ? (
          rows.map((n) => {
            const Icon =
              n.kind === "booking"
                ? BookHeart
                : n.kind === "reminder"
                  ? Clock3
                  : Heart;
            return (
              <article
                key={n.id}
                className={`notification-row ${!n.read ? "unread" : ""}`}
              >
                <span className={`notification-icon ${n.kind}`}>
                  <Icon size={21} strokeWidth={1.5} />
                </span>
                <Link to={href(n.href)} onClick={() => demo.markRead(n.id)}>
                  <h3>
                    {n.title}
                    {!n.read && (
                      <span className="unread-dot" aria-label="Unread" />
                    )}
                  </h3>
                  <p>{n.body}</p>
                  <small>{formatDate(n.time, true)} IST</small>
                </Link>
                {!n.read && (
                  <button
                    className="icon-button"
                    aria-label={`Mark ${n.title} as read`}
                    onClick={() => demo.markRead(n.id)}
                  >
                    <CheckCheck size={17} />
                  </button>
                )}
                <ChevronRight size={16} />
              </article>
            );
          })
        ) : (
          <Empty
            title={
              unreadOnly ? "You’re all caught up." : "Your little update corner"
            }
          >
            {demo.enabled
              ? "We’ll keep the important little things here."
              : "Live notifications will appear when the campus notification service is connected."}
          </Empty>
        )}
      </section>
      <p className="bottom-note">
        <Bell size={14} />A gentle nudge, just when you need it.
      </p>
    </>
  );
}
