'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, Save, GripVertical, Eye, EyeOff,
  Palette, Type, Globe, Settings2, LayoutGrid, ExternalLink,
  Upload, X, Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WebsiteSection {
  id: string;
  section_type: string;
  title: string;
  subtitle: string | null;
  content: Record<string, unknown> | null;
  is_visible: boolean;
  sort_order: number;
}

interface BrandingData {
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  tagline: string | null;
  meta_description: string | null;
  social_links: Record<string, string> | null;
  booking_rules: Record<string, unknown> | null;
}

export default function SiteBuilderPage() {
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('sections');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sectionsRes, brandingRes] = await Promise.all([
        fetch('/api/admin/sections').then(r => r.json()),
        fetch('/api/admin/branding').then(r => r.json()),
      ]);
      if (sectionsRes.success) setSections(sectionsRes.data);
      if (brandingRes.success) setBranding(brandingRes.data);
    } catch {
      toast.error('Failed to load site builder data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSection = async (sectionId: string, isVisible: boolean) => {
    try {
      const res = await fetch('/api/admin/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sectionId, is_visible: !isVisible }),
      });
      const data = await res.json();
      if (data.success) {
        setSections(prev =>
          prev.map(s => s.id === sectionId ? { ...s, is_visible: !isVisible } : s)
        );
        toast.success(`Section ${!isVisible ? 'shown' : 'hidden'}`);
      }
    } catch {
      toast.error('Failed to update section');
    }
  };

  const updateSectionContent = async (sectionId: string, updates: Partial<WebsiteSection>) => {
    try {
      const res = await fetch('/api/admin/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sectionId, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        setSections(prev =>
          prev.map(s => s.id === sectionId ? { ...s, ...updates } : s)
        );
        toast.success('Section updated');
      }
    } catch {
      toast.error('Failed to update section');
    }
  };

  const saveBranding = async () => {
    if (!branding) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Branding saved');
      } else {
        toast.error('Failed to save branding');
      }
    } catch {
      toast.error('Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);

    try {
      await fetch('/api/admin/sections/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: newSections.map(s => s.id) }),
      });
    } catch {
      toast.error('Failed to reorder');
      fetchData();
    }
  };

  // Image upload helper
  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) return data.data.url;
      toast.error(data.error || 'Upload failed');
      return null;
    } catch {
      toast.error('Upload failed');
      return null;
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!branding) return;
    const url = await uploadImage(file, 'branding');
    if (url) {
      setBranding({ ...branding, logo_url: url });
      toast.success('Logo uploaded — click Save to apply');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-forest-500/35" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-forest-700">Site Builder</h1>
          <p className="text-sm text-forest-500/45 mt-1">Customize your resort website appearance and content</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Preview Site
          </a>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="sections" className="text-xs">
            <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Sections
          </TabsTrigger>
          <TabsTrigger value="branding" className="text-xs">
            <Palette className="w-3.5 h-3.5 mr-1" /> Branding
          </TabsTrigger>
          <TabsTrigger value="typography" className="text-xs">
            <Type className="w-3.5 h-3.5 mr-1" /> Typography
          </TabsTrigger>
          <TabsTrigger value="seo" className="text-xs">
            <Globe className="w-3.5 h-3.5 mr-1" /> SEO
          </TabsTrigger>
        </TabsList>

        {/* SECTIONS TAB */}
        <TabsContent value="sections" className="space-y-3 mt-4">
          <p className="text-sm text-forest-500/45">Reorder sections, toggle visibility, or edit their content and images.</p>
          {sections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              index={index}
              total={sections.length}
              onToggle={() => toggleSection(section.id, section.is_visible)}
              onMove={(dir) => moveSection(index, dir)}
              onSave={(updates) => updateSectionContent(section.id, updates)}
              onUploadImage={uploadImage}
            />
          ))}
        </TabsContent>

        {/* BRANDING TAB */}
        <TabsContent value="branding" className="space-y-4 mt-4">
          {branding && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Color Palette
                  </CardTitle>
                  <CardDescription>Set your resort brand colors</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Primary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        value={branding.primary_color}
                        onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={branding.primary_color}
                        onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        value={branding.secondary_color}
                        onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={branding.secondary_color}
                        onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Accent Color</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        value={branding.accent_color}
                        onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={branding.accent_color}
                        onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Resort Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Resort Name</Label>
                    <Input
                      value={branding.name}
                      onChange={(e) => setBranding({ ...branding, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Tagline</Label>
                    <Input
                      value={branding.tagline || ''}
                      onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                      placeholder="A short tagline for your resort"
                      className="mt-1"
                    />
                  </div>

                  {/* Logo upload */}
                  <div>
                    <Label>Logo</Label>
                    <div className="mt-2">
                      {branding.logo_url ? (
                        <div className="relative inline-block">
                          <img
                            src={branding.logo_url}
                            alt="Resort logo"
                            className="h-20 w-auto rounded-lg border border-forest-100/30 object-contain bg-white p-2"
                          />
                          <button
                            onClick={() => setBranding({ ...branding, logo_url: null })}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <ImageDropzone
                          onDrop={(file) => handleLogoUpload(file)}
                          label="Drop logo image or click to browse"
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={saveBranding} disabled={saving} className="bg-forest-500 hover:bg-forest-600">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Branding
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* TYPOGRAPHY TAB */}
        <TabsContent value="typography" className="space-y-4 mt-4">
          {branding && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Type className="w-4 h-4" /> Font Settings
                </CardTitle>
                <CardDescription>Choose fonts for your resort website</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Heading Font</Label>
                  <Input
                    value={branding.font_heading}
                    onChange={(e) => setBranding({ ...branding, font_heading: e.target.value })}
                    className="mt-1"
                    placeholder="Playfair Display"
                  />
                  <p className="text-xs text-forest-500/35 mt-1">Used for section titles and headings</p>
                </div>
                <div>
                  <Label>Body Font</Label>
                  <Input
                    value={branding.font_body}
                    onChange={(e) => setBranding({ ...branding, font_body: e.target.value })}
                    className="mt-1"
                    placeholder="Inter"
                  />
                  <p className="text-xs text-forest-500/35 mt-1">Used for paragraphs and content text</p>
                </div>
              </CardContent>
            </Card>
          )}
          {branding && (
            <div className="flex justify-end">
              <Button onClick={saveBranding} disabled={saving} className="bg-forest-500 hover:bg-forest-600">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Typography
              </Button>
            </div>
          )}
        </TabsContent>

        {/* SEO TAB */}
        <TabsContent value="seo" className="space-y-4 mt-4">
          {branding && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Search Engine Optimization
                  </CardTitle>
                  <CardDescription>Help search engines find your resort</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Meta Description</Label>
                    <Textarea
                      value={branding.meta_description || ''}
                      onChange={(e) => setBranding({ ...branding, meta_description: e.target.value })}
                      placeholder="A short description that appears in search results..."
                      className="mt-1"
                      rows={3}
                    />
                    <p className="text-xs text-forest-500/35 mt-1">
                      {(branding.meta_description || '').length}/160 characters
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Social Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {['facebook', 'instagram', 'tiktok'].map((platform) => (
                    <div key={platform}>
                      <Label className="capitalize">{platform}</Label>
                      <Input
                        value={(branding.social_links as Record<string, string>)?.[platform] || ''}
                        onChange={(e) =>
                          setBranding({
                            ...branding,
                            social_links: { ...(branding.social_links || {}), [platform]: e.target.value },
                          })
                        }
                        placeholder={`https://${platform}.com/...`}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={saveBranding} disabled={saving} className="bg-forest-500 hover:bg-forest-600">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save SEO Settings
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Image Dropzone Component ---
function ImageDropzone({ onDrop, label }: { onDrop: (file: File) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setUploading(true);
    await onDrop(file);
    setUploading(false);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
        dragOver ? 'border-forest-400 bg-forest-50' : 'border-forest-200 hover:border-forest-300'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-forest-500" />
          <p className="text-sm text-forest-500/45">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-6 h-6 text-forest-500/35" />
          <p className="text-sm text-forest-500/45">{label || 'Drop image here or click to browse'}</p>
          <p className="text-xs text-forest-500/35">JPEG, PNG, WebP, GIF — Max 5MB</p>
        </div>
      )}
    </div>
  );
}

// --- Section Card Component ---
function SectionCard({
  section,
  index,
  total,
  onToggle,
  onMove,
  onSave,
  onUploadImage,
}: {
  section: WebsiteSection;
  index: number;
  total: number;
  onToggle: () => void;
  onMove: (dir: 'up' | 'down') => void;
  onSave: (updates: Partial<WebsiteSection>) => void;
  onUploadImage: (file: File, folder: string) => Promise<string | null>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle || '');
  const [images, setImages] = useState<string[]>(
    (section.content?.images as string[]) || []
  );
  const [heroImage, setHeroImage] = useState<string>(
    (section.content?.hero_image as string) || ''
  );

  const handleSave = () => {
    const contentUpdates: Record<string, unknown> = { ...section.content };
    if (section.section_type === 'hero') {
      contentUpdates.hero_image = heroImage;
    }
    if (['gallery', 'accommodations', 'activities'].includes(section.section_type)) {
      contentUpdates.images = images;
    }
    onSave({ title, subtitle: subtitle || null, content: contentUpdates });
    setEditing(false);
  };

  const handleImageUpload = async (file: File) => {
    const url = await onUploadImage(file, `sections/${section.section_type}`);
    if (url) {
      if (section.section_type === 'hero') {
        setHeroImage(url);
      } else {
        setImages(prev => [...prev, url]);
      }
      toast.success('Image uploaded');
    }
  };

  const removeImage = (urlToRemove: string) => {
    setImages(prev => prev.filter(u => u !== urlToRemove));
  };

  return (
    <Card className={!section.is_visible ? 'opacity-60' : ''}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col gap-0.5 pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={index === 0}
              onClick={() => onMove('up')}
            >
              ▲
            </Button>
            <GripVertical className="w-4 h-4 text-forest-500/25 mx-auto" />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={index === total - 1}
              onClick={() => onMove('down')}
            >
              ▼
            </Button>
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Section title"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Subtitle</Label>
                  <Input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Section subtitle (optional)"
                    className="text-sm"
                  />
                </div>

                {/* Hero image upload */}
                {section.section_type === 'hero' && (
                  <div>
                    <Label className="text-xs">Hero Image</Label>
                    {heroImage ? (
                      <div className="relative mt-1 inline-block">
                        <img
                          src={heroImage}
                          alt="Hero"
                          className="h-32 w-auto rounded-lg border object-cover"
                        />
                        <button
                          onClick={() => setHeroImage('')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <ImageDropzone onDrop={handleImageUpload} label="Drop hero image here" />
                      </div>
                    )}
                  </div>
                )}

                {/* Gallery images */}
                {['gallery', 'accommodations', 'activities'].includes(section.section_type) && (
                  <div>
                    <Label className="text-xs">Images</Label>
                    <div className="grid grid-cols-4 gap-2 mt-1">
                      {images.map((url, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={url}
                            alt={`Image ${i + 1}`}
                            className="w-full h-20 object-cover rounded-lg border"
                          />
                          <button
                            onClick={() => removeImage(url)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <div className="w-full h-20">
                        <ImageDropzone onDrop={handleImageUpload} label="+" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} className="bg-forest-500 hover:bg-forest-600">
                    <Save className="w-3 h-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="cursor-pointer" onClick={() => setEditing(true)}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {section.section_type}
                  </Badge>
                  <h3 className="font-medium text-forest-700 truncate">{section.title}</h3>
                  {/* Show image count */}
                  {((section.content?.images as string[])?.length > 0 || (section.content?.hero_image as string)) && (
                    <span className="text-xs text-forest-500/35 flex items-center gap-0.5">
                      <ImageIcon className="w-3 h-3" />
                      {section.section_type === 'hero'
                        ? '1 image'
                        : `${((section.content?.images as string[]) || []).length} images`}
                    </span>
                  )}
                </div>
                {section.subtitle && (
                  <p className="text-sm text-forest-500/45 mt-0.5 truncate">{section.subtitle}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Switch
              checked={section.is_visible}
              onCheckedChange={onToggle}
            />
            {section.is_visible ? (
              <Eye className="w-4 h-4 text-forest-500" />
            ) : (
              <EyeOff className="w-4 h-4 text-forest-500/35" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
