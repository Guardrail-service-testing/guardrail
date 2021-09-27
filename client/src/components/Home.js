import React, { useState, useEffect } from "react";
import ReplayTile from "./ReplayTile";
import axios from "axios";

function Home() {
  const [replaySessions, setReplaySessions] = useState([]);

  const replayTiles = replaySessions.map((id, idx) => {
    return <ReplayTile key={id} id={id} />;
  });

  //on Mount, issue a request to localhost:9001/replaysessions to receive id's of replay sessions
  //use those to setReplaySessions?
  useEffect(() => {
    axios
      .get("http://localhost:9001/replay-sessions")
      .then((res) => {
        setReplaySessions(res.data);
      })
      .catch((errorResponse) => {
        const response = errorResponse.response;

        if (response && response.data && response.data.error) {
          console.error(`HTTP Error: ${response.data.error}`);
        } else {
          console.error("Error: ", errorResponse);
        }
      });
  }, []);

  return (
    <main>
      <h3>Replay Sessions:</h3>
      <ul className="tiles">{replayTiles}</ul>
    </main>
  );
}

export default Home;
