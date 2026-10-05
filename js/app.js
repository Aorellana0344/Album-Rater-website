startApp();

async function startApp() {
  await loadData();
  showArtists();
}



addBtn.addEventListener("click", () => {

  if (!artistPage.classList.contains("hidden")) {
    artistModal.classList.remove("hidden");
  }

  else if (!albumPage.classList.contains("hidden")) {
    albumModal.classList.remove("hidden");
  }

});



backBtn.addEventListener("click", () => {

  if (!ratingPage.classList.contains("hidden")) {
    showAlbums(currentArtistIndex);
  }

  else if (!albumPage.classList.contains("hidden")) {
    showArtists();
  }

});



document
  .getElementById("cancelArtistBtn")
  .addEventListener("click", () => {
    artistModal.classList.add("hidden");
  });



document
  .getElementById("cancelAlbumBtn")
  .addEventListener("click", () => {
    albumModal.classList.add("hidden");
  });



document
  .getElementById("saveArtistBtn")
  .addEventListener("click", async () => {

    const name = artistNameInput.value.trim();

    if (!name) {
      alert("Enter an artist name.");
      return;
    }

    const imageFile = artistImageInput.files[0];

    let image = "";

    if (imageFile) {
      image = await fileToBase64(imageFile);
    }

    artists.push({
      name: name,
      image: image,
      albums: []
    });

    await saveData();

    artistNameInput.value = "";
    artistImageInput.value = "";

    artistModal.classList.add("hidden");

    showArtists();

  });



document
  .getElementById("saveAlbumBtn")
  .addEventListener("click", async () => {

    const albumName = albumNameInput.value.trim();

    const trackNames = tracklistInput.value
      .split("\n")
      .map(track => track.trim())
      .filter(track => track !== "");

    if (!albumName) {
      alert("Enter an album name.");
      return;
    }

    if (trackNames.length === 0) {
      alert("Enter at least one song.");
      return;
    }

    const imageFile = albumImageInput.files[0];

    let image = "";

    if (imageFile) {
      image = await fileToBase64(imageFile);
    }

    const songs = trackNames.map(name => ({
      title: name,
      rating: "",
      isSkit: false
    }));

    artists[currentArtistIndex].albums.push({
      title: albumName,
      image: image,
      songs: songs
    });

    await saveData();

    albumNameInput.value = "";
    albumImageInput.value = "";
    tracklistInput.value = "";

    albumModal.classList.add("hidden");

    showAlbums(currentArtistIndex);

  });

