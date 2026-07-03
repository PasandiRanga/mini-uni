'use client';

import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import CreatePostModal from '@/components/post/CreatePostModal';

interface CreatePostModalContextType {
  /**
   * Open the create-post modal. Pass a post id to edit an existing post, and
   * optionally the already-loaded post object to prefill instantly (no fetch).
   */
  openCreatePost: (editId?: string | null, initialPost?: unknown) => void;
  closeCreatePost: () => void;
}

const CreatePostModalContext = createContext<CreatePostModalContextType | undefined>(undefined);

export const CreatePostModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [initialPost, setInitialPost] = useState<unknown>(null);

  const openCreatePost = useCallback((id?: string | null, post?: unknown) => {
    setEditId(id ?? null);
    setInitialPost(post ?? null);
    setOpen(true);
  }, []);

  const closeCreatePost = useCallback(() => setOpen(false), []);

  const handleSuccess = useCallback(() => {
    // Let any open lists (My posts, feed, etc.) know they should refetch.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('miniuni:post-changed'));
    }
    router.refresh();
  }, [router]);

  return (
    <CreatePostModalContext.Provider value={{ openCreatePost, closeCreatePost }}>
      {children}
      <CreatePostModal open={open} onOpenChange={setOpen} editId={editId} initialPost={initialPost} onSuccess={handleSuccess} />
    </CreatePostModalContext.Provider>
  );
};

export const useCreatePostModal = (): CreatePostModalContextType => {
  const ctx = useContext(CreatePostModalContext);
  if (!ctx) throw new Error('useCreatePostModal must be used within a CreatePostModalProvider');
  return ctx;
};
