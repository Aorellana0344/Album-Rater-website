function getRatedSongData(songs) {
  const eligibleSongs = songs.filter(song => !song.isSkit);

  const ratedSongs = eligibleSongs.filter(song =>
    song.rating !== "" &&
    song.rating !== null &&
    song.rating !== undefined
  );

  const numericRatings = ratedSongs.map(song => {
    if (String(song.rating).toUpperCase() === "S") {
      return 11;
    }

    return Number(song.rating);
  });

  let songAverage = 0;

  if (numericRatings.length > 0) {
    const total = numericRatings.reduce(
      (sum, rating) => sum + rating,
      0
    );

    songAverage = total / numericRatings.length;
  }

  const sCount = ratedSongs.filter(song =>
    String(song.rating).toUpperCase() === "S"
  ).length;

  const ninePlusCount = ratedSongs.filter(song => {
    if (String(song.rating).toUpperCase() === "S") {
      return false;
    }

    const rating = Number(song.rating);
    return rating >= 9;
  }).length;

  return {
    eligibleSongs,
    ratedSongs,
    songAverage,
    sCount,
    ninePlusCount
  };
}


function getCoverArtData(item) {
  const coverArtValue = item.coverArtRating;

  const hasCoverArtRating =
    coverArtValue !== "" &&
    coverArtValue !== null &&
    coverArtValue !== undefined &&
    !Number.isNaN(Number(coverArtValue));

  return {
    hasCoverArtRating,
    coverArtRating: hasCoverArtRating
      ? Number(coverArtValue)
      : 0
  };
}


const IDEAL_ALBUM_TRACK_COUNT = 12;

function calculateAlbumScore(album) {
  const songData = getRatedSongData(album.songs);

  const actualTrackCount = songData.eligibleSongs.length;

  const qualityAdjustment =
    songData.sCount +
    Math.floor(songData.ninePlusCount / 2);

  let effectiveTrackCount = actualTrackCount;

  if (effectiveTrackCount > IDEAL_ALBUM_TRACK_COUNT) {
    effectiveTrackCount = Math.max(
      IDEAL_ALBUM_TRACK_COUNT,
      effectiveTrackCount - qualityAdjustment
    );
  }
  else if (effectiveTrackCount < IDEAL_ALBUM_TRACK_COUNT) {
    effectiveTrackCount = Math.min(
      IDEAL_ALBUM_TRACK_COUNT,
      effectiveTrackCount + qualityAdjustment
    );
  }

  let lengthScore = 10;

  if (effectiveTrackCount < IDEAL_ALBUM_TRACK_COUNT) {
    lengthScore -= (IDEAL_ALBUM_TRACK_COUNT - effectiveTrackCount) * 0.5;
  }
  else if (effectiveTrackCount > IDEAL_ALBUM_TRACK_COUNT) {
    lengthScore -= (effectiveTrackCount - IDEAL_ALBUM_TRACK_COUNT) * 0.75;
  }

  lengthScore = Math.max(0, lengthScore);

  const coverData = getCoverArtData(album);

  const finalScore = coverData.hasCoverArtRating
    ? (songData.songAverage * 0.93) +
      (lengthScore * 0.05) +
      (coverData.coverArtRating * 0.02)
    : (songData.songAverage * 0.95) +
      (lengthScore * 0.05);

  const complete =
    songData.ratedSongs.length === songData.eligibleSongs.length &&
    songData.eligibleSongs.length > 0;

  return {
    songAverage: songData.songAverage,
    finalScore,
    lengthScore,
    coverArtRating: coverData.coverArtRating,
    hasCoverArtRating: coverData.hasCoverArtRating,
    actualTrackCount,
    eligibleTrackCount: songData.eligibleSongs.length,
    effectiveTrackCount,
    sCount: songData.sCount,
    ninePlusCount: songData.ninePlusCount,
    ratedCount: songData.ratedSongs.length,
    complete
  };
}


