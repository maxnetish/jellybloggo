"use client";

import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const theme = createTheme({
  primaryColor: "blue",
});

export function MantineProviders({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme}>
      <Notifications
        position="top-right"
        autoClose={10000}
        pauseResetOnHover="notification"
      />
      {children}
    </MantineProvider>
  );
}