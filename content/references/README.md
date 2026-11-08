# References

Drop example images here (posts you like from other brands, Pinterest, competitors, your own Gemini drafts), then ask Claude:

> Make a post like `references/<file>` using our skill and brand.

Claude reads the image, names the layout idea behind it, maps it to one of the archetypes in the `stacko-post-design` skill and rebuilds it with Stacko's palette, fonts, frame, logo and footer. It does **not** copy the reference's brand, logo, text, people or product screens; product visuals come only from `assets/screens/`. If the post needs a photo, Claude writes an image prompt for you instead of reusing the reference.

Tips
- Name files so they're easy to point at: `2026-11-07_zoho-alerts.jpg`, `ref-poll-light.png`.
- Add a line of what you like about it in the chat ("the big number layout", "the split screen").
- These images are inspiration only. They are never placed in a post and are not synced to the CRM.
