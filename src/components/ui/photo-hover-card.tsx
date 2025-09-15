import React from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface PhotoHoverCardProps {
  photoUrl: string | null;
  altText: string;
  fallbackText: string;
  children: React.ReactNode;
}

export function PhotoHoverCard({ 
  photoUrl, 
  altText, 
  fallbackText, 
  children 
}: PhotoHoverCardProps) {
  const [imageLoading, setImageLoading] = React.useState(true);
  const [imageError, setImageError] = React.useState(false);

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-auto p-4 bg-card border border-border shadow-lg"
        side="top"
        align="center"
      >
        <div className="flex flex-col items-center space-y-2">
          <div className="relative">
            {imageLoading && photoUrl && (
              <Skeleton className="w-48 h-48 rounded-full absolute inset-0 z-10" />
            )}
            <Avatar className="w-48 h-48 border-2 border-border">
              <AvatarImage
                src={photoUrl || undefined}
                alt={altText}
                className="object-cover object-[center_20%]"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
              <AvatarFallback className="text-lg font-semibold bg-muted text-muted-foreground">
                {fallbackText}
              </AvatarFallback>
            </Avatar>
          </div>
          <p className="text-sm font-medium text-foreground text-center max-w-[200px] truncate">
            {altText}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}