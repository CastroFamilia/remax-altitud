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
  const [imgSrc, setImgSrc] = useState<string>(typeof src === "string" ? src : fallbackSrc);

  // Sync state if src changes dynamically
  useEffect(() => {
    if (typeof src === "string") {
      setImgSrc(src);
    }
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
}
