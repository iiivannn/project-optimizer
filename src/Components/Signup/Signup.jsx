import "./Signup.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase"; // Ensure you have firebaseConfig.js
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";

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
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Store user data in Firestore
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        username,
        email,
        createdAt: new Date(),
      });

      alert("Registration successful!");
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
