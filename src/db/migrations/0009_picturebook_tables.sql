-- AI 绘本闯关系统 - 数据库迁移

CREATE TABLE IF NOT EXISTS "word_task" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"grade" text NOT NULL,
	"status" text DEFAULT 'uploaded' NOT NULL,
	"original_image_urls" jsonb,
	"recognized_words" jsonb,
	"confirmed_words" jsonb,
	"word_groups" jsonb,
	"credits_used" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "word_story" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"group_index" integer NOT NULL,
	"words" jsonb NOT NULL,
	"story_content" text NOT NULL,
	"story_content_zh" text,
	"highlighted_words" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "challenge_card" (
	"id" text PRIMARY KEY NOT NULL,
	"story_id" text NOT NULL,
	"task_id" text NOT NULL,
	"group_index" integer NOT NULL,
	"card_index" integer NOT NULL,
	"card_type" text NOT NULL,
	"sub_type" text NOT NULL,
	"target_word" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "challenge_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"task_id" text NOT NULL,
	"user_id" text NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"score" integer DEFAULT 0,
	"response" jsonb,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- 外键约束
DO $$ BEGIN
 ALTER TABLE "word_task" ADD CONSTRAINT "word_task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "word_story" ADD CONSTRAINT "word_story_task_id_word_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."word_task"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "challenge_card" ADD CONSTRAINT "challenge_card_story_id_word_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."word_story"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "challenge_card" ADD CONSTRAINT "challenge_card_task_id_word_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."word_task"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "challenge_attempt" ADD CONSTRAINT "challenge_attempt_card_id_challenge_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."challenge_card"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "challenge_attempt" ADD CONSTRAINT "challenge_attempt_task_id_word_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."word_task"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "challenge_attempt" ADD CONSTRAINT "challenge_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- 索引
CREATE INDEX IF NOT EXISTS "word_task_user_id_idx" ON "word_task" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "word_task_status_idx" ON "word_task" USING btree ("status");
CREATE INDEX IF NOT EXISTS "word_story_task_id_idx" ON "word_story" USING btree ("task_id");
CREATE INDEX IF NOT EXISTS "challenge_card_story_id_idx" ON "challenge_card" USING btree ("story_id");
CREATE INDEX IF NOT EXISTS "challenge_card_task_id_idx" ON "challenge_card" USING btree ("task_id");
CREATE INDEX IF NOT EXISTS "challenge_attempt_card_id_idx" ON "challenge_attempt" USING btree ("card_id");
CREATE INDEX IF NOT EXISTS "challenge_attempt_task_id_idx" ON "challenge_attempt" USING btree ("task_id");
CREATE INDEX IF NOT EXISTS "challenge_attempt_user_id_idx" ON "challenge_attempt" USING btree ("user_id");
