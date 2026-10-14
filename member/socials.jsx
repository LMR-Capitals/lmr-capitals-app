import React from "react";
import Icon from "./icons";
export const socials = [
  ["X / Twitter", "https://x.com/lmrcapitals"],
  ["Discord", "https://discord.gg/jfkzn5GS"],
  ["YouTube", "https://www.youtube.com/@LMRcapitals"],
  ["Instagram", "https://www.instagram.com/lmrcapitals/"],
];
export default function SocialLinks() {
  return (
    <nav className="circle-socials" aria-label="LMR social channels">
      {socials.map(([label, href]) => (
        <a href={href} key={label} target="_blank" rel="noopener noreferrer">
          {label}
          <Icon name="external" size={12} />
        </a>
      ))}
    </nav>
  );
}
