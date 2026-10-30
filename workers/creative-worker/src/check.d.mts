export interface CheckError {
  file: string;
  rule: string;
  message: string;
  line?: number;
}
export interface CheckResult {
  ok: boolean;
  errors: CheckError[];
  files: { path: string; size: number }[];
  totalBytes: number;
}
export declare const LIMITS: { maxFiles: number; maxFileBytes: number; maxTotalBytes: number };
export declare function validateWorkspace(dir: string, opts: { format: "static" | "carousel" | "video" }): CheckResult;
