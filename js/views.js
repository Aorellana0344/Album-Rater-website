function getRatingColorClass(value) {
  if (String(value).trim().toUpperCase() === "S") {
    return "rating-rainbow";
  }

  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const rating = Number(value);
  if (Number.isNaN(rating)) return "";

  if (rating >= 10) return "rating-purple";
  if (rating > 8) return "rating-blue";
  if (rating > 6) return "rating-green";
  if (rating > 4) return "rating-yellow";
  if (rating > 2) return "rating-orange";
  return "rating-red";
}


function getAlbumScoreColorClass(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const rating = Number(value);
  if (Number.isNaN(rating)) return "";

  if (rating >= 9.5) {
    return "rating-rainbow";
  }

  return getRatingColorClass(rating);
}


function formatAlbumScore(value, includeStar = false) {
  const rounded = Number(Number(value).toFixed(2));

  if (rounded === 10) {
    return "PERFECT!";
  }

  return `${Number(value).toFixed(2)}${includeStar ? " ★" : ""}`;
}


function applyRatingColor(element, value, albumScore = false) {
  element.classList.remove(
    "rating-red",
    "rating-orange",
    "rating-yellow",
    "rating-green",
    "rating-blue",
    "rating-purple",
    "rating-rainbow"
  );

  const colorClass = albumScore
    ? getAlbumScoreColorClass(value)
    : getRatingColorClass(value);

  if (colorClass) {
    element.classList.add(colorClass);
  }
}


function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function normalizeSongs(songs) {
  songs.forEach(song => {
    if (song.isSkit === undefined) {
      song.isSkit = false;
    }
  });
}


function hideAllPages() {
  artistPage.classList.add("hidden");
  albumPage.classList.add("hidden");
  ratingPage.classList.add("hidden");
  deluxePage.classList.add("hidden");
}


