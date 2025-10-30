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

export default app;
