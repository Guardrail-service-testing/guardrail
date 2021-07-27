# app1

To get it working, set the `replay_middleware` (main) to point to this instance.

The app listens on PORT 9001

| method | path      | notes                                                                                       |
| ------ | --------- | ------------------------------------------------------------------------------------------- |
| post   | /triplets | This path will accept JSON bodies of the request, response, and replayed response.          |
| get    | /triplets | This returns all the records as a JSON                                                      |
| get    | /deltas   | This returns deltas return by the `Diff` library. It also outputs the result on `stderror`. |


## setting up mongodb
- Run `docker run --net=host --name some-mongo -v /home/james/caps/datadir:/data/db -d mongo`
	- This will run a mongo container, named `some-mongo` on the background. See `docker ps`.

	- For now, no credentials are set up.