function showArtists() {
  currentArtistIndex = null;
  currentAlbumIndex = null;

  hideAllPages();
  artistPage.classList.remove("hidden");

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
        alt="${escapeHtml(artist.name)}"
      >
      <p>${escapeHtml(artist.name)}</p>
    `;

    card.addEventListener("click", () => showAlbums(index));

    const menuBtn = document.createElement("button");
    menuBtn.className = "card-menu-btn";
    menuBtn.textContent = "•••";
    menuBtn.setAttribute("aria-label", `Edit ${artist.name}`);

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

  if (artist.description === undefined) {
    artist.description = "";
  }

  hideAllPages();
  albumPage.classList.remove("hidden");

  backBtn.classList.remove("hidden");
  addBtn.classList.remove("hidden");
  pageTitle.textContent = artist.name;

  const artistAverage = calculateArtistAverage(artist);
  const topSongs = getArtistTopSongs(artist, 10);

  const averageDisplay =
    artistAverage === null
      ? "—"
      : artistAverage.toFixed(2);

  const descriptionDisplay =
    artist.description.trim()
      ? escapeHtml(artist.description)
      : "Add a description for this artist.";

  const topSongsHtml = topSongs.length > 0
    ? topSongs.map((song, index) => `
        <div class="top-song-item">
          <div class="top-song-main">
            <span class="top-song-rank">${index + 1}</span>
            <div class="top-song-text">
              <strong>${escapeHtml(song.title)}</strong>
              <span>${escapeHtml(song.albumTitle)}</span>
            </div>
          </div>
          <span class="rating-chip ${getRatingColorClass(song.rating)}">
            ${escapeHtml(song.rating)}
          </span>
        </div>
      `).join("")
    : `
        <p class="empty-state">
          Rate some songs to build this artist's Top Songs.
        </p>
      `;

  artistProfile.innerHTML = `
    <div class="artist-profile-card">
      <div class="artist-profile-left">
        <img
          class="artist-profile-image"
          src="${artist.image || placeholderImage()}"
          alt="${escapeHtml(artist.name)}"
        >

        <div class="artist-average score-outline-card">
          <span>Average Album Rating</span>
          <strong class="${artistAverage === null ? "" : getRatingColorClass(artistAverage)}">
            ${averageDisplay}
          </strong>
        </div>
      </div>

      <div class="artist-profile-description">
        <div class="artist-description-heading">
          <h2>${escapeHtml(artist.name)}</h2>
          <button id="editArtistDescriptionBtn" class="small-secondary-btn">
            Edit Description
          </button>
        </div>
        <p>${descriptionDisplay}</p>
      </div>
    </div>

    <section class="profile-section top-songs-section">
      <h2 class="section-title">Top Songs</h2>
      <div class="top-songs-grid">
        ${topSongsHtml}
      </div>
    </section>
  `;

  document
    .getElementById("editArtistDescriptionBtn")
    .addEventListener("click", () => editArtistDescription(artistIndex));

  albumGrid.innerHTML = "";

  artist.albums.forEach((album, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "card-wrap";

    const card = document.createElement("div");
    card.className = "card album-card";

    const score = calculateAlbumScore(album);

    const scoreText = score.complete
      ? `
          <p class="album-card-score rating-chip ${getAlbumScoreColorClass(score.finalScore)}">
            ${formatAlbumScore(score.finalScore)}
          </p>
        `
      : "";

    card.innerHTML = `
      <img
        src="${album.image || placeholderImage()}"
        alt="${escapeHtml(album.title)}"
      >
      <p class="album-card-title">${escapeHtml(album.title)}</p>
      ${scoreText}
    `;

    card.addEventListener("click", () => showAlbumRating(index));

    const menuBtn = document.createElement("button");
    menuBtn.className = "card-menu-btn";
    menuBtn.textContent = "•••";
    menuBtn.setAttribute("aria-label", `Edit ${album.title}`);

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

  if (album.coverArtRating === undefined) {
    album.coverArtRating = "";
  }

  normalizeSongs(album.songs);

  if (album.deluxe) {
    if (album.deluxe.coverArtRating === undefined) {
      album.deluxe.coverArtRating = "";
    }
    normalizeSongs(album.deluxe.songs || []);
  }

  hideAllPages();
  ratingPage.classList.remove("hidden");

  backBtn.classList.remove("hidden");
  addBtn.classList.add("hidden");
  pageTitle.textContent = artist.name;

  renderAlbumHero();
  renderTrackList(album.songs, trackList, {
    onStatsUpdate: updateAlbumStats,
    onRerender: () => showAlbumRating(currentAlbumIndex),
    deleteLabel: "song"
  });
  renderDeluxeSection();
}


function renderAlbumHero() {
  const artist = artists[currentArtistIndex];
  const album = artist.albums[currentAlbumIndex];
  const stats = calculateAlbumScore(album);

  const finalDisplay = stats.complete
    ? formatAlbumScore(stats.finalScore)
    : "Incomplete";

  const finalClass = stats.complete
    ? getAlbumScoreColorClass(stats.finalScore)
    : "";

  const coverArtValue = album.coverArtRating ?? "";

  albumHeader.innerHTML = `
    <div class="detail-hero">
      <img
        class="detail-cover"
        src="${album.image || placeholderImage()}"
        alt="${escapeHtml(album.title)}"
      >

      <div class="detail-info">
        <div class="detail-title-block">
          <div>
            <h2>${escapeHtml(album.title)}</h2>
            <p>${escapeHtml(artist.name)}</p>
            <span>${stats.eligibleTrackCount} ${stats.eligibleTrackCount === 1 ? "Song" : "Songs"}</span>
          </div>

          <button
            id="editCurrentAlbumBtn"
            class="icon-menu-btn"
            aria-label="Edit album"
          >•••</button>
        </div>

        <div class="hero-score-card ${finalClass}">
          <span>Album Rating</span>
          <strong>${finalDisplay}</strong>
        </div>

        <div class="metric-grid metric-grid-three">
          <div class="metric-card">
            <span>Song Average</span>
            <strong class="${stats.ratedCount > 0 ? getRatingColorClass(stats.songAverage) : ""}">
              ${stats.ratedCount > 0 ? stats.songAverage.toFixed(2) : "—"}
            </strong>
            <small>93%</small>
          </div>

          <div class="metric-card">
            <span>Length Score</span>
            <strong class="${getRatingColorClass(stats.lengthScore)}">
              ${stats.lengthScore.toFixed(2)}
            </strong>
            <small>5%</small>
          </div>

          <div class="metric-card">
            <span>Cover Art</span>
            <input
              id="coverArtRatingInput"
              class="metric-rating-input ${getRatingColorClass(coverArtValue)}"
              type="text"
              inputmode="decimal"
              placeholder="0-10"
              value="${escapeHtml(coverArtValue)}"
              aria-label="Cover art rating"
            >
            <small>2%</small>
          </div>
        </div>

        <div class="album-meta-row">
          <span>${stats.ratedCount}/${stats.eligibleTrackCount} rated</span>
          <span>${stats.sCount}/3 S ratings</span>
          <span>${stats.ninePlusCount} songs rated 9+</span>
        </div>
      </div>
    </div>
  `;

  document
    .getElementById("editCurrentAlbumBtn")
    .addEventListener("click", () => editAlbum(currentAlbumIndex));

  const coverArtInput = document.getElementById("coverArtRatingInput");

  coverArtInput.addEventListener("change", () => {
    const value = coverArtInput.value.trim();

    if (value === "") {
      album.coverArtRating = "";
      saveData();
      renderAlbumHero();
      renderDeluxeSection();
      return;
    }

    const number = Number(value);

    if (Number.isNaN(number) || number < 0 || number > 10) {
      alert("Enter a cover art rating from 0 to 10.");
      coverArtInput.value = album.coverArtRating ?? "";
      return;
    }

    album.coverArtRating = number;
    saveData();
    renderAlbumHero();
    renderDeluxeSection();
  });
}


function updateAlbumStats() {
  renderAlbumHero();
  renderDeluxeSection();
}


function renderTrackList(songs, container, options) {
  container.innerHTML = `
    <div class="track-panel">
      <div class="track-panel-heading">
        <h2>${options.heading || "Tracks"}</h2>
        <span>${songs.length} ${songs.length === 1 ? "song" : "songs"}</span>
      </div>
      <div class="track-rows"></div>
    </div>
  `;

  const rows = container.querySelector(".track-rows");

  songs.forEach((song, songIndex) => {
    const row = document.createElement("div");
    row.className = "track";

    row.innerHTML = `
      <span class="track-number">${songIndex + 1}</span>

      <div class="track-info">
        <span class="track-title">${escapeHtml(song.title)}</span>
        <div class="track-tools">
          <label class="skit-option">
            <input
              type="checkbox"
              ${song.isSkit ? "checked" : ""}
            >
            Don't Count
          </label>
          <button class="track-action edit-song-btn">Edit</button>
          <button class="track-action delete-song-btn">Delete</button>
        </div>
      </div>

      <input
        class="rating-input ${getRatingColorClass(song.rating)}"
        type="text"
        inputmode="decimal"
        placeholder="0-10 / S"
        value="${escapeHtml(song.rating)}"
        ${song.isSkit ? "disabled" : ""}
      >
    `;

    const ratingInput = row.querySelector(".rating-input");
    const skitInput = row.querySelector(".skit-option input");
    const editSongBtn = row.querySelector(".edit-song-btn");
    const deleteSongBtn = row.querySelector(".delete-song-btn");

    ratingInput.addEventListener("change", () => {
      let value = ratingInput.value.trim().toUpperCase();

      if (value === "") {
        song.rating = "";
        applyRatingColor(ratingInput, "");
        saveData();
        options.onStatsUpdate();
        return;
      }

      if (value === "S") {
        const currentSCount = songs.filter(otherSong =>
          otherSong !== song &&
          !otherSong.isSkit &&
          String(otherSong.rating).toUpperCase() === "S"
        ).length;

        if (currentSCount >= 3) {
          alert("You can only have 3 S-rated songs in this tracklist.");
          ratingInput.value = song.rating;
          return;
        }

        song.rating = "S";
        ratingInput.value = "S";
        applyRatingColor(ratingInput, "S");
        saveData();
        options.onStatsUpdate();
        return;
      }

      const number = Number(value);

      if (Number.isNaN(number) || number < 0 || number > 10) {
        alert("Enter a rating from 0 to 10, or enter S.");
        ratingInput.value = song.rating;
        return;
      }

      song.rating = number;
      ratingInput.value = number;
      applyRatingColor(ratingInput, number);
      saveData();
      options.onStatsUpdate();
    });

    skitInput.addEventListener("change", () => {
      song.isSkit = skitInput.checked;
      ratingInput.disabled = song.isSkit;
      saveData();
      options.onStatsUpdate();
    });

    editSongBtn.addEventListener("click", async () => {
      const newTitle = prompt("Edit song name:", song.title);
      if (!newTitle) return;

      song.title = newTitle.trim();
      await saveData();
      options.onRerender();
    });

    deleteSongBtn.addEventListener("click", async () => {
      const confirmed = confirm(`Delete \"${song.title}\"?`);
      if (!confirmed) return;

      songs.splice(songIndex, 1);
      await saveData();
      options.onRerender();
    });

    rows.appendChild(row);
  });
}


