// lib/forum-api.ts — Typed client for /api/community-forum
import { api } from "@/lib/api-client";

export type ForumChannel = {
  channel_id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  visibility: "public" | "kyc_only" | "vertical_priv_only" | "admin_only";
  write_min_plan: "basic" | "pro" | "premium" | "admin";
  is_archived: boolean;
  post_count: number;
  last_post_at: string | null;
  unread: number;
  muted: boolean;
  can_post: boolean;
  can_react: boolean;
};

export type ForumCapabilities = {
  join: boolean;
  read: boolean;
  post: boolean;
  react: boolean;
  vip_threads: boolean;
  create_poll?: boolean;
  vote_poll?: boolean;
};

export type ForumGate = {
  can_reply: boolean;
  can_react: boolean;
  can_vote_poll: boolean;
};

export type ForumAuthor = {
  user_id: string;
  business_name: string;
  plan: string;
  verified: boolean;
  is_admin: boolean;
  avatar_url?: string | null;
};

export type ForumPost = {
  post_id: string;
  channel_id: string;
  author_user_id: string;
  author: ForumAuthor;
  title: string;
  body: string;
  tags: string[];
  type: "post" | "poll" | "system_alert";
  is_pinned: boolean;
  is_locked: boolean;
  is_hidden: boolean;
  reply_count: number;
  reaction_counts: Record<string, number>;
  view_count: number;
  last_reply_at: string;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
};

export type ForumReply = {
  reply_id: string;
  post_id: string;
  channel_id: string;
  author_user_id: string;
  author: ForumAuthor;
  body: string;
  parent_reply_id: string | null;
  is_hidden: boolean;
  reaction_counts: Record<string, number>;
  created_at: string;
  edited_at: string | null;
};

export type ForumPoll = {
  poll_id: string;
  post_id: string;
  question: string;
  options: { option_id: string; text: string; vote_count: number }[];
  multi_choice: boolean;
  closes_at: string;
  is_closed: boolean;
  total_voters: number;
  my_vote?: string[] | null;
};

export type ForumMention = {
  mention_id: string;
  from_user_id: string;
  to_user_id: string;
  post_id: string | null;
  reply_id: string | null;
  read: boolean;
  reason?: string;
  created_at: string;
};

export const EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "🙏"] as const;

// ── channels ──────────────────────────────────────────────────────────
export const listChannels = () =>
  api<{
    channels: ForumChannel[];
    access_level: "none" | "read_only" | "full" | "vip";
    capabilities: ForumCapabilities;
    plan: string;
    plan_matrix: Record<string, string>;
  }>("/community-forum/channels");

export const myCapabilities = () =>
  api<{
    plan: string;
    access_level: "none" | "read_only" | "full" | "vip";
    capabilities: ForumCapabilities;
    plan_matrix: Record<string, string>;
  }>("/community-forum/me/capabilities");

export const muteChannel = (id: string) =>
  api<{ ok: true }>(`/community-forum/channels/${id}/mute`, { method: "POST" });

export const unmuteChannel = (id: string) =>
  api<{ ok: true }>(`/community-forum/channels/${id}/unmute`, { method: "POST" });

export const markChannelRead = (id: string) =>
  api<{ ok: true }>(`/community-forum/channels/${id}/mark-read`, { method: "POST" });

// ── posts ─────────────────────────────────────────────────────────────
export const listPosts = (channelId: string, params: {
  limit?: number; cursor?: string; tag?: string; author?: string;
} = {}) => {
  const q = new URLSearchParams();
  if (params.limit) q.set("limit", String(params.limit));
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.tag) q.set("tag", params.tag);
  if (params.author) q.set("author", params.author);
  return api<{ posts: ForumPost[]; next_cursor: string | null; count: number }>(
    `/community-forum/channels/${channelId}/posts?${q.toString()}`,
  );
};

export const getPost = (postId: string) =>
  api<{
    post: ForumPost;
    poll: ForumPoll | null;
    channel: ForumChannel;
    gate: ForumGate;
  }>(`/community-forum/posts/${postId}`);

export const createPost = (
  channelId: string,
  body: {
    title: string;
    body: string;
    tags?: string[];
    type?: "post" | "poll";
    poll?: { question: string; options: string[]; multi_choice: boolean; duration_days: number };
  },
) =>
  api<{ ok: true; post: ForumPost; poll: ForumPoll | null }>(
    `/community-forum/channels/${channelId}/posts`,
    { method: "POST", body },
  );

export const editPost = (
  postId: string,
  body: { title?: string; body?: string; tags?: string[] },
) =>
  api<{ ok: true }>(`/community-forum/posts/${postId}`, { method: "PATCH", body });

export const deletePost = (postId: string) =>
  api<{ ok: true }>(`/community-forum/posts/${postId}`, { method: "DELETE" });

// ── replies ──────────────────────────────────────────────────────────
export const listReplies = (postId: string, cursor?: string) => {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return api<{ replies: ForumReply[]; next_cursor: string | null; count: number }>(
    `/community-forum/posts/${postId}/replies${q}`,
  );
};

