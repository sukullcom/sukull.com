import { NextResponse } from "next/server";
import { secureApi, ApiResponses } from "@/lib/api-middleware";
import db from "@/db/drizzle";
import { lessons, challenges, challengeOptions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getRequestLogger } from "@/lib/logger";
import { parseRangeHeader } from "@/lib/pagination";
import {
  sanitizeLessonWrite,
  sanitizeChallengeWrite,
  sanitizeChallengeOptionWrite,
} from "@/lib/admin-write-sanitizers";

// ✅ CONSOLIDATED LESSONS API: Replaces /api/lessons, /api/challenges, /api/challengeOptions
export const GET = secureApi.admin(async (request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');

  try {
    switch (action) {
      case 'list': {
        const { start, end, limit } = parseRangeHeader(request.headers.get('Range'));

        const [{ count: totalCount }] = await db.select({
          count: sql<number>`count(*)`
        }).from(lessons);
        
        const total = Number(totalCount);
        
        const data = await db.query.lessons.findMany({
          limit: limit,
          offset: start,
          orderBy: (lessons, { desc }) => [desc(lessons.id)]
        });
        
        const response = NextResponse.json(data);
        response.headers.set('Content-Range', `lessons ${start}-${Math.min(end, total - 1)}/${total}`);
        response.headers.set('Access-Control-Expose-Headers', 'Content-Range');
        
        return response;
      }

      case 'get': {
        // Get specific lesson by ID
        if (!id) {
          return ApiResponses.badRequest("Lesson ID is required");
        }

        const lessonId = parseInt(id);
        if (isNaN(lessonId)) {
          return ApiResponses.badRequest("Invalid lesson ID");
        }

        const data = await db.query.lessons.findFirst({
          where: eq(lessons.id, lessonId),
        });

        if (!data) {
          return ApiResponses.notFound("Lesson not found");
        }

        return ApiResponses.success(data);
      }

      case 'challenges': {
        // Get challenges for a lesson or all challenges
        const lessonId = searchParams.get('lessonId');
        
        if (lessonId) {
          // Get challenges for specific lesson
          const data = await db.query.challenges.findMany({
            where: eq(challenges.lessonId, parseInt(lessonId)),
            orderBy: (challenges, { asc }) => [asc(challenges.order)]
          });
          return ApiResponses.success(data);
        } else {
          const { start, end, limit } = parseRangeHeader(request.headers.get('Range'));

          const [{ count: totalCount }] = await db.select({
            count: sql<number>`count(*)`
          }).from(challenges);
          
          const total = Number(totalCount);
          
          const data = await db.query.challenges.findMany({
            limit: limit,
            offset: start,
            orderBy: (challenges, { desc }) => [desc(challenges.id)]
          });
          
          const response = NextResponse.json(data);
          response.headers.set('Content-Range', `challenges ${start}-${Math.min(end, total - 1)}/${total}`);
          response.headers.set('Access-Control-Expose-Headers', 'Content-Range');
          
          return response;
        }
      }

      case 'challenge': {
        // Get specific challenge by ID
        if (!id) {
          return ApiResponses.badRequest("Challenge ID is required");
        }

        const challengeId = parseInt(id);
        if (isNaN(challengeId)) {
          return ApiResponses.badRequest("Invalid challenge ID");
        }

        const data = await db.query.challenges.findFirst({
          where: eq(challenges.id, challengeId),
        });

        if (!data) {
          return ApiResponses.notFound("Challenge not found");
        }

        return ApiResponses.success(data);
      }

      case 'challenge-options': {
        // Get challenge options for a challenge or all options
        const challengeId = searchParams.get('challengeId');
        
        if (challengeId) {
          // Get options for specific challenge
          const data = await db.query.challengeOptions.findMany({
            where: eq(challengeOptions.challengeId, parseInt(challengeId)),
          });
          return ApiResponses.success(data);
        } else if (id) {
          // Get specific option by ID
          const optionId = parseInt(id);
          if (isNaN(optionId)) {
            return ApiResponses.badRequest("Invalid option ID");
          }

          const data = await db.query.challengeOptions.findFirst({
            where: eq(challengeOptions.id, optionId),
          });

          if (!data) {
            return ApiResponses.notFound("Challenge option not found");
          }

          return ApiResponses.success(data);
        } else {
          const { start, end, limit } = parseRangeHeader(request.headers.get('Range'));

          const [{ count: totalCount }] = await db.select({
            count: sql<number>`count(*)`
          }).from(challengeOptions);
          
          const total = Number(totalCount);
          
          const data = await db.query.challengeOptions.findMany({
            limit: limit,
            offset: start,
            orderBy: (challengeOptions, { desc }) => [desc(challengeOptions.id)]
          });
          
          const response = NextResponse.json(data);
          response.headers.set('Content-Range', `challengeOptions ${start}-${Math.min(end, total - 1)}/${total}`);
          response.headers.set('Access-Control-Expose-Headers', 'Content-Range');
          
          return response;
        }
      }

      default: {
        return ApiResponses.badRequest("Invalid action parameter. Supported actions: list, get, challenges, challenge, challenge-options");
      }
    }
  } catch (error) {
    const log = await getRequestLogger({ labels: { route: "api/lessons", op: "GET" } });
    log.error({ message: "lessons GET failed", error, location: "api/lessons/GET", fields: { action } });
    return ApiResponses.serverError("Sunucu tarafında bir hata oluştu.");
  }
});