function renderDeluxeSection() {
  const album = artists[currentArtistIndex].albums[currentAlbumIndex];

  if (!album.deluxe) {
    deluxeSection.innerHTML = `
      <section class="deluxe-section">
        <div class="deluxe-section-heading">
          <div>
            <span class="eyebrow">Optional</span>
            <h2>Deluxe Edition</h2>
          </div>
          <button id="addDeluxeBtn" class="deluxe-add-btn">+ Add Deluxe Edition</button>
        </div>
        <p class="deluxe-empty-copy">
          Attach only the bonus songs. Deluxe editions do not use the length penalty.
        </p>
      </section>
    `;

    document.getElementById("addDeluxeBtn").addEventListener("click", () => {
      deluxeNameInput.value = `${album.title} (Deluxe)`;
      deluxeTracklistInput.value = "";
      deluxeImageInput.value = "";
      deluxeModal.classList.remove("hidden");
    });

    return;
  }

  const deluxe = album.deluxe;
  const stats = calculateDeluxeScore(deluxe);

  const scoreDisplay = stats.complete
    ? formatAlbumScore(stats.finalScore)
    : "Incomplete";

  const scoreClass = stats.complete
    ? getAlbumScoreColorClass(stats.finalScore)
    : "";

  deluxeSection.innerHTML = `
    <section class="deluxe-section deluxe-present">
      <div class="deluxe-section-heading">
        <div>
          <span class="eyebrow">Connected Release</span>
          <h2>Deluxe Edition</h2>
        </div>
        <button id="editDeluxeBtn" class="icon-menu-btn" aria-label="Edit deluxe">•••</button>
      </div>

      <div id="viewDeluxeCard" class="deluxe-card">
        <img
          src="${deluxe.image || album.image || placeholderImage()}"
          alt="${escapeHtml(deluxe.title)}"
        >

        <div class="deluxe-card-copy">
          <strong>${escapeHtml(deluxe.title)}</strong>
          <span>${deluxe.songs.length} Bonus ${deluxe.songs.length === 1 ? "Track" : "Tracks"}</span>
          <small>98% songs · 2% cover · no length penalty</small>
        </div>

        <div class="deluxe-card-score ${scoreClass}">
          <span>Deluxe Rating</span>
          <strong>${scoreDisplay}</strong>
        </div>

        <span class="deluxe-card-arrow">›</span>
      </div>
    </section>
  `;

  document
    .getElementById("viewDeluxeCard")
    .addEventListener("click", showDeluxeRating);

  document
    .getElementById("editDeluxeBtn")
    .addEventListener("click", event => {
      event.stopPropagation();
      editDeluxe();
    });
}


