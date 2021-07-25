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

module.exports = {
  omit,
  pruneResponse,
  convertBodyToText,
}