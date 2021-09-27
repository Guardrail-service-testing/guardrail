import React from "react";

function DifPreview(params) {
  return (
    <li
      onFocus={params.handleSelect}
      tabIndex={params.tabindex}
      className="preview"
      id={params.id}
    >
      <p>{params.id}</p>
    </li>
  );
}

export default DifPreview;
