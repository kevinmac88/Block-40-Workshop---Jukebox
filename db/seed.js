import db from "#db/client";
import { faker } from "@faker-js/faker";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
  await db.query("DELETE FROM playlists_tracks"); //delete this first bcuz it depends on the other 2 tables
  await db.query("DELETE FROM tracks");
  await db.query("DELETE FROM playlists");

  // DELETE FROM different from DROP TABLE -> delete from keeps table structure but deletes contents, DROP TABLE eliminates the entire table itself

  await db.query("ALTER SEQUENCE playlists_id_seq RESTART WITH 1");
  await db.query("ALTER SEQUENCE tracks_id_seq RESTART WITH 1");
  await db.query("ALTER SEQUENCE playlists_tracks_id_seq RESTART WITH 1");

  //above code resets ID sequence so it doesnt continue from where it last was after I delete the contents of the table

  console.log("Seeding tracks...");

  const trackCount = 25;

  for (let i = 0; i < trackCount; i++) {
    const name = faker.music.songName();
    const duration_ms = faker.number.int({ min: 120000, max: 360000 });

    await db.query("INSERT INTO tracks (name, duration_ms) VALUES ($1, $2)", [
      name,
      duration_ms,
    ]);
  }

  console.log("Seeding playlists...");

  //setting up object keys that I can reference to further randomize playlist names
  const playlistTypes = [
    { prefix: "Best of", suffix: "Classics" },
    { prefix: "Ultimate", suffix: "Hits" },
    { prefix: "Chill", suffix: "Vibes" },
    { prefix: "Workout", suffix: "Energy" },
    { prefix: "Road Trip", suffix: "Anthems" },
    { prefix: "Late Night", suffix: "Jams" },
    { prefix: "Party", suffix: "Mix" },
    { prefix: "Focus", suffix: "Beats" },
    { prefix: "Throwback", suffix: "Favorites" },
    { prefix: "Indie", suffix: "Discoveries" },
  ];

  for (const type of playlistTypes) {
    const name = `${type.prefix} ${faker.music.genre()} ${type.suffix}`;
    const description = faker.lorem.sentence();

    await db.query(
      "INSERT INTO playlists (name, description) VALUES ($1, $2)",
      [name, description]
    );
  }

  console.log("Seeding playlist-track relationships");
  const relationshipCount = 20;

  for (let i = 0; i < relationshipCount; i++) {
    const playlist_id = faker.number.int({ min: 1, max: 10 }); //sets up random playlist ID 1-10
    const track_id = faker.number.int({ min: 1, max: 25 }); //sets up random track id 1-25

    try {
      await db.query(
        "INSERT INTO playlists_tracks (playlist_id, track_id) VALUES ($1, $2)",
        [playlist_id, track_id]
      );
    } catch (error) {
      if (error.code !== "23505") throw error;
    }
    //that is the error code for unique constraint violation. i want to ignore it so the seed script doesnt crash and stop when it violates the unique constraint, which could happen because of the random generation - i just want it to continue onwards. the constraint is still enforced in my SQL and if it is any other error it will throw the error.
  }

  console.log("Seeding complete - rejoice my friend");
  console.log(`   ${trackCount} tracks`);
  console.log(`   ${playlistTypes.length} playlists`);
  console.log(
    `   ${relationshipCount} playlist-track relationships (duplicates skipped)`
  );
}
