import React, { useState, useEffect } from "react";
import { sb } from "./api";
import { config, accountRegistrationReady } from "./config";
import { Logo, Button } from "./ui";
import { guideUrl, policyUrl, provider } from "./guidelines.mjs";
import { registrationDetails, authEmailReturn } from "./enrollment.mjs";
export default function Auth({ onLegal, recovery = false }) {
  const [mode, setMode] = useState(recovery ? "password" : new URLSearchParams(location.search).get("signup") === "1" ? "signup" : "login"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [confirmationEmail, setConfirmationEmail] = useState(""),
    [resendWait, setResendWait] = useState(0);
  useEffect(() => {
    if (!resendWait) return;
    const timer = setTimeout(() => setResendWait(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendWait]);
  async function resendConfirmation() {
    if (busy || resendWait || !confirmationEmail) return;
    setBusy(true); setError("");
    try {
      const { error } = await sb.auth.resend({ type: "signup", email: confirmationEmail, options: { emailRedirectTo: authEmailReturn(location.origin) } });
      if (error) throw error;
      setNotice("If this account needs confirmation, a new link has been sent. Check your inbox and spam folder.");
      setResendWait(60);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const f = new FormData(e.currentTarget),
      email = String(f.get("email") || "").trim(),
      password = String(f.get("password") || "");
    try {
      let result;
      if (mode === "login")
        result = await sb.auth.signInWithPassword({ email, password });
      if (mode === "signup") {
        if (!accountRegistrationReady)
          throw new Error(
            "Free account registration will open after LMR publishes its final account policies.",
          );
        const details = registrationDetails(f, config.legalVersion);
        result = await sb.auth.signUp({
          email: details.email,
          password: details.password,
          options: {
            emailRedirectTo: authEmailReturn(location.origin),
            data: details.data,
          },
        });
        if (!result.error && !result.data?.session) {
          setConfirmationEmail(email);
          setResendWait(60);
          setMode("confirm");
          setNotice("Check your email to confirm your account, then sign in.");
        }
      }
      if (mode === "reset") {
        result = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: location.origin + "/member/index.html?recovery=1",
        });
        if (!result.error)
          setNotice(
            "If this address has an account, a recovery link has been sent.",
          );
      }
      if (mode === "password") {
        if (password !== String(f.get("confirm_password") || "")) throw new Error("Your passwords do not match. Please check both fields.");
        result = await sb.auth.updateUser({ password });
        if (!result.error) {
          await sb.auth.signOut();
          location.assign("/member/index.html");
        }
      }
      if (result?.error) throw result.error;
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-shell">
      <section className="auth-story">
        <a href="/" aria-label="LMR Capitals home"><Logo /></a>
        <div>
          <h1>
            The thinking.
            <br />
            The process.
            <br />
            <span>The Inner Circle.</span>
          </h1>
          <p>
            Start free with the LMR chapter library and resources. Upgrade to
            membership for live market context, observations and private
            support.
          </p>
        </div>
        <small>
          Built on THE Chain Methodology.
          <br />
          Trading involves substantial risk. No outcome is guaranteed.
        </small>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form">
          <h2>
            {mode === "login"
              ? "Welcome to the circle."
              : mode === "signup"
                ? "Your journey starts here."
                : mode === "confirm"
                  ? "Check your inbox."
                : mode === "password"
                  ? "Choose a new password."
                  : "Reset your password."}
          </h2>
          <p>
            {mode === "login"
              ? "Sign in with your existing LMR Capitals account."
              : mode === "signup"
                ? "Start free. No card or subscription required."
                : mode === "confirm"
                  ? `A confirmation link has been requested for ${confirmationEmail}. Confirm your email, then return to sign in.`
                : "Secure access to your LMR account."}
          </p>
          <a className="text-button" href={guideUrl}>New to LMR? Read the joining guide →</a>
          {error && (
            <div className="banner error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="banner" role="status">
              {notice}
            </div>
          )}
          {mode === "signup" && !accountRegistrationReady && (
            <div className="banner">
              Registration is awaiting final policy approval. You can read the
              draft account terms and privacy notice in the joining guide.
            </div>
          )}
          {mode === "confirm" ? <div className="form-stack confirmation-actions"><p>Check spam and make sure the email is correct. Already have an LMR account? Return to sign in instead.</p><Button onClick={resendConfirmation} disabled={busy || resendWait > 0}>{resendWait ? `Resend available in ${resendWait}s` : "Resend confirmation email"}</Button><Button gold onClick={() => { setMode("login"); setNotice(""); setError(""); }}>Return to sign in</Button><button className="text-button" onClick={() => { setMode("signup"); setNotice(""); setError(""); }}>Use a different email</button></div> :
          <form onSubmit={submit} className="form-stack">
            {mode === "signup" && (
              <label>
                Your name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength="80"
                />
              </label>
            )}
            {mode !== "password" && (
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </label>
            )}
            {mode !== "reset" && (
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength={mode === "login" ? 1 : 12}
                  required
                />
              </label>
            )}
            {mode === "signup" && (
              <p className="password-guidance">Use at least 12 characters and a password you do not use elsewhere.</p>
            )}
            {(mode === "signup" || mode === "password") && <label>Confirm password<input name="confirm_password" type="password" autoComplete="new-password" minLength={12} required /></label>}
            {mode === "signup" && (
              <>
              <label className="check-label">
                <input name="account_terms" type="checkbox" required />
                <span>
                  I am at least 18 and agree to the{" "}
                  <a
                    href={config.termsUrl || policyUrl("terms")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    account & membership terms
                  </a>
                  ,{" "}
                  <a
                    href={config.privacyUrl || policyUrl("privacy")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    privacy policy
                  </a>.
                </span>
              </label>
              <label className="check-label"><input name="risk_acknowledgement" type="checkbox" required /><span>I have read the <a href={policyUrl("risk")} target="_blank" rel="noreferrer">trading risk disclosure</a> and understand that trading can cause substantial losses. Membership does not guarantee results.</span></label>
              </>
            )}
            <Button
              gold
              disabled={busy || (mode === "signup" && !accountRegistrationReady)}
            >
              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in to Inner Circle"
                  : mode === "signup"
                    ? "Create free account"
                    : mode === "password"
                      ? "Update password"
                      : "Send recovery link"}
            </Button>
          </form>}
          <div className="auth-links">
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setNotice("");
              }}
            >
              {mode === "login" ? "Create an account" : "Back to sign in"}
            </button>
            {mode === "login" && (
              <button
                onClick={() => {
                  setMode("reset");
                  setError("");
                }}
              >
                Forgot password?
              </button>
            )}
          </div>
          <div className="auth-legal">
            <button onClick={() => onLegal("risk")}>Risk disclosure</button> ·{" "}
            <button onClick={() => onLegal("terms")}>Terms</button> ·{" "}
            <button onClick={() => onLegal("privacy")}>Privacy</button>
            <p>
              All content is educational. Futures trading may result in losses
              greater than your initial investment.
            </p>
            <p>{provider.businessName} · ABN {provider.abn}</p>
            <a className="text-button" href="/member/index.html?preview=1">
              Explore the application preview →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
