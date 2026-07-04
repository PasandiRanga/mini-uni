// Lightweight client-side event bus so post lists (My Posts, Feed, Explore)
// reflect create/edit/delete instantly, without waiting for a server refetch.

/* eslint-disable @typescript-eslint/no-explicit-any */

export const POST_CHANGED = 'miniuni:post-changed';

export type PostChange =
  | { action: 'created'; post: any }
  | { action: 'updated'; post: any }
  | { action: 'deleted'; id: string };

export const emitPostChanged = (detail: PostChange) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<PostChange>(POST_CHANGED, { detail }));
  }
};

/** Apply an optimistic change to a list of posts (matched by id). */
export function applyPostChange<T extends { id: string }>(list: T[], change: PostChange): T[] {
  if (change.action === 'deleted') {
    return list.filter((p) => p.id !== change.id);
  }
  const post = change.post as T;
  const exists = list.some((p) => p.id === post.id);
  if (exists) {
    return list.map((p) => (p.id === post.id ? { ...p, ...post } : p));
  }
  // Newly created (or not yet in this list) — put it on top.
  return [post, ...list];
}

/** Subscribe to post changes; returns an unsubscribe function. */
export const onPostChanged = (handler: (change: PostChange) => void) => {
  const listener = (e: Event) => handler((e as CustomEvent<PostChange>).detail);
  window.addEventListener(POST_CHANGED, listener);
  return () => window.removeEventListener(POST_CHANGED, listener);
};
