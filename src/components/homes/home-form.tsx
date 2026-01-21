'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { z } from 'zod';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n/client';
import { useHome } from '@/lib/contexts/home-context';
import type { Home } from '@/lib/db/schema';

const homeFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameLt: z.string().optional(),
  address: z.string().optional(),
  purchaseDate: z.string().optional(),
  coverImageUrl: z.string().optional(),
  description: z.string().optional(),
  descriptionLt: z.string().optional(),
});

type HomeFormData = z.infer<typeof homeFormSchema>;

interface HomeFormProps {
  home?: Home;
  onSuccess?: () => void;
}

export function HomeForm({ home, onSuccess }: HomeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(home?.coverImageUrl || null);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { refreshHomes } = useHome();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<HomeFormData>({
    resolver: zodResolver(homeFormSchema),
    defaultValues: {
      name: home?.name || '',
      nameLt: home?.nameLt || '',
      address: home?.address || '',
      purchaseDate: home?.purchaseDate || '',
      coverImageUrl: home?.coverImageUrl || '',
      description: home?.description || '',
      descriptionLt: home?.descriptionLt || '',
    },
  });

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    return imageCompression(file, options);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    try {
      // Compress image before upload
      const compressedFile = await compressImage(file);

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('fileType', 'photo');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setValue('coverImageUrl', data.fileUrl);
      setPreviewUrl(data.fileUrl);

      toast({
        title: t('common.success'),
        description: t('homes.coverImage') + ' uploaded',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      await uploadFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.heic'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isUploading,
  });

  const handleRemoveImage = () => {
    setValue('coverImageUrl', '');
    setPreviewUrl(null);
  };

  const onSubmit = async (data: HomeFormData) => {
    setIsLoading(true);

    try {
      const url = home ? `/api/homes/${home.id}` : '/api/homes';
      const method = home ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          coverImageUrl: data.coverImageUrl || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save home');
      }

      toast({
        title: home ? t('homes.homeUpdated') : t('homes.homeCreated'),
        description: home
          ? t('homes.homeUpdatedDescription')
          : t('homes.homeCreatedDescription'),
      });

      await refreshHomes();

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/homes');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving home:', error);
      toast({
        title: t('common.error'),
        description: t('homes.saveError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('homes.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t('homes.name')} *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder={t('homes.namePlaceholder')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameLt">{t('homes.nameLt')}</Label>
              <Input
                id="nameLt"
                {...register('nameLt')}
                placeholder={t('homes.nameLtPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t('homes.address')}</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder={t('homes.addressPlaceholder')}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">{t('homes.purchaseDate')}</Label>
              <Input
                id="purchaseDate"
                type="date"
                {...register('purchaseDate')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('homes.coverImage')}</Label>
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Cover preview"
                    className="h-32 w-full rounded-md border object-cover"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <div {...getRootProps()}>
                      <input {...getInputProps()} />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isUploading}
                      >
                        {t('homes.changeImage')}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveImage}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`h-32 w-full rounded-md border-2 border-dashed cursor-pointer transition-colors flex items-center justify-center ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary'
                  }`}
                >
                  <input {...getInputProps()} />
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : isDragActive ? (
                    <p className="text-sm text-primary">{t('homes.dropImageHere')}</p>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {t('homes.selectImage')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('homes.orDragAndDrop')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description">{t('homes.description')}</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder={t('homes.descriptionPlaceholder')}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionLt">{t('homes.descriptionLt')}</Label>
              <Textarea
                id="descriptionLt"
                {...register('descriptionLt')}
                placeholder={t('homes.descriptionLtPlaceholder')}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading || isUploading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {home ? t('common.save') : t('homes.createHome')}
        </Button>
      </div>
    </form>
  );
}
