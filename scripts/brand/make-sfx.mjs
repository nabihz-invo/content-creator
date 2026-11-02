#!/usr/bin/env node
/**
 * UI sound pack for a studio brand (P5-T13), generated once with ElevenLabs Sound Effects.
 *
 *   node scripts/brand/make-sfx.mjs --out <kit>/assets/audio/sfx [--only pop,ding] [--ffmpeg PATH]
 *
 * Only the small UI sounds the engine's components play (the studio sfx allowlist).
 * Transitions stay silent: cuts are music-driven, so no whoosh/riser/impact is made.
 * Each file is trimmed of leading/trailing silence and peak-normalised to −6 dBFS, so
 * the render mixer can sit them under the voice without one sound jumping out.
 * An existing file is moved to <out>/raw/synth/ first (raw/ is never synced).
 * Env: ELEVENLABS_API_KEY (workers/.env is read when it is not set).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const opt = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i < 0 ? d : argv[i + 1];
};

// name → [prompt, seconds]. Short, soft, modern product UI; never cartoonish.
export const SFX = {
  pop: ["soft subtle UI pop, a small card appearing in a modern app, clean, no reverb", 0.5],
  typing: ["quiet laptop keyboard typing, a short burst of five keystrokes, soft and close", 1.2],
  ding: ["gentle bright notification ding, single soft bell tone, modern app", 0.8],
  check: ["soft positive confirmation chime, two quick rising notes, modern app success", 0.7],
  tick: ["tiny crisp UI tick, a counter number changing, very short and quiet", 0.5],
  click: ["soft mouse click on a trackpad, single, clean and close", 0.5],
  notification: ["smartphone message notification, short soft two-tone, modern and calm", 0.9],
  send: ["message sent sound, short soft upward swipe, modern chat app", 0.6],
  scan: ["barcode scanner beep, single short soft electronic beep", 0.5],
  marker: ["whiteboard marker drawing a short quick line, close and dry", 0.8],
  paper: ["single sheet of paper being picked up, soft rustle, close", 0.7],
  shutter: ["smartphone camera shutter, single soft click", 0.5],
};

function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  const here = dirname(fileURLToPath(import.meta.url));
  const f = join(here, "..", "..", "workers", ".env");
  if (existsSync(f)) {
    const m = /^\s*ELEVENLABS_API_KEY\s*=\s*"?([^"\r\n]+?)"?\s*$/m.exec(readFileSync(f, "utf8"));
    if (m) return m[1];
  }
  throw new Error("ELEVENLABS_API_KEY is not set");
}

async function generate(key, prompt, seconds) {
  const r = await fetch(
    "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128",
    {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({ text: prompt, duration_seconds: seconds, prompt_influence: 0.6 }),
    },
  );
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return Buffer.from(await r.arrayBuffer());
}

/** Peak level in dBFS (ffmpeg volumedetect writes to stderr). */
function peakDb(ffmpeg, file) {
  const r = spawnSync(
    ffmpeg,
    ["-hide_banner", "-i", file, "-af", "volumedetect", "-f", "null", "-"],
    {
      encoding: "utf8",
    },
  );
  const m = /max_volume:\s*(-?[\d.]+) dB/.exec(r.stderr ?? "");
  if (!m) throw new Error(`could not measure ${file}`);
  return Number(m[1]);
}

function finish(ffmpeg, raw, dest) {
  // Trim silence (40 dB under the clip's own peak) at both ends, then a 10 ms fade-out
  // so the cut never clicks.
  const floor = `${(peakDb(ffmpeg, raw) - 40).toFixed(1)}dB`;
  const trim =
    `silenceremove=start_periods=1:start_threshold=${floor}:start_silence=0.01,` +
    `areverse,silenceremove=start_periods=1:start_threshold=${floor}:start_silence=0.03,` +
    "afade=t=in:d=0.01,areverse";
  const tmp = `${dest}.trim.wav`;
  execFileSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-i", raw, "-af", trim, tmp]);
  const peak = peakDb(ffmpeg, tmp);
  execFileSync(ffmpeg, [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    tmp,
    "-af",
    `volume=${(-6 - peak).toFixed(2)}dB`,
    "-ac",
    "2",
    "-ar",
    "44100",
    "-c:a",
    "libmp3lame",
    "-b:a",
    "128k",
    dest,
  ]);
  rmSync(tmp);
  return peak;
}

const out = opt("out");
if (!out) {
  console.error("usage: make-sfx.mjs --out <assets>/audio/sfx [--only a,b] [--ffmpeg PATH]");
  process.exit(2);
}
const ffmpeg = opt("ffmpeg", process.env.FFMPEG_PATH ?? "ffmpeg");
const only = opt("only")?.split(",");
const key = apiKey();
mkdirSync(join(out, "raw", "synth"), { recursive: true });

for (const [name, [prompt, seconds]] of Object.entries(SFX)) {
  if (only && !only.includes(name)) continue;
  const dest = join(out, `${name}.mp3`);
  const keep = join(out, "raw", "synth", `${name}.mp3`);
  if (existsSync(dest) && !existsSync(keep)) renameSync(dest, keep);
  const raw = join(out, "raw", `${name}.elevenlabs.mp3`);
  writeFileSync(raw, await generate(key, prompt, seconds));
  const peak = finish(ffmpeg, raw, dest);
  console.log(`${name.padEnd(13)} ${seconds}s  peak ${peak} dB → −6 dB`);
}
