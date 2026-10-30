import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type { ErrorObject, ValidateFunction } from "ajv";
import { ApiError } from "./errors.ts";

import intakeRecord from "./vendor/schemas/intake-record.schema.json" with { type: "json" };
import createProject from "./vendor/schemas/api/create-project.request.schema.json" with { type: "json" };
import csvImport from "./vendor/schemas/api/csv-import.request.schema.json" with { type: "json" };
import questionnaireSubmit from "./vendor/schemas/api/questionnaire-submit.request.schema.json" with { type: "json" };
import scriptEdit from "./vendor/schemas/api/script-edit.request.schema.json" with { type: "json" };
import scriptGenerate from "./vendor/schemas/api/script-generate.request.schema.json" with { type: "json" };
import approval from "./vendor/schemas/api/approval.request.schema.json" with { type: "json" };

// deno-lint-ignore no-explicit-any
// anyOf-with-required ("idea or url") references properties declared at the top level.
const ajv = new (Ajv2020 as any)({
  allErrors: true,
  useDefaults: true,
  strict: true,
  strictRequired: false,
});
// deno-lint-ignore no-explicit-any
(addFormats as any)(ajv);

const schemas = {
  intakeRecord,
  createProject,
  csvImport,
  questionnaireSubmit,
  scriptEdit,
  scriptGenerate,
  approval,
} as const;
export type SchemaName = keyof typeof schemas;

const compiled = new Map<SchemaName, ValidateFunction>();

function validator(name: SchemaName): ValidateFunction {
  let v = compiled.get(name);
  if (!v) {
    v = ajv.compile(schemas[name]) as ValidateFunction;
    compiled.set(name, v);
  }
  return v;
}

export function formatErrors(errors: ErrorObject[] | null | undefined) {
  return (errors ?? []).map((e) => ({
    path: e.instancePath || "/",
    message: e.message ?? "invalid",
    ...(e.params && Object.keys(e.params).length ? { params: e.params } : {}),
  }));
}

const bySchema = new WeakMap<object, ValidateFunction>();

/** Validates against an arbitrary schema object (AI stage outputs); returns readable errors. */
export function schemaErrors(schema: object, data: unknown): string[] {
  let v = bySchema.get(schema);
  if (!v) {
    v = ajv.compile(schema) as ValidateFunction;
    bySchema.set(schema, v);
  }
  return v(data) ? [] : formatErrors(v.errors).map((e) => `${e.path} ${e.message}`);
}

/** Validates (and applies schema defaults to) `data`, or throws 422. */
export function validate<T>(name: SchemaName, data: unknown): T {
  const v = validator(name);
  if (!v(data)) {
    throw new ApiError("validation_failed", "request body is invalid", {
      errors: formatErrors(v.errors),
    });
  }
  return data as T;
}
