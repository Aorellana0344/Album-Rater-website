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
    (songAverage * 0.90) +
    (lengthScore * 0.05) +
    (coverArtRating * 0.05);



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
