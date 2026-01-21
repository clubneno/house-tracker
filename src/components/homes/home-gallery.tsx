'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HomeImage } from '@/lib/db/schema';

interface HomeGalleryProps {
  homeId: string;
  coverImageUrl: string | null;
  images: HomeImage[];
}

export function HomeGallery({ homeId, coverImageUrl, images }: HomeGalleryProps) {
  // Combine cover image with gallery images
  const allImages = [
    ...(coverImageUrl ? [{ id: 'cover', url: coverImageUrl, caption: null }] : []),
    ...images,
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  if (allImages.length === 0) {
    return (
      <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
        <Building2 className="h-16 w-16 text-muted-foreground" />
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const currentImage = allImages[currentIndex];

  return (
    <div className="relative">
      <div className="aspect-video relative overflow-hidden rounded-lg">
        <img
          src={currentImage.url}
          alt={currentImage.caption || 'Home image'}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {currentImage.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3">
            <p className="text-sm">{currentImage.caption}</p>
          </div>
        )}
      </div>

      {allImages.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {allImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
