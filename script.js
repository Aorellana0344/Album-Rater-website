let artists = [];

let currentArtistIndex = null;
let currentAlbumIndex = null;

const DB_NAME = "AlbumRaterDB";
const DB_VERSION = 1;
const STORE_NAME = "appData";

const artistPage = document.getElementById("artistPage");
const albumPage = document.getElementById("albumPage");
const ratingPage = document.getElementById("ratingPage");

const artistGrid = document.getElementById("artistGrid");
const albumGrid = document.getElementById("albumGrid");
const trackList = document.getElementById("trackList");
const albumHeader = document.getElementById("albumHeader");

const pageTitle = document.getElementById("pageTitle");
const addBtn = document.getElementById("addBtn");
const backBtn = document.getElementById("backBtn");

const artistModal = document.getElementById("artistModal");
const albumModal = document.getElementById("albumModal");

const artistNameInput = document.getElementById("artistNameInput");
const artistImageInput = document.getElementById("artistImageInput");

const albumNameInput = document.getElementById("albumNameInput");
const albumImageInput = document.getElementById("albumImageInput");
const tracklistInput = document.getElementById("tracklistInput");

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



  if (stats.ratedCount === 0) {

    statsBox.innerHTML = `
      <div class="album-stats">

        <h2>Album Score</h2>

        <p>
          Start rating songs to calculate the score.
        </p>

      </div>
    `;

    return;
  }



  const finalDisplay =
    stats.complete
      ? stats.finalScore.toFixed(2)
      : "Incomplete";



  statsBox.innerHTML = `

    <div class="album-stats">

      <h2>Album Score</h2>

      <div class="stat-row">
        <span>Song Average</span>
        <strong>${stats.songAverage.toFixed(2)}</strong>
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

      <div class="final-score">
        <span>Final Score</span>
        <span>${finalDisplay}</span>
      </div>

      <div class="score-note">
        S = 11/10 • Ideal length = 14 tracks<br>
        Final = 85% song average + 15% length score
      </div>

    </div>

  `;

}



function calculateAlbumScore(album) {

  const eligibleSongs =
    album.songs.filter(song => !song.isSkit);



  const ratedSongs =
    eligibleSongs.filter(song =>
      song.rating !== "" &&
      song.rating !== null &&
      song.rating !== undefined
    );



  const numericRatings =
    ratedSongs.map(song => {

      if (
        String(song.rating)
          .toUpperCase() === "S"
      ) {
        return 11;
      }

      return Number(song.rating);

    });



  let songAverage = 0;

  if (numericRatings.length > 0) {

    const total =
      numericRatings.reduce(
        (sum, rating) => sum + rating,
        0
      );

    songAverage =
      total / numericRatings.length;

  }



  const sCount =
    ratedSongs.filter(song =>
      String(song.rating)
        .toUpperCase() === "S"
    ).length;



  const ninePlusCount =
    ratedSongs.filter(song => {

      if (
        String(song.rating)
          .toUpperCase() === "S"
      ) {
        return false;
      }

      const rating = Number(song.rating);

      return rating >= 9;

    }).length;



  const actualTrackCount =
    eligibleSongs.length;



  /*
    Every S = 1 adjustment.

    Every TWO non-S songs rated 9+
    = 1 adjustment.
  */

  const qualityAdjustment =
    sCount +
    Math.floor(ninePlusCount / 2);



  let effectiveTrackCount =
    actualTrackCount;



  /*
    Quality can move the album toward 14,
    but never beyond 14.
  */

  if (effectiveTrackCount > 14) {

    effectiveTrackCount =
      Math.max(
        14,
        effectiveTrackCount - qualityAdjustment
      );

  }

  else if (effectiveTrackCount < 14) {

    effectiveTrackCount =
      Math.min(
        14,
        effectiveTrackCount + qualityAdjustment
      );

  }



  let lengthScore = 10;



  if (effectiveTrackCount < 14) {

    const missingTracks =
      14 - effectiveTrackCount;

    lengthScore -=
      missingTracks * 0.5;

  }



  else if (effectiveTrackCount > 14) {

    const extraTracks =
      effectiveTrackCount - 14;

    lengthScore -=
      extraTracks * 0.75;

  }



  /*
    Don't allow the length score
    to fall below zero.
  */

  lengthScore =
    Math.max(0, lengthScore);



  const finalScore =
    (songAverage * 0.85) +
    (lengthScore * 0.15);



  const complete =
    ratedSongs.length ===
    eligibleSongs.length &&
    eligibleSongs.length > 0;



  return {

    songAverage: songAverage,

    finalScore: finalScore,

    lengthScore: lengthScore,

    actualTrackCount: actualTrackCount,

    eligibleTrackCount: eligibleSongs.length,

    effectiveTrackCount:
      effectiveTrackCount,

    sCount: sCount,

    ninePlusCount: ninePlusCount,

    ratedCount: ratedSongs.length,

    complete: complete

  };

}

function openDatabase() {

  return new Promise((resolve, reject) => {

    const request =
      indexedDB.open(DB_NAME, DB_VERSION);


    request.onupgradeneeded = event => {

      const db =
        event.target.result;

      if (
        !db.objectStoreNames.contains(STORE_NAME)
      ) {

        db.createObjectStore(STORE_NAME);

      }

    };


    request.onsuccess = () => {
      resolve(request.result);
    };


    request.onerror = () => {
      reject(request.error);
    };

  });

}



async function saveData() {
  try {
    const db = await openDatabase();

    await new Promise((resolve, reject) => {
      const transaction = db.transaction(
        STORE_NAME,
        "readwrite"
      );

      const store = transaction.objectStore(
        STORE_NAME
      );

      store.put(
        artists,
        "artists"
      );

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };

      transaction.onabort = () => {
        reject(transaction.error);
      };
    });

    console.log("Data saved successfully.");

  } catch (error) {
    console.error(
      "Could not save data:",
      error
    );
  }
}


async function loadData() {

  try {

    const db =
      await openDatabase();


    const savedArtists =
      await new Promise(
        (resolve, reject) => {

          const transaction =
            db.transaction(
              STORE_NAME,
              "readonly"
            );

          const store =
            transaction.objectStore(
              STORE_NAME
            );

          const request =
            store.get("artists");


          request.onsuccess = () => {
            resolve(request.result);
          };


          request.onerror = () => {
            reject(request.error);
          };

        }
      );


    if (savedArtists) {

      artists = savedArtists;

      return;

    }


    /*
      MIGRATION:

      If you already had albums saved
      using the old localStorage system,
      bring them into IndexedDB.
    */

    const oldData =
      localStorage.getItem(
        "albumRaterData"
      );


    if (oldData) {

      artists =
        JSON.parse(oldData);

      await saveData();

      console.log(
        "Old Album Rater data moved to IndexedDB."
      );

    }

  }

  catch (error) {

    console.error(
      "Could not load data:",
      error
    );

  }

}



function fileToBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        () => resolve(
          reader.result
        );

      reader.onerror =
        reject;

      reader.readAsDataURL(file);

    }
  );

}



function placeholderImage() {

  return `
    data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg'
         width='300'
         height='300'>
      <rect
        width='100%'
        height='100%'
        fill='%23333'
      />
    </svg>
  `;

}

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


      artists = backup.artists;

      await saveData();

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