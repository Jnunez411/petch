import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/petch+/home.tsx"),
  route("login", "routes/petch+/login.tsx"),
  route("signup", "routes/petch+/signup.tsx"),
  route("logout", "routes/petch+/logout.tsx"),
  route("profile", "routes/petch+/profile.tsx"),
  route("profile/adopter", "routes/petch+/profile.adopter.tsx"),
  route("profile/vendor", "routes/petch+/profile.vendor.tsx"),
  route("pets", "routes/petch+/pets.tsx"),
  route("pets/create", "routes/petch+/createListing.tsx"),
  route("pets/:id", "routes/petch+/pet.$id.tsx"),
  route("ai-match", "routes/petch+/ai-match.tsx"),
] satisfies RouteConfig;
