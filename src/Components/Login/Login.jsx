/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import "./Login.css";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="wrapper">
      <div className="flip-card__inner">
        <div className="flip-card__front">
          <div className="title">Log in</div>
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
