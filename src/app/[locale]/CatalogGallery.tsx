/** Photo strip for the catalogue detail pages: one lead image, the rest beside it. */
export interface CatalogGalleryProps {
  photos: string[];
  alt: string;
  /** Shown when nothing has been uploaded yet. */
  fallback?: string;
}

export function CatalogGallery({ photos, alt, fallback = '/kost_room_1.jpg' }: CatalogGalleryProps) {
  const lead = photos[0] ?? fallback;
  const rest = photos.slice(1, 5);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div
        className={`overflow-hidden rounded-[1.5rem] border border-border/50 ${
          rest.length > 0 ? 'sm:col-span-2' : 'sm:col-span-3'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lead} alt={alt} className="h-64 w-full object-cover sm:h-96" />
      </div>

      {rest.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
          {rest.map((photo, index) => (
            <div key={photo} className="overflow-hidden rounded-[1.25rem] border border-border/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={`${alt} — foto ${index + 2}`}
                className="h-32 w-full object-cover sm:h-[7.3rem]"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
