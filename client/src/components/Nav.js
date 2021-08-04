import React from 'react';
import '../App.css';
import { Link } from 'react-router-dom';

function Nav() {
  return (
    <nav>
      <Link to="/">
        <h1>Guardrail</h1>
      </Link>
    </nav>
  )
}

export default Nav;