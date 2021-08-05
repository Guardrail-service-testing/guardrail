# Guardrail Service Testing

## Capturing traffic

1. Install the script
2. Create dependencies.json

   - `destinationURL`: This is the ["origin"](https://nodejs.org/api/url.html#url_url_origin) of the destination host. Origin is composed of the scheme, hostname, or IP, and port.
     For now, only http is supported.
   - `proxyPort`: This is the port the proxy will receive requests. It's mandatory that one is provided.
   - `varName`: This name identifies each proxy.

```JSON
[
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
]
```

3. Run `guardrail setup-proxies`. The will create and start Mountebank proxies in recording mode. The list of proxies is written to a file called `proxy-list.json` with the following content.

```JSON
{
  "proxyList": [
    {
      "varName": "DEPENDENCY_1",
      "to": "https://downstream-service1",
      "proxy": "http://localhost:5002"
    },
    {
      "varName": "DEPENDENCY_2",
      "to": "http://localhost:9000",
      "proxy": "http://localhost:5003"
    }
  ]
}
```

We're assuming that the developer is responsible for setting the imposters.json and environment variables correctly.

## Notes On Stopping Mountebank

Caution. Currently, the command `guardrail stop` will remove all Mountebank proxies. If you are proxying services in production, stopping may cause service interruption.
