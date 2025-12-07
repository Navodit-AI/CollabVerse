"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if(!token){
      router.push("/login");
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.logo}>CollabVerse</div>

        <button onClick={logout} className={styles.logout}>
          Logout
        </button>
      </nav>

      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to CollabVerse 👋</h1>
        <p className={styles.subtitle}>
          You’re logged in. More awesome features coming soon!
        </p>
      </main>
    </div>
  );
}
