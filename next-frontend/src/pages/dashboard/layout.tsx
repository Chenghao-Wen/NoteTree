import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Sidebar and other layout elements can be added here */}
      {children}
    </div>
  );
}
