import { journalPublication } from "./journal-media.mjs";
import { preview, safeEmbed, safeHttps } from "./config";
import { sb, checked, uploadMedia, copyJournalEntry } from "./api";
import { validSessionBlock } from "./live-sessions.mjs";

const previewNotice = (
  title,
  body,
  category = "post",
  audience = "members",
) => ({
  id: crypto.randomUUID(),
  title,
  body,
  category,
  audience,
  created_at: new Date().toISOString(),
});

// Shared by the member studio and the dedicated Admin Terminal.
export function useAdminActions({ user, data, setData, run, refresh, notify }) {
  const onPublish = (e, kind) => {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    run(async () => {
      const file = f.get("image");
      let image_path = null,
        image_url = null;
      if (file?.size) {
        if (
          !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
          file.size > 10 * 1024 * 1024
        )
          throw new Error("Use a PNG, JPEG or WebP image under 10 MB.");
        if (preview) image_url = URL.createObjectURL(file);
        else image_path = await uploadMedia(file, user);
      }
      const status = String(f.get("status"));
      const record = {
        author_id: user.id,
        kind,
        title: String(f.get("title")).trim(),
        body: String(f.get("body")).trim(),
        status,
        image_path,
        image_caption: String(f.get("image_caption")).trim(),
        pinned: f.get("pinned") === "on",
        published_at: status === "published" ? new Date().toISOString() : null,
      };
      if (kind === "callout") {
        const conditions = String(f.get("conditions") || "").trim(), invalidation = String(f.get("invalidation") || "").trim();
        if (!conditions || !invalidation) throw new Error("Add the callout conditions and invalidation.");
        record.body += `\n\nConditions\n${conditions}\n\nInvalidation\n${invalidation}`;
      }
      if (!record.title || !record.body)
        throw new Error("A title and post body are required.");
      if (["execution", "achievement"].includes(kind) && !file?.size)
        throw new Error("Attach an image for this publication.");
      let item;
      if (preview)
        item = {
          ...record,
          image_url,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          preview: true,
        };
      else
        item = await checked(
          sb.rpc("circle_publish_post", {
            payload: record,
            notify_members: true,
          }),
        );
      if (status === "published") {
        if (preview) {
          setData((d) => ({
            ...d,
            adminPosts: [item, ...d.adminPosts],
            posts: [item, ...d.posts],
            notifications: [
              previewNotice(
                item.title,
                "New publication from the LMR desk.",
                "post",
                kind === "terminology" ? "free" : "members",
              ),
              ...d.notifications,
            ],
          }));
        } else await refresh();
      } else if (preview) {
        setData((d) => ({ ...d, adminPosts: [item, ...d.adminPosts] }));
      } else await refresh();
      form.reset();
      notify(
        status === "published"
          ? "Post published to the member feed" +
              (preview ? " in preview." : ".")
          : preview
            ? "Draft saved in this preview."
            : "Draft saved to the admin database.",
      );
    });
  };
  const onJournalPublish = (source) =>
    run(async () => {
      if (preview) {
        if (["achievement", "trade"].includes(source.kind) && !source.image)
          throw new Error("Add an achievement image in your journal first.");
        const existing = data.adminPosts.find(
          (post) =>
            post.source_kind === source.kind && post.source_id === source.id,
        );
        const item = {
          ...journalPublication(source, user.id),
          id: existing?.id || crypto.randomUUID(),
        };
        setData((d) => ({
          ...d,
          adminPosts: [
            item,
            ...d.adminPosts.filter((post) => post.id !== item.id),
          ],
          posts: [item, ...d.posts.filter((post) => post.id !== item.id)],
          notifications: [
            previewNotice(
              item.title,
              "A journal publication is now available in your feed.",
            ),
            ...d.notifications,
          ],
        }));
      } else {
        if (source.kind === "trade") {
          const image_path = await copyJournalEntry(source,user);
          try {
            await checked(sb.rpc("circle_publish_trade", {p_source_id:source.id,p_image_path:image_path,p_entry_version:source.entry_version}));
          } catch (error) {
            await sb.storage.from("circle-media").remove([image_path]);
            throw error;
          }
        } else await checked(sb.rpc("circle_publish_journal", {p_source_kind:source.kind,p_source_id:source.id}));
        await refresh();
      }
      notify(
        preview
          ? "Journal record published in this preview."
          : "Journal record published. Future journal edits stay synchronized.",
      );
    });
  const onCreateObservation = (event) => {
    event.preventDefault();
    const form = event.currentTarget, f = new FormData(form);
    const id = form.dataset.observationId || `circle-${crypto.randomUUID()}`;
    form.dataset.observationId = id;
    run(async () => {
      const title = String(f.get("title") || "").trim(), body = String(f.get("body") || "").trim();
      if (!title || !body) throw new Error("Add an observation title and its context.");
      let image = null; const file = f.get("image");
      if(file?.size) {
        if(!["image/png","image/jpeg","image/webp"].includes(file.type) || file.size > 5*1024*1024) throw new Error("Choose a PNG, JPEG or WebP chart under 5 MB.");
        image = await new Promise((resolve,reject) => {const reader = new FileReader();reader.onload = () => resolve(reader.result);reader.onerror = () => reject(new Error("The chart could not be read. Choose another image."));reader.readAsDataURL(file);});
      }
      const published = f.get("status") === "published";
      if (preview) {
        const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
        const source = {id,kind:"observation",title,session_tag:String(f.get("session_tag")||""),created_at:new Date().toISOString(),content:`<p>${escape(body).replaceAll('\n','<br>')}</p>${image?`<img src="${image}" alt="Observation chart">`:''}`,updated_at:new Date().toISOString()};
        const item = {...journalPublication(source,user.id),status:published?"published":"draft",published_at:published?new Date().toISOString():null};
        setData(d => ({...d,journalEntries:[source,...d.journalEntries],adminPosts:[item,...d.adminPosts],posts:published?[item,...d.posts]:d.posts,notifications:published?[previewNotice(title,"A new Journal observation is available."),...d.notifications]:d.notifications}));
      } else {
        await checked(sb.rpc("circle_create_observation", {p_id:id,p_title:title,p_body:body,p_session_tag:String(f.get("session_tag")||""),p_image:image,p_publish:published}));
        await refresh();
      }
      delete form.dataset.observationId;
      form.reset();
      notify(published?"Observation saved to your Journal and published to paid members.":"Observation saved to your Journal and a private Studio draft.");
    });
  };
  const onSession = (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    run(async () => {
      const provider = String(f.get("provider")),
        stream_url = String(f.get("stream_url")).trim();
      if (
        !safeHttps(stream_url) ||
        (provider !== "external" && !safeEmbed(stream_url))
      )
        throw new Error(
          "Use a valid HTTPS link. YouTube and Vimeo require their embed URL.",
        );
      const record = {
        title: String(f.get("title")).trim(),
        description: String(f.get("description")).trim(),
        session_block: String(f.get("session_block")),
        starts_at: new Date(String(f.get("starts_at"))).toISOString(),
        status: String(f.get("status")),
        provider,
        stream_url,
      };
      if (!validSessionBlock(record.session_block))
        throw new Error(
          "Choose Asia, London, NY AM or NY PM for this session.",
        );
      const item = preview
        ? { ...record, id: crypto.randomUUID(), preview: true }
        : await checked(sb.rpc("circle_publish_session", { payload: record }));
      if (preview)
        setData((d) => ({
          ...d,
          sessions: [item, ...d.sessions],
          notifications: [
            {
              id: crypto.randomUUID(),
              title: item.title,
              body: "A new LMR session has been announced.",
              category: "live",
              created_at: new Date().toISOString(),
            },
            ...d.notifications,
          ],
        }));
      else await refresh();
      form.reset();
      notify("Session published" + (preview ? " in preview." : "."));
    });
  };
  const onPostStatus = (id, status) =>
    run(async () => {
      if (preview) {
        setData((d) => {
          const item =
            d.adminPosts.find((p) => p.id === id) ||
            d.posts.find((p) => p.id === id);
          const next = {
            ...item,
            status,
            published_at:
              status === "published" ? new Date().toISOString() : null,
          };
          return {
            ...d,
            adminPosts: d.adminPosts.map((p) => (p.id === id ? next : p)),
            notifications:
              item.status === status
                ? d.notifications
                : [
                    previewNotice(
                      item.title,
                      status === "published"
                        ? "A publication is now available in your feed."
                        : "LMR withdrew this publication from the feed.",
                      "post",
                      item.kind === "terminology" ? "free" : "members",
                    ),
                    ...d.notifications,
                  ],
            posts:
              status === "published"
                ? [next, ...d.posts.filter((p) => p.id !== id)]
                : d.posts.filter((p) => p.id !== id),
          };
        });
      } else {
        await checked(
          sb.rpc("circle_set_post_status", { post_id: id, new_status: status }),
        );
        await refresh();
      }
      notify(
        status === "published" ? "Post published." : "Post moved to drafts.",
      );
    });
  const onSessionStatus = (id, status) =>
    run(async () => {
      if (preview)
        setData((d) => ({
          ...d,
          sessions: d.sessions.map((s) => (s.id === id ? { ...s, status } : s)),
          notifications:
            d.sessions.find((s) => s.id === id)?.status === status
              ? d.notifications
              : [
                  previewNotice(
                    d.sessions.find((s) => s.id === id)?.title ||
                      "Live analysis",
                    `LMR session status: ${status}. Open the live room for details.`,
                    "live",
                  ),
                  ...d.notifications,
                ],
        }));
      else {
        await checked(
          sb.rpc("circle_set_session_status", {
            session_id: id,
            new_status: status,
          }),
        );
        await refresh();
      }
      notify("Session status updated.");
    });
  const onSessionBlock = (id, session_block) =>
    run(async () => {
      if (!validSessionBlock(session_block))
        throw new Error("Choose one of the four session groups.");
      if (preview)
        setData((d) => ({
          ...d,
          sessions: d.sessions.map((s) =>
            s.id === id ? { ...s, session_block } : s,
          ),
          notifications:
            d.sessions.find((s) => s.id === id)?.session_block === session_block
              ? d.notifications
              : [
                  previewNotice(
                    d.sessions.find((s) => s.id === id)?.title ||
                      "Live analysis",
                    "LMR updated the session group. Check the live room for details.",
                    "live",
                  ),
                  ...d.notifications,
                ],
        }));
      else {
        await checked(
          sb
            .from("circle_live_sessions")
            .update({ session_block })
            .eq("id", id)
            .select("id")
            .single(),
        );
        await refresh();
      }
      notify("Session group updated" + (preview ? " in preview." : "."));
    });
  const onAnnouncement = (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    run(async () => {
      const record = {
        title: String(f.get("title")).trim(),
        body: String(f.get("body")).trim(),
        category: String(f.get("category")),
        audience: String(f.get("audience") || "members"),
      };
      const item = preview
        ? {
            ...record,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          }
        : await checked(
            sb.from("circle_notifications").insert(record).select().single(),
          );
      setData((d) => ({ ...d, notifications: [item, ...d.notifications] }));
      form.reset();
      notify("Announcement published" + (preview ? " in preview." : "."));
    });
  };
  const answer = (e, id) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    run(async () => {
      const record = {
        answer: String(f.get("answer")).trim(),
        status: "answered",
      };
      if (!preview)
        await checked(
          sb
            .from("circle_questions")
            .update(record)
            .eq("id", id)
            .select("id")
            .single(),
        );
      setData((d) => ({
        ...d,
        questions: d.questions.map((q) =>
          q.id === id ? { ...q, ...record } : q,
        ),
      }));
      if (preview) setData(d => ({...d,notifications:[{...previewNotice("LMR replied to your question","Open Questions & answers to read the reply.","reply","free"),target_user_id:d.questions.find(q => q.id === id)?.user_id},...d.notifications]}));
      else await refresh();
      notify("Private reply saved. The member has been notified.");
    });
  };
  const replyMentorship = (e, id) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    run(async () => {
      const record = {
        admin_reply: String(f.get("admin_reply")).trim(),
        status: String(f.get("status")),
      };
      if (!preview)
        await checked(
          sb
            .from("circle_mentorship_requests")
            .update(record)
            .eq("id", id)
            .select("id")
            .single(),
        );
      setData((d) => ({
        ...d,
        mentorship: d.mentorship.map((r) =>
          r.id === id ? { ...r, ...record } : r,
        ),
      }));
      notify("Mentorship request updated.");
    });
  };
  return {
    onPublish,
    onJournalPublish,
    onCreateObservation,
    onSession,
    onPostStatus,
    onSessionStatus,
    onSessionBlock,
    onAnnouncement,
    answer,
    replyMentorship,
  };
}
