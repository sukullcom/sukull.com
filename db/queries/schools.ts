/**
 * Schools master-data queries.
 *
 * Leaderboard-style school queries (e.g. `getSchoolPointsByType`) live in
 * `./leaderboard` -- that's ranking logic. This file is for raw listing.
 */
import { cache } from "react";
import db from "@/db/drizzle";

export const getSchools = cache(async () => {
  const data = await db.query.schools.findMany({
    orderBy: (schools, { asc }) => [asc(schools.name)],
    columns: {
      id: true,
      name: true,
      city: true,
      district: true,
      category: true,
      kind: true,
      type: true,
    },
  });

  return data;
});
