"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Trash2, Eye, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";

interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  memberCount: number;
}

interface ProjectListProps {
  projects: Project[];
  onDelete: (projectId: number) => void;
  onProjectCreated: () => void;
}

export interface ProjectListRef {
  showCreateDialog: () => void;
}

export const ProjectList = forwardRef<ProjectListRef, ProjectListProps>(
  ({ projects, onDelete, onProjectCreated }, ref) => {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [newProjectDescription, setNewProjectDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();

    useImperativeHandle(ref, () => ({
      showCreateDialog: () => setShowCreateDialog(true),
    }));

    const handleCreateProject = async () => {
      if (!newProjectName.trim()) {
        toast({
          title: "Error",
          description: "Please enter a project name",
          variant: "destructive",
        });
        return;
      }

      setIsCreating(true);
      try {
        await apiFetch<Project>(API_ENDPOINTS.PROJECTS.LIST, {
          method: "POST",
          body: JSON.stringify({
            name: newProjectName,
            description: newProjectDescription,
          }),
        });

        toast({
          title: "Success",
          description: "Project created successfully.",
        });

        setShowCreateDialog(false);
        setNewProjectName("");
        setNewProjectDescription("");
        onProjectCreated();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create project",
          variant: "destructive",
        });
      } finally {
        setIsCreating(false);
      }
    };

      return (
      <>
        {projects.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">No projects found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Get started by creating a new project.
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
            Create Your First Project
          </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Members: {project.memberCount}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  <div className="flex gap-2">
                    <Link href={`/projects/${project.id}/settings`}>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this project? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(project.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Enter the details for your new project. You can connect GitHub repositories after creation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectDescription">Description</Label>
                  <Input
                    id="projectDescription"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Enter project description"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateProject}
                  disabled={isCreating || !newProjectName.trim()}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
      </>
    );
  }
);

ProjectList.displayName = "ProjectList";