import { useState, type FormEvent } from "react";
import { Check, Clock3, HeartHandshake, Plus, Search, Zap } from "lucide-react";
import { useDemo } from "../app/DemoContext";
import {
  Avatar,
  Badge,
  Empty,
  ErrorMessage,
  PageHeading,
  formatDate,
} from "../components/ui";
import { Modal } from "../components/Modal";

const categories = [
  "All essentials",
  "Study essentials",
  "Lab essentials",
  "Daily essentials",
  "Clothes & accessories",
];
export function EmergencyPage() {
  const demo = useDemo();
  const [category, setCategory] = useState("All essentials");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const now = demo.enabled
    ? new Date("2026-11-15T12:00:00+05:30").getTime()
    : Date.now();
  const active = demo.requests.filter(
    (r) => new Date(r.expires).getTime() > now,
  );
  const requests = active.filter(
    (r) =>
      (category === "All essentials" || r.category === category) &&
      `${r.title} ${r.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    const deadline = new Date(`${String(data.get("neededBy"))}:00+05:30`);
    if (!Number.isFinite(deadline.getTime()) || deadline.getTime() <= now) {
      setError(
        "Please choose a time after 15 November 2026, 12:00 pm IST for this sample request.",
      );
      return;
    }
    demo.addRequest({
      id: crypto.randomUUID(),
      title: String(data.get("title")).trim(),
      description: String(data.get("description")).trim(),
      category: String(data.get("category")),
      student: demo.name,
      neededBy: deadline.toISOString(),
      expires: deadline.toISOString(),
      offered: false,
      own: true,
    });
    setCreating(false);
  }
  return (
    <>
      <PageHeading
        eyebrow="BECAUSE CAMPUS HAS YOUR BACK"
        title="Emergency Essentials"
        description="Post an urgent request or help another student with an essential."
        action={
          <button
            className="button primary"
            disabled={!demo.enabled}
            onClick={() => setCreating(true)}
          >
            <Plus size={17} />
            Post a request
          </button>
        }
      />
      <div className="emergency-banner">
        <HeartHandshake size={38} strokeWidth={1.2} />
        <div>
          <h2>Need something at short notice?</h2>
          <p>
            Need something for an exam, a practical, or an unexpected moment?
            Ask another IGDTUW student.
          </p>
        </div>
        <Zap size={30} strokeWidth={1} />
      </div>
      <div className="filter-bar">
        <div className="filter-chips" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c}
              aria-pressed={category === c}
              className={category === c ? "selected" : ""}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={16} />
          <input
            aria-label="Search emergency requests"
            placeholder="Find a request…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="section-heading">
        <h2>
          Someone could use your help{" "}
          <span className="count-label">{requests.length}</span>
        </h2>
        <small className="muted">
          {demo.enabled
            ? "Sample board · 15 Nov, 12:00 pm IST"
            : "Campus requests"}
        </small>
      </div>
      <div className="emergency-grid">
        {requests.map((request) => (
          <article className="emergency-card" key={request.id}>
            <div className="card-topline">
              <Badge tone="amber">
                <Zap size={12} />
                Urgent request
              </Badge>
              <span className="category-label">{request.category}</span>
            </div>
            <h3>{request.title}</h3>
            <p>{request.description}</p>
            <div className="request-deadline">
              <Clock3 size={15} />
              Needed by {formatDate(request.neededBy, true)} IST
            </div>
            <div className="request-footer">
              <span className="lender-line">
                <Avatar name={request.student} />
                <strong>{request.student}</strong>
              </span>
              <button
                disabled={request.own}
                className={`button ${request.offered ? "outline" : "primary"} small-button`}
                aria-pressed={request.offered}
                onClick={() => demo.offer(request.id)}
              >
                {request.own ? (
                  "Your request"
                ) : request.offered ? (
                  <>
                    <Check size={14} />
                    Offered · Undo
                  </>
                ) : (
                  "I can help"
                )}
              </button>
            </div>
            {request.offered && (
              <p className="offer-note" role="status">
                Sample offer saved for this preview. No message has been sent.
              </p>
            )}
          </article>
        ))}
      </div>
      {!requests.length && (
        <Empty
          title={search ? "No matching requests" : "A quiet moment on campus"}
        >
          {demo.enabled
            ? "Try another category or post a sample request."
            : "Requests and offers will open when the campus emergency service is connected."}
        </Empty>
      )}
      {creating && (
        <Modal
          title="What do you need a hand with?"
          onClose={() => setCreating(false)}
        >
          <p className="muted">
            Sample request · visible in this preview only.
          </p>
          <form className="stack-form" onSubmit={create}>
            <label>
              What do you need?
              <input
                name="title"
                placeholder="A calculator for my exam…"
                minLength={3}
                maxLength={100}
                required
                autoFocus
              />
            </label>
            <label>
              Category
              <select name="category">
                {categories.slice(1).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              A few helpful details
              <textarea
                name="description"
                rows={3}
                placeholder="Share what you need and for how long. Keep personal contact details private."
                minLength={10}
                maxLength={1000}
                required
              />
            </label>
            <label>
              Needed by · India time
              <input
                type="datetime-local"
                name="neededBy"
                min="2026-11-15T12:01"
                defaultValue="2026-11-16T09:00"
                required
              />
            </label>
            <ErrorMessage>{error}</ErrorMessage>
            <div className="button-row">
              <button
                type="button"
                className="button outline"
                onClick={() => setCreating(false)}
              >
                Cancel
              </button>
              <button type="submit" className="button primary">
                Post sample request
                <Plus size={16} />
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
