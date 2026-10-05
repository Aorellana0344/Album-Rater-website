function showArtists() {

  currentArtistIndex = null;
  currentAlbumIndex = null;

  artistPage.classList.remove("hidden");
  albumPage.classList.add("hidden");
  ratingPage.classList.add("hidden");

  backBtn.classList.add("hidden");
  addBtn.classList.remove("hidden");

  pageTitle.textContent = "Artists";

  artistGrid.innerHTML = "";

  artists.forEach((artist, index) => {

    const wrapper = document.createElement("div");
    wrapper.className = "card-wrap";

    const card = document.createElement("div");
    card.className = "card artist-card";

    card.innerHTML = `
      <img
        src="${artist.image || placeholderImage()}"
        alt="${artist.name}"
      >
      <p>${artist.name}</p>
    `;

    card.addEventListener("click", () => {
      showAlbums(index);
    });

    const menuBtn = document.createElement("button");
    menuBtn.className = "card-menu-btn";
    menuBtn.textContent = "•••";

    menuBtn.addEventListener("click", event => {
      event.stopPropagation();
      editArtist(index);
    });

    wrapper.appendChild(card);
    wrapper.appendChild(menuBtn);

    artistGrid.appendChild(wrapper);

  });

}




function showAlbums(artistIndex) {

  currentArtistIndex = artistIndex;
  currentAlbumIndex = null;

  const artist = artists[artistIndex];

  artistPage.classList.add("hidden");
  albumPage.classList.remove("hidden");
  ratingPage.classList.add("hidden");

  backBtn.classList.remove("hidden");
  addBtn.classList.remove("hidden");

  pageTitle.textContent = artist.name;

  albumGrid.innerHTML = "";

  artist.albums.forEach((album, index) => {

    const wrapper = document.createElement("div");
    wrapper.className = "card-wrap";

    const card = document.createElement("div");
    card.className = "card";

    const score = calculateAlbumScore(album);

    let scoreText = "";

    if (score.complete) {
      scoreText = `
        <p>${score.finalScore.toFixed(2)} ★</p>
      `;
    }

    card.innerHTML = `
      <img
        src="${album.image || placeholderImage()}"
        alt="${album.title}"
      >

      <p>${album.title}</p>

      ${scoreText}
    `;

    card.addEventListener("click", () => {
      showAlbumRating(index);
    });

    const menuBtn = document.createElement("button");
    menuBtn.className = "card-menu-btn";
    menuBtn.textContent = "•••";

    menuBtn.addEventListener("click", event => {
      event.stopPropagation();
      editAlbum(index);
    });

    wrapper.appendChild(card);
    wrapper.appendChild(menuBtn);

    albumGrid.appendChild(wrapper);

  });

}



function showAlbumRating(albumIndex) {

  currentAlbumIndex = albumIndex;

  const artist = artists[currentArtistIndex];
  const album = artist.albums[albumIndex];

  /*
    Old albums do not have a cover art rating yet.
    Keep it blank until the user rates the cover.
  */
  if (album.coverArtRating === undefined) {
    album.coverArtRating = "";
  }

  /*
    This makes old albums created before the skit
    feature still work.
  */
  album.songs.forEach(song => {

    if (song.isSkit === undefined) {
      song.isSkit = false;
    }

  });

  artistPage.classList.add("hidden");
  albumPage.classList.add("hidden");
  ratingPage.classList.remove("hidden");

  backBtn.classList.remove("hidden");
  addBtn.classList.add("hidden");

  pageTitle.textContent = album.title;

  albumHeader.innerHTML = `
    <img
      src="${album.image || placeholderImage()}"
      alt="${album.title}"
    >

    <h2>${album.title}</h2>

    <p>${artist.name}</p>

    <div id="albumStats"></div>
  `;

  trackList.innerHTML = "";

  album.songs.forEach((song, songIndex) => {

    const row = document.createElement("div");

    row.className = "track";

row.innerHTML = `
  <div class="track-info">

    <span>
      ${songIndex + 1}. ${song.title}
    </span>

    <label class="skit-option">

      <input
        type="checkbox"
        ${song.isSkit ? "checked" : ""}
      >

      Skit / Don't Count

    </label>

    <div class="song-actions">
      <button class="edit-song-btn">
        Edit
      </button>

      <button class="delete-song-btn danger-btn">
        Delete
      </button>
    </div>

  </div>

      <input
        class="rating-input"
        type="text"
        inputmode="decimal"
        placeholder="0-10 / S"
        value="${song.rating}"
        ${song.isSkit ? "disabled" : ""}
      >
    `;

    const ratingInput =
      row.querySelector(".rating-input");

    const skitInput =
      row.querySelector(".skit-option input");

    const editSongBtn =
      row.querySelector(".edit-song-btn");

    const deleteSongBtn =
      row.querySelector(".delete-song-btn");      



    ratingInput.addEventListener("change", () => {

      let value =
        ratingInput.value
          .trim()
          .toUpperCase();

      if (value === "") {

        song.rating = "";

        ratingInput.classList.remove("invalid");

        saveData();
        updateAlbumStats();

        return;
      }



      if (value === "S") {

        const currentSCount =
          album.songs.filter(otherSong =>
            otherSong !== song &&
            !otherSong.isSkit &&
            String(otherSong.rating).toUpperCase() === "S"
          ).length;

        if (currentSCount >= 3) {

          alert(
            "You can only have 3 S-rated songs on an album."
          );

          ratingInput.value = song.rating;

          return;
        }

        song.rating = "S";

        ratingInput.value = "S";

        ratingInput.classList.remove("invalid");

        saveData();
        updateAlbumStats();

        return;
      }



      const number = Number(value);

      if (
        Number.isNaN(number) ||
        number < 0 ||
        number > 10
      ) {

        alert(
          "Enter a rating from 0 to 10, or enter S."
        );

        ratingInput.value = song.rating;

        return;
      }



      song.rating = number;

      ratingInput.value = number;

      ratingInput.classList.remove("invalid");

      saveData();
      updateAlbumStats();

    });



    skitInput.addEventListener("change", () => {

      song.isSkit = skitInput.checked;

      ratingInput.disabled = song.isSkit;

      saveData();
      updateAlbumStats();

    });

editSongBtn.addEventListener(
  "click",
  async () => {

    const newTitle =
      prompt(
        "Edit song name:",
        song.title
      );

    if (!newTitle) return;

    song.title =
      newTitle.trim();

    await saveData();

    showAlbumRating(
      currentAlbumIndex
    );

  }
);


deleteSongBtn.addEventListener(
  "click",
  async () => {

    const confirmed =
      confirm(
        `Delete "${song.title}"?`
      );

    if (!confirmed) return;

    album.songs.splice(
      songIndex,
      1
    );

    await saveData();

    showAlbumRating(
      currentAlbumIndex
    );

  }
);

    trackList.appendChild(row);

  });



  updateAlbumStats();

}



