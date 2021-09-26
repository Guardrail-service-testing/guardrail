# Guardrail Service Testing

## What is Guardrail

Guardrail is an open-source tool that generates regression tests for stateless non-persisted microservices using recorded production traffic. It combines traffic replay and service virtualization to test a microservice in isolation.

There are three core functionalities to Guardrail:

1. **Record** traffic in the production environment
2. **Replay** traffic in the testing environment
3. **Report** the results from the testing environment

## Using Guardrail

Let’s walk through a typical workflow for a developer using Guardrail.

### 1. Record

The first step is to record traffic upstream and downstream of the microservice in production that we are changing.

#### 1.1 Verify Application Meets Requirements

There are a few requirements an architecture must meet before Guardrail can be deployed.

1. The network traffic between microservices must be unencrypted. This scenario typically will involve a firewall and a gateway that separates the private and the public internet. Nginx as an API gateway with TrueCrypt is a basic example of this scenario. It is possible to use Guardrail with encrypted traffic, but the developer must add their own TLS termination proxy.

2. The application must use the “correlation ID” pattern to trace requests. A “correlation ID” is a unique HTTP header value attached to a request when it passes into an application’s private network.

3. The use case is limited to non-persisted stateless services that are purely for data transformation.

4. Guardrail can work with architectures with (synchronous) HTTP communication patterns using a combination of REST and JSON. It doesn't work with asynchronous communication patterns that use HTTP Polling or message queues.

#### 1.2 Installation in a Production Environment

Install [Goreplay](https://github.com/buger/goreplay), [Mountebank](https://github.com/bbyars/mountebank), and [Guardrail](https://github.com/Guardrail-service-testing/guardrail) on the production machine of the microservice you will eventually be changing.

#### 1.3 Change URLs of Downstream Dependencies

Traffic between the microservice and its downstream dependencies is recorded using a proxy, so the URLs the microservice uses to address those dependencies must be changed to the URLs of the proxies.

Declare a list of dependency URLs in a file called `dependency.json` with the following format and then run the command `guardrail init`. Specify these details for each:

- `destinationURL`: This is the ["origin"](https://nodejs.org/api/url.html#url_url_origin) of the destination host. Origin is composed of the scheme, hostname, or IP, and port.
- `proxyPort`: This is the port the proxy will receive requests.
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

#### 1.4 Start Recording

When ready, run `guardrail record`.

From that point on, GoReplay is recording upstream traffic, and Mountebank is recording downstream traffic. Traffic is recorded to the production host’s file system.

#### 1.5 Stop Recording

Stop upstream and downstream traffic recording by quitting Guardrail (^C). Then, the URLs addressing the downstream recording proxies should be reverted to the URLs that point directly towards the downstream dependencies.

### 2. Replay

#### 2.1 Setup the Testing Environment

Follow the same installation on the host the test will run on, then spin up the updated microservice on that machine. The microservice should be configured using the same URLs declared on `dependencies.json`. If it is configured with addresses of the actual dependencies, the service under test will issue requests to production dependencies.

#### 2.2 Data Transfer

Transfer the files of recorded traffic from the production host to the testing host.

#### 2.4 Replay traffic

Run `guardrail replay` command in the testing host. This starts up the Mountebank virtualized services using the data collected from production and then replays the upstream requests against the service under test using GoReplay. It also starts up a component of Guardrail called the “Reporting Service,” which becomes relevant in the next section.

The same traffic recording can be replayed multiple times, allowing developers to iterate on the service under test without having to re-record traffic.

### 3. Report Results

#### 3.1 Calculate and View Results

In addition to storing traffic data in a database, the Reporting Service calculates the results of a replay session and serves the results to the Guardrail user interface. Results are a comparison of the actual and expected HTTP response status, headers, and JSON body.

Once a replay session finishes, view the results hosted at `http://localhost:9001`. Requests that had different responses from what was recorded in production are listed, along with the expected and actual responses. It also shows a few metrics on performance parity that compares response times, error rates, timeouts.
