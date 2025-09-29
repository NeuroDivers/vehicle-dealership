'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Languages,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Mail,
  Target
} from 'lucide-react';
import {
  generateVehicleDescription,
  translateText,
  generateSocialCaption,
  describeVehicleImage,
  generateLeadFollowUp,
  analyzeLeadQuality
} from '@/lib/ai-features';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  odometer: number;
  bodyType: string;
  color: string;
  description?: string;
  images?: string[];
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  vehicleInterest: string;
  source: string;
  createdAt: string;
}

export default function AIFeaturesManager() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});

  // Description Generation
  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: '',
    price: '',
    odometer: '',
    bodyType: '',
    color: '',
  });

  // Translation
  const [translationText, setTranslationText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('fr');

  // Social Caption
  const [captionVehicle, setCaptionVehicle] = useState(vehicleData);
  const [captionPlatform, setCaptionPlatform] = useState('twitter');

  // Image Analysis
  const [imageUrl, setImageUrl] = useState('');

  // Lead Follow-up
  const [leadData, setLeadData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    vehicleInterest: '',
  });
  const [followUpVehicle, setFollowUpVehicle] = useState(vehicleData);

  const generateDescription = async () => {
    setLoading(true);
    try {
      const vehicle = {
        ...vehicleData,
        year: parseInt(vehicleData.year),
        price: parseInt(vehicleData.price),
        odometer: parseInt(vehicleData.odometer),
      };

      const description = await generateVehicleDescription(vehicle);
      setResults(prev => ({ ...prev, description }));
    } catch (error) {
      console.error('Failed to generate description:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslation = async () => {
    setLoading(true);
    try {
      const translated = await translateText(translationText, targetLanguage);
      setResults(prev => ({ ...prev, translation: translated }));
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCaption = async () => {
    setLoading(true);
    try {
      const vehicle = {
        ...captionVehicle,
        year: parseInt(captionVehicle.year),
        price: parseInt(captionVehicle.price),
      };

      const caption = await generateSocialCaption(vehicle, captionPlatform);
      setResults(prev => ({ ...prev, caption }));
    } catch (error) {
      console.error('Failed to generate caption:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeImage = async () => {
    setLoading(true);
    try {
      const description = await describeVehicleImage(imageUrl);
      setResults(prev => ({ ...prev, imageAnalysis: description }));
    } catch (error) {
      console.error('Image analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFollowUp = async () => {
    setLoading(true);
    try {
      const lead = { ...leadData, daysAgo: 2 };
      const vehicle = {
        ...followUpVehicle,
        year: parseInt(followUpVehicle.year),
        price: parseInt(followUpVehicle.price),
      };

      const email = await generateLeadFollowUp(lead, vehicle);
      setResults(prev => ({ ...prev, followUp: email }));
    } catch (error) {
      console.error('Follow-up generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeLead = async () => {
    setLoading(true);
    try {
      const lead = {
        ...leadData,
        source: 'website',
        createdAt: new Date().toISOString(),
      };

      const analysis = await analyzeLeadQuality(lead);
      setResults(prev => ({ ...prev, leadAnalysis: analysis }));
    } catch (error) {
      console.error('Lead analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-6 w-6 text-purple-600" />
        <h1 className="text-2xl font-bold">AI Features Manager</h1>
      </div>

      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="description" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Descriptions
          </TabsTrigger>
          <TabsTrigger value="translation" className="flex items-center gap-1">
            <Languages className="h-4 w-4" />
            Translate
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            Social
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-1">
            <ImageIcon className="h-4 w-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Vehicle Descriptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Make</Label>
                  <Input
                    value={vehicleData.make}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, make: e.target.value }))}
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input
                    value={vehicleData.model}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="Camry"
                  />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input
                    value={vehicleData.year}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, year: e.target.value }))}
                    placeholder="2024"
                  />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input
                    value={vehicleData.price}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="25000"
                  />
                </div>
              </div>

              <Button onClick={generateDescription} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Description'}
              </Button>

              {results.description && (
                <div className="mt-4">
                  <Label>Generated Description</Label>
                  <Textarea
                    value={results.description}
                    readOnly
                    rows={6}
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="translation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Translation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Text to Translate</Label>
                <Textarea
                  value={translationText}
                  onChange={(e) => setTranslationText(e.target.value)}
                  placeholder="Enter text to translate..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Target Language</Label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleTranslation} disabled={loading}>
                {loading ? 'Translating...' : 'Translate'}
              </Button>

              {results.translation && (
                <div className="mt-4">
                  <Label>Translated Text</Label>
                  <Textarea
                    value={results.translation}
                    readOnly
                    rows={4}
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Social Media Captions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Make</Label>
                  <Input
                    value={captionVehicle.make}
                    onChange={(e) => setCaptionVehicle(prev => ({ ...prev, make: e.target.value }))}
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input
                    value={captionVehicle.model}
                    onChange={(e) => setCaptionVehicle(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="Camry"
                  />
                </div>
              </div>

              <div>
                <Label>Platform</Label>
                <Select value={captionPlatform} onValueChange={setCaptionPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={generateCaption} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Caption'}
              </Button>

              {results.caption && (
                <div className="mt-4">
                  <Label>Generated Caption</Label>
                  <Textarea
                    value={results.caption}
                    readOnly
                    rows={4}
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Image Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Image URL</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/vehicle-image.jpg"
                />
              </div>

              <Button onClick={analyzeImage} disabled={loading}>
                {loading ? 'Analyzing...' : 'Analyze Image'}
              </Button>

              {results.imageAnalysis && (
                <div className="mt-4">
                  <Label>Image Analysis</Label>
                  <Textarea
                    value={results.imageAnalysis}
                    readOnly
                    rows={4}
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Lead Follow-up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lead Name</Label>
                  <Input
                    value={leadData.name}
                    onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Vehicle Interest</Label>
                  <Input
                    value={leadData.vehicleInterest}
                    onChange={(e) => setLeadData(prev => ({ ...prev, vehicleInterest: e.target.value }))}
                    placeholder="2024 Toyota Camry"
                  />
                </div>
              </div>

              <div>
                <Label>Lead Message</Label>
                <Textarea
                  value={leadData.message}
                  onChange={(e) => setLeadData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="I'm interested in this vehicle..."
                  rows={3}
                />
              </div>

              <Button onClick={generateFollowUp} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Follow-up Email'}
              </Button>

              {results.followUp && (
                <div className="mt-4">
                  <Label>Generated Follow-up Email</Label>
                  <Textarea
                    value={results.followUp}
                    readOnly
                    rows={8}
                    className="mt-1 font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Lead Quality Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lead Name</Label>
                  <Input
                    value={leadData.name}
                    onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={leadData.email}
                    onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <Button onClick={analyzeLead} disabled={loading}>
                {loading ? 'Analyzing...' : 'Analyze Lead Quality'}
              </Button>

              {results.leadAnalysis && (
                <div className="mt-4 space-y-4">
                  <div>
                    <Label>Quality Score</Label>
                    <Badge
                      variant={
                        results.leadAnalysis.quality === 'high' ? 'default' :
                        results.leadAnalysis.quality === 'medium' ? 'secondary' : 'destructive'
                      }
                      className="ml-2"
                    >
                      {results.leadAnalysis.quality.toUpperCase()}
                    </Badge>
                  </div>

                  <div>
                    <Label>Analysis</Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                      <p><strong>Reasons:</strong> {results.leadAnalysis.reasons?.join(', ') || 'Analysis in progress'}</p>
                      <p className="mt-2"><strong>Recommendations:</strong> {results.leadAnalysis.recommendations?.join(', ') || 'Standard follow-up'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
