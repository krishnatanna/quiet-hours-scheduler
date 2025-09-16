import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/mongodb";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

const AHEAD_MINUTES = 10;
const WINDOW_MINUTES = 1; // small window to capture near-matches

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers["x-cron-secret"] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const db = getDb();
  const col = db.collection("silent_blocks");

  const now = new Date();
  const target = new Date(now.getTime() + AHEAD_MINUTES * 60 * 1000);
  const startWindow = new Date(target.getTime() - WINDOW_MINUTES * 60 * 1000);
  const endWindow = new Date(target.getTime() + WINDOW_MINUTES * 60 * 1000);

  const candidates = await col.find({
    notification_sent: false,
    start_time: { $gte: startWindow, $lte: endWindow }
  }).toArray();

  if (!candidates.length) return res.status(200).json({ ok: true, sent: 0 });

  // group by user_email (or user_id)
  const byUser = new Map<string, any[]>();
  for (const c of candidates) {
    const key = String(c.user_email || c.user_id || "unknown");
    const arr = byUser.get(key) || [];
    arr.push(c);
    byUser.set(key, arr);
  }

  let sent = 0;
  for (const [userKey, blocks] of byUser.entries()) {
    const first = blocks.sort((a,b) => a.start_time - b.start_time)[0];
    if (!first.user_email) continue;

    const textLines = [
      `Hi — your Quiet Hours block "${first.title || "Study Time"}" starts at ${new Date(first.start_time).toLocaleString()}.`,
      "",
      "If you did not schedule this, ignore this email."
    ];

    // add list if many
    if (blocks.length > 1) {
      textLines.push("", "Other upcoming blocks:");
      blocks.forEach(b => textLines.push(`- ${b.title || "-"} at ${new Date(b.start_time).toLocaleString()}`));
    }

    try {
      await sgMail.send({
        to: first.user_email,
        from: process.env.MAIL_FROM!,
        subject: "Quiet Hours starting in 10 minutes",
        text: textLines.join("\n"),
      });
      sent++;

      // mark all these blocks as notified
      const ids = blocks.map(b => b._id);
      await col.updateMany({ _id: { $in: ids } }, { $set: { notification_sent: true, notified_at: new Date() }});
    } catch (err) {
      console.error("send error", err);
    }
  }

  return res.status(200).json({ ok: true, sent });
}
