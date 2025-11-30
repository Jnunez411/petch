import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/petch+/home.tsx"),
  route("login", "routes/petch+/login.tsx"),
  route("signup", "routes/petch+/signup.tsx"),
  route("logout", "routes/petch+/logout.tsx"),
] satisfies RouteConfig;
