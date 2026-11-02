import assert from "node:assert/strict";
import { test } from "node:test";
import { extractJson, promptOf } from "../src/claude-code.ts";

test("a first request is the user message plus the output schema", () => {
  const p = promptOf({
    model: "claude-opus-5-5",
    messages: [{ role: "user", content: "Analyse this idea." }],
    output_config: { format: { schema: { type: "object", required: ["title"] } } },
  });
  assert.match(p, /^Analyse this idea\./);
  assert.match(p, /Return only one JSON object/);
  assert.match(p, /"required":\["title"\]/);
});

test("a retry quotes the earlier answer and the problems found", () => {
  const p = promptOf({
    model: "claude-opus-5-5",
    messages: [
      { role: "user", content: "Write the script." },
      { role: "assistant", content: [{ type: "text", text: '{"title":"far too long"}' }] },
      { role: "user", content: "Your JSON did not pass validation:\n- /title too long" },
    ],
  });
  assert.match(p, /<request>\nWrite the script\.\n<\/request>/);
  assert.match(p, /<your_previous_answer>\n\{"title":"far too long"\}/);
  assert.match(p, /Now:\n\nYour JSON did not pass validation/);
});

test("replies are cut down to the JSON object", () => {
  assert.equal(extractJson('Here:\n```json\n{"a":1}\n```'), '{"a":1}');
  assert.equal(extractJson('{"a":{"b":2}} done'), '{"a":{"b":2}}');
});
