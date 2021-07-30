# app1

To get it working, set the `replay_middleware` (main) to point to this instance.

ENV variables to set:

- PORT=9001
- MONGO_URI:mongodb://localhost:27017/replay

| method | path                                      | notes                                                                                                  |
| ------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| post   | /triplets                                 | This path will accept JSON bodies of the request, response, and replayed response.                     |
| get    | /triplets                                 | This returns all the records of triplets as a json as a JSON                                           |
| get    | /triplets/latest                          | Returns the latest triplets                                                                            |
| get    | /triplets/latest/:correlationId           | 1 triplet                                                                                              |
| get    | /triplets/:replaySessionId/:correlationId | 1 triplet                                                                                              |
| get    | /deltas                                   | DEPRECATED This returns deltas return by the `Diff` library. It also outputs the result on `stderror`. |
| get    | /diff                                     | Diff of latest replay session                                                                          |

To be implemented:

| method | path                                  | notes |
| ------ | ------------------------------------- | ----- |
| get    | /diff/:replaySessionId                |       |
| get    | /diff/latest/:correlationId           |       |
| get    | /diff/:replaySessionId/:correlationId |       |

## setting up mongodb

- Run `docker run --net=host --name some-mongo -v /home/james/caps/datadir:/data/db -d mongo`

  - This will run a mongo container, named `some-mongo` on the background. See `docker ps`.

  - For now, no credentials are set up.
