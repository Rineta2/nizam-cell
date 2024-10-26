"use client";

import "@/components/styles/globals.scss";

import AuthContextProvider from "@/utlis/context/AuthContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthContextProvider>{children}</AuthContextProvider>
      </body>
    </html>
  );
}
