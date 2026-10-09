import type { Metadata } from "next";
import { AccountProfile } from "@/components/AccountProfile";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return <AccountProfile />;
}
