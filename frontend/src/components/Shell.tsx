import { useState } from "react";
import {
  NavLink,
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Bell,
  BookHeart,
  ChevronRight,
  CircleHelp,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/client";
import { useAuth } from "../app/AuthContext";
import { useDemo, useHref } from "../app/DemoContext";
import { Avatar, Brand, Bow, ErrorMessage, Loading } from "./ui";
import { ThemeToggle } from "./ThemeToggle";
import { readableError } from "../utils/identity";

export function Shell() {
  const demo = useDemo();
  const session = useAuth();
  const href = useHref();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const name = demo.enabled
    ? demo.name
    : session.profile?.displayName || "Student";
  const uid = demo.enabled ? "me" : session.user?.uid;
  if (!uid) return <Loading />;
  const unread = demo.notifications.filter((n) => !n.read).length;
  const links = [
    { path: "/marketplace", label: "Marketplace", icon: Store },
    { path: "/listings/new", label: "List an item", icon: PlusCircle },
    { path: "/dashboard", label: "My dashboard", icon: LayoutDashboard },
    { path: "/bookings", label: "My bookings", icon: BookHeart },
    { path: "/emergency", label: "Emergency Essentials", icon: Zap },
    {
      path: "/notifications",
      label: "Notifications",
      icon: Bell,
      count: unread,
    },
    { path: `/profile/${uid}`, label: "My profile", icon: UserRound },
    ...(demo.enabled || session.isAdmin
      ? [
          {
            path: "/admin",
            label: demo.enabled ? "Admin preview" : "Admin console",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];
  const page =
    links.find((link) => location.pathname.startsWith(href(link.path)))
      ?.label ||
    (location.pathname.includes("/items/")
      ? "Listing details"
      : location.pathname.includes("/listings/")
        ? "Edit listing"
        : "My dashboard");
  async function logout() {
    if (!auth) return;
    setError("");
    try {
      await signOut(auth);
      navigate("/auth/login", { replace: true });
    } catch (err) {
      setError(readableError(err));
    }
  }
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {open && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${open ? "is-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-only"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <span className="sidebar-label">YOUR IGDTUW COMMUNITY</span>
        <nav>
          {links.map(({ path, label, icon: Icon, count }) => (
            <NavLink
              key={path}
              to={href(path)}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} strokeWidth={1.6} />
              <span>{label}</span>
              {!!count && <span className="nav-count">{count}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <Bow />
          <h3>Have something spare?</h3>
          <p>Share everyday essentials with other students.</p>
          <Link to={href("/listings/new")} onClick={() => setOpen(false)}>
            List an item <Heart size={13} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <Link to={href("/help")} className="nav-item" onClick={() => setOpen(false)}>
            <CircleHelp size={19} />
            Help & campus care
          </Link>
          {demo.enabled ? (
            <Link to="/auth/login" className="nav-item">
              <LogOut size={19} />
              Leave demo
            </Link>
          ) : (
            <button className="nav-item" onClick={logout}>
              <LogOut size={19} />
              Sign out
            </button>
          )}
          <ErrorMessage>{error}</ErrorMessage>
          <div className="sidebar-person">
            <Avatar name={name} />
            <span>
              <strong>{name}</strong>
              <small>
                IGDTUW ·{" "}
                {demo.enabled
                  ? "Sample student"
                  : session.isAdmin
                    ? "Administrator"
                    : "Student"}
              </small>
            </span>
            <Heart size={15} />
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-only"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
              aria-expanded={open}
            >
              <Menu />
            </button>
            <span>My BorrowHer</span>
            <ChevronRight size={14} />
            <strong>{page}</strong>
          </div>
          <div className="topbar-right">
            <span className="campus-pill">
              <span />
              IGDTUW community
            </span>
            <ThemeToggle />
            <Link
              className="notification-button icon-button"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              to={href("/notifications")}
            >
              <Bell size={20} />
              {!!unread && <i />}
            </Link>
            <Link to={href(`/profile/${uid}`)} aria-label="My profile">
              <Avatar name={name} />
            </Link>
          </div>
        </header>
        {demo.enabled && (
          <div className="demo-strip">
            <Sparkles size={13} />
            <span>
              Design preview · sample data · changes reset when you leave
            </span>
            <Link to="/auth/register">
              View sign-up <ChevronRight size={12} />
            </Link>
          </div>
        )}
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>
            For the IGDTUW community.{" "}
            <a href="/images/credits.html">Photo credits</a>
          </span>
          <span>
            Borrow. Share. <em>Repeat.</em> <Heart size={12} />
          </span>
        </footer>
      </div>
    </div>
  );
}
