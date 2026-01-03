//@ts-nocheck
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export const Button = ({ children, variant = "primary", style, ...props }: ButtonProps) => {
  const baseStyle = {
    padding: "10px 20px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    ...style,
  };

  const variants = {
    primary: {
      backgroundColor: "#0070f3",
      color: "white",
    },
    secondary: {
      backgroundColor: "#eaeaea",
      color: "#333",
    },
  };

  return (
    <button style={{ ...baseStyle, ...variants[variant] }} {...props}>
      {children}
    </button>
  );
};
