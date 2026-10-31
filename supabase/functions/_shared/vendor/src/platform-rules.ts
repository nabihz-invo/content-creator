/**
 * Platform constraints for publishing packages (ADR-0008 §7), checked by the
 * API before a package is created and shown in the CRM. Values follow each
 * platform's published limits for feed posts (late 2026); keep them
 * conservative — a package that passes here must be postable by hand.
 */

export const PLATFORMS = [
  "instagram",
  "facebook",
  "linkedin",
  "x",
  "tiktok",
  "threads",
  "youtube",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export interface PlatformRule {
  label: string;
  /** Output types the platform accepts as a post. */
  outputs: ("png" | "carousel" | "mp4")[];
  /** Allowed width/height ratio range for images. */
  aspect: [number, number];
  maxItems: number;
  minCarouselItems: number;
  maxCaption: number;
  maxHashtags: number;
  maxImageBytes: number;
}

const MB = 1024 * 1024;

export const PLATFORM_RULES: Record<Platform, PlatformRule> = {
  instagram: {
    label: "Instagram",
    outputs: ["png", "carousel", "mp4"],
    aspect: [0.8, 1.91],
    maxItems: 20,
    minCarouselItems: 2,
    maxCaption: 2200,
    maxHashtags: 30,
    maxImageBytes: 8 * MB,
  },
  facebook: {
    label: "Facebook",
    outputs: ["png", "carousel", "mp4"],
    aspect: [0.5, 1.91],
    maxItems: 10,
    minCarouselItems: 2,
    maxCaption: 63206,
    maxHashtags: 30,
    maxImageBytes: 10 * MB,
  },
  linkedin: {
    label: "LinkedIn",
    outputs: ["png", "carousel", "mp4"],
    aspect: [0.5, 1.91],
    maxItems: 20,
    minCarouselItems: 2,
    maxCaption: 3000,
    maxHashtags: 30,
    maxImageBytes: 8 * MB,
  },
  x: {
    label: "X",
    outputs: ["png", "carousel", "mp4"],
    aspect: [0.5, 2],
    maxItems: 4,
    minCarouselItems: 2,
    maxCaption: 280,
    maxHashtags: 10,
    maxImageBytes: 5 * MB,
  },
  tiktok: {
    label: "TikTok",
    outputs: ["png", "carousel", "mp4"],
    aspect: [0.5, 1],
    maxItems: 35,
    minCarouselItems: 2,
    maxCaption: 4000,
    maxHashtags: 30,
    maxImageBytes: 20 * MB,
  },
  threads: {
    label: "Threads",
    outputs: ["png", "carousel", "mp4"],
    aspect: [0.5, 1.91],
    maxItems: 20,
    minCarouselItems: 2,
    maxCaption: 500,
    maxHashtags: 1,
    maxImageBytes: 8 * MB,
  },
  youtube: {
    label: "YouTube",
    outputs: ["mp4"],
    aspect: [0.5, 2],
    maxItems: 1,
    minCarouselItems: 1,
    maxCaption: 5000,
    maxHashtags: 15,
    maxImageBytes: 0,
  },
};

export interface PackageCheckInput {
  platform: string;
  output_type: "png" | "carousel" | "mp4";
  items: { width: number; height: number; mime_type: string; file_size?: number }[];
  caption: string;
  hashtags: string[];
  link?: string | null;
}

export type PackageIssue = {
  field: "platform" | "media" | "caption" | "hashtags" | "link";
  message: string;
};

/** Hashtags in the caption count towards the platform limit too. */
export function hashtagCount(caption: string, hashtags: string[]): number {
  const inCaption = caption.match(/(^|\s)#[\p{L}\p{N}_]+/gu)?.length ?? 0;
  return inCaption + hashtags.length;
}

export function checkPublishPackage(input: PackageCheckInput): PackageIssue[] {
  const rule = PLATFORM_RULES[input.platform as Platform];
  if (!rule) return [{ field: "platform", message: `unsupported platform ${input.platform}` }];
  const issues: PackageIssue[] = [];
  if (!rule.outputs.includes(input.output_type))
    issues.push({
      field: "media",
      message: `${rule.label} does not take ${input.output_type} posts`,
    });
  const n = input.items.length;
  if (input.output_type === "carousel" && (n < rule.minCarouselItems || n > rule.maxItems))
    issues.push({
      field: "media",
      message: `${rule.label} takes ${rule.minCarouselItems}–${rule.maxItems} images, this has ${n}`,
    });
  for (const [i, it] of input.items.entries()) {
    if (it.mime_type.startsWith("image/")) {
      const ratio = it.width / it.height;
      if (ratio < rule.aspect[0] - 0.005 || ratio > rule.aspect[1] + 0.005)
        issues.push({
          field: "media",
          message: `item ${i + 1} is ${it.width}×${it.height}; ${rule.label} takes ratios ${rule.aspect[0]}–${rule.aspect[1]}`,
        });
      if (it.file_size !== undefined && it.file_size > rule.maxImageBytes)
        issues.push({
          field: "media",
          message: `item ${i + 1} is larger than ${rule.label}'s ${rule.maxImageBytes / MB} MB limit`,
        });
    }
  }
  const caption = input.caption ?? "";
  const fullCaption = [caption, input.hashtags.join(" ")].filter(Boolean).join("\n\n");
  if ([...fullCaption].length > rule.maxCaption)
    issues.push({
      field: "caption",
      message: `caption with hashtags is ${[...fullCaption].length} characters; ${rule.label} allows ${rule.maxCaption}`,
    });
  if (hashtagCount(caption, input.hashtags) > rule.maxHashtags)
    issues.push({
      field: "hashtags",
      message: `${rule.label} allows at most ${rule.maxHashtags} hashtags`,
    });
  if (input.hashtags.some((h) => !/^#[\p{L}\p{N}_]+$/u.test(h)))
    issues.push({
      field: "hashtags",
      message: "hashtags must look like #word (letters, digits, _)",
    });
  if (input.link && !/^https:\/\/\S+$/.test(input.link))
    issues.push({ field: "link", message: "link must be an https URL" });
  return issues;
}
