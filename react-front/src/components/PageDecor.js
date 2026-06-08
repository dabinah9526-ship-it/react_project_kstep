import "./PageDecor.css";

function PageDecor({ variant }) {
    if (variant === "box") {
        return (
            <div className="page-decor-box-wrap" aria-hidden="true">
                <div className="page-decor-box-band">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

                <div className="page-decor-box-norigae">
                    <div className="page-decor-box-norigae-string"></div>
                    <div className="page-decor-box-norigae-knot"></div>
                    <div className="page-decor-box-norigae-ribbon">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-decor-page-wrap" aria-hidden="true">
            <div className="page-decor-cloud page-decor-cloud-one"></div>
            <div className="page-decor-cloud page-decor-cloud-two"></div>

            <div className="page-decor-traditional-motif page-decor-motif-left"></div>
            <div className="page-decor-traditional-motif page-decor-motif-right"></div>

            <div className="page-decor-bojagi page-decor-bojagi-one"></div>
            <div className="page-decor-bojagi page-decor-bojagi-two"></div>

            <div className="page-decor-flower page-decor-flower-one">✿</div>
            <div className="page-decor-flower page-decor-flower-two">❀</div>
        </div>
    );
}

export default PageDecor;