import { useEffect, useState } from "react";
import "./ScrollTopButton.css";

function ScrollTopButton() {
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        function checkScroll() {
            if (window.scrollY > 350) {
                setShowButton(true);
            } else {
                setShowButton(false);
            }
        }

        window.addEventListener("scroll", checkScroll);
        checkScroll();

        return () => {
            window.removeEventListener("scroll", checkScroll);
        };
    }, []);

    function moveTop() {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    return (
        <button
            type="button"
            className={showButton ? "scroll-top-btn show" : "scroll-top-btn"}
            onClick={moveTop}
            aria-label="맨 위로 이동"
            title="맨 위로"
        >
            <span>↑</span>
        </button>
    );
}

export default ScrollTopButton;