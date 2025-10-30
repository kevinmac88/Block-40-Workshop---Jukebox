DROP TABLE IF EXISTS playlists_tracks;
DROP TABLE IF EXISTS tracks;
DROP TABLE IF EXISTS playlists;

CREATE TABLE playlists (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE tracks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    duration_ms INTEGER NOT NULL
);

-- this is our junciton table, customary to just combine the 2 tables it refernces in the name
CREATE TABLE playlists_tracks (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,

    CONSTRAINT fk_playlist
    FOREIGN KEY (playlist_id)
    REFERENCES playlists(id)
    -- above 2 lines mean: playlist_id column must contain a value that exists already in playlists.id.
    ON DELETE CASCADE,

    CONSTRAINT fk_track
    FOREIGN KEY (track_id)
    REFERENCES tracks(id)
    ON DELETE CASCADE,

-- this one ensures a track can only be in a playlist one time
    CONSTRAINT unique_playlist_track
    UNIQUE (playlist_id, track_id)
    --above line means that you cannot add the same track to the same playlist twice
);