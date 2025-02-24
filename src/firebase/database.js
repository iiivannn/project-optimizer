import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";

export async function createUserData(username, email, user) {
  await addDoc(collection(db, "users"), {
    uid: user.uid,
    username,
    email,
    createdAt: new Date(),
  });
}