function calculateDeluxeScore(deluxe) {
  const songData = getRatedSongData(deluxe.songs || []);
  const coverData = getCoverArtData(deluxe);

  const finalScore = coverData.hasCoverArtRating
    ? (songData.songAverage * 0.98) +
      (coverData.coverArtRating * 0.02)
    : songData.songAverage;

  const complete =
    songData.ratedSongs.length === songData.eligibleSongs.length &&
    songData.eligibleSongs.length > 0;

  return {
    songAverage: songData.songAverage,
    finalScore,
    coverArtRating: coverData.coverArtRating,
    hasCoverArtRating: coverData.hasCoverArtRating,
    eligibleTrackCount: songData.eligibleSongs.length,
    sCount: songData.sCount,
    ninePlusCount: songData.ninePlusCount,
    ratedCount: songData.ratedSongs.length,
    complete
  };
}


function calculateArtistAverage(artist) {
  const completedScores = artist.albums
    .map(album => calculateAlbumScore(album))
    .filter(score => score.complete)
    .map(score => score.finalScore);

  if (completedScores.length === 0) {
    return null;
  }

  const total = completedScores.reduce(
    (sum, score) => sum + score,
    0
  );

  return total / completedScores.length;
}


function getArtistTopSongs(artist, limit = 10) {
  const songs = [];

  artist.albums.forEach((album, albumIndex) => {
    const addSongs = (sourceSongs, albumTitle, isDeluxe = false) => {
      sourceSongs.forEach((song, songIndex) => {
        if (song.isSkit) return;

        if (
          song.rating === "" ||
          song.rating === null ||
          song.rating === undefined
        ) {
          return;
        }

        const isS = String(song.rating).toUpperCase() === "S";
        const numericRating = isS ? 11 : Number(song.rating);

        if (Number.isNaN(numericRating)) return;

        songs.push({
          title: song.title,
          albumTitle,
          rating: isS ? "S" : numericRating,
          numericRating,
          albumIndex,
          songIndex,
          isDeluxe
        });
      });
    };

    addSongs(album.songs || [], album.title, false);

    if (album.deluxe && Array.isArray(album.deluxe.songs)) {
      addSongs(
        album.deluxe.songs,
        album.deluxe.title || `${album.title} (Deluxe)`,
        true
      );
    }
  });

  songs.sort((a, b) => {
    if (b.numericRating !== a.numericRating) {
      return b.numericRating - a.numericRating;
    }

    if (a.albumIndex !== b.albumIndex) {
      return a.albumIndex - b.albumIndex;
    }

    if (a.isDeluxe !== b.isDeluxe) {
      return a.isDeluxe ? 1 : -1;
    }

    return a.songIndex - b.songIndex;
  });

  // Keep scores descending, cycling albums within each tied rating.
  const alternating = [];
  for (let start = 0; start < songs.length;) {
    let end = start;
    const albums = new Map();
    while (end < songs.length && songs[end].numericRating === songs[start].numericRating) {
      const song = songs[end++];
      if (!albums.has(song.albumIndex)) albums.set(song.albumIndex, []);
      albums.get(song.albumIndex).push(song);
    }
    const queues = [...albums.values()];
    for (let round = 0; queues.some(queue => round < queue.length); round++) {
      queues.forEach(queue => {
        if (round < queue.length) alternating.push(queue[round]);
      });
    }
    start = end;
  }
  return alternating.slice(0, limit);
}


function getArtistCardData(artist, mode = "prime") {
  const scores = artist.albums.map(calculateAlbumScore)
    .filter(score => score.complete).map(score => score.finalScore)
    .sort((a, b) => b - a);
  const selected = mode === "career" ? scores : scores.slice(0, 3);
  const average = selected.length ? selected.reduce((a, b) => a + b, 0) / selected.length : null;
  const overall = average === null ? null : Math.min(99, Math.max(0, Math.round(average * 10)));
  const tier = overall === null ? "unrated" : overall >= 90 ? "purple" : overall >= 80 ? "gold" : overall >= 70 ? "silver" : "bronze";
  return { overall, tier, count: selected.length };
}
