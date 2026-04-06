CREATE TABLE IF NOT EXISTS "concept_mastery" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" integer NOT NULL,
	"concept_key" text NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"incorrect_count" integer DEFAULT 0 NOT NULL,
	"last_attempted_at" timestamp
);

ALTER TABLE "concept_mastery" ADD CONSTRAINT "concept_mastery_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX IF NOT EXISTS "concept_mastery_user_course_concept" ON "concept_mastery" ("user_id","course_id","concept_key");
