/** MP4 checks from `ffmpeg -i` (ffprobe is not always installed): size, duration, fps, codecs, audio. */
import { spawnSync } from "node:child_process";

export interface Mp4Info {
  durationS: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string | null;
}

export function probeMp4(ffmpeg: string, file: string): Mp4Info {
  const r = spawnSync(ffmpeg, ["-hide_banner", "-i", file], { encoding: "utf8" });
  const text = `${r.stderr ?? ""}`;
  const d = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(text);
  const v = /Stream #\S+.*Video: (\w+).*?, (\d{2,5})x(\d{2,5})[^,]*,(?:.*?, )?([\d.]+) fps/.exec(
    text,
  );
  const a = /Stream #\S+.*Audio: (\w+)/.exec(text);
  if (!d || !v) throw new Error(`not a readable video: ${text.split("\n").slice(-4).join(" ")}`);
  return {
    durationS: Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]),
    videoCodec: v[1]!,
    width: Number(v[2]),
    height: Number(v[3]),
    fps: Number(v[4]),
    audioCodec: a ? a[1]! : null,
  };
}

export function checkMp4(
  info: Mp4Info,
  want: { width: number; height: number; fps: number; durationS: number },
): string[] {
  const errs: string[] = [];
  if (info.width !== want.width || info.height !== want.height)
    errs.push(`is ${info.width}×${info.height}, expected ${want.width}×${want.height}`);
  if (Math.abs(info.fps - want.fps) > 0.01) errs.push(`is ${info.fps} fps, expected ${want.fps}`);
  if (Math.abs(info.durationS - want.durationS) > 1 / want.fps + 0.05)
    errs.push(`lasts ${info.durationS.toFixed(2)} s, expected ${want.durationS.toFixed(2)} s`);
  if (info.videoCodec !== "h264") errs.push(`video codec ${info.videoCodec}, expected h264`);
  return errs;
}
