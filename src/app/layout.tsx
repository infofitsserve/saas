import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Infofitsserve | People operations, made clearer",
  description: "ShiftPilot and RecruitFlow AI from Infofitsserve Consultant Services.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
