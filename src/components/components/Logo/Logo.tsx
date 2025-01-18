import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/assets/logo.svg";

export function LogoComponent() {
  return (
    <Link to="/">
      <img src={Logo} alt="Logo do projeto Chat SAEL" />
    </Link>
  );
}
