import Login from "../Login/Login";
import Signup from "../Signup/Signup";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-wrapper">
      <div className="login-wrap">
        <Login />
      </div>
      <div className="signup-wrap">
        <Signup />
      </div>
    </div>
  );
}
