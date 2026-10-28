async function editArtistDescription(index) {
  const artist = artists[index];

  const updated = prompt(
    "Edit artist description:",
    artist.description || ""
  );

  if (updated === null) return;

  artist.description = updated.trim();
  await saveData();

  if (currentArtistIndex === index) {
    showAlbums(index);
  }
  else {
    showArtists();
  }
}


async function editArtist(index) {
  const artist = artists[index];

  const action = prompt(
    `Edit Artist\n\nType:\n1 = Rename\n2 = Change Image\n3 = Edit Description\n4 = Delete Artist`
  );

  if (action === "1") {
    const newName = prompt("New artist name:", artist.name);
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

      artist.image = await fileToBase64(file);
      await saveData();
      showArtists();
    };

    input.click();
  }

  else if (action === "3") {
    await editArtistDescription(index);
  }

  else if (action === "4") {
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
  const artist = artists[currentArtistIndex];
  const album = artist.albums[index];

  const action = prompt(
    `Edit Album\n\nType:\n1 = Rename Album\n2 = Change Cover\n3 = Edit Tracklist\n4 = Delete Album`
  );

  if (action === "1") {
    const newTitle = prompt("New album name:", album.title);
    if (!newTitle) return;

    album.title = newTitle.trim();
    await saveData();

    if (currentAlbumIndex === index && !ratingPage.classList.contains("hidden")) {
      showAlbumRating(index);
    }
    else {
      showAlbums(currentArtistIndex);
    }
  }

  else if (action === "2") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      album.image = await fileToBase64(file);
      await saveData();

      if (currentAlbumIndex === index && !ratingPage.classList.contains("hidden")) {
        showAlbumRating(index);
      }
      else {
        showAlbums(currentArtistIndex);
      }
    };

    input.click();
  }

  else if (action === "3") {
    const existing = album.songs
      .map(song => song.title)
      .join("\n");

    const updated = prompt(
      "Edit tracklist. One song per line:",
      existing
    );

    if (updated === null) return;

    const names = updated
      .split("\n")
      .map(name => name.trim())
      .filter(name => name !== "");

    const oldSongs = album.songs;

    album.songs = names.map(name => {
      const oldSong = oldSongs.find(song => song.title === name);

      if (oldSong) return oldSong;

      return {
        title: name,
        rating: "",
        isSkit: false
      };
    });

    await saveData();

    if (currentAlbumIndex === index && !ratingPage.classList.contains("hidden")) {
      showAlbumRating(index);
    }
    else {
      showAlbums(currentArtistIndex);
    }
  }

  else if (action === "4") {
    const confirmed = confirm(`Delete ${album.title}?`);
    if (!confirmed) return;

    artist.albums.splice(index, 1);
    await saveData();
    showAlbums(currentArtistIndex);
  }
}


async function editDeluxe() {
  const album = artists[currentArtistIndex].albums[currentAlbumIndex];
  const deluxe = album.deluxe;

  if (!deluxe) return;

  const action = prompt(
    `Edit Deluxe Edition\n\nType:\n1 = Rename Deluxe\n2 = Change Cover\n3 = Edit Bonus Tracklist\n4 = Delete Deluxe`
  );

  if (action === "1") {
    const newTitle = prompt("New deluxe name:", deluxe.title);
    if (!newTitle) return;

    deluxe.title = newTitle.trim();
    await saveData();
    renderCurrentDeluxeOrAlbum();
  }

  else if (action === "2") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      deluxe.image = await fileToBase64(file);
      deluxe.coverArtRating = "";
      await saveData();
      renderCurrentDeluxeOrAlbum();
    };

    input.click();
  }

  else if (action === "3") {
    const existing = deluxe.songs
      .map(song => song.title)
      .join("\n");

    const updated = prompt(
      "Edit bonus tracklist. One bonus song per line:",
      existing
    );

    if (updated === null) return;

    const names = updated
      .split("\n")
      .map(name => name.trim())
      .filter(name => name !== "");

    const oldSongs = deluxe.songs;

    deluxe.songs = names.map(name => {
      const oldSong = oldSongs.find(song => song.title === name);
      if (oldSong) return oldSong;

      return {
        title: name,
        rating: "",
        isSkit: false
      };
    });

    await saveData();
    renderCurrentDeluxeOrAlbum();
  }

  else if (action === "4") {
    const confirmed = confirm(`Delete ${deluxe.title}?`);
    if (!confirmed) return;

    delete album.deluxe;
    await saveData();
    showAlbumRating(currentAlbumIndex);
  }
}


function renderCurrentDeluxeOrAlbum() {
  if (!deluxePage.classList.contains("hidden")) {
    showDeluxeRating();
  }
  else {
    showAlbumRating(currentAlbumIndex);
  }
}
