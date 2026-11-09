'use client';
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PostDetail from "@/components/post/PostDetail";

// Shareable page for one post, in the public chrome so links work for guests too.
const PostPage = ({ id }: { id: string }) => {
  const router = useRouter();
  const back = () => (window.history.length > 1 ? router.back() : router.push("/explore"));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 pb-20 pt-28">
        <button
          type="button"
          onClick={back}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-elevated">
          <PostDetail postId={id} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PostPage;
