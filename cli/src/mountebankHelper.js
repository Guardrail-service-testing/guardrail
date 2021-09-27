const createImposterBody = ({ protocol, to, port }, ...predicateMatches) => {
  return {
    port,
    protocol,
    stubs: [
      {
        responses: [
          {
            proxy: {
              to,
              mode: "proxyAlways",
              addWaitBehavior: true,
              predicateGenerators: [
                {
                  matches: { path: true },
                },
                ...predicateMatches,
              ],
            },
          },
        ],
      },
    ],
  };
};

const matchBody = { matches: { body: true } };
const matchXCorrelationIdHeader = {
  matches: { headers: { "x-correlation-id": true } },
};

const splitProtocolUrl = (destinationUrl) => {
  const url = new URL(destinationUrl);
  const protocol = url.protocol.replace(":", "");
  const { origin, port } = url;
  return { protocol, to: origin, port };
};

const createLocalhostUrl = ({ protocol, port }) => {
  return `${protocol}://localhost:${port}`;
};

const createImposters = (destinationList) => {
  const protocol = "http"; // Supported protocol
  const proxyList = [];
  const imposters = destinationList.map(
    ({ destinationURL, proxyPort, varName }) => {
      const { to } = splitProtocolUrl(destinationURL);
      const imposter = createImposterBody(
        { protocol, to, port: Number(proxyPort) },
        matchBody,
        matchXCorrelationIdHeader
      );
      proxyList.push({
        varName,
        to,
        proxy: createLocalhostUrl({ protocol, port: proxyPort }),
      });
      return imposter;
    }
  );

  return { imposters, proxyList };
};

const specString = `[
  {
    "varName": "DEPENDENCY_1",
    "destinationURL": "https://downstream-service1",
    "proxyPort": 5002
  },
  {
    "varName": "DEPENDENCY_2",
    "destinationURL": "http://localhost:9000",
    "proxyPort": 5003
  }
]`;

const { imposters, proxyList } = createImposters(JSON.parse(specString));
const impostersString = JSON.stringify(imposters, null, 2);

module.exports = {
  createImposterBody,
  createImposters,
  matchBody,
  matchXCorrelationIdHeader,
};