export const createReply = (
  postId: string,
  body: { body: string; parent_reply_id?: string },
) =>
  api<{ ok: true; reply: ForumReply }>(
    `/community-forum/posts/${postId}/replies`,
    { method: "POST", body },
  );

export const editReply = (replyId: string, body: { body: string }) =>
  api<{ ok: true }>(`/community-forum/replies/${replyId}`, { method: "PATCH", body });

export const deleteReply = (replyId: string) =>
  api<{ ok: true }>(`/community-forum/replies/${replyId}`, { method: "DELETE" });

// ── reactions ─────────────────────────────────────────────────────────
export const react = (
  targetType: "post" | "reply",
  targetId: string,
  emoji: string,
) =>
  api<{ ok: true; reacted: boolean }>(
    `/community-forum/${targetType}/${targetId}/react`,
    { method: "POST", body: { emoji } },
  );

// ── polls ─────────────────────────────────────────────────────────────
export const votePoll = (pollId: string, optionIds: string[]) =>
  api<{ ok: true; poll: ForumPoll; my_vote: string[] }>(
    `/community-forum/polls/${pollId}/vote`,
    { method: "POST", body: { option_ids: optionIds } },
  );

export const closePoll = (pollId: string) =>
  api<{ ok: true }>(`/community-forum/polls/${pollId}/close`, { method: "POST" });

// ── search ────────────────────────────────────────────────────────────
export const searchPosts = (q: string, channel?: string, tag?: string) => {
  const params = new URLSearchParams({ q });
  if (channel) params.set("channel", channel);
  if (tag) params.set("tag", tag);
  return api<{ results: ForumPost[]; count: number; query: string }>(
    `/community-forum/search?${params.toString()}`,
  );
};

// ── mentions ──────────────────────────────────────────────────────────
export const listMentions = (unread?: boolean) => {
  const q = unread ? "?unread=true" : "";
  return api<{ mentions: ForumMention[]; unread: number }>(`/community-forum/mentions${q}`);
};

export const readMention = (id: string) =>
  api<{ ok: true }>(`/community-forum/mentions/${id}/read`, { method: "POST" });

export const readAllMentions = () =>
  api<{ ok: true; updated: number }>("/community-forum/mentions/read-all", { method: "POST" });

export const unreadSummary = () =>
  api<{ mentions: number }>("/community-forum/unread");

// ── user state ────────────────────────────────────────────────────────
export const getMyState = () =>
  api<{
    user_id: string;
    muted_channels: string[];
    muted_by_admin_until: string | null;
    notification_prefs: {
      push_mentions: boolean;
      push_replies_to_my_posts: boolean;
      email_digest_weekly: boolean;
      email_digest_daily: boolean;
      email_digest_monthly?: boolean;
      email_digest_frequency?: "off" | "weekly" | "monthly";
    };
  }>("/community-forum/me/state");

export const patchMyState = (body: {
  muted_channels?: string[];
  notification_prefs?: Record<string, any>;
}) =>
  api<{ ok: true }>("/community-forum/me/state", { method: "PATCH", body });

// ── admin ─────────────────────────────────────────────────────────────
export const adminPin   = (postId: string, reason?: string) =>
  api(`/admin/community-forum/posts/${postId}/pin`, { method: "POST", body: { reason } });
export const adminUnpin = (postId: string, reason?: string) =>
  api(`/admin/community-forum/posts/${postId}/unpin`, { method: "POST", body: { reason } });
export const adminLock  = (postId: string, reason?: string) =>
  api(`/admin/community-forum/posts/${postId}/lock`, { method: "POST", body: { reason } });
export const adminUnlock = (postId: string, reason?: string) =>
  api(`/admin/community-forum/posts/${postId}/unlock`, { method: "POST", body: { reason } });
export const adminHide  = (postId: string, reason?: string) =>
  api(`/admin/community-forum/posts/${postId}/hide`, { method: "POST", body: { reason } });
export const adminUnhide = (postId: string) =>
  api(`/admin/community-forum/posts/${postId}/unhide`, { method: "POST", body: { reason: "" } });
export const adminHideReply = (replyId: string, reason?: string) =>
  api(`/admin/community-forum/replies/${replyId}/hide`, { method: "POST", body: { reason } });
export const adminMuteUser = (userId: string, durationSec: number, reason?: string) =>
  api(`/admin/community-forum/users/${userId}/mute`, { method: "POST", body: { duration_seconds: durationSec, reason } });
export const adminUnmuteUser = (userId: string) =>
  api(`/admin/community-forum/users/${userId}/unmute`, { method: "POST", body: { reason: "" } });
export const adminAudit = (params: { limit?: number; action?: string; admin_id?: string } = {}) => {
  const q = new URLSearchParams();
  if (params.limit) q.set("limit", String(params.limit));
  if (params.action) q.set("action", params.action);
  if (params.admin_id) q.set("admin_id", params.admin_id);
  return api<{ items: any[]; count: number }>(`/admin/community-forum/audit?${q.toString()}`);
};
