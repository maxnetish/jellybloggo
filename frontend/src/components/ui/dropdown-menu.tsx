import * as React from "react"
import * as BaseMenu from "@base-ui/react/menu"
import { cn } from "@/lib/utils"

const BaseMenuRoot = BaseMenu.Menu.Root
const BaseMenuTrigger = BaseMenu.Menu.Trigger
const BaseMenuPortal = BaseMenu.Menu.Portal
const BaseMenuPositioner = BaseMenu.Menu.Positioner
const BaseMenuPopup = BaseMenu.Menu.Popup
const BaseMenuItem = BaseMenu.Menu.Item
const BaseMenuLinkItem = BaseMenu.Menu.LinkItem
const BaseMenuSeparator = BaseMenu.Menu.Separator
const BaseMenuList = BaseMenu.Menu.List
const BaseMenuGroup = BaseMenu.Menu.Group

const DropdownMenu = BaseMenuRoot
const DropdownMenuTrigger = BaseMenuTrigger

const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof BaseMenuPopup>,
  React.ComponentPropsWithoutRef<typeof BaseMenuPopup>
>(({ className, children, ...props }, ref) => (
  <BaseMenuPortal>
    <BaseMenuPositioner sideOffset={4}>
      <BaseMenuPopup
        ref={ref}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      >
        <BaseMenuList>{children}</BaseMenuList>
      </BaseMenuPopup>
    </BaseMenuPositioner>
  </BaseMenuPortal>
))
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof BaseMenuItem>,
  React.ComponentPropsWithoutRef<typeof BaseMenuItem> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <BaseMenuItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuLinkItem = React.forwardRef<
  React.ComponentRef<typeof BaseMenuLinkItem>,
  React.ComponentPropsWithoutRef<typeof BaseMenuLinkItem>
>(({ className, ...props }, ref) => (
  <BaseMenuLinkItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground",
      className
    )}
    {...props}
  />
))
DropdownMenuLinkItem.displayName = "DropdownMenuLinkItem"

const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof BaseMenuSeparator>,
  React.ComponentPropsWithoutRef<typeof BaseMenuSeparator>
>(({ className, ...props }, ref) => (
  <BaseMenuSeparator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuList = BaseMenuList
const DropdownMenuGroup = BaseMenuGroup

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuList,
  DropdownMenuGroup,
}