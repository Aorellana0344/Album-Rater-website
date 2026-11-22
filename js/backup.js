const exportBtn =
  document.getElementById("exportBtn");

const importFile =
  document.getElementById("importFile");


exportBtn.addEventListener("click", () => {

  const backup = {
    app: "Album Rater",
    version: 1,
    exportDate: new Date().toISOString(),
    artists: artists
  };

  const json =
    JSON.stringify(backup, null, 2);

  const blob =
    new Blob(
      [json],
      { type: "application/json" }
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  const date =
    new Date()
      .toISOString()
      .split("T")[0];

  link.href = url;

  link.download =
    `album-rater-backup-${date}.json`;

  link.click();

  URL.revokeObjectURL(url);

});


importFile.addEventListener(
  "change",
  async event => {

    const file =
      event.target.files[0];

    if (!file) {
      return;
    }

    try {

      const text =
        await file.text();

      const backup =
        JSON.parse(text);


      if (
        !backup.artists ||
        !Array.isArray(backup.artists)
      ) {

        alert(
          "This does not look like a valid Album Rater backup."
        );

        return;
      }


      const confirmed =
        confirm(
          "Importing this backup will replace the albums currently saved in the app. Continue?"
        );


      if (!confirmed) {
        importFile.value = "";
        return;
      }


      if (backup.artists.some(artist => !artist || typeof artist.name !== "string" || !Array.isArray(artist.albums) || artist.albums.some(album => !album || typeof album.title !== "string" || !Array.isArray(album.songs)))) {
        throw new Error("Invalid backup structure");
      }
      const previousArtists = artists;
      artists = backup.artists;
      try { await saveData(); }
      catch (error) { artists = previousArtists; throw error; }

      showArtists();

      importFile.value = "";

      alert(
        "Backup restored successfully!"
      );

    }

    catch (error) {

      alert(
        "There was a problem reading the backup file."
      );

      console.error(error);

    }

  }
);
