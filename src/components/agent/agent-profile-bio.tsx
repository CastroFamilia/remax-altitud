"use client";

import { useState } from "react";

interface AgentProfileBioProps {
  bio: string;
  maxLength?: number;
  readMoreLabel?: string;
  showLessLabel?: string;
}

export function AgentProfileBio({
  bio,
  maxLength = 200,
  readMoreLabel = "Ver más",
  showLessLabel = "Ver menos",
}: AgentProfileBioProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // If bio is within limit, render directly
  if (bio.length <= maxLength) {
    return (
      <p
        className="mt-3 whitespace-pre-line text-sm md:text-base leading-relaxed text-text-body"
        data-testid="agent-profile-bio"
      >
        {bio}
      </p>
    );
  }

  // Find last space before maxLength to avoid cutting words
  const cutoffIndex = bio.lastIndexOf(" ", maxLength);
  const truncated =
    cutoffIndex > 0 ? bio.slice(0, cutoffIndex).trim() : bio.slice(0, maxLength).trim();

  return (
    <div
      className="mt-3 text-sm md:text-base leading-relaxed text-text-body"
      data-testid="agent-profile-bio"
    >
      <span className="whitespace-pre-line">{isExpanded ? bio : `${truncated}...`}</span>{" "}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="inline-flex items-center font-semibold text-brand-navy hover:underline focus:outline-none cursor-pointer text-xs md:text-sm whitespace-nowrap"
      >
        {isExpanded ? showLessLabel : readMoreLabel}
      </button>
    </div>
  );
}

export default AgentProfileBio;
