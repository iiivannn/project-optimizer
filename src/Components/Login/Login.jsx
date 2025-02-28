/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import "./Login.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { authenticateUser } from "../../firebase/auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await authenticateUser(email, password, username);
      navigate("/dashboard"); // Redirect after successful signup
    } catch (error) {
      console.error("Error signing up: ", error.message);
      alert(error.message);
    }
  };

  return (
    <div className="wrapper">
      <div className="flip-card__inner">
        <div className="flip-card__front">
          <div className="title">Log in</div>
          <form className="flip-card__form" onSubmit={handleLogin}>
            <input
              className="flip-card__input"
              name="email"
              placeholder="Email"
              type="text"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="flip-card__input"
              name="password"
              placeholder="Password"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="flip-card__btn">
              Let&apos;s go!
            </button>
          </form>
          <div className="register">
            <p>
              Don&apos;t have an account? <br />
              Register <Link to="/signup"> here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
