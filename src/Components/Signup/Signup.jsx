import "./Signup.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUsernameAndPassword } from "../../firebase/auth";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpassword, setCpassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== cpassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await createUsernameAndPassword(email, password, username);
      alert("Registration successful!");
      navigate("/login");
    } catch (error) {
      console.error("Error signing up: ", error.message);
      alert(error.message);
    }
  };

  return (
    <div className="wrapper">
      <div className="flip-card__inner">
        <div className="flip-card__front">
          <div className="title">Register</div>
          <form className="flip-card__form" onSubmit={handleSignup}>
            <input
              className="flip-card__input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              type="text"
              required
            />
            <input
              className="flip-card__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              required
            />
            <input
              className="flip-card__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              required
            />
            <input
              className="flip-card__input"
              value={cpassword}
              onChange={(e) => setCpassword(e.target.value)}
              placeholder="Confirm Password"
              type="password"
              required
            />
            <button type="submit" className="flip-card__btn">
              Let&apos;s go!
            </button>
          </form>
          <div className="login">
            <p>
              Have an account? <br />
              Login <Link to="/login"> here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
