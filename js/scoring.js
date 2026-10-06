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


  const qualityAdjustment =
    sCount +
    Math.floor(ninePlusCount / 2);


  let effectiveTrackCount =
    actualTrackCount;


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


  lengthScore =
    Math.max(0, lengthScore);


  const coverArtValue =
    album.coverArtRating;

  const hasCoverArtRating =
    coverArtValue !== "" &&
    coverArtValue !== null &&
    coverArtValue !== undefined &&
    !Number.isNaN(Number(coverArtValue));

  const coverArtRating =
    hasCoverArtRating
      ? Number(coverArtValue)
      : 0;


  const finalScore =
    (songAverage * 0.93) +
    (lengthScore * 0.05) +
    (coverArtRating * 0.02);


  const complete =
    ratedSongs.length ===
    eligibleSongs.length &&
    eligibleSongs.length > 0 &&
    hasCoverArtRating;


  return {

    songAverage: songAverage,

    finalScore: finalScore,

    lengthScore: lengthScore,

    coverArtRating: coverArtRating,

    hasCoverArtRating: hasCoverArtRating,

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


function calculateArtistAverage(artist) {

  const completedScores =
    artist.albums
      .map(album => calculateAlbumScore(album))
      .filter(score => score.complete)
      .map(score => score.finalScore);

  if (completedScores.length === 0) {
    return null;
  }

  const total =
    completedScores.reduce(
      (sum, score) => sum + score,
      0
    );

  return total / completedScores.length;

}


function getArtistTopSongs(artist, limit = 10) {

  const songs = [];

  artist.albums.forEach((album, albumIndex) => {

    album.songs.forEach((song, songIndex) => {

      if (song.isSkit) {
        return;
      }

      if (
        song.rating === "" ||
        song.rating === null ||
        song.rating === undefined
      ) {
        return;
      }

      const isS =
        String(song.rating).toUpperCase() === "S";

      const numericRating =
        isS ? 11 : Number(song.rating);

      if (Number.isNaN(numericRating)) {
        return;
      }

      songs.push({
        title: song.title,
        albumTitle: album.title,
        rating: isS ? "S" : numericRating,
        numericRating: numericRating,
        albumIndex: albumIndex,
        songIndex: songIndex
      });

    });

  });

  songs.sort((a, b) => {

    if (b.numericRating !== a.numericRating) {
      return b.numericRating - a.numericRating;
    }

    if (a.albumIndex !== b.albumIndex) {
      return a.albumIndex - b.albumIndex;
    }

    return a.songIndex - b.songIndex;

  });

  return songs.slice(0, limit);

}
