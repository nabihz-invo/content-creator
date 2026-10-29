/**
 * Telegram webhook (P1-T10). Telegram calls this with an Update; we reply
 * inline (webhook response with method=sendMessage) so no bot token is needed
 * here. Every update is processed at most once (source key telegram:<update_id>).
 */
import { requireWorkspaceRole } from "../_shared/auth.ts";
import type { Deps } from "../_shared/deps.ts";
import { ApiError } from "../_shared/errors.ts";
import { type IntakeRecord, intakeIdea } from "../_shared/intake.ts";
import { extractFirstUrl } from "../_shared/sanitize.ts";

interface TgUser {
  id: number;
  language_code?: string;
}
interface TgMessage {
  message_id: number;
  date: number;
  chat: { id: number; type: string };
  from?: TgUser;
  text?: string;
  caption?: string;
  voice?: { file_id: string; duration: number };
  audio?: { file_id: string };
  photo?: { file_id: string; width: number; height: number }[];
  document?: { file_id: string; file_name?: string };
}
interface TgUpdate {
  update_id: number;
  message?: TgMessage;
}

type Lang = "en" | "ar";
const T = {
  en: {
    help: "Send me an idea as text or a link and I'll add it to your content inbox.\nCommands: /link <code> to connect your account.",
    notLinked:
      "This Telegram account isn't connected yet. In the CRM open Settings → Telegram, create a code, then send /link <code> here.",
    linked: "Connected! Send me ideas or links any time.",
    badCode: "That code is invalid or expired. Create a new one in the CRM.",
    voice: "Voice notes aren't supported yet — please send the idea as text.",
    unsupported: "I can only take text, links, or a photo with a caption for now.",
    created: (url: string) => `Idea saved ✅ It's being analyzed now.\n${url}`,
    duplicate: (url: string) => `You already sent this idea — here it is:\n${url}`,
    forbidden: "Your role can't submit ideas in this workspace.",
    failed: "Sorry, I couldn't save that idea. Please try again.",
  },
  ar: {
    help: "أرسل لي فكرة كنص أو رابط وسأضيفها إلى صندوق المحتوى.\nالأوامر: ‎/link <الرمز> لربط حسابك.",
    notLinked:
      "حساب تيليجرام هذا غير مرتبط بعد. افتح الإعدادات ← تيليجرام في النظام، أنشئ رمزًا ثم أرسل ‎/link <الرمز> هنا.",
    linked: "تم الربط! أرسل أفكارك أو روابطك في أي وقت.",
    badCode: "الرمز غير صالح أو منتهي. أنشئ رمزًا جديدًا من النظام.",
    voice: "الرسائل الصوتية غير مدعومة بعد — أرسل الفكرة كنص من فضلك.",
    unsupported: "أستطيع حاليًا استقبال النصوص أو الروابط أو صورة مع وصف فقط.",
    created: (url: string) => `تم حفظ الفكرة ✅ يجري تحليلها الآن.\n${url}`,
    duplicate: (url: string) => `أرسلت هذه الفكرة من قبل — ها هي:\n${url}`,
    forbidden: "صلاحيتك لا تسمح بإضافة أفكار في مساحة العمل هذه.",
    failed: "عذرًا، لم أتمكن من حفظ الفكرة. حاول مرة أخرى.",
  },
} as const;

function reply(chatId: number, text: string, replyTo?: number) {
  return Response.json({
    method: "sendMessage",
    chat_id: chatId,
    text,
    ...(replyTo
      ? { reply_parameters: { message_id: replyTo, allow_sending_without_reply: true } }
      : {}),
    link_preview_options: { is_disabled: true },
  });
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export function createTelegramHandler(deps: Deps) {
  const { sql } = deps;

  return async (req: Request): Promise<Response> => {
    if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
    const secret = deps.config.telegramWebhookSecret;
    const given = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
    if (!secret || !safeEqual(given, secret)) return new Response("unauthorized", { status: 401 });

    let update: TgUpdate;
    try {
      update = await req.json();
    } catch {
      return new Response("bad request", { status: 400 });
    }
    const msg = update.message;
    // Acknowledge everything we don't handle so Telegram doesn't retry it.
    if (!msg?.from || msg.chat.type !== "private") return new Response(null, { status: 200 });

    const [profile] = await sql<{ id: string; locale: Lang }[]>`
      select id, locale from public.profiles where telegram_user_id = ${msg.from.id}`;
    const lang: Lang = profile?.locale ?? (msg.from.language_code?.startsWith("ar") ? "ar" : "en");
    const t = T[lang];
    const text = (msg.text ?? msg.caption ?? "").trim();

    const command = text.match(/^\/(start|link|help)(?:@\w+)?(?:\s+(\S+))?/i);
    if (command) {
      const [, name, arg] = command;
      if ((name === "link" || name === "start") && arg) {
        const [row] = await sql<{ uid: string | null }[]>`
          select public.consume_telegram_link_code(${arg}, ${msg.from.id}) as uid`;
        return reply(
          msg.chat.id,
          row?.uid ? T.en.linked + "\n" + T.ar.linked : t.badCode,
          msg.message_id,
        );
      }
      return reply(msg.chat.id, profile ? t.help : t.notLinked);
    }

    if (!profile) return reply(msg.chat.id, t.notLinked);
    if (msg.voice || msg.audio) return reply(msg.chat.id, t.voice, msg.message_id);
    if (!text) return reply(msg.chat.id, t.unsupported, msg.message_id);

    const url = extractFirstUrl(text);
    const ideaText = url ? text.replace(url, "").trim() : text;
    const record: IntakeRecord = {
      input_source: url && !ideaText ? "url" : "telegram",
      ...(ideaText ? { original_idea: ideaText } : {}),
      ...(url ? { source_url: url } : {}),
      source_reference: `telegram:${msg.chat.id}:${msg.message_id}`,
      source_metadata: {
        telegram_chat_id: msg.chat.id,
        telegram_message_id: msg.message_id,
        ...(msg.photo?.length
          ? { telegram_photo_file_id: msg.photo[msg.photo.length - 1]!.file_id }
          : {}),
      },
      submitted_at: new Date(msg.date * 1000).toISOString(),
    };

    try {
      const { workspaceId } = await requireWorkspaceRole(sql, profile.id, undefined, [
        "admin",
        "editor",
      ]);
      const r = await intakeIdea(sql, deps.dispatcher, record, {
        workspaceId,
        actorId: profile.id,
        sourceKey: `telegram:${update.update_id}`,
      });
      const link = `${deps.config.crmUrl.replace(/\/$/, "")}/projects/${r.project_id}`;
      return reply(
        msg.chat.id,
        r.created || r.replayed ? t.created(link) : t.duplicate(link),
        msg.message_id,
      );
    } catch (err) {
      if (err instanceof ApiError && err.code === "forbidden")
        return reply(msg.chat.id, t.forbidden);
      if (err instanceof ApiError && err.code === "validation_failed")
        return reply(msg.chat.id, t.unsupported);
      console.error("telegram intake failed", err);
      return reply(msg.chat.id, t.failed, msg.message_id);
    }
  };
}