function showDeluxeRating() {
  const artist = artists[currentArtistIndex];
  const album = artist.albums[currentAlbumIndex];
  const deluxe = album.deluxe;

  if (!deluxe) {
    showAlbumRating(currentAlbumIndex);
    return;
  }

  if (deluxe.coverArtRating === undefined) {
    deluxe.coverArtRating = "";
  }

  normalizeSongs(deluxe.songs || []);

  hideAllPages();
  deluxePage.classList.remove("hidden");

  backBtn.classList.remove("hidden");
  addBtn.classList.add("hidden");
  pageTitle.textContent = artist.name;

  renderDeluxeHero();
  renderTrackList(deluxe.songs, deluxeTrackList, {
    heading: "Bonus Tracks",
    onStatsUpdate: updateDeluxeStats,
    onRerender: showDeluxeRating,
    deleteLabel: "bonus song"
  });
}


function renderDeluxeHero() {
  const artist = artists[currentArtistIndex];
  const album = artist.albums[currentAlbumIndex];
  const deluxe = album.deluxe;
  const stats = calculateDeluxeScore(deluxe);

  const finalDisplay = stats.complete
    ? formatAlbumScore(stats.finalScore)
    : "Incomplete";

  const finalClass = stats.complete
    ? getAlbumScoreColorClass(stats.finalScore)
    : "";

  const coverArtValue = deluxe.coverArtRating ?? "";

  deluxeHeader.innerHTML = `
    <div class="detail-hero deluxe-hero">
      <img
        class="detail-cover"
        src="${deluxe.image || album.image || placeholderImage()}"
        alt="${escapeHtml(deluxe.title)}"
      >

      <div class="detail-info">
        <div class="detail-title-block">
          <div>
            <span class="eyebrow">Deluxe Edition</span>
            <h2>${escapeHtml(deluxe.title)}</h2>
            <p>${escapeHtml(artist.name)}</p>
            <span>${stats.eligibleTrackCount} Bonus ${stats.eligibleTrackCount === 1 ? "Track" : "Tracks"}</span>
          </div>

          <button id="editCurrentDeluxeBtn" class="icon-menu-btn" aria-label="Edit deluxe">•••</button>
        </div>

        <div class="hero-score-card ${finalClass}">
          <span>Deluxe Rating</span>
          <strong>${finalDisplay}</strong>
        </div>

        <div class="metric-grid metric-grid-two">
          <div class="metric-card">
            <span>Bonus Song Average</span>
            <strong class="${stats.ratedCount > 0 ? getRatingColorClass(stats.songAverage) : ""}">
              ${stats.ratedCount > 0 ? stats.songAverage.toFixed(2) : "—"}
            </strong>
            <small>98%</small>
          </div>

          <div class="metric-card">
            <span>Cover Art</span>
            <input
              id="deluxeCoverArtRatingInput"
              class="metric-rating-input ${getRatingColorClass(coverArtValue)}"
              type="text"
              inputmode="decimal"
              placeholder="0-10"
              value="${escapeHtml(coverArtValue)}"
              aria-label="Deluxe cover art rating"
            >
            <small>2%</small>
          </div>
        </div>

        <div class="deluxe-info-note">
          <span>ⓘ</span>
          <p>This deluxe includes only the bonus tracks. The length penalty does not apply.</p>
        </div>
      </div>
    </div>
  `;

  document
    .getElementById("editCurrentDeluxeBtn")
    .addEventListener("click", editDeluxe);

  const coverArtInput = document.getElementById("deluxeCoverArtRatingInput");

  coverArtInput.addEventListener("change", () => {
    const value = coverArtInput.value.trim();

    if (value === "") {
      deluxe.coverArtRating = "";
      saveData();
      renderDeluxeHero();
      return;
    }

    const number = Number(value);

    if (Number.isNaN(number) || number < 0 || number > 10) {
      alert("Enter a cover art rating from 0 to 10.");
      coverArtInput.value = deluxe.coverArtRating ?? "";
      return;
    }

    deluxe.coverArtRating = number;
    saveData();
    renderDeluxeHero();
  });
}


function updateDeluxeStats() {
  renderDeluxeHero();
}
