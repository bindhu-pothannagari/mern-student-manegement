import { request } from "./client.js";
import { toQuery } from "./query.js";

export const getDashboard = (filters) => request(`/dashboard${toQuery(filters)}`);
