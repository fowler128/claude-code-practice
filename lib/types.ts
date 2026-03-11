export type NavigationRoute =
  | "/dashboard"
  | "/leads"
  | "/deals"
  | "/clients"
  | "/engagements"
  | "/tasks"
  | "/finance"
  | "/knowledge"
  | "/settings";

export interface ShellNavItem {
  href: NavigationRoute;
  label: string;
}
