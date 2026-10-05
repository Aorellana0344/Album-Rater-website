async function editArtist(index) {

  const artist = artists[index];

  const action = prompt(
    `Edit Artist

Type:
1 = Rename
2 = Change Image
3 = Delete Artist`
  );

  if (action === "1") {

    const newName = prompt(
      "New artist name:",
      artist.name
    );

    if (!newName) return;

    artist.name = newName.trim();

    await saveData();
    showArtists();

  }

  else if (action === "2") {

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {

      const file = input.files[0];

      if (!file) return;

      artist.image =
        await fileToBase64(file);

      await saveData();
      showArtists();

    };

    input.click();

  }

  else if (action === "3") {

    const confirmed = confirm(
      `Delete ${artist.name} and all of their albums?`
    );

    if (!confirmed) return;

    artists.splice(index, 1);

    await saveData();
    showArtists();

  }

}

async function editAlbum(index) {

  const artist =
    artists[currentArtistIndex];

  const album =
    artist.albums[index];

  const action = prompt(
    `Edit Album

Type:
1 = Rename Album
2 = Change Cover
3 = Edit Tracklist
4 = Delete Album`
  );

  if (action === "1") {

    const newTitle = prompt(
      "New album name:",
      album.title
    );

    if (!newTitle) return;

    album.title =
      newTitle.trim();

    await saveData();

    showAlbums(currentArtistIndex);

  }

  else if (action === "2") {

    const input =
      document.createElement("input");

    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {

      const file =
        input.files[0];

      if (!file) return;

      album.image =
        await fileToBase64(file);

      await saveData();

      showAlbums(currentArtistIndex);

    };

    input.click();

  }

  else if (action === "3") {

    const existing =
      album.songs
        .map(song => song.title)
        .join("\n");

    const updated =
      prompt(
        "Edit tracklist. One song per line:",
        existing
      );

    if (updated === null) return;

    const names =
      updated
        .split("\n")
        .map(name => name.trim())
        .filter(name => name !== "");

    /*
      Preserve existing ratings
      where song names still match.
    */

    const oldSongs =
      album.songs;

    album.songs =
      names.map(name => {

        const oldSong =
          oldSongs.find(
            song => song.title === name
          );

        if (oldSong) {
          return oldSong;
        }

        return {
          title: name,
          rating: "",
          isSkit: false
        };

      });

    await saveData();

    showAlbums(currentArtistIndex);

  }

  else if (action === "4") {

    const confirmed = confirm(
      `Delete ${album.title}?`
    );

    if (!confirmed) return;

    artist.albums.splice(index, 1);

    await saveData();

    showAlbums(currentArtistIndex);

  }

}