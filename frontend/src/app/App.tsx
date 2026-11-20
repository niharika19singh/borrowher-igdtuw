import { useEffect } from "react";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { ArrowLeft, Heart, MapPin, ShieldCheck } from "lucide-react";
import { AuthProvider, useAuth } from "./AuthContext";
import { DemoProvider, useDemo } from "./DemoContext";
import { Shell } from "../components/Shell";
import {
  Brand,
  Empty,
  ErrorMessage,
  Loading,
  PageHeading,
} from "../components/ui";
import { AuthPage, VerifyPage } from "../features/Auth";
import { Dashboard } from "../features/Dashboard";
import { BookingPage } from "../features/Booking";
import { EmergencyPage } from "../features/Emergency";
import { NotificationsPage } from "../features/Notifications";
import { ProfilePage } from "../features/Profile";
import { AdminPage } from "../features/Admin";
import { HomePage } from "../features/marketplace/HomePage";
import { MarketplacePage } from "../features/marketplace/MarketplacePage";
import { ItemDetailPage } from "../features/marketplace/ItemDetailPage";
import { ListingFormPage } from "../features/marketplace/ListingFormPage";

function Protected({ admin = false }: { admin?: boolean }) {
  const session = useAuth();
  const demo = useDemo();
  const location = useLocation();
  if (demo.enabled) return <Outlet />;
  if (session.loading) return <Loading />;
  if (!session.user)
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  if (session.error)
    return (
      <div className="standalone">
        <Brand />
        <ErrorMessage>{session.error}</ErrorMessage>
        <Link to="/auth/verify" className="button primary">
          Check account status
        </Link>
      </div>
    );
  if (!session.isStudent && !session.isAdmin)
    return <Navigate to="/auth/verify" replace />;
  if (admin && !session.isAdmin)
    return (
      <>
        <PageHeading
          eyebrow="CAMPUS CARE"
          title="Administrator access required"
          description="This space is for authorised campus administrators."
        />
        <Link to="/dashboard" className="button outline">
          Back to dashboard
        </Link>
      </>
    );
  return <Outlet />;
}

function DemoRoot() {
  return (
    <DemoProvider>
      <Outlet />
    </DemoProvider>
  );
}

function ScrollToPage() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById("main-content")?.focus({ preventScroll: true });
    const page =
      pathname
        .split("/")
        .filter(Boolean)
        .filter((p) => p !== "demo")[0] || "Welcome";
    document.title = `BorrowHer · ${page.charAt(0).toUpperCase() + page.slice(1)}`;
  }, [pathname]);
  return null;
}

function HelpPage() {
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE CARE FOR OUR CIRCLE"
        title="Sharing, with care."
        description="A few little habits that make BorrowHer work for everyone."
      />
      <div className="help-grid">
        {[
          {
            title: "Keep our circle campus-only",
            text: "Use your own @igdtuw.ac.in email. Verify your inbox and wait for student approval before borrowing or lending.",
            icon: ShieldCheck,
          },
          {
            title: "Meet in a public campus space",
            text: "Choose an approved pickup zone together. Follow campus access rules. Keep room numbers, private addresses and contact details private.",
            icon: MapPin,
          },
          {
            title: "Care for the little things",
            text: "Check the item together at pickup. Agree on condition and borrowing dates. Return it on time and in the condition you received it.",
            icon: Heart,
          },
          {
            title: "Confirm your own side",
            text: "Pickup and return need both students’ confirmation. If you disagree about an item’s condition, contact a campus administrator instead of confirming completion.",
            icon: ShieldCheck,
          },
        ].map(({ title, text, icon: Icon }) => (
          <section className="panel help-card" key={title}>
            <Icon size={29} strokeWidth={1.3} />
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
      </div>
      <div className="care-callout">
        <Heart size={19} />
        <p>
          BorrowHer is a student project. Verification does not guarantee an
          exchange is risk-free. Deposits in the MVP are simulated; the app does
          not collect or hold money.
        </p>
      </div>
    </>
  );
}

function NotFound() {
  return (
    <div className="standalone">
      <Brand />
      <Empty title="A little off the campus map">
        We couldn’t find this page. Let’s get you back to BorrowHer.
      </Empty>
      <Link to="/" className="button primary">
        <ArrowLeft size={16} />
        Back to BorrowHer
      </Link>
    </div>
  );
}

function workflowRoutes() {
  return (
    <>
      <Route path="marketplace" element={<MarketplacePage />} />
      <Route path="items/:listingId" element={<ItemDetailPage />} />
      <Route path="listings/new" element={<ListingFormPage />} />
      <Route path="listings/:listingId/edit" element={<ListingFormPage />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="bookings" element={<Dashboard bookingsOnly />} />
      <Route path="bookings/:bookingId" element={<BookingPage />} />
      <Route path="emergency" element={<EmergencyPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profile/:uid" element={<ProfilePage />} />
      <Route element={<Protected admin />}>
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="help" element={<HelpPage />} />
    </>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ScrollToPage />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/login" element={<AuthPage />} />
        <Route path="/auth/register" element={<AuthPage />} />
        <Route path="/auth/reset" element={<AuthPage />} />
        <Route path="/auth/verify" element={<VerifyPage />} />
        <Route element={<Protected />}>
          <Route element={<Shell />}>{workflowRoutes()}</Route>
        </Route>
        <Route path="/demo" element={<DemoRoot />}>
          <Route index element={<Navigate to="/demo/dashboard" replace />} />
          <Route element={<Shell />}>{workflowRoutes()}</Route>
        </Route>
        <Route
          path="/community-guidelines"
          element={
            <div className="standalone guidelines">
              <Brand />
              <HelpPage />
              <Link to="/auth/register" className="button primary">
                Back to sign-up
              </Link>
            </div>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