export const POST = secureApi.admin(async (request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const body = await request.json().catch(() => ({}));

    // Explicit allow-list per action (defence-in-depth). Admin tokens
    // are high-value; `...body` would silently accept any column a
    // future migration adds to these tables. See
    // `lib/admin-write-sanitizers.ts` for the long-form rationale.
    switch (action) {
      case 'create-lesson':
      default: {
        const parsed = sanitizeLessonWrite(body, "create");
        if (!parsed.ok) return ApiResponses.badRequest(parsed.error);
        const data = await db
          .insert(lessons)
          .values({
            title: parsed.values.title!,
            unitId: parsed.values.unitId!,
            order: parsed.values.order!,
          })
          .returning();
        return ApiResponses.created(data[0]);
      }

      case 'create-challenge': {
        const parsed = sanitizeChallengeWrite(body, "create");
        if (!parsed.ok) return ApiResponses.badRequest(parsed.error);
        const v = parsed.values;
        const data = await db
          .insert(challenges)
          .values({
            lessonId: v.lessonId!,
            type: v.type! as (typeof challenges.type.enumValues)[number],
            question: v.question!,
            questionImageSrc: v.questionImageSrc ?? null,
            explanation: v.explanation ?? null,
            order: v.order!,
            difficulty: (v.difficulty ?? null) as (typeof challenges.difficulty.enumValues)[number] | null,
            tags: v.tags ?? null,
            timeLimit: v.timeLimit ?? null,
            metadata: v.metadata ?? null,
          })
          .returning();
        return ApiResponses.created(data[0]);
      }

      case 'create-challenge-option': {
        const parsed = sanitizeChallengeOptionWrite(body, "create");
        if (!parsed.ok) return ApiResponses.badRequest(parsed.error);
        const v = parsed.values;
        const data = await db
          .insert(challengeOptions)
          .values({
            challengeId: v.challengeId!,
            text: v.text!,
            correct: v.correct ?? false,
            imageSrc: v.imageSrc ?? null,
            audioSrc: v.audioSrc ?? null,
            correctOrder: v.correctOrder ?? null,
            pairId: v.pairId ?? null,
            isBlank: v.isBlank ?? false,
            dragData: v.dragData ?? null,
          })
          .returning();
        return ApiResponses.created(data[0]);
      }
    }
  } catch (error) {
    const log = await getRequestLogger({ labels: { route: "api/lessons", op: "POST" } });
    log.error({ message: "lessons POST failed", error, location: "api/lessons/POST", fields: { action } });
    return ApiResponses.serverError("Sunucu tarafında bir hata oluştu.");
  }
});

