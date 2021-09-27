import React from "react";
import "../App.css";
import { Link } from "react-router-dom";

function ReplayTile(params) {
  return (
    <li className="session-tile">
      <Link to={`/replaysession/${params.id}`}>
        <h3>{params.id}</h3>
      </Link>
    </li>
  );
}

export default ReplayTile;
