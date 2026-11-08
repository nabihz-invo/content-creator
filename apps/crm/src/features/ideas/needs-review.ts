interface ReviewState {
  idea_comments: { status: "open" | "addressed" }[];
  review: { status: "approved" | "changes_requested" } | null;
}

/**
 * Does this pending idea need the owner? Not while a note is waiting for the agent (it comes back
 * once the note is answered), and not when a finished post was approved or sent back for changes
 * (a post stays `new` after its review; replacing its files clears the review and brings it back).
 */
export function needsReview(idea: ReviewState): boolean {
  return !idea.review && !idea.idea_comments.some((c) => c.status === "open");
}
