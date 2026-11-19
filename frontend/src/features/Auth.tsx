import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  Heart,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, callFunction, firebaseConfigured } from "../firebase/client";
import { useAuth } from "../app/AuthContext";
import {
  Bow,
  Brand,
  ErrorMessage,
  Loading,
  SuccessMessage,
} from "../components/ui";
import {
  isCollegeEmail,
  normalizeEmail,
  readableError,
} from "../utils/identity";
import { ThemeToggle } from "../components/ThemeToggle";
import { IconSwap } from "../components/IconSwap";
import type { EnsureUserProfileResponse } from "../types/backend";

function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <div className="auth-header">
        <Brand />
        <div className="auth-header-actions">
          <ThemeToggle />
          <Link to="/demo/dashboard" className="text-link">
            Explore the demo <ArrowRight size={15} />
          </Link>
        </div>
      </div>
      <main className="auth-grid">
        <section className="auth-story">
          <span className="eyebrow">
            <Sparkles size={15} />
            EXCLUSIVELY FOR IGDTUW
          </span>
          <h1>
            Borrow. Share. <br />
            <em>Repeat.</em>
          </h1>
          <p>
            Borrow everyday essentials from students at IGDTUW — from a
            calculator before an exam to a lab coat for your next practical.
          </p>
          <figure className="auth-campus-photo">
            <img
              src="/images/igdtuw-campus.jpg"
              alt="The academic building and lawn at IGDTUW"
              width={1280}
              height={720}
            />
            <figcaption>IGDTUW · Kashmere Gate, Delhi</figcaption>
          </figure>
          <div className="story-footer">
            <ShieldCheck size={20} />
            <span>
              A community for IGDTUW students.
              <br />
              <strong>Sign up with your @igdtuw.ac.in email.</strong>
            </span>
          </div>
        </section>
        <section className="auth-form-panel">{children}</section>
      </main>
      <footer className="auth-footer">
        BorrowHer · The IGDTUW Campus Sharing Economy{" "}
        <a href="/images/credits.html">Photo credits</a>
      </footer>
    </div>
  );
}
export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAuth();
  const register = location.pathname.endsWith("/register");
  const reset = location.pathname.endsWith("/reset");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    setError("");
    setSuccess("");
  }, [location.pathname]);
  if (session.loading)
    return (
      <AuthFrame>
        <Loading />
      </AuthFrame>
    );
  if (session.isStudent || session.isAdmin)
    return <Navigate to={session.isAdmin ? "/admin" : "/dashboard"} replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const fields = new FormData(event.currentTarget);
    const email = normalizeEmail(String(fields.get("email")));
    const password = String(fields.get("password") || "");
    if (!isCollegeEmail(email)) {
      setError("Please use your college email ending in @igdtuw.ac.in.");
      return;
    }
    if (register && password !== fields.get("confirmPassword")) {
      setError("The passwords do not match. Please check both fields.");
      return;
    }
    if (!auth) {
      setError(
        "Campus sign-in is not available yet. Please try the design preview.",
      );
      return;
    }
    setBusy(true);
    try {
      if (reset) {
        await sendPasswordResetEmail(auth, email);
        setSuccess(
          "If this email has an account, a password reset link is on its way. Please check your inbox.",
        );
      } else if (register) {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        try {
          await updateProfile(result.user, {
            displayName: String(fields.get("displayName")).trim(),
          });
          await sendEmailVerification(result.user);
          await callFunction<Record<string, never>, EnsureUserProfileResponse>(
            "ensureUserProfile",
            {},
          );
          navigate("/auth/verify", { replace: true });
        } catch (err) {
          navigate("/auth/verify", {
            replace: true,
            state: {
              setupError:
                readableError(err) +
                " Your account was created. Use the options below to finish setup.",
            },
          });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        try {
          await callFunction<Record<string, never>, EnsureUserProfileResponse>(
            "ensureUserProfile",
            {},
          );
        } catch {
          /* Verification screen provides an explicit profile setup retry. */
        }
        navigate("/auth/verify", { replace: true });
      }
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthFrame>
      <div className="auth-form-inner">
        <span className="auth-form-icon">
          {register ? <Heart size={25} strokeWidth={1.5} /> : <Bow />}
        </span>
        <p className="eyebrow">
          {register
            ? "JOIN YOUR CAMPUS COMMUNITY"
            : reset
              ? "LET’S GET YOU BACK IN"
              : "YOUR CAMPUS CIRCLE IS WAITING"}
        </p>
        <h2>
          {register
            ? "Create your account."
            : reset
              ? "Forgot your password?"
              : "Welcome back."}
        </h2>
        <p className="muted">
          {register
            ? "Join BorrowHer with your IGDTUW email."
            : reset
              ? "We’ll send a reset link to your college inbox."
              : "Good things are better when we share them."}
        </p>
        {!firebaseConfigured && (
          <div className="setup-note">
            Campus sign-in is being set up.{" "}
            <Link to="/demo/dashboard">
              Explore the design preview <ArrowRight size={13} />
            </Link>
          </div>
        )}
        <form onSubmit={submit} className="stack-form" key={location.pathname}>
          {register && (
            <label>
              Your name
              <input
                name="displayName"
                autoComplete="name"
                placeholder="What should we call you?"
                minLength={2}
                maxLength={100}
                required
              />
            </label>
          )}
          <label>
            College email
            <div className="input-with-icon">
              <Mail size={17} />
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="yourname@igdtuw.ac.in"
                required
                aria-describedby="email-hint"
              />
            </div>
            <small id="email-hint">
              Only @igdtuw.ac.in email addresses can join.
            </small>
          </label>
          {!reset && (
            <>
              <label>
                Password
                <div className="password-field">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                    placeholder={
                      register ? "At least 8 characters" : "Your password"
                    }
                    minLength={register ? 8 : undefined}
                    maxLength={128}
                    required
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    <IconSwap
                      swapped={showPassword}
                      first={<Eye size={18} />}
                      second={<EyeOff size={18} />}
                    />
                  </button>
                </div>
              </label>
              {register ? (
                <label>
                  Confirm password
                  <input
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="One more time, please"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </label>
              ) : (
                <Link to="/auth/reset" className="forgot-link">
                  Forgot password?
                </Link>
              )}
            </>
          )}
          {register && (
            <label className="checkbox-label">
              <input name="communityAgreement" type="checkbox" required />
              <span>
                I’ll respect the campus community, care for borrowed items, and
                follow{" "}
                <Link to="/community-guidelines">community guidelines</Link>.
              </span>
            </label>
          )}
          <ErrorMessage>{error}</ErrorMessage>
          <SuccessMessage>{success}</SuccessMessage>
          <button
            className="button primary full"
            disabled={busy || !firebaseConfigured}
          >
            {busy
              ? "Just a moment…"
              : register
                ? "Create account"
                : reset
                  ? "Send reset link"
                  : "Sign in to BorrowHer"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-switch">
          {reset ? (
            <Link to="/auth/login">
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          ) : register ? (
            <>
              Already have an account? <Link to="/auth/login">Sign in</Link>
            </>
          ) : (
            <>
              New around here?{" "}
              <Link to="/auth/register">Create an account</Link>
            </>
          )}
        </p>
        <div className="auth-trust">
          <ShieldCheck size={15} />
          Use your college email to verify that you study at IGDTUW.
        </div>
      </div>
    </AuthFrame>
  );
}

export function VerifyPage() {
  const session = useAuth();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(
      () => setCooldown((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);
  if (session.loading)
    return (
      <AuthFrame>
        <Loading />
      </AuthFrame>
    );
  if (!session.user) return <Navigate to="/auth/login" replace />;
  if (session.isStudent || session.isAdmin)
    return <Navigate to={session.isAdmin ? "/admin" : "/dashboard"} replace />;
  const validEmail = isCollegeEmail(session.user.email || "");
  const emailVerified = session.user.emailVerified;
  const suspended =
    session.profile?.accountStatus === "suspended" ||
    session.profile?.verificationStatus === "suspended";
  const rejected = session.profile?.verificationStatus === "rejected";
  async function action(kind: "refresh" | "resend" | "logout") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (kind === "logout") await signOut(auth!);
      if (kind === "refresh") {
        await session.refresh();
        setMessage(
          "Status refreshed. If you have just verified your email, administrator approval may still be pending.",
        );
      }
      if (kind === "resend") {
        await sendEmailVerification(auth!.currentUser!);
        setCooldown(60);
        setMessage(
          "Verification email sent. Check your inbox and spam folder.",
        );
      }
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthFrame>
      <div className="auth-form-inner verification">
        <span className="auth-form-icon">
          <Mail size={28} />
        </span>
        <p className="eyebrow">ONE LITTLE STEP CLOSER</p>
        <h2>
          {suspended
            ? "Account paused."
            : rejected
              ? "Verification needs attention."
              : "Let’s make it official."}
        </h2>
        <p className="muted">
          {!validEmail ? (
            "This account does not use an @igdtuw.ac.in email. Please sign out and use your college email."
          ) : suspended ? (
            "Your account is suspended. Contact your campus administrator for help."
          ) : rejected ? (
            session.profile?.rejectionReason ||
            "Contact your campus administrator to review your verification."
          ) : (
            <>
              BorrowHer is for verified IGDTUW students.
              <br />
              <strong>{session.user.email}</strong>
            </>
          )}
        </p>
        <ol className="verification-steps">
          <li className={emailVerified ? "done" : ""}>
            <span>{emailVerified ? <Check size={18} /> : "1"}</span>
            <div>
              <strong>Verify your college email</strong>
              <p>Open the link in your college inbox, then refresh below.</p>
            </div>
          </li>
          <li
            className={
              session.profile?.verificationStatus === "verified" ? "done" : ""
            }
          >
            <span>
              {session.profile?.verificationStatus === "verified" ? (
                <CheckCheck size={18} />
              ) : (
                "2"
              )}
            </span>
            <div>
              <strong>Campus approval</strong>
              <p>
                An administrator reviews your student account before campus
                access opens.
              </p>
            </div>
          </li>
        </ol>
        <ErrorMessage>
          {error || session.error || location.state?.setupError}
        </ErrorMessage>
        <SuccessMessage>{message}</SuccessMessage>
        <button
          className="button primary full"
          onClick={() => action("refresh")}
          disabled={busy || !validEmail}
        >
          {busy ? "Checking…" : "I’ve verified — refresh status"}
          <ArrowRight size={17} />
        </button>
        {!emailVerified && validEmail && (
          <button
            className="button outline full"
            onClick={() => action("resend")}
            disabled={busy || cooldown > 0}
          >
            {cooldown ? `Resend in ${cooldown}s` : "Resend verification email"}
          </button>
        )}
        <button
          className="text-button"
          onClick={() => action("logout")}
          disabled={busy}
        >
          Sign out and use another account
        </button>
      </div>
    </AuthFrame>
  );
}
