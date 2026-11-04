import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  describeInstagramPayload,
  parseInstagramCommentEvents,
  secretsMatch,
  verifyMetaSignature,
} from "@/lib/instagram/webhook";

describe("secretsMatch", () => {
  it("matches the same verify token", () => {
    expect(secretsMatch("meatyhamhock", "meatyhamhock")).toBe(true);
  });

  it("rejects a different token of the same length", () => {
    expect(secretsMatch("meatyhamhock", "meatyhamh0ck")).toBe(false);
  });
});

describe("verifyMetaSignature", () => {
  it("accepts a sha256 signature of the raw body", () => {
    const body = '{"object":"instagram"}';
    const digest = createHmac("sha256", "app-secret").update(body).digest("hex");
    expect(verifyMetaSignature(body, `sha256=${digest}`, "app-secret")).toBe(true);
  });

  it("rejects a body that was changed after signing", () => {
    const digest = createHmac("sha256", "app-secret").update("original").digest("hex");
    expect(verifyMetaSignature("tampered", `sha256=${digest}`, "app-secret")).toBe(false);
  });
});

describe("parseInstagramCommentEvents", () => {
  it("reads an Instagram Login live comment", () => {
    const events = parseInstagramCommentEvents({
      object: "instagram",
      entry: [
        {
          id: "17841401584453519",
          time: 1569262486,
          field: "live_comments",
          value: {
            id: "comment-1",
            text: "sağ",
            from: { id: "ig-user", username: "izleyici" },
            media: { id: "live-1", media_product_type: "LIVE" },
          },
        },
      ],
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      field: "live_comments",
      commentId: "comment-1",
      text: "sağ",
      username: "izleyici",
      commenterId: "ig-user",
      mediaId: "live-1",
      mediaProductType: "LIVE",
      accountId: "17841401584453519",
    });
    expect(events[0]?.eventTime?.toISOString()).toBe("2019-09-23T18:14:46.000Z");
  });

  it("reads a Facebook Login live comment wrapped in changes", () => {
    const events = parseInstagramCommentEvents([
      {
        object: "instagram",
        entry: [
          {
            id: "17841401584453519",
            time: 1569262486134,
            changes: [
              {
                field: "live_comments",
                value: {
                  comment_id: "comment-2",
                  text: "sol",
                  parent_id: "parent-1",
                  from: { id: "ig-user-2", username: "biri" },
                  media: { id: "live-2", media_product_type: "LIVE" },
                },
              },
              { field: "messages", value: { text: "yok say" } },
            ],
          },
        ],
      },
    ]);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      commentId: "comment-2",
      text: "sol",
      parentId: "parent-1",
      username: "biri",
      mediaId: "live-2",
    });
    expect(events[0]?.eventTime?.toISOString()).toBe("2019-09-23T18:14:46.134Z");
  });

  it("names the webhook fields without keeping comment text", () => {
    expect(
      describeInstagramPayload({
        entry: [{ field: "live_comments", value: { text: "gizli" } }],
      }),
    ).toBe("live_comments");
    expect(describeInstagramPayload({ entry: [] })).toBe("no-field");
  });
});
