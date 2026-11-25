"use client";

import { useState, useEffect } from "react";
import Image, { type ImageProps } from "next/image";
import { AGENT_PLACEHOLDER_SRC } from "@/lib/utils/agent-photo";

interface AgentAvatarProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
}

/**
 * Client wrapper around next/image for agent avatars.
 * Falls back to `fallbackSrc` and then `/images/agent-placeholder.svg` if the
 * primary image fails to load (e.g. 403 Cloudflare challenge or 404).
 */
export function AgentAvatar({
  src,
  alt,
  fallbackSrc = AGENT_PLACEHOLDER_SRC,
  ...props
}: AgentAvatarProps) {
  const initialSrc = typeof src === "string" && src.length > 0 ? src : AGENT_PLACEHOLDER_SRC;
  const [imgSrc, setImgSrc] = useState<string>(initialSrc);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  useEffect(() => {
    setImgSrc(typeof src === "string" && src.length > 0 ? src : AGENT_PLACEHOLDER_SRC);
    setFallbackAttempted(false);
  }, [src]);

  return (
    <Image
      key={imgSrc}
      {...props}
      src={imgSrc}
      alt={alt}
      unoptimized={props.unoptimized || imgSrc === AGENT_PLACEHOLDER_SRC || undefined}
      onError={() => {
        if (!fallbackAttempted && fallbackSrc && fallbackSrc !== AGENT_PLACEHOLDER_SRC) {
          setImgSrc(fallbackSrc);
          setFallbackAttempted(true);
        } else {
          setImgSrc(AGENT_PLACEHOLDER_SRC);
        }
      }}
    />
  );
}
