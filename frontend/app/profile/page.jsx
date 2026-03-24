import dynamic from "next/dynamic";

const ProfilePage = dynamic(() => import("../../src/views/ProfilePage"), { ssr: false });

export default function Profile() {
  return <ProfilePage />;
}
