import Avatar from "./avatar";
import {ObservationRecord} from "./journal-record";
import {journalTitle} from "./journal-media.mjs";
import React, { useEffect, useRef, useState, useId } from "react";
import Icon from "./icons";
export function AccountMenu({
  name,
  initials,
  photo,
  subtitle,
  onNavigate,
  onSignOut,
  busy,
  compact = false,
  administrator = false,
}) {
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);
  const menu = useRef(null);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector('[role="menuitem"]')?.focus();
    const dismiss = (event) => {
      if (!container.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  const choose = (action) => {
    setOpen(false);
    trigger.current?.focus();
    action();
  };
  const navigateMenu = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
      return;
    }
    const items = Array.from(
      menu.current.querySelectorAll('[role="menuitem"]:not(:disabled)'),
    );
    const index = items.indexOf(document.activeElement);
    const next = {
      ArrowDown: (index + 1) % items.length,
      ArrowUp: (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    }[event.key];
    if (next !== undefined) {
      event.preventDefault();
      items[next]?.focus();
    }
  };
  return (
    <div
      className={`account-menu${compact ? " compact-account-menu" : ""}`}
      ref={container}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        className={compact ? "avatar" : "sidebar-profile"}
        aria-label={`Account options for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {compact ? (
          <Avatar src={photo} initials={initials} bare />
        ) : (
          <>
            <Avatar src={photo} initials={initials} />
            <span>
              <strong>{name}</strong>
              <small>{subtitle}</small>
            </span>
            <Icon name="chevron" size={15} />
          </>
        )}
      </button>
      {open && (
        <div
          className="account-options"
          id={menuId}
          role="menu"
          aria-label="Account options"
          ref={menu}
          onKeyDown={navigateMenu}
        >
          <div className="account-options-heading">{administrator ? "Administrator account" : "Your account"}</div>
          {(administrator ? [
            ["profile", "Profile"],
            ["settings", "Settings & administration"],
          ] : [
            ["profile", "Profile"],
            ["settings", "Settings"],
            ["billing", "Membership"],
          ]).map(([route, label]) => (
            <button
              key={route}
              role="menuitem"
              onClick={() => choose(() => onNavigate(route))}
            >
              <Icon name={route} size={17} />
              {label}
            </button>
          ))}
          <div className="account-options-divider" role="separator" />
          <button
            role="menuitem"
            disabled={busy}
            onClick={() => choose(onSignOut)}
          >
            <Icon name="logout" size={17} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
export const kindLabels = {
  terminology: "Free resource",
  analysis: "Live analysis",
  observation: "Observation",
  callout: "Callout",
  execution: "Execution",
  achievement: "Achievement",
};
export const formatDate = (
  date,
  options = { month: "short", day: "numeric" },
) =>
  date
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        ...options,
      }).format(new Date(date))
    : "To be announced";
export function Logo({ compact = false }) {
  return (
    <div className={compact ? "logo-crop" : "brand"}>
      {compact ? (
        <img
          src="/icons/High-Resolution-Color-Logo-on-Transparent-Background.png"
          alt="LMR"
        />
      ) : (
        <>
          <Logo compact />
          <div>
            <strong>LMR CAPITALS</strong>
            <small>THE INNER CIRCLE</small>
          </div>
        </>
      )}
    </div>
  );
}
export function Button({
  children,
  icon,
  onClick,
  gold = false,
  small = false,
  ...props
}) {
  return (
    <button
      className={`button${gold ? " gold" : ""}${small ? " small" : ""}`}
      onClick={onClick}
      {...props}
    >
      {icon && <Icon name={icon} size={small ? 14 : 16} />} {children}
    </button>
  );
}
export function Empty({ title, body, icon = "observations", children }) {
  return (
    <div className="empty-state">
      <Icon name={icon} size={28} />
      <h3>{title}</h3>
      <p>{body}</p>
      {children}
    </div>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="Close" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function MarketLines() {
  return (
    <svg className="live-art" viewBox="0 0 420 270" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M0 217H420M0 158H420M0 99H420M0 40H420" opacity=".2" />
        {[
          175, 157, 163, 140, 149, 128, 105, 119, 92, 109, 87, 63, 79, 49, 55,
          35, 50,
        ].map((y, i) => (
          <g key={i} opacity={i > 9 ? ".9" : ".6"}>
            <path d={`M${28 + i * 23} ${y - 18}v55`} />
            <rect
              x={22 + i * 23}
              y={y}
              width="12"
              height={i % 3 ? 22 : 14}
              fill={i % 3 ? "#af945e" : "#172639"}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
export function RiskNote({ onLegal }) {
  return (
    <div className="risk-inline">
      Futures trading involves substantial risk of loss. Educational content
      only. Past performance does not predict future results.
      <button onClick={() => onLegal("risk")}>Read risk disclosure</button>
    </div>
  );
}
export function Post({ post, saved, onSave, onImage, onQuestion }) {
  return (
    <article className="post panel">
      <div className="post-author">
        <Logo compact />
        <div>
          <strong>
            LMR Capitals <Icon name="shield" size={12} />
          </strong>
          <small>
            {formatDate(post.published_at || post.created_at)} · From the LMR
            desk{post.source_id ? " · Journal Application" : ""}
            {post.preview ? " · Preview" : ""}
          </small>
        </div>
        <span className="tag">{kindLabels[post.kind] || post.kind}</span>
      </div>
      <h3>{journalTitle(post)}</h3>
      <p style={{ whiteSpace: "pre-wrap" }}>{post.body}</p>
      {post.source_content && <ObservationRecord record={post} onChart={src => onImage({...post, image_url:src, image_caption:"Journal observation chart", source_content:null})} />}
      {post.image_url && (
        <button
          className="post-media"
          onClick={() => onImage(post)}
          aria-label={`View image: ${post.title}`}
        >
          <img
            src={post.image_url}
            alt={post.image_caption || post.title}
            loading="lazy"
          />
          <span className="media-caption">
            {post.image_caption || "Published by LMR"}
            <Icon name="external" size={13} />
          </span>
        </button>
      )}
      {post.media_error && (
        <p className="content-note">
          The image could not load. Refresh to request a new image link.
        </p>
      )}
      <div className="post-footer">
        <button onClick={() => onQuestion(post)}>
          <Icon name="questions" size={15} />
          Ask the desk
        </button>
        <small>
          {post.preview ? "Illustrative post" : "Member publication"}
        </small>
        <button
          className={saved ? "active" : ""}
          aria-pressed={saved}
          onClick={() => onSave(post.id)}
        >
          <Icon name="save" size={15} />
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </article>
  );
}
