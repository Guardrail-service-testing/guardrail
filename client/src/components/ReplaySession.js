import React, { useState, useEffect } from "react";
//import data from "../data.js"
import DifPreview from "./DifPreview";
import Dif from "./Dif";
import axios from "axios";

function ReplaySession(params) {
  const [report, setReport] = useState({});
  const [difs, setDifs] = useState([]);
  const [selected, setSelected] = useState(undefined);

  function handleSelect(e) {
    e.preventDefault();
    setSelected(e.target.id);
  }

  function handleExit(e) {
    e.preventDefault();
    setSelected(undefined);
  }

  //issue a request to localhost:9000/replaysession/id

  useEffect(() => {
    axios
      .get("http://localhost:9001/report")
      .then((res) => {
        setReport(res.data);
      })
      .catch((errorResponse) => {
        const response = errorResponse.response;

        if (response && response.data && response.data.error) {
          console.error(`HTTP Error: ${response.data.error}`);
        } else {
          console.error("Error: ", errorResponse);
        }
      });

    axios
      .get("http://localhost:9001/diff")
      .then((res) => {
        setDifs(res.data);
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
    <>
      <header>
        <h1>Replay Overview (#{report.replaySessionId})</h1>
        <table>
          <tbody>
            <tr>
              <td>Number of Requests</td>
              <td>{report.totalRequests}</td>
            </tr>
            <tr>
              <td>Number of Recorded Response Timeouts</td>
              <td>{report.recordedTimeouts}</td>
            </tr>
            <tr>
              <td>Number of Replayed Response Timeouts</td>
              <td>{report.replayedTimeouts}</td>
            </tr>
            <tr>
              <td>Response Body Parity</td>
              <td>
                {(report.totalRequests - report.notError500ButDifferentBody) /
                  report.totalRequests}
                %
              </td>
            </tr>
            <tr>
              <td>500's issued (production)</td>
              <td>{report.recordedError500}</td>
            </tr>
            <tr>
              <td>500's issued (replay)</td>
              <td>{report.replayedError500}</td>
            </tr>
            <tr>
              <td>Average response time (production)</td>
              <td>{report.recordedAverageLatencies}</td>
            </tr>
            <tr>
              <td>Average response time (replay)</td>
              <td>{report.replayedAverageLatencies}</td>
            </tr>
          </tbody>
        </table>
      </header>
      <section>
        <h3>Mishandled Requests</h3>
        <ul>
          {difs.length === 0 ? (
            <li>None</li>
          ) : (
            difs.map((dif, idx) => {
              if (dif.correlationId === selected) {
                return (
                  <Dif
                    handleExit={handleExit}
                    key={dif.correlationId}
                    id={dif.correlationId}
                    difStr={dif.bodyUnifiedDiffPatch}
                  />
                );
              } else {
                return (
                  <DifPreview
                    handleSelect={handleSelect}
                    key={dif.correlationId}
                    id={dif.correlationId}
                    tabindex={idx}
                  />
                );
              }
            })
          )}
        </ul>
      </section>
    </>
  );
}

export default ReplaySession;
