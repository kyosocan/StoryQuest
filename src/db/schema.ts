import { boolean, integer, jsonb, pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

// https://www.better-auth.com/docs/concepts/database#core-schema
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	normalizedEmail: text('normalized_email').unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	role: text('role'),
	banned: boolean('banned'),
	banReason: text('ban_reason'),
	banExpires: timestamp('ban_expires'),
	customerId: text('customer_id'),
}, (table) => ({
	userIdIdx: index("user_id_idx").on(table.id),
	userCustomerIdIdx: index("user_customer_id_idx").on(table.customerId),
	userRoleIdx: index("user_role_idx").on(table.role),
}));

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	impersonatedBy: text('impersonated_by')
}, (table) => ({
	sessionTokenIdx: index("session_token_idx").on(table.token),
	sessionUserIdIdx: index("session_user_id_idx").on(table.userId),
}));

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
}, (table) => ({
	accountUserIdIdx: index("account_user_id_idx").on(table.userId),
	accountAccountIdIdx: index("account_account_id_idx").on(table.accountId),
	accountProviderIdIdx: index("account_provider_id_idx").on(table.providerId),
}));

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
});

// https://www.better-auth.com/docs/plugins/api-key#schema
export const apikey = pgTable("apikey", {
  id: text("id").primaryKey(),
  name: text("name"),
  start: text("start"),
  prefix: text("prefix"),
  key: text("key").notNull(),
  userId: text("user_id") .notNull() .references(() => user.id, { onDelete: "cascade" }),
  refillInterval: integer("refill_interval"),
  refillAmount: integer("refill_amount"),
  lastRefillAt: timestamp("last_refill_at"),
  enabled: boolean("enabled").default(true),
  rateLimitEnabled: boolean("rate_limit_enabled").default(true),
  rateLimitTimeWindow: integer("rate_limit_time_window").default(86400000),
  rateLimitMax: integer("rate_limit_max").default(10),
  requestCount: integer("request_count").default(0),
  remaining: integer("remaining"),
  lastRequest: timestamp("last_request"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  permissions: text("permissions"),
  metadata: text("metadata"),
}, (table) => ({
  apikeyKeyIdx: index("apikey_key_idx").on(table.key),
  apikeyUserIdIdx: index("apikey_user_id_idx").on(table.userId),
}));

export const payment = pgTable("payment", {
	id: text("id").primaryKey(),
	priceId: text('price_id').notNull(),
	type: text('type').notNull(),
	scene: text('scene'), // payment scene: 'lifetime', 'credit', 'subscription'
	interval: text('interval'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	customerId: text('customer_id').notNull(),
	subscriptionId: text('subscription_id'),
	sessionId: text('session_id'),
	invoiceId: text('invoice_id').unique(), // unique constraint for avoiding duplicate processing
	status: text('status').notNull(),
	paid: boolean('paid').notNull().default(false), // indicates whether payment is completed (set in invoice.paid event)
	periodStart: timestamp('period_start'),
	periodEnd: timestamp('period_end'),
	cancelAtPeriodEnd: boolean('cancel_at_period_end'),
	trialStart: timestamp('trial_start'),
	trialEnd: timestamp('trial_end'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
	paymentTypeIdx: index("payment_type_idx").on(table.type),
	paymentSceneIdx: index("payment_scene_idx").on(table.scene),
	paymentPriceIdIdx: index("payment_price_id_idx").on(table.priceId),
	paymentUserIdIdx: index("payment_user_id_idx").on(table.userId),
	paymentCustomerIdIdx: index("payment_customer_id_idx").on(table.customerId),
	paymentStatusIdx: index("payment_status_idx").on(table.status),
	paymentPaidIdx: index("payment_paid_idx").on(table.paid),
	paymentSubscriptionIdIdx: index("payment_subscription_id_idx").on(table.subscriptionId),
	paymentSessionIdIdx: index("payment_session_id_idx").on(table.sessionId),
	paymentInvoiceIdIdx: index("payment_invoice_id_idx").on(table.invoiceId),
}));

export const userCredit = pgTable("user_credit", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	currentCredits: integer("current_credits").notNull().default(0),
	lastRefreshAt: timestamp("last_refresh_at"), // deprecated
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	userCreditUserIdIdx: index("user_credit_user_id_idx").on(table.userId),
}));

export const creditTransaction = pgTable("credit_transaction", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	type: text("type").notNull(),
	description: text("description"),
	amount: integer("amount").notNull(),
	remainingAmount: integer("remaining_amount"),
	paymentId: text("payment_id"), // field name is paymentId, but actually it's invoiceId
	expirationDate: timestamp("expiration_date"),
	expirationDateProcessedAt: timestamp("expiration_date_processed_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	creditTransactionUserIdIdx: index("credit_transaction_user_id_idx").on(table.userId),
	creditTransactionTypeIdx: index("credit_transaction_type_idx").on(table.type),
}));

// ============================================================
// AI 绘本闯关系统 - Picture Book Challenge System
// ============================================================

/**
 * 单词学习任务 - 家长创建的学习任务
 */
