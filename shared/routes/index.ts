export const API_ROUTES = {
  TEST: "/test",
  USERS: "/users",
  LOGIN: "/auth/login"
} as const;

export type User = {
  id: string;
  username: string;
  email: string;
};
