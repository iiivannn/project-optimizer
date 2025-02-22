import "./Signup.css";

import { Link } from "react-router-dom";

export default function Signup() {
  return (
    <div className="wrapper">
      <div className="flip-card__inner">
        <div className="flip-card__front">
          <div className="title">Register</div>
          <form className="flip-card__form" action="/login">
            <input
              className="flip-card__input"
              name="username"
              placeholder="Username"
              type="text"
            />
            <input
              className="flip-card__input"
              name="password"
              placeholder="Password"
              type="password"
            />
            <input
              className="flip-card__input"
              name="cpassword"
              placeholder="Confirm Password"
              type="password"
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
