import React from "react";
const Diff2html = require("diff2html");

function Dif(params) {
  const myHtml = Diff2html.html(Diff2html.parse(params.difStr), {
    drawFileList: false,
    matching: "lines",
    outputFormat: "side-by-side",
    synchronisedScroll: true,
    highlight: true,
  });

  return (
    <div className="dif">
      <button onClick={params.handleExit}>X</button>
      <div dangerouslySetInnerHTML={{ __html: myHtml }} />
    </div>
  );
}

export default Dif;
