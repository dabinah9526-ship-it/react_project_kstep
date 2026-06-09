import { useEffect, useState } from "react";
import { getLang, setLang } from "../utils/language";
import "./LanguageToggle.css";

function LanguageToggle() {
    const [language, setLanguage] = useState(getLang());

    useEffect(() => {
        function changeLanguage() {
            setLanguage(getLang());
        }

        window.addEventListener("kstepLanguageChange", changeLanguage);

        return () => {
            window.removeEventListener("kstepLanguageChange", changeLanguage);
        };
    }, []);

    function changeKo() {
        setLang("ko");
        setLanguage("ko");
    }

    function changeEn() {
        setLang("en");
        setLanguage("en");
    }

    return (
        <div className="language-toggle">
            <button
                type="button"
                className={language === "ko" ? "active" : ""}
                onClick={changeKo}
            >
                한국어
            </button>

            <button
                type="button"
                className={language === "en" ? "active" : ""}
                onClick={changeEn}
            >
                English
            </button>
        </div>
    );
}

export default LanguageToggle;