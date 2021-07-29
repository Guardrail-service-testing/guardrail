const Diff = require("diff");

const omit = (keys, obj) => {
  if (keys.length === 0) return obj;
  const { [keys.pop()]: omitted, ...rest } = obj;
  return omit(keys, rest);
};

const pruneResponse = (response, ignoreHeaders = []) => {
  const { status, headers, body } = response;
  const { timestamp, latency } = response.meta;
  const filteredHeaders = omit(ignoreHeaders, headers);

  return { status, headers: filteredHeaders, body, timestamp, latency };
};

const convertBodyToText = (response) => {
  const { body, ...rest } = response;
  const text = Buffer.from(response.body).toString();
  return { body: text, ...rest };
};

const isDifferentBody = (response, replayedResponse) => {
  if (
    Buffer.compare(
      Buffer.from(response.body),
      Buffer.from(replayedResponse.body)
    ) !== 0
  ) {
    return true;
  }
  return false;
};

const correlationIdOf = (httpData) => {
  return httpData.headers["x-correlation-id"];
};

const unifiedDiff = (
  oldTitle,
  newTitle,
  oldText,
  newText,
  oldHeader,
  newHeader
) => {
  return Diff.createTwoFilesPatch(
    oldTitle,
    newTitle,
    oldText,
    newText,
    oldHeader,
    newHeader
  );
};

const isDifferentStatusAndBody = ({ request, response, replayedResponse }) => {
  if (response.status !== replayedResponse.status) return true;

  if (isDifferentBody(response, replayedResponse)) return true;

  return false;
};

const diffJson = (whichPart, recorded, replayed) => {
  return unifiedDiff(
    `recorded ${whichPart}`,
    `replayed ${whichPart}`,
    JSON.stringify(recorded),
    JSON.stringify(replayed)
  )
}

const diffTwoResponses = ({ response, replayedResponse, ignoredHeaders }) => {
  const { correlationId, replaySessionId } = response;
  const recorded = convertBodyToText(pruneResponse(response, ignoredHeaders));
  const replayed = convertBodyToText(pruneResponse(replayedResponse, ignoredHeaders));

  const statusUnifiedDiffPatch = diffJson('body', recorded.status, replayed.status)
  const headersUnifiedDiffPatch = diffJson('body', recorded.headers, replayed.headers)
  const bodyUnifiedDiffPatch = diffJson('body', recorded.body, replayed.body)

  return {
    correlationId, replaySessionId, ignoredHeaders, statusUnifiedDiffPatch, headersUnifiedDiffPatch, bodyUnifiedDiffPatch,
    recorded,
    replayed,
  };
};

module.exports = {
  omit,
  pruneResponse,
  convertBodyToText,
  isDifferentBody,
  correlationIdOf,
  unifiedDiff,
  diffTwoResponses,
  isDifferentStatusAndBody,
};
