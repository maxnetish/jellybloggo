import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as BaseNav from "@base-ui/react/navigation-menu"
import { cn } from "@/lib/utils"

const BaseNavigationMenu = BaseNav.NavigationMenu.Root;
const BaseNavigationMenuList = BaseNav.NavigationMenu.List;
const BaseNavigationMenuItem = BaseNav.NavigationMenu.Item;
const BaseNavigationMenuContent = BaseNav.NavigationMenu.Content;
const BaseNavigationMenuTrigger = BaseNav.NavigationMenu.Trigger;
const BaseNavigationMenuLink = BaseNav.NavigationMenu.Link;

const NavigationMenu = React.forwardRef<
  React.ComponentRef<typeof BaseNavigationMenu>,
  React.ComponentPropsWithoutRef<typeof BaseNavigationMenu>
>(({ className, children, ...props }, ref) => (
  <BaseNavigationMenu
    ref={ref}
    className={cn(
      "relative z-10 flex max-w-max flex-1 items-center justify-center",
      className
    )}
    {...props}
  >
    {children}
  </BaseNavigationMenu>
))
NavigationMenu.displayName = "NavigationMenu"

const NavigationMenuList = React.forwardRef<
  React.ComponentRef<typeof BaseNavigationMenuList>,
  React.ComponentPropsWithoutRef<typeof BaseNavigationMenuList>
>(({ className, ...props }, ref) => (
  <BaseNavigationMenuList
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
    {...props}
  />
))
NavigationMenuList.displayName = "NavigationMenuList"

const NavigationMenuItem = BaseNavigationMenuItem

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:text-accent-foreground data-[open]:bg-accent/50 data-[open]:hover:bg-accent data-[open]:focus:bg-accent"
)

const NavigationMenuTrigger = React.forwardRef<
  React.ComponentRef<typeof BaseNavigationMenuTrigger>,
  React.ComponentPropsWithoutRef<typeof BaseNavigationMenuTrigger>
>(({ className, children, ...props }, ref) => (
  <BaseNavigationMenuTrigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}
  </BaseNavigationMenuTrigger>
))
NavigationMenuTrigger.displayName = "NavigationMenuTrigger"

const NavigationMenuContent = React.forwardRef<
  React.ComponentRef<typeof BaseNavigationMenuContent>,
  React.ComponentPropsWithoutRef<typeof BaseNavigationMenuContent>
>(({ className, ...props }, ref) => (
  <BaseNavigationMenuContent
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto",
      className
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = "NavigationMenuContent"

const NavigationMenuLink = BaseNavigationMenuLink

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
}