const omit = (keys, obj) => {
  if (keys.length === 0) return obj
  const { [keys.pop()]: omitted, ...rest } = obj;
  return omit(keys, rest);
}

const pruneResponse = (response, ignoreHeaders = []) => {
  const { status, headers, body } = response
  const filteredHeaders = omit(ignoreHeaders, headers)

  return { status, headers: filteredHeaders, body }
}

const convertBodyToText = (response) => {
  const { body, ...rest } = response
  const text = Buffer.from(response.body).toString()
  return { body: text, ...rest }
}

const isDifferentBody = (response, replayedResponse) => {
  if (Buffer.compare(
    Buffer.from(response.body),
    Buffer.from(replayedResponse.body)
  ) !== 0) {
    return true
  }
  return false
}

const correlationIdOf = (httpData) => {
  return httpData.headers['x-correlation-id'];
}

module.exports = {
  omit,
  pruneResponse,
  convertBodyToText,
  isDifferentBody,
  correlationIdOf,
}