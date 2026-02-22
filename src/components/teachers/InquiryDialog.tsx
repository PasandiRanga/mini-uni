import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface InquiryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    teacherId: string;
    teacherName: string;
    posts: any[];
}

export const InquiryDialog: React.FC<InquiryDialogProps> = ({ isOpen, onClose, teacherId, teacherName, posts }) => {
    const [selectedPostId, setSelectedPostId] = useState("");
    const [selectedSlotId, setSelectedSlotId] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { token } = useAuth();
    const { toast } = useToast();

    const selectedPost = posts.find(p => p.id === selectedPostId);

    const handleSubmit = async () => {
        if (!selectedPostId || !message) {
            toast({ title: "Validation Error", description: "Please select a post and enter a message.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
            const res = await fetch(`${baseUrl}/api/inquiries`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    postId: selectedPostId,
                    message,
                    timeSlotId: selectedSlotId || undefined
                })
            });

            if (res.ok) {
                toast({ title: "Inquiry Sent", description: "Your message has been sent to the teacher." });
                onClose();
                setMessage("");
                setSelectedPostId("");
                setSelectedSlotId("");
            } else {
                throw new Error("Failed to send inquiry");
            }
        } catch (err) {
            toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Contact {teacherName}</DialogTitle>
                    <DialogDescription>
                        Select a class and send an inquiry or request a slot.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="post">Select Class/Post</Label>
                        <select
                            id="post"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedPostId}
                            onChange={(e) => {
                                setSelectedPostId(e.target.value);
                                setSelectedSlotId("");
                            }}
                        >
                            <option value="">-- Choose a post --</option>
                            {posts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                    </div>

                    {selectedPost?.timeSlots?.length > 0 && (
                        <div className="grid gap-2">
                            <Label htmlFor="slot">Available Slots</Label>
                            <select
                                id="slot"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedSlotId}
                                onChange={(e) => setSelectedSlotId(e.target.value)}
                            >
                                <option value="">-- Optional: Select a slot --</option>
                                {selectedPost.timeSlots.map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                        {new Date(s.startTime).toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="message">Your Message</Label>
                        <Textarea
                            id="message"
                            placeholder="Hi, I'm interested in this class..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Send Inquiry"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
