"use client";

import { useState, useEffect } from "react";
import Image, { type ImageProps } from "next/image";

interface PropertyImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
}

export function PropertyImage({
  src,
  alt,
  fallbackSrc = "/property-placeholder.svg",
  ...props
}: PropertyImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(
    typeof src === "string" ? src : "/property-placeholder.svg",
  );
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  // Sync state if src changes dynamically
  useEffect(() => {
    if (typeof src === "string") {
      setImgSrc(src);
      setFallbackAttempted(false);
    } else {
      setImgSrc("/property-placeholder.svg");
      setFallbackAttempted(false);
    }
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      unoptimized={props.unoptimized || fallbackAttempted}
      onError={() => {
        if (!fallbackAttempted && fallbackSrc && fallbackSrc !== "/property-placeholder.svg") {
          setImgSrc(fallbackSrc);
          setFallbackAttempted(true);
        } else {
          setImgSrc("/property-placeholder.svg");
        }
      }}
    />
  );
}
