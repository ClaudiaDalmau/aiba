import { publicRoute } from "@/lib/api";
import { leadStats } from "@/lib/leads";

export const GET = publicRoute(async () => leadStats());
