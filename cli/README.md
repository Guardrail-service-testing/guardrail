#

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

Output: `{ protocol, port, varName }`

```JSON
[{
	"url": http://localhost:333,
	"varName": DEPENDENCY_1
}]
```

We're assuming that the developer is responsible for setting the imposters.json and environment variables correctly.
