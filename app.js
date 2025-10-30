import express from "express";
import db from "#db/client";

const app = express();

//my middleware goes here
app.use(express.json()); //this is what allows me to convert icoming JSON into JS objects. otherwise for ex console.log(req.body) would be undefined for ex.

//track routes
app.get("/tracks", async (req, res, next) => {
  try {
    const result = await db.query("SELECT * FROM tracks");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

//get specific track

app.get("/tracks/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    //validate id is a #
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID must be a #" });
    }

    const result = await db.query("SELECT * FROM tracks WHERE id = $1", [id]);

    //check if track was found
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "track not found" });
    }

    //send single track back
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

//playlist routes
app.get("/playlists", async (req, res, next) => {
  try {
    const result = await db.query("SELECT * FROM playlists");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

//create new playlist
app.post("/playlists", async (req, res, next) => {
  try {
    //check if req body exists for npm test condition
    if (!req.body) {
      return res.status(400).json({ error: "req body is required" });
    }
    const { name, description } = req.body;

    // validate fields
    if (!name || !description) {
      return res.status(400).json({
        error: "Name and description are required",
      });
    }

    const result = await db.query(
      "INSERT INTO playlists (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

//get spec. playlist
app.get("/playlists/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID must be #" });
    }

    const result = await db.query("SELECT * FROM playlists WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "playlist not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

//get tracks in a playlist - need to JOIN tables
app.get("/playlists/:id/tracks", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID must be a num" });
    }

    //check if playlist exists (if i dont, client cant tell if playlist is just empty or doesnt exist)
    const playlistCheck = await db.query(
      "SELECT * FROM playlists WHERE id = $1",
      [id]
    );

    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ error: "playlist not found" });
    }

    //get all tracks for playlist
    const result = await db.query(
      `SELECT tracks.*
        FROM tracks
        JOIN playlists_tracks ON tracks.id = playlists_tracks.track_id
        WHERE playlists_tracks.playlist_id = $1`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

//add track to playlist
app.post("/playlists/:id/tracks", async (req, res, next) => {
  try {
    const { id } = req.params;

    //validate playlist id from url
    if (isNaN(id)) {
      return res.status(400).json({ error: "playlist id must be #" });
    }

    //check if req body exists for npm test
    if (!req.body) {
      return res.status(400).json({ error: "req body required" });
    }
    const { trackId } = req.body;
    //val. trackId in req body
    if (!trackId) {
      return res.status(400).json({ error: "track ID req." });
    }

    if (isNaN(trackId)) {
      return res.status(400).json({ error: "trackID must be a #" });
    }

    //check if playlist exists
    const playlistCheck = await db.query(
      "SELECT * FROM playlists WHERE id = $1",
      [id]
    );

    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ error: "playlist not found sorry dude" });
    }

    //check if track exists
    const trackCheck = await db.query("SELECT * FROM tracks WHERE id = $1", [
      trackId,
    ]);

    if (trackCheck.rows.length === 0) {
      return res.status(400).json({ error: "track not found" });
    }

    //insert track to playlist
    const result = await db.query(
      "INSERT INTO playlists_tracks (playlist_id, track_id) VALUES ($1, $2) RETURNING *",
      [id, trackId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    // if unique constraint is violated tell them otherwise kick to error handler
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Track is already in this playlist",
      });
    }
    next(error);
  }
});

//error handling middleware (goes last always)
app.use((error, req, res, next) => {
  console.error(error);

  // handle different postgres errors
  if (error.code) {
    switch (error.code) {
      case "23503": // for foreign key violation
        return res.status(400).json({
          error: "trying to reference a record that doesn't exist",
        });
      case "23505": // unique constraint violation
        return res.status(400).json({
          error: "duplicate error",
        });
      default:
        return res.status(500).json({
          error: "DB error",
        });
    }
  }

  // generic server error
  res.status(500).json({
    error: "Internal server error",
  });
});

export default app;
