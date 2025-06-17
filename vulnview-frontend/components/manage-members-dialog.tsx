"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { Loader2, Trash2, UserPlus } from "lucide-react";

interface Member {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface ManageMembersDialogProps {
  projectId: string;
}

export function ManageMembersDialog({ projectId }: ManageMembersDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const { toast } = useToast();

  const fetchMembers = async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      // NOTE: API endpoint is a placeholder and needs to be created in the backend.
      const data = await apiFetch<Member[]>(`/api/v1/projects/${projectId}/members`);
      setMembers(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch project members.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [isOpen]);

  const handleAddMember = async () => {
    if (!newMemberEmail) {
        toast({ title: "Email is required", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
        // NOTE: API endpoint is a placeholder and needs to be created in the backend.
      await apiFetch(`/api/v1/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ email: newMemberEmail, role: "Viewer" }), // Default role
      });
      toast({ title: "Success", description: "Member added successfully." });
      setNewMemberEmail("");
      fetchMembers(); // Refresh list
    } catch (error) {
      toast({
        title: "Error",
        description: (error as any)?.message || "Failed to add member.",
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    setIsLoading(true);
    try {
      // NOTE: API endpoint is a placeholder and needs to be created in the backend.
      await apiFetch(`/api/v1/projects/${projectId}/members/${memberId}`, {
        method: "DELETE",
      });
      toast({ title: "Success", description: "Member removed successfully." });
      fetchMembers(); // Refresh list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member.",
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Manage Members
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Project Members</DialogTitle>
          <DialogDescription>
            Add or remove members from this project.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input 
                    placeholder="Enter user's email" 
                    value={newMemberEmail} 
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                />
                <Button onClick={handleAddMember} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </Button>
            </div>
            <div className="space-y-2">
                <h4 className="font-medium">Current Members</h4>
                {isLoading && members.length === 0 ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : members.length > 0 ? (
                    members.map(member => (
                        <div key={member.id} className="flex justify-between items-center p-2 border rounded">
                            <div>
                                <p className="font-semibold">{member.username}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.id)} disabled={isLoading}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">No members found.</p>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 