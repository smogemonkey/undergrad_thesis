'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Download, FileText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { isAuthenticated } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

interface Project {
  id: string;
  name: string;
}

interface Report {
  id: string;
  name: string;
  createdAt: string;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED';
  downloadUrl?: string;
}

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchProjects();
    fetchReports();
  }, [router]);

  const fetchProjects = async () => {
    try {
      const data = await apiFetch<Project[]>(API_ENDPOINTS.PROJECTS.LIST);
      setProjects(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch projects',
        variant: 'destructive',
      });
    }
  };

  const fetchReports = async () => {
    try {
      const data = await apiFetch<Report[]>(API_ENDPOINTS.REPORTS.LIST);
      setReports(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch reports',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedProject) {
      toast({
        title: 'Error',
        description: 'Please select a project',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const data = await apiFetch<Report>(API_ENDPOINTS.REPORTS.GENERATE, {
        method: 'POST',
        body: JSON.stringify({
          projectId: selectedProject,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        }),
      });
      
      setReports((prev) => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Report generation started',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.REPORTS.DOWNLOAD(reportId), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vulnerability-report-${reportId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download report',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Generate Reports</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <DatePicker
                selected={startDate}
                onSelect={setStartDate}
                placeholder="Start date"
              />
            </div>
            <div>
              <DatePicker
                selected={endDate}
                onSelect={setEndDate}
                placeholder="End date"
              />
            </div>
          </div>
          <Button
            className="mt-4"
            onClick={handleGenerateReport}
            disabled={generating || !selectedProject}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{report.name}</h3>
                  <p className="text-sm text-gray-500">
                    Generated on {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      report.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : report.status === 'PROCESSING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {report.status.charAt(0) + report.status.slice(1).toLowerCase()}
                  </span>
                  {report.status === 'COMPLETED' && report.downloadUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(report.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No reports generated yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}