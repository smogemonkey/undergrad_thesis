'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { apiFetch } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config';

interface GitHubSettings {
  webhookUrl: string;
  webhookSecret: string;
  autoScanEnabled: boolean;
  scanOnPush: boolean;
  scanOnPullRequest: boolean;
  scanOnRelease: boolean;
}

export default function GitHubSettingsPage() {
  const [settings, setSettings] = useState<GitHubSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch<GitHubSettings>(API_ENDPOINTS.GITHUB.SETTINGS);
      setSettings(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch GitHub settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await apiFetch(API_ENDPOINTS.GITHUB.SETTINGS, {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      toast({
        title: 'Success',
        description: 'GitHub settings saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save GitHub settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    if (!settings?.webhookUrl) return;
    
    navigator.clipboard.writeText(settings.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: 'Success',
      description: 'Webhook URL copied to clipboard',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center flex-col gap-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">Failed to load settings</p>
              <Button onClick={fetchSettings}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">GitHub Integration Settings</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="webhookUrl"
                    value={settings.webhookUrl}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyWebhookUrl}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Add this webhook URL to your GitHub repository settings
                </p>
              </div>

              <div>
                <Label htmlFor="webhookSecret">Webhook Secret</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  value={settings.webhookSecret}
                  onChange={(e) =>
                    setSettings({ ...settings, webhookSecret: e.target.value })
                  }
                />
                <p className="text-sm text-gray-500 mt-1">
                  Secret used to verify webhook payloads
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automated Scanning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoScan">Enable Automated Scanning</Label>
                  <p className="text-sm text-gray-500">
                    Automatically scan for vulnerabilities on GitHub events
                  </p>
                </div>
                <Switch
                  id="autoScan"
                  checked={settings.autoScanEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoScanEnabled: checked })
                  }
                />
              </div>

              <div className="space-y-4 pl-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="scanOnPush">Scan on Push</Label>
                    <p className="text-sm text-gray-500">
                      Scan when code is pushed to any branch
                    </p>
                  </div>
                  <Switch
                    id="scanOnPush"
                    checked={settings.scanOnPush}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, scanOnPush: checked })
                    }
                    disabled={!settings.autoScanEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="scanOnPullRequest">Scan on Pull Request</Label>
                    <p className="text-sm text-gray-500">
                      Scan when a pull request is opened or updated
                    </p>
                  </div>
                  <Switch
                    id="scanOnPullRequest"
                    checked={settings.scanOnPullRequest}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, scanOnPullRequest: checked })
                    }
                    disabled={!settings.autoScanEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="scanOnRelease">Scan on Release</Label>
                    <p className="text-sm text-gray-500">
                      Scan when a new release is published
                    </p>
                  </div>
                  <Switch
                    id="scanOnRelease"
                    checked={settings.scanOnRelease}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, scanOnRelease: checked })
                    }
                    disabled={!settings.autoScanEnabled}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}