'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2, Loader2, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface PostActionsPost {
  id: string;
  title?: string;
  subject?: string;
  user?: { id?: string };
  likeCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; role: string };
}

const MAX_COMMENT_LENGTH = 1000;

/**
 * Like, comment and share controls for a post card. Likes update instantly
 * and roll back if the server refuses; guests are sent to sign in.
 */
interface PostActionsProps {
  post: PostActionsPost;
  /** Replaces the comments dialog, e.g. scrolling to comments shown inline. */
  onCommentsClick?: () => void;
  /** Comment count kept in step by an inline thread. */
  commentCountOverride?: number;
}

const PostActions = ({ post, onCommentsClick, commentCountOverride }: PostActionsProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isGuest = !user;

  const [liked, setLiked] = useState(Boolean(post.likedByMe));
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [commentsOpen, setCommentsOpen] = useState(false);

  // Lists refetch posts; keep the counts in step with the latest data.
  useEffect(() => {
    setLiked(Boolean(post.likedByMe));
    setLikeCount(post.likeCount ?? 0);
    setCommentCount(post.commentCount ?? 0);
  }, [post.likedByMe, post.likeCount, post.commentCount]);

  const requireSignIn = (action: string) => {
    toast({ title: "Sign in to continue", description: `Log in or create an account to ${action}.` });
    router.push("/auth");
  };

  const toggleLike = async () => {
    if (isGuest) return requireSignIn("like posts");
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't update like");
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch (err: unknown) {
      setLiked(!next);
      setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
      toast({ title: "Couldn't update like", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    const title = post.title || post.subject || "A class on MiniUni";
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Share it with anyone." });
    } catch {
      /* the share sheet was dismissed */
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 gap-1.5 px-2 ${liked ? "text-destructive hover:text-destructive" : "text-muted-foreground"}`}
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          {likeCount > 0 && <span className="text-xs tabular-nums">{likeCount}</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-muted-foreground"
          onClick={() => (onCommentsClick ? onCommentsClick() : setCommentsOpen(true))}
          aria-label="Comments"
        >
          <MessageCircle className="h-4 w-4" />
          {(commentCountOverride ?? commentCount) > 0 && <span className="text-xs tabular-nums">{commentCountOverride ?? commentCount}</span>}
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground" onClick={share} aria-label="Share">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {!onCommentsClick && (
        <CommentsDialog
          post={post}
          open={commentsOpen}
          onOpenChange={setCommentsOpen}
          onCountChange={setCommentCount}
          onRequireSignIn={() => requireSignIn("comment")}
        />
      )}
    </>
  );
};

interface CommentThreadProps {
  post: PostActionsPost;
  /** Load only while true (e.g. when a dialog opens). */
  active?: boolean;
  onCountChange: (count: number) => void;
  onRequireSignIn: () => void;
  /** Classes for the scrolling list, e.g. a max height inside a dialog. */
  listClassName?: string;
}

/** A post's comments with a box to add one. Used in the dialog and on the post page. */
export const CommentThread = ({ post, active = true, onCountChange, onRequireSignIn, listClassName = "" }: CommentThreadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!active) return;
    let live = true;
    setLoading(true);
    fetch(`/api/posts/${post.id}/comments`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: CommentItem[]) => {
        if (!live) return;
        setComments(list);
        onCountChange(list.length);
      })
      .catch(() => {})
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [active, post.id, onCountChange]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return onRequireSignIn();
    const content = draft.trim();
    if (!content) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't post comment");
      setComments((list) => {
        const next = [...list, data];
        onCountChange(next.length);
        return next;
      });
      setDraft("");
    } catch (err: unknown) {
      toast({ title: "Couldn't post comment", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const remove = async (commentId: string) => {
    try {
      const res = await fetch(`/api/posts/${post.id}/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn't delete comment");
      setComments((list) => {
        const next = list.filter((c) => c.id !== commentId);
        onCountChange(next.length);
        return next;
      });
    } catch (err: unknown) {
      toast({ title: "Couldn't delete", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    }
  };

  const canDelete = (c: CommentItem) =>
    Boolean(user) && (c.user.id === user?.id || post.user?.id === user?.id || user?.role === "ADMIN");

  return (
    <>
      <div className={`-mx-1 min-h-[120px] flex-1 space-y-4 overflow-y-auto px-1 ${listClassName}`}>
        {loading && comments.length === 0 ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="group flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {(c.user.firstName?.[0] || "?").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{`${c.user.firstName} ${c.user.lastName}`.trim()}</span>
                  {c.user.id === post.user?.id && (
                    <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Author</span>
                  )}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </span>
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground/90">{c.content}</p>
              </div>
              {canDelete(c) && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="shrink-0 self-start text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus:opacity-100 group-hover:opacity-100"
                  aria-label="Delete comment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} className="flex items-end gap-2 border-t border-border/60 pt-4">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
          placeholder={user ? "Write a comment…" : "Sign in to comment"}
          rows={2}
          className="min-h-0 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button type="submit" variant="hero" size="icon" disabled={posting || (Boolean(user) && !draft.trim())} aria-label="Post comment">
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </>
  );
};

interface CommentsDialogProps {
  post: PostActionsPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCountChange: (count: number) => void;
  onRequireSignIn: () => void;
}

const CommentsDialog = ({ post, open, onOpenChange, onCountChange, onRequireSignIn }: CommentsDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex max-h-[85vh] max-w-lg flex-col">
      <DialogHeader>
        <DialogTitle>Comments</DialogTitle>
        <DialogDescription className="truncate">{post.title || post.subject}</DialogDescription>
      </DialogHeader>
      <CommentThread post={post} active={open} onCountChange={onCountChange} onRequireSignIn={onRequireSignIn} />
    </DialogContent>
  </Dialog>
);

export default PostActions;
