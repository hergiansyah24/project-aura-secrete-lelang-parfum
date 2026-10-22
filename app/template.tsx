"use client";

import { useEffect } from "react";

export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    console.log("Template mounted");
  }, []);

  return <>{children}</>;
}
