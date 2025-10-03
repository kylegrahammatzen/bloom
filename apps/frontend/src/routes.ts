import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("./components/layout.tsx", [
    layout("./components/public-layout.tsx", [
      index("./pages/home.tsx"),
      route("login", "./pages/login.tsx"),
      route("signup", "./pages/signup.tsx"),
    ]),
    layout("./components/protected-layout.tsx", [
      route("dashboard", "./pages/dashboard.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
