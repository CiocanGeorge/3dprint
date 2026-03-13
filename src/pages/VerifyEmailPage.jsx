import React from "react";
import { Link } from "react-router-dom";
import styles from "./VerifyEmailPage.module.css";

export default function VerifyEmailPage() {
  return (
    <div className={styles.page}>
      
      <div className={styles.decor}>
        <div className={styles.orb}></div>
      </div>

      <div className={styles.content}>

        <div className={styles.eyebrow}>
          ACCOUNT ACTIVATION
        </div>

        <h1 className={styles.title}>
          Confirmă <span className={styles.accent}>emailul</span>
        </h1>

        <p className={styles.sub}>
          Ți-am trimis un email de confirmare.  
          Deschide mesajul primit și apasă pe linkul de verificare
          pentru a activa contul.
        </p>

        <p className={styles.hint}>
          Dacă nu găsești emailul, verifică și folderul <b>Spam</b>.
        </p>

        <div className={styles.actions}>
          <Link to="/login" className={styles.primaryBtn}>
            MERGI LA LOGIN
          </Link>

          {/* <button className={styles.ghostBtn}>
            RETRIMITE EMAIL
          </button> */}
        </div>

      </div>
    </div>
  );
}