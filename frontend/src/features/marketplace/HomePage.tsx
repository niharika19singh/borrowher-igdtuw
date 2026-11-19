import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  FlaskConical,
  Heart,
  MapPin,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Umbrella,
} from "lucide-react";
import { useAuth } from "../../app/AuthContext";
import { Brand } from "../../components/ui";
import { ThemeToggle } from "../../components/ThemeToggle";
import {
  subscribeActiveCategories,
  subscribeActiveListings,
  subscribeApprovedPickupZones,
} from "../../services/marketplace";
import type { Category, Listing, PickupZone } from "../../types/backend";
import { ListingCard } from "./ListingCard";

const CAMPUS_CATEGORIES = [
  {
    id: "electronics-calculators",
    label: "Calculators & Electronics",
    icon: Calculator,
  },
  { id: "academic-books", label: "Academic Books & Notes", icon: BookOpen },
  {
    id: "lab-project-equipment",
    label: "Lab Coats & Equipment",
    icon: FlaskConical,
  },
  { id: "campus-essentials", label: "Campus Essentials", icon: Umbrella },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Verify your IGDTUW email",
    text: "Sign up with your official @igdtuw.ac.in address and complete student verification for trusted campus-only access.",
    icon: ShieldCheck,
  },
  {
    step: "02",
    title: "Browse or list campus essentials",
    text: "Find calculators, textbooks, lab coats, and umbrellas nearby—or share items you are not using this semester.",
    icon: Search,
  },
  {
    step: "03",
    title: "Meet at approved campus zones",
    text: "Exchange safely in administrator-approved public campus spots like the Admin Block Foyer or Central Library Entrance.",
    icon: MapPin,
  },
  {
    step: "04",
    title: "Return on time, build trust",
    text: "Keep exchanges transparent with clear borrow windows, simulated deposits, and verified peer reputations.",
    icon: CheckCircle2,
  },
];

export function HomePage() {
  const session = useAuth();
  const [liveListings, setLiveListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [zones, setZones] = useState<PickupZone[]>([]);
  const canReadMarketplace = Boolean(
    session.user && (session.isStudent || session.isAdmin),
  );

  useEffect(() => {
    if (!canReadMarketplace) {
      setLiveListings([]);
      return;
    }
    const unsubListings = subscribeActiveListings(
      (items) => {
        const sorted = [...items].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        );
        setLiveListings(sorted.slice(0, 4));
      },
      () => setLiveListings([]),
    );
    const unsubCategories = subscribeActiveCategories(
      setCategories,
      () => setCategories([]),
    );
    const unsubZones = subscribeApprovedPickupZones(setZones, () =>
      setZones([]),
    );
    return () => {
      unsubListings();
      unsubCategories();
      unsubZones();
    };
  }, [canReadMarketplace]);

  const categoryMap = new Map(categories.map((c) => [c.categoryId, c.name]));
  const zoneMap = new Map(zones.map((z) => [z.zoneId, z.label]));

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <Brand />
          <nav className="landing-nav" aria-label="Primary">
            {canReadMarketplace ? (
              <>
                <Link to="/marketplace" className="text-link">
                  Marketplace
                </Link>
                <Link to="/dashboard" className="text-link">
                  Dashboard
                </Link>
                <Link to="/listings/new" className="button primary">
                  <PlusCircle size={16} />
                  List an item
                </Link>
              </>
            ) : (
              <>
                <Link to="/demo/marketplace" className="text-link">
                  Explore demo
                </Link>
                <Link to="/auth/login" className="button outline">
                  Sign in
                </Link>
                <Link to="/auth/register" className="button primary">
                  Join IGDTUW
                </Link>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="landing-hero">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="eyebrow">
                <Sparkles size={13} />
                IGDTUW CAMPUS SHARING ECONOMY
              </p>
              <h1>
                Borrow. Share. <em>Repeat.</em>
              </h1>
              <p className="landing-lead">
                Your trusted campus circle to borrow and lend textbooks,
                scientific calculators, lab coats, umbrellas, and everyday
                student essentials—exclusively for verified IGDTUW students.
              </p>
              <div className="button-row">
                {canReadMarketplace ? (
                  <>
                    <Link to="/marketplace" className="button primary">
                      Explore Marketplace
                      <ArrowRight size={16} />
                    </Link>
                    <Link to="/listings/new" className="button outline">
                      <PlusCircle size={16} />
                      List an Item
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/auth/register" className="button primary">
                      Get started with @igdtuw.ac.in
                      <ArrowRight size={16} />
                    </Link>
                    <Link to="/demo/marketplace" className="button outline">
                      Preview Marketplace Demo
                    </Link>
                  </>
                )}
              </div>
              <p className="landing-trust-line">
                <ShieldCheck size={16} />
                Verified `@igdtuw.ac.in` students · Approved public campus
                pickup zones · Zero middlemen
              </p>
            </div>
            <figure className="landing-hero-figure">
              <img
                src="/images/igdtuw-campus.jpg"
                alt="Indira Gandhi Delhi Technical University for Women campus courtyard"
                width={960}
                height={720}
              />
              <figcaption>
                Indira Gandhi Delhi Technical University for Women · Kashmere
                Gate
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">BROWSE BY CATEGORY</p>
                <h2>Campus essentials, organized for student life</h2>
              </div>
              <Link
                to={canReadMarketplace ? "/marketplace" : "/demo/marketplace"}
                className="text-link"
              >
                View all items <ArrowRight size={15} />
              </Link>
            </div>
            <div className="landing-category-grid">
              {CAMPUS_CATEGORIES.map(({ id, label, icon: Icon }) => (
                <Link
                  key={id}
                  to={
                    canReadMarketplace
                      ? `/marketplace?category=${encodeURIComponent(id)}`
                      : `/demo/marketplace?category=${encodeURIComponent(id)}`
                  }
                  className="panel landing-category-card"
                >
                  <span className="emergency-icon">
                    <Icon size={22} />
                  </span>
                  <strong>{label}</strong>
                  <span className="muted">Browse listings →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {canReadMarketplace && liveListings.length > 0 && (
          <section className="landing-section">
            <div className="landing-container">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">LIVE ON CAMPUS</p>
                  <h2>Recently listed by verified students</h2>
                </div>
                <Link to="/marketplace" className="text-link">
                  Open full marketplace <ArrowRight size={15} />
                </Link>
              </div>
              <div className="marketplace-grid">
                {liveListings.map((item) => (
                  <ListingCard
                    key={item.listingId}
                    listing={item}
                    categoryName={categoryMap.get(item.categoryId)}
                    zoneLabel={zoneMap.get(item.pickupZoneIds[0])}
                    isOwner={item.ownerUid === session.user?.uid}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="landing-section">
          <div className="landing-container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">HOW BORROWHER WORKS</p>
                <h2>Safe, peer-to-peer sharing across campus</h2>
              </div>
            </div>
            <div className="help-grid">
              {HOW_IT_WORKS.map(({ step, title, text, icon: Icon }) => (
                <article className="panel help-card" key={step}>
                  <div className="landing-step-head">
                    <Icon size={24} />
                    <span className="badge pink">Step {step}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer landing-footer">
        <span>
          BorrowHer · IGDTUW Campus Sharing Economy ·{" "}
          <a href="/images/credits.html">Photo credits</a> ·{" "}
          <Link to="/community-guidelines">Campus guidelines</Link>
        </span>
        <span>
          Borrow. Share. <em>Repeat.</em> <Heart size={12} />
        </span>
      </footer>
    </div>
  );
}
