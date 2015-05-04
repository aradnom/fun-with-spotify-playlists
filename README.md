# WATS ALL THIS THEN

This is a skeleton for a music player app utilizing the Spotify Web Helper
service.  It defines a tiny API for retrieving the necessary tokens for
communicating with the Web Helper listener that Spotify runs in the background.
Intended as a jumping off point for other stuff, but seemed like possibly a
handy resource for anyone else looking to use Spotify for a Player Thing of
some sort.

This also defines a simple Angular service (spotifyHelper) for sending commands
to the helper.  The following commands are supported:

* Play spotify resource (track, playlist, etc.)
* Pause
* Get client status

## Requirements

* An active Spotify client
* NodeJS

## Usage

Setup:

```
mkdir logs
cp lib/config/config.sample.js lib/config/config.js
npm install
```

Run the API:

```
node app.js
```

Then go to http://localhost:8080 for a simple demo.