export const wordTask = pgTable("word_task", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	title: text("title").notNull(),
	grade: text("grade").notNull(), // '1'-'6', 'KET', 'PET'
	status: text("status").notNull().default('uploaded'), // uploaded, confirmed, generating, ready, completed
	originalImageUrls: jsonb("original_image_urls").$type<string[]>(), // 上传的图片 URL 列表
	recognizedWords: jsonb("recognized_words").$type<RecognizedWord[]>(), // AI 识别的单词
	confirmedWords: jsonb("confirmed_words").$type<ConfirmedWord[]>(), // 家长确认/编辑后的单词
	wordGroups: jsonb("word_groups").$type<WordGroup[]>(), // 分组后的单词
	creditsUsed: integer("credits_used").default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	wordTaskUserIdIdx: index("word_task_user_id_idx").on(table.userId),
	wordTaskStatusIdx: index("word_task_status_idx").on(table.status),
}));

/**
 * 故事 - 每组单词对应一个故事
 */
export const wordStory = pgTable("word_story", {
	id: text("id").primaryKey(),
	taskId: text("task_id").notNull().references(() => wordTask.id, { onDelete: 'cascade' }),
	groupIndex: integer("group_index").notNull(), // 组序号 (0-based)
	words: jsonb("words").$type<string[]>().notNull(), // 本组包含的单词列表
	storyContent: text("story_content").notNull(), // 生成的故事内容
	storyContentZh: text("story_content_zh"), // 中文翻译（可选）
	highlightedWords: jsonb("highlighted_words").$type<Record<string, number[]>>(), // 单词在故事中的位置
	createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
	wordStoryTaskIdIdx: index("word_story_task_id_idx").on(table.taskId),
}));

/**
 * 闯关卡 - 每组故事对应 5-6 张闯关卡
 */
export const challengeCard = pgTable("challenge_card", {
	id: text("id").primaryKey(),
	storyId: text("story_id").notNull().references(() => wordStory.id, { onDelete: 'cascade' }),
	taskId: text("task_id").notNull().references(() => wordTask.id, { onDelete: 'cascade' }),
	groupIndex: integer("group_index").notNull(),
	cardIndex: integer("card_index").notNull(), // 卡片序号 (0-based)
	cardType: text("card_type").notNull(), // 'reading' | 'choice'
	subType: text("sub_type").notNull(), // 'image_choice' | 'action_reading' | 'expression_replace' | 'follow_reading'
	targetWord: text("target_word").notNull(), // 测试的目标单词
	content: jsonb("content").$type<ChallengeCardContent>().notNull(), // 卡片内容
	createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
	challengeCardStoryIdIdx: index("challenge_card_story_id_idx").on(table.storyId),
	challengeCardTaskIdIdx: index("challenge_card_task_id_idx").on(table.taskId),
}));

/**
 * 闯关记录 - 孩子的闯关尝试
 */
export const challengeAttempt = pgTable("challenge_attempt", {
	id: text("id").primaryKey(),
	cardId: text("card_id").notNull().references(() => challengeCard.id, { onDelete: 'cascade' }),
	taskId: text("task_id").notNull().references(() => wordTask.id, { onDelete: 'cascade' }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	passed: boolean("passed").notNull().default(false),
	score: integer("score").default(0), // 0-100
	response: jsonb("response").$type<ChallengeResponse>(), // 孩子的回答
	attemptNumber: integer("attempt_number").notNull().default(1),
	createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
	challengeAttemptCardIdIdx: index("challenge_attempt_card_id_idx").on(table.cardId),
	challengeAttemptTaskIdIdx: index("challenge_attempt_task_id_idx").on(table.taskId),
	challengeAttemptUserIdIdx: index("challenge_attempt_user_id_idx").on(table.userId),
}));

// ============================================================
// JSON 类型定义 (用于 jsonb 列的类型约束)
// ============================================================

export type RecognizedWord = {
	word: string;
	meaning?: string; // 中文释义
	partOfSpeech?: string; // 词性: noun, verb, adjective, abstract
	confidence?: number;
};

export type ConfirmedWord = {
	word: string;
	meaning: string;
	partOfSpeech: string; // noun, verb, adjective, abstract
};

export type WordGroup = {
	groupIndex: number;
	words: ConfirmedWord[];
};

export type ChallengeCardContent = {
	// 通用字段
	instruction: string; // 题目指令
	instructionZh?: string; // 中文指令

	// 朗读题字段
	readingText?: string; // 需要朗读的文本
	readingHint?: string; // 提示
	keywords?: string[]; // 关键词（判断朗读正确性）

	// 选择题字段
	question?: string; // 问题
	questionZh?: string; // 中文问题
	options?: ChallengeOption[]; // 选项
	correctOptionIndex?: number; // 正确答案索引
	imageUrl?: string; // 图片选择题的图片

	// 情境
	storyContext?: string; // 故事中的相关段落
};

export type ChallengeOption = {
	text: string;
	textZh?: string;
	isCorrect: boolean;
};

export type ChallengeResponse = {
	type: 'reading' | 'choice';
	// 朗读回答
	spokenText?: string;
	matchedKeywords?: string[];
	matchPercentage?: number;
	// 选择题回答
	selectedOptionIndex?: number;
};
