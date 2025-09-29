'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Share2, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';
import { generateSocialPost } from '@/lib/social-media';
import { generateSocialCaption } from '@/lib/ai-features';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  images?: string[];
}

interface SocialMediaSettings {
  autoPostNewVehicles: boolean;
  platforms: {
    twitter: boolean;
    facebook: boolean;
    instagram: boolean;
    linkedin: boolean;
  };
  postingSchedule: string; // e.g., "09:00,14:00,18:00"
}

export default function SocialMediaManager() {
  const [settings, setSettings] = useState<SocialMediaSettings>({
    autoPostNewVehicles: false,
    platforms: {
      twitter: false,
      facebook: false,
      instagram: false,
      linkedin: false,
    },
    postingSchedule: '09:00,14:00,18:00',
  });

  const [recentVehicles, setRecentVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [customPost, setCustomPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Load settings and recent vehicles
    loadSettings();
    loadRecentVehicles();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/social-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load social settings:', error);
    }
  };

  const loadRecentVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles?limit=5&sort=created_desc');
      if (response.ok) {
        const data = await response.json();
        setRecentVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error('Failed to load recent vehicles:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/admin/social-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Error saving settings');
    }
  };

  const postToSocialMedia = async (vehicle: Vehicle, platforms: string[]) => {
    try {
      setIsGenerating(true);

      for (const platform of platforms) {
        const content = customPost || await generateSocialCaption(vehicle, platform);

        const response = await fetch('/api/admin/social-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform,
            content,
            vehicleId: vehicle.id,
            imageUrl: vehicle.images?.[0], // First image
          }),
        });

        if (!response.ok) {
          console.error(`Failed to post to ${platform}`);
        }
      }

      alert('Posted to selected platforms!');
      setCustomPost('');
      setSelectedVehicle(null);
    } catch (error) {
      console.error('Failed to post:', error);
      alert('Error posting to social media');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePreview = async () => {
    if (!selectedVehicle) return;

    setIsGenerating(true);
    try {
      const preview = await generateSocialCaption(selectedVehicle, 'twitter');
      setCustomPost(preview);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Social Media Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-post"
              checked={settings.autoPostNewVehicles}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, autoPostNewVehicles: checked }))
              }
            />
            <Label htmlFor="auto-post">Auto-post new vehicles</Label>
          </div>

          <div>
            <Label className="text-sm font-medium">Posting Schedule</Label>
            <Input
              value={settings.postingSchedule}
              onChange={(e) => setSettings(prev => ({ ...prev, postingSchedule: e.target.value }))}
              placeholder="09:00,14:00,18:00"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Comma-separated times (24-hour format) for optimal posting
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Active Platforms</Label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(settings.platforms).map(([platform, enabled]) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Switch
                    id={platform}
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        platforms: { ...prev.platforms, [platform]: checked }
                      }))
                    }
                  />
                  <Label htmlFor={platform} className="capitalize flex items-center gap-1">
                    {platform === 'twitter' && <Twitter className="h-4 w-4" />}
                    {platform === 'facebook' && <Facebook className="h-4 w-4" />}
                    {platform === 'instagram' && <Instagram className="h-4 w-4" />}
                    {platform === 'linkedin' && <Linkedin className="h-4 w-4" />}
                    {platform}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={saveSettings} className="w-full">
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Social Posting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Vehicle</Label>
            <select
              className="w-full mt-1 p-2 border rounded"
              value={selectedVehicle?.id || ''}
              onChange={(e) => {
                const vehicle = recentVehicles.find(v => v.id === e.target.value);
                setSelectedVehicle(vehicle || null);
              }}
            >
              <option value="">Choose a vehicle...</option>
              {recentVehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model} - ${vehicle.price?.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {selectedVehicle && (
            <div className="space-y-4">
              <div>
                <Label>Post Content (leave empty for AI-generated)</Label>
                <Textarea
                  value={customPost}
                  onChange={(e) => setCustomPost(e.target.value)}
                  placeholder="Custom post content..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={generatePreview}
                  disabled={isGenerating}
                  variant="outline"
                >
                  {isGenerating ? 'Generating...' : 'Generate AI Preview'}
                </Button>

                <Button
                  onClick={() => postToSocialMedia(selectedVehicle, ['twitter', 'facebook'])}
                  disabled={isGenerating}
                >
                  Post Now
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <Twitter className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Posted about 2024 Toyota Camry</span>
              </div>
              <Badge variant="secondary">Success</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <Facebook className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Scheduled post for 2024 Honda Civic</span>
              </div>
              <Badge variant="outline">Pending</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
