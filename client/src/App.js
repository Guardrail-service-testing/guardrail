import React from "react";
import "./App.css";
import Nav from "./components/Nav";
import Home from "./components/Home";
import ReplaySession from "./components/ReplaySession";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="App">
        <Nav />
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/replaysession/:id" component={ReplaySession} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
