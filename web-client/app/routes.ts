import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/petch+/home.tsx"),
  route("login", "routes/petch+/login.tsx"),
  route("register", "routes/register.tsx"),
  route("logout", "routes/petch+/logout.tsx"),
] satisfies RouteConfig;
