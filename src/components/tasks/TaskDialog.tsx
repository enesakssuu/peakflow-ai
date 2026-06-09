// ============================================================
// PeakFlow AI — Task Dialog (Create/Edit)
// ============================================================

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Zap, Image as ImageIcon, Trash2, Paperclip } from 'lucide-react';
import type { Task } from '@/types';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSave: (data: { 
    title: string; 
    estimatedDuration: number; 
    impactScore: number;
    description?: string;
    imageUrl?: string;
  }) => void;
}

const durations = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
];

export default function TaskDialog({ open, onOpenChange, task, onSave }: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [duration, setDuration] = useState(30);
  const [impact, setImpact] = useState(3);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setImageUrl(task.imageUrl || '');
      setDuration(task.estimatedDuration);
      setImpact(task.impactScore);
    } else {
      setTitle('');
      setDescription('');
      setImageUrl('');
      setDuration(30);
      setImpact(3);
    }
  }, [task, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.7 quality to keep base64 extremely small
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setImageUrl(dataUrl);
        setUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl,
      estimatedDuration: Math.max(1, duration),
      impactScore: impact,
    });
    onOpenChange(false);
  };

  const impactLabels: Record<number, string> = {
    1: 'Low',
    2: 'Medium-Low',
    3: 'Medium',
    4: 'High',
    5: 'Critical',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update your task details.' : 'What do you need to get done?'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              placeholder="e.g., Write blog post about AI productivity"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="h-11"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              placeholder="Add details, bullet points, or instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Image Uploader */}
          <div className="space-y-2.5">
            <Label>Attachment Image</Label>
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-border/80 bg-secondary/20 p-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={imageUrl} alt="Attachment" className="w-16 h-12 rounded-lg object-cover border border-border" />
                  <span className="text-xs text-muted-foreground font-medium truncate max-w-[200px]">Attached Image</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeImage}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="task-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-dashed hover:border-accent hover:bg-accent/5 flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => document.getElementById('task-image')?.click()}
                  disabled={uploading}
                >
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  {uploading ? 'Compressing...' : 'Add Image'}
                </Button>
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <Label className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Estimated Duration
              </span>
              <span className="text-xs text-accent font-semibold">
                {duration > 0 ? `${duration} min` : 'Not set'}
              </span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {durations.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                    duration === d.value
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-border hover:border-accent/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-4 border-t border-border/40 pt-2.5">
              <span className="text-xs font-medium text-muted-foreground">Or set custom minutes:</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={480}
                  value={duration || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setDuration(0);
                    } else {
                      const num = parseInt(val);
                      setDuration(isNaN(num) ? 0 : num);
                    }
                  }}
                  className="w-24 h-9 text-sm text-center font-medium"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </div>
          </div>

          {/* Impact Score */}
          <div className="space-y-3">
            <Label className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                Impact Score
              </span>
              <span className="text-xs text-accent font-medium">
                {impact}/5 — {impactLabels[impact]}
              </span>
            </Label>
            <Slider
              value={[impact]}
              onValueChange={(val) => setImpact(val[0])}
              min={1}
              max={5}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              <span>Low</span>
              <span>Critical</span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={!title.trim() || uploading}>
              {task ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
