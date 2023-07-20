import React from "react";
import "./button.css"; // 👈new addition

export interface ButtonProps {
  label: string;
}

const Button = ({ label }: ButtonProps) => {
  // btn class added 👇👇
  return <button className="btn">{label}</button>;
};

export default Button;
