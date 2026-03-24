/**
 * checkAccess – match filters are free for everyone (no pass or coin gate).
 */

export type FilterType = "gender" | "location" | "all";

export type CheckAccessResult =
  | { allowed: true; viaPass: boolean; viaCoins?: boolean }
  | { allowed: false; error: string };

export async function checkAccess(
  _userId: string,
  _filterType: FilterType
): Promise<CheckAccessResult> {
  return { allowed: true, viaPass: true };
}
