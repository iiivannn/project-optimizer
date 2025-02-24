import { useAuth } from "../contexts/AuthContext";
import { signOutUser } from "../../firebase/auth";

export default function Dashboard() {
  const { currentUser } = useAuth();
  console.log(currentUser);

  return (
    <div>
      <p>This is Dashboard</p>
      <button type="button" onClick={signOutUser}>
        Logout
      </button>
    </div>
  );
}
