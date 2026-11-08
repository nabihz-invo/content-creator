# Prompts for Claude Code

Open Claude Code in the `content/` folder. Static posts use the `stacko-post-design` skill; reels and motion carousels use `stacko-content-studio`.

## Make a post like a reference

```
I put <file> in references/. Make a post like it using our skill and brand: EN first, then AR.
Show me the previews.
```

## Build posts from the plan

```
Build <ID>, <ID> from plans/Stacko_Content_Studio.xlsx (or: the posts I describe below).
Load the stacko-post-design skill. Build each in posts/<month or unscheduled>/<ID>_<slug>/source/, render previews,
check them against the QA list, and show me the previews. If a post needs an image we don't have, give me the prompts.
```

## Review feedback

```
Feedback on <ID>: <your comments>.
Apply it, re-render the preview, and if it's a rule for future posts too, add it to the standing rules in the skill.
```

## Images are ready

```
I added <ASSET-ID>.jpg to assets/post-images/final/ (originals in raw/).
Mark them received in the register and finish the posts that were waiting for them.
```

## Approve and send to the CRM

```
<ID>, <ID> are approved.
Render the final PNGs (en/, ar/) and the editable HTML (html/), update the register,
and add them to the content CRM (create the projects if they don't exist, then import the finished files).
```

## Reels (motion engine)

```
Build <ID> from plans/Stacko_Content_Studio.xlsx with the stacko-content-studio skill.
Render --preview --lang all first and show me both contact sheets.
```
