import { verifyTerminalAccess } from "./terminal-access.mjs";
export const journalCollections = [
  ["trades", "Trades", "id,date,market,position,session,pnl,risk,rr,grade,feedback", "date"],
  ["accounts", "Accounts", "id,name,type,status,firm,size,deposit,date", "date"],
  ["transactions", "Transactions", "id,date,type,amount,currency,note,status", "date"],
  ["daily", "Daily analysis", "date,name,bias,session,plan,review_notes,trade_plan", "date"],
  ["weekly", "Weekly analysis", "week_key,data,monthly_key,saved_at", "week_key"],
  ["monthly", "Monthly analysis & canvases", "key,data,saved_at", "key"],
  ["journal", "Journal entries", "id,date,title,content,text,mood,type", "date"],
  ["notes", "Notes", "id,title,text,date,tags", "date"],
  ["lmr_observations", "Observations", "id,title,content,session_tag,created_at", "created_at"],
  ["lmr_achievements", "Achievements", "id,title,category,firm,amount,achieved_on,caption,is_public", "achieved_on"],
  ["weekly_reports", "Reports", "id,title,content,metrics,created_at,kind,subtitle", "created_at"],
  ["targets", "Goals & targets", "id,title,kind,category,unit,target_value,current_value,target_date,details", "created_at"],
  ["target_events", "Goal history", "id,target_id,event_type,value,note,created_at,targets!inner(user_id)", "created_at"],
  ["lmr_ach_suppressions", "Achievement exclusions", "id,created_at", "created_at"],
  ["lmr_session_chain", "Session chain", "id,trade_date,symbol,kind,checkpoint,window_name,o,h,l,c,phase,smt", "trade_date"],
  ["lmr_profiles", "Market profiles", "id,scope,period_key,summary,report_md", "period_key"],
  ["lmr_terminology", "Terminology", "data,updated_at", "updated_at"],
  ["lmr_psychology", "Psychology", "data,updated_at", "updated_at"],
  ["pd_switches", "PD array changes", "id,date,from_array,to_array,reason,switched_at", "switched_at"],
  ["copier_config", "Trade copier", "config,updated_at", "updated_at"],
  ["chart_images", "Chart image records", "id,scope,ref_id,slot_id,storage_key,width,height,created_at", "created_at"],
  ["ai_chats", "AI conversations", "id,title,messages,session_date,updated_at", "updated_at"],
  ["lmr_automation_scripts", "Automation scripts", "name,version,code,updated_at", "updated_at"],
  // Deliberately explicit: profile settings may contain private API credentials.
  ["profiles", "Journal profile", "name,email,business,website,theme,updated_at", "updated_at"],
];
const adminRpcs = new Set(["admin_metrics", "admin_list_users", "admin_list_subscriptions", "admin_list_admins", "admin_grant_comp", "admin_revoke_comp", "admin_add_admin", "admin_remove_admin"]);
export async function verifiedAdmin(client) {
  const access = await verifyTerminalAccess(client);
  if (access.stage !== "ready") throw new Error("Complete administrator verification before accessing the Admin Hub.");
  return access.user;
}
export async function hubRpc(client, name, args) {
  if (!adminRpcs.has(name)) throw new Error("Unsupported Admin Hub action.");
  await verifiedAdmin(client);
  const { data, error } = await client.rpc(name, args);
  if (error) throw error;
  return data;
}
export async function journalRecords(client, collection, page = 0) {
  const item = journalCollections.find(([id]) => id === collection);
  if (!item || !Number.isInteger(page) || page < 0) throw new Error("Choose a journal collection.");
  const user = await verifiedAdmin(client);
  const { data, error, count } = await client.from(item[0]).select(item[2], { count: "exact" })
    .eq(collection === "target_events" ? "targets.user_id" : "user_id", user.id).order(item[3], { ascending: false }).range(page * 20, page * 20 + 19);
  if (error) throw error;
  return { rows: data || [], count: count || 0 };
}
