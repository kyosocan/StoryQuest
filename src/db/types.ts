import { apikey, payment } from "./schema";

export type Payment = typeof payment.$inferSelect;
export type ApiKey = typeof apikey.$inferSelect;
