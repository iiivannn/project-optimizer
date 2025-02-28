import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { signOutUser } from "../../firebase/auth";
import { db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import img1 from "../../assets/gmaps.png";

import "./Dashboard.css";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsername = async () => {
      if (currentUser) {
        try {
          const userDoc = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userDoc);
          console.log(currentUser.uid);
          if (userSnap.exists()) {
            setUsername(userSnap.data().username);
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching username:", error);
        }
      }
    };

    fetchUsername();
  }, [currentUser]);

  const handleLogout = async () => {
    await signOutUser();
    navigate("/login"); // Redirect to login page
  };

  return (
    <div>
      <div className="nav">
        <h1>RouteWise</h1>

        <button className="logout-btn" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <p className="welcome-user">
        Welcome, {username ? username : currentUser?.email}!
      </p>

      <div className="content">
        <div className="go-from">
          <div className="search">
            <label htmlFor="search-from">From:</label>
            <input type="text" name="search-from" />
          </div>

          <img className="from-img" src={img1} alt="Google Maps Philippines" />
        </div>

        <div className="go-to">
          <div className="search">
            <label htmlFor="search-to">To:</label>
            <input type="text" name="search-to" />
          </div>
          <img className="to-img" src={img1} alt="Google Maps Philippines" />
        </div>
      </div>
    </div>
  );
}
