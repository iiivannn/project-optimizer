import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";
import { createUserData } from "./database";

export async function createUsernameAndPassword(email, password, username) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;
  await createUserData(username, email, user);
  return user;
}

export async function authenticateUser(email, password) {
  const verifyUser = await signInWithEmailAndPassword(auth, email, password);
  const user = verifyUser.user;
  return user;
}

export async function signOutUser() {
  return signOut(auth);
}
