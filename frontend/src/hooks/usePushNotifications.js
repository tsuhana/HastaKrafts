import { useEffect } from "react";
import { userAPI } from "../api/axios";

const usePushNotifications = () => {
  useEffect(() => {
    console.log("🚀 usePushNotifications hook running!");

    const saveSid = async (sid) => {
      try {
        if (!sid) return;
        // FIX: localStorage || sessionStorage (Remember Me support)
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) { console.warn("❌ No token found"); return; }
        await userAPI.savePushSid({ sid });
        console.log("✅ Push sid saved:", sid);
      } catch (err) {
        console.warn("Could not save push sid:", err.message);
      }
    };

    const tryFetchSid = () => {
      console.log("🔍 webpushr available?", typeof window.webpushr);
      if (window.webpushr && typeof window.webpushr === "function") {
        window.webpushr("fetch_id", function (sid) {
          console.log("📬 sid received:", sid);
          if (sid) saveSid(sid);
        });
      }
    };

    const timer = setTimeout(tryFetchSid, 4000);
    return () => clearTimeout(timer);
  }, []);
};

export default usePushNotifications;