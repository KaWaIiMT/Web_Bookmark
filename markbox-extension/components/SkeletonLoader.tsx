export function SkeletonLoader() {
  return (
    <div className="p-4 space-y-4">
      {/* Cover image placeholder */}
      <div className="aspect-[2.2/1] rounded-xl shimmer" />

      <div className="space-y-3">
        {/* Favicon + site name row */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-sm shimmer" />
          <div className="h-3 w-20 rounded-full shimmer" />
        </div>

        {/* Title */}
        <div className="h-5 w-3/4 rounded-md shimmer" />
        <div className="h-5 w-1/2 rounded-md shimmer" />

        {/* Summary */}
        <div className="h-3 w-full rounded-full shimmer" />
        <div className="h-3 w-5/6 rounded-full shimmer" />

        {/* Tags */}
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-14 rounded-full shimmer" />
          <div className="h-6 w-16 rounded-full shimmer" />
          <div className="h-6 w-10 rounded-full shimmer" />
        </div>

        {/* Button */}
        <div className="h-10 w-full rounded-xl shimmer mt-4" />
      </div>
    </div>
  );
}
