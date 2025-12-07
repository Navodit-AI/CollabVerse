"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./signup.module.css";

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [message, setMessage] = useState("");

  const handleSubmit = async(e)=>{
    e.preventDefault();

    const res = await fetch("http://localhost:8080/api/auth/signup", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    if(res.ok){
      localStorage.setItem("token", data.token || "");
      router.push("/dashboard");
    } else {
      setMessage(data.message);
    }
  };

  return (
    <div className={styles.background}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Join CollabVerse</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input 
            name="name"
            placeholder="Name"
            className={styles.input}
            onChange={(e)=> setForm({...form, name:e.target.value})}
          />
          <input 
            name="email"
            type="email"
            placeholder="Email"
            className={styles.input}
            onChange={(e)=> setForm({...form, email:e.target.value})}
          />
          <input 
            name="password"
            type="password"
            placeholder="Password"
            className={styles.input}
            onChange={(e)=> setForm({...form, password:e.target.value})}
          />
          <button className={styles.button}>Sign up</button>
        </form>

        {message && <p className={styles.error}>{message}</p>}

        <p className={styles.footer}>
          Already have an account?{" "}
          <span className={styles.link} onClick={()=> router.push("/login")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
