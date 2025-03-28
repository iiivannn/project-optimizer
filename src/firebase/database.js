import { setDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

export async function createUserData(username, email, user) {
  try {
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      username,
      email,
      createdAt: new Date(),
    });
    console.log("User data successfully created in Firestore");
  } catch (error) {
    console.error("Error creating user data in Firestore:", error);
    throw error;
  }
}
