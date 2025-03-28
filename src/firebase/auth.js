import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";
import { createUserData } from "./database";

export async function createUsernameAndPassword(email, password, username) {
  try {
    console.log("Attempting to create user:", { email, username });

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    console.log("Firebase Authentication User Created:", user);

    await createUserData(username, email, user);

    console.log("User data successfully created in Firestore");

    return user;
  } catch (error) {
    console.error("Detailed Error in createUsernameAndPassword:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error;
  }
}

export async function authenticateUser(email, password) {
  try {
    const verifyUser = await signInWithEmailAndPassword(auth, email, password);
    const user = verifyUser.user;
    return user;
  } catch (error) {
    console.error("Authentication Error:", {
      message: error.message,
      code: error.code,
    });
    throw error;
  }
}

export async function signOutUser() {
  return signOut(auth);
}
