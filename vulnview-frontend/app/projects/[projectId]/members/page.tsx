"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/navbar";

const API_BASE_URL = "http://localhost:8080";

interface Member {
  id: number;
  username: string;
  email: string;
  role: string;
}

export default function ProjectMembersPage({ params }: { params: { projectId: string } }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ email: "", role: "MEMBER" });
  const [adding, setAdding] = useState(false);
  const { getAuthHeaders, user } = useAuth();
  const { toast } = useToast();

  // Fetch all members
  useEffect(() => {
    async function fetchMembers() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/projects/${params.projectId}/members`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch members");
        const data = await res.json();
        setMembers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
    // eslint-disable-next-line
  }, [params.projectId]);

  // Check if current user is a project admin
  const isProjectAdmin = members.some(m => m.email === user?.email && (m.role === "ADMIN" || m.role === "OWNER"));

  // Add member
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/projects/${params.projectId}/members`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) throw new Error("Failed to add member");
      toast({ title: "Member added", description: `User ${addForm.email} added as ${addForm.role}` });
      setAddForm({ email: "", role: "MEMBER" });
      // Refresh member list
      const data = await res.json();
      setMembers(prev => [...prev, data]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  }

  // Change member role
  async function handleRoleChange(memberId: number, newRole: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/projects/${params.projectId}/members/${memberId}/role`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      toast({ title: "Role updated", description: `Member role changed to ${newRole}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  // Remove member
  async function handleRemove(memberId: number) {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/projects/${params.projectId}/members/${memberId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to remove member");
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast({ title: "Member removed" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-black">
      <Navbar />
      <div className="container mx-auto py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Project Members</h1>
        {isProjectAdmin && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Add Member</h2>
              <form className="flex flex-col md:flex-row gap-4 items-center" onSubmit={handleAdd}>
                <Input required type="email" placeholder="User Email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
                <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} className="border rounded p-2">
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <Button type="submit" disabled={adding}>{adding ? "Adding..." : "Add"}</Button>
              </form>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">All Members</h2>
            {loading ? <div>Loading members...</div> : error ? <div className="text-red-500">{error}</div> : (
              <table className="w-full text-left border">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Username</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Role</th>
                    {isProjectAdmin && <th className="p-2">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} className="border-b">
                      <td className="p-2">{m.username}</td>
                      <td className="p-2">{m.email}</td>
                      <td className="p-2">
                        <Badge variant={m.role === "ADMIN" || m.role === "OWNER" ? "default" : m.role === "VIEWER" ? "secondary" : "outline"} className="mr-2">
                          {m.role.charAt(0) + m.role.slice(1).toLowerCase()}
                        </Badge>
                        {isProjectAdmin && m.role !== "OWNER" && (
                          <select
                            value={m.role}
                            onChange={e => handleRoleChange(m.id, e.target.value)}
                            className="border rounded p-1"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="MEMBER">Member</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        )}
                      </td>
                      {isProjectAdmin && m.role !== "OWNER" && (
                        <td className="p-2">
                          <Button variant="destructive" size="sm" onClick={() => handleRemove(m.id)}>Remove</Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 