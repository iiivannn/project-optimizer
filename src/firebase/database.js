import { setDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

export async function createUserData(username, email, user) {
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    username,
    email,
    createdAt: new Date(),
  });
}
