import { NextRequest, NextResponse } from "next/server";
import { secureApi, ApiResponses } from "@/lib/api-middleware";
import db from "@/db/drizzle";
import { lessons, challenges, challengeOptions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// ✅ CONSOLIDATED LESSONS API: Replaces /api/lessons, /api/challenges, /api/challengeOptions
export const GET = secureApi.admin(async (request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');

  try {
    switch (action) {
      case 'list': {
        // Original lessons listing functionality
        const rangeHeader = request.headers.get('Range') || 'items=0-9';
        const [, rangeValue] = rangeHeader.split('=');
        const [startStr, endStr] = rangeValue.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        const limit = end - start + 1;
        
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
          // Get all challenges with pagination
          const rangeHeader = request.headers.get('Range') || 'items=0-9';
          const [, rangeValue] = rangeHeader.split('=');
          const [startStr, endStr] = rangeValue.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          const limit = end - start + 1;
          
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
          // Get all challenge options with pagination
          const rangeHeader = request.headers.get('Range') || 'items=0-9';
          const [, rangeValue] = rangeHeader.split('=');
          const [startStr, endStr] = rangeValue.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          const limit = end - start + 1;
          
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
    console.error(`Error in lessons API (action: ${action}):`, error);
    return ApiResponses.serverError("Internal server error");
  }
});

export const POST = secureApi.admin(async (request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const body = await request.json();

    switch (action) {
      case 'create-lesson': {
        const data = await db.insert(lessons).values({
          ...body,
        }).returning();
        
        return ApiResponses.created(data[0]);
      }

      case 'create-challenge': {
        const data = await db.insert(challenges).values({
          ...body,
        }).returning();
        
        return ApiResponses.created(data[0]);
      }

      case 'create-challenge-option': {
        const data = await db.insert(challengeOptions).values({
          ...body,
        }).returning();
        
        return ApiResponses.created(data[0]);
      }

      default: {
        // Default to lesson creation for backward compatibility
        const data = await db.insert(lessons).values({
          ...body,
        }).returning();
        
        return ApiResponses.created(data[0]);
      }
    }
  } catch (error) {
    console.error(`Error in lessons POST:`, error);
    return ApiResponses.serverError("Internal server error");
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

    switch (action) {
      case 'update-lesson': {
        const data = await db
          .update(lessons)
          .set({ ...body })
          .where(eq(lessons.id, itemId))
          .returning();

        if (data.length === 0) {
          return ApiResponses.notFound("Lesson not found");
        }

        return ApiResponses.success(data[0]);
      }

      case 'update-challenge': {
        const data = await db
          .update(challenges)
          .set({ ...body })
          .where(eq(challenges.id, itemId))
          .returning();

        if (data.length === 0) {
          return ApiResponses.notFound("Challenge not found");
        }

        return ApiResponses.success(data[0]);
      }

      case 'update-challenge-option': {
        const data = await db
          .update(challengeOptions)
          .set({ ...body })
          .where(eq(challengeOptions.id, itemId))
          .returning();

        if (data.length === 0) {
          return ApiResponses.notFound("Challenge option not found");
        }

        return ApiResponses.success(data[0]);
      }

      default: {
        // Default to lesson update for backward compatibility
        const data = await db
          .update(lessons)
          .set({ ...body })
          .where(eq(lessons.id, itemId))
          .returning();

        if (data.length === 0) {
          return ApiResponses.notFound("Lesson not found");
        }

        return ApiResponses.success(data[0]);
      }
    }
  } catch (error) {
    console.error(`Error in lessons PUT:`, error);
    return ApiResponses.serverError("Internal server error");
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
    console.error(`Error in lessons DELETE:`, error);
    return ApiResponses.serverError("Internal server error");
  }
});