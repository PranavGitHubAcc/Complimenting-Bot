import React from "react";
import "./ContributorCard.css";

const ContributorCard = ({ github, name, at }) => {
    return (
        <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="contributor-card"
        >
            <div className="avatar-wrapper">
                <img
                    src={`${github}.png`}
                    alt={`${name}'s Avatar`}
                    className="avatar"
                />
                <div className="avatar-hover-overlay"></div>
            </div>

            <div className="contributor-info">
                <span className="contributor-name">{name}</span>
                <span className="contributor-id">@{at}</span>
            </div>
        </a>
    );
};

export default ContributorCard;