function updateAlbumStats() {

  const album =
    artists[currentArtistIndex]
      .albums[currentAlbumIndex];

  const stats = calculateAlbumScore(album);

  const statsBox =
    document.getElementById("albumStats");

  const coverArtValue =
    album.coverArtRating ?? "";

  const finalDisplay =
    stats.complete
      ? stats.finalScore.toFixed(2)
      : "Incomplete";



  statsBox.innerHTML = `

    <div class="album-stats">

      <h2>Album Score</h2>

      <div class="stat-row">
        <span>Song Average</span>
        <strong>
          ${stats.ratedCount > 0
            ? stats.songAverage.toFixed(2)
            : "—"}
        </strong>
      </div>

      <div class="stat-row">
        <span>Rated Songs</span>
        <strong>
          ${stats.ratedCount}/${stats.eligibleTrackCount}
        </strong>
      </div>

      <div class="stat-row">
        <span>S Ratings</span>
        <strong>${stats.sCount}/3</strong>
      </div>

      <div class="stat-row">
        <span>9+ Songs</span>
        <strong>${stats.ninePlusCount}</strong>
      </div>

      <div class="stat-row">
        <span>Actual Track Count</span>
        <strong>${stats.eligibleTrackCount}</strong>
      </div>

      <div class="stat-row">
        <span>Effective Track Count</span>
        <strong>${stats.effectiveTrackCount}</strong>
      </div>

      <div class="stat-row">
        <span>Length Score</span>
        <strong>${stats.lengthScore.toFixed(2)}</strong>
      </div>

      <div class="stat-row">
        <span>Cover Art</span>
        <input
          id="coverArtRatingInput"
          class="rating-input cover-art-rating-input"
          type="text"
          inputmode="decimal"
          placeholder="0-10"
          value="${coverArtValue}"
          aria-label="Cover art rating"
        >
      </div>

      <div class="final-score">
        <span>Final Score</span>
        <span>${finalDisplay}</span>
      </div>

      <div class="score-note">
        S = 11/10 • Ideal length = 14 tracks<br>
        Final = 90% song average + 5% length + 5% cover art
      </div>

    </div>

  `;



  const coverArtInput =
    document.getElementById("coverArtRatingInput");

  coverArtInput.addEventListener("change", () => {

    const value =
      coverArtInput.value.trim();

    if (value === "") {

      album.coverArtRating = "";

      saveData();
      updateAlbumStats();

      return;
    }

    const number = Number(value);

    if (
      Number.isNaN(number) ||
      number < 0 ||
      number > 10
    ) {

      alert(
        "Enter a cover art rating from 0 to 10."
      );

      coverArtInput.value =
        album.coverArtRating ?? "";

      return;
    }

    album.coverArtRating = number;
    coverArtInput.value = number;

    saveData();
    updateAlbumStats();

  });

}