export const PUT = secureApi.admin(async (request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');

  if (!id) {
    return ApiResponses.badRequest("ID is required for updates");
  }

  try {
    const body = await request.json();
    const itemId = parseInt(id);

    if (isNaN(itemId)) {
      return ApiResponses.badRequest("Invalid ID");
    }

    // Explicit allow-list for every update path — see
    // `lib/admin-write-sanitizers.ts`. Drizzle's `.set(...)` tolerates
    // `undefined` for unset columns, so each sanitizer returns a
    // partial object and untouched columns are preserved.
    switch (action) {
      case 'update-lesson': {
        const parsed = sanitizeLessonWrite(body, "update");
        if (!parsed.ok) return ApiResponses.badRequest(parsed.error);
        const data = await db
          .update(lessons)
          .set(parsed.values)
          .where(eq(lessons.id, itemId))
          .returning();

        if (data.length === 0) {
          return ApiResponses.notFound("Lesson not found");
        }

        return ApiResponses.success(data[0]);
      }

      case 'update-challenge': {
        const parsed = sanitizeChallengeWrite(body, "update");
        if (!parsed.ok) return ApiResponses.badRequest(parsed.error);
        const v = parsed.values;
        const data = await db
          .update(challenges)
          .set({
            ...(v.lessonId !== undefined ? { lessonId: v.lessonId } : {}),
            ...(v.type !== undefined
              ? { type: v.type as (typeof challenges.type.enumValues)[number] }
              : {}),
            ...(v.question !== undefined ? { question: v.question } : {}),
            ...(v.questionImageSrc !== undefined ? { questionImageSrc: v.questionImageSrc } : {}),
            ...(v.explanation !== undefined ? { explanation: v.explanation } : {}),
            ...(v.order !== undefined ? { order: v.order } : {}),
            ...(v.difficulty !== undefined
              ? { difficulty: v.difficulty as (typeof challenges.difficulty.enumValues)[number] | null }
              : {}),
            ...(v.tags !== undefined ? { tags: v.tags } : {}),
            ...(v.timeLimit !== undefined ? { timeLimit: v.timeLimit } : {}),
            ...(v.metadata !== undefined ? { metadata: v.metadata } : {}),
          })
          .where(eq(challenges.id, itemId))
          .returning();

        if (data.length === 0) {
          return ApiResponses.notFound("Challenge not found");
        }

        return ApiResponses.success(data[0]);
      }

      case 'update-challenge-option': {
        const parsed = sanitizeChallengeOptionWrite(body, "update");
        if (!parsed.ok) return ApiResponses.badRequest(parsed.error);
        const v = parsed.values;
        const data = await db
          .update(challengeOptions)
          .set({
            ...(v.challengeId !== undefined ? { challengeId: v.challengeId } : {}),
            ...(v.text !== undefined ? { text: v.text } : {}),
            ...(v.correct !== undefined ? { correct: v.correct } : {}),
            ...(v.imageSrc !== undefined ? { imageSrc: v.imageSrc } : {}),
            ...(v.audioSrc !== undefined ? { audioSrc: v.audioSrc } : {}),
            ...(v.correctOrder !== undefined ? { correctOrder: v.correctOrder } : {}),
            ...(v.pairId !== undefined ? { pairId: v.pairId } : {}),
            ...(v.isBlank !== undefined ? { isBlank: v.isBlank } : {}),
            ...(v.dragData !== undefined ? { dragData: v.dragData } : {}),
          })
          .where(eq(challengeOptions.id, itemId))
          .returning();

        if (data.length === 0) {
          return ApiResponses.notFound("Challenge option not found");
        }

        return ApiResponses.success(data[0]);
      }

      default: {
        // Default to lesson update for backward compatibility
        const parsed = sanitizeLessonWrite(body, "update");
        if (!parsed.ok) return ApiResponses.badRequest(parsed.error);
        const data = await db
          .update(lessons)
          .set(parsed.values)
          .where(eq(lessons.id, itemId))
          .returning();

        if (data.length === 0) {
          return ApiResponses.notFound("Lesson not found");
        }

        return ApiResponses.success(data[0]);
      }
    }
  } catch (error) {
    const log = await getRequestLogger({ labels: { route: "api/lessons", op: "PUT" } });
    log.error({ message: "lessons PUT failed", error, location: "api/lessons/PUT", fields: { action } });
    return ApiResponses.serverError("Sunucu tarafında bir hata oluştu.");
  }
});

export const DELETE = secureApi.admin(async (request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');

  if (!id) {
    return ApiResponses.badRequest("ID is required for deletion");
  }

  try {
    const itemId = parseInt(id);

    if (isNaN(itemId)) {
      return ApiResponses.badRequest("Invalid ID");
    }

    switch (action) {
      case 'delete-lesson': {
        const data = await db
          .delete(lessons)
          .where(eq(lessons.id, itemId))
          .returning();

        if (data.length === 0) {
          return ApiResponses.notFound("Lesson not found");
        }

        return ApiResponses.success(data[0]);
      }

      case 'delete-challenge': {
        const data = await db
          .delete(challenges)
          .where(eq(challenges.id, itemId))
          .returning();

        if (data.length === 0) {
          return ApiResponses.notFound("Challenge not found");
        }

        return ApiResponses.success(data[0]);
      }

      case 'delete-challenge-option': {
        const data = await db
          .delete(challengeOptions)
          .where(eq(challengeOptions.id, itemId))
          .returning();

        if (data.length === 0) {
          return ApiResponses.notFound("Challenge option not found");
        }

        return ApiResponses.success(data[0]);
      }

      default: {
        // Default to lesson deletion for backward compatibility
        const data = await db
          .delete(lessons)
          .where(eq(lessons.id, itemId))
          .returning();

        if (data.length === 0) {
          return ApiResponses.notFound("Lesson not found");
        }

        return ApiResponses.success(data[0]);
      }
    }
  } catch (error) {
    const log = await getRequestLogger({ labels: { route: "api/lessons", op: "DELETE" } });
    log.error({ message: "lessons DELETE failed", error, location: "api/lessons/DELETE", fields: { action } });
    return ApiResponses.serverError("Sunucu tarafında bir hata oluştu.");
  }
});