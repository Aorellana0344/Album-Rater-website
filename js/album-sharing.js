// Shared albums retain one identity across IndexedDB and JSON backup restores.
function reconnectSharedAlbums(collection) {
  const shared = new Map();
  collection.forEach(artist => {
    artist.albums = artist.albums.map(album => {
      if (!album.sharedAlbumId) return album;
      if (!shared.has(album.sharedAlbumId)) shared.set(album.sharedAlbumId, album);
      return shared.get(album.sharedAlbumId);
    });
  });
}

function albumKey(value) { return value.trim().toLocaleLowerCase(); }

function downloadAlbumJSON(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportSingleAlbum(index) {
  const album = artists[currentArtistIndex].albums[index];
  const credits = artists.filter(artist => artist.albums.includes(album)).map(artist => artist.name);
  const copy = JSON.parse(JSON.stringify(album));
  delete copy.sharedAlbumId;
  downloadAlbumJSON({ app: 'Album Rater', type: 'album', version: 1, artists: credits, album: copy },
    `${album.title.replace(/[^a-z0-9 -]/gi, '').trim() || 'album'}.json`);
}

function shareAlbum(index) {
  const album = artists[currentArtistIndex].albums[index];
  const dialog = document.createElement('dialog');
  dialog.className = 'album-share-dialog';
  const title = document.createElement('h2'); title.textContent = 'Add album to another artist';
  const helper = document.createElement('p'); helper.textContent = 'Ratings, tracklists and covers stay synced. Removing an album from one artist leaves it on the others.';
  dialog.append(title, helper);
  const choices = [];
  artists.forEach(artist => {
    if (artist.albums.includes(album)) return;
    const label = document.createElement('label');
    const input = document.createElement('input'); input.type = 'checkbox';
    const duplicate = artist.albums.some(other => albumKey(other.title) === albumKey(album.title));
    input.disabled = duplicate;
    label.append(input, document.createTextNode(` ${artist.name}${duplicate ? ' — already has an album with this title' : ''}`));
    dialog.append(label); choices.push({ artist, input });
  });
  if (!choices.length) helper.textContent += ' Already on every artist page. Add another artist from the home page first.';
  const cancel = document.createElement('button'); cancel.textContent = 'Cancel'; cancel.onclick = () => dialog.close();
  const save = document.createElement('button'); save.textContent = 'Add to selected artists';
  save.onclick = async () => {
    const selected = choices.filter(choice => choice.input.checked);
    if (!selected.length) return;
    const priorId = album.sharedAlbumId;
    album.sharedAlbumId ||= crypto.randomUUID();
    selected.forEach(({ artist }) => artist.albums.push(album));
    try {
      await saveData(); dialog.close(); showAlbums(currentArtistIndex);
    } catch (error) {
      selected.forEach(({ artist }) => { artist.albums = artist.albums.filter(other => other !== album); });
      if (!priorId) delete album.sharedAlbumId;
      alert('Could not save the shared album. Please try again.');
    }
  };
  dialog.append(cancel, save);
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog); dialog.showModal();
}

function validateAlbumImport(data) {
  const fail = message => { throw new Error(message); };
  if (!data || data.type !== 'album' || !data.album || Array.isArray(data.album)) fail('Choose a single-album JSON file, not a full backup.');
  const cleanRating = (rating, allowS) => {
    if (rating === '' || rating === null || rating === undefined) return '';
    if (allowS && String(rating).toUpperCase() === 'S') return 'S';
    if (!['string', 'number'].includes(typeof rating) || String(rating).trim() === '') fail('Invalid rating.');
    const n = Number(rating);
    if (!Number.isFinite(n) || n < 0 || n > 10) fail('Ratings must be 0–10 or S.');
    return n;
  };
  const cleanImage = image => {
    if (!image) return '';
    if (typeof image !== 'string' || !/^(https?:\/\/|data:image\/(png|jpeg|jpg|webp|gif);base64,)/i.test(image) || /[<>"'\s]/.test(image)) fail('Cover must be an HTTPS URL or an embedded image.');
    return image;
  };
  const clean = album => {
    if (!album || typeof album.title !== 'string' || !album.title.trim()) fail('Album title is required.');
    if (!Array.isArray(album.songs) || !album.songs.length) fail('Album needs at least one song.');
    const songs = album.songs.map(song => {
      if (typeof song === 'string') song = { title: song };
      if (!song || typeof song.title !== 'string' || !song.title.trim()) fail('Each song needs a title.');
      return { title: song.title.trim(), rating: cleanRating(song.rating, true), isSkit: song.isSkit === true };
    });
    if (songs.filter(song => !song.isSkit && song.rating === 'S').length > 3) fail('An album can have at most three S ratings.');
    return { title: album.title.trim(), image: cleanImage(album.image), coverArtRating: cleanRating(album.coverArtRating, false), songs };
  };
  const album = clean(data.album);
  if (data.album.deluxe) album.deluxe = clean(data.album.deluxe);
  let names = data.artists ?? (data.artist ? [data.artist] : []);
  if (!Array.isArray(names) || names.some(name => typeof name !== 'string' || !name.trim())) fail('Artists must be a list of names.');
  names = [...new Map(names.map(name => [albumKey(name), name.trim()])).values()];
  return { album, names };
}

async function importSingleAlbum(file) {
  const { album, names } = validateAlbumImport(JSON.parse(await file.text()));
  if (!names.length && !albumPage.classList.contains('hidden') && artists[currentArtistIndex]) names.push(artists[currentArtistIndex].name);
  if (!names.length) throw new Error('Include an artists list in the JSON, or open an artist page first.');
  const targets = names.map(name => artists.find(artist => albumKey(artist.name) === albumKey(name)) || { name, image: '', description: '', albums: [] });
  for (const artist of targets) {
    if (artist.albums.some(other => albumKey(other.title) === albumKey(album.title))) throw new Error(`${artist.name} already has “${album.title}”. Nothing was imported.`);
  }
  if (!confirm(`Add “${album.title}” (${album.songs.length} tracks) to ${names.join(', ')}?\n\nExisting albums and ratings will be kept. Missing artists will be created.`)) return;
  const previous = artists.slice();
  if (targets.length > 1) album.sharedAlbumId = crypto.randomUUID();
  targets.forEach(artist => { if (!artists.includes(artist)) artists.push(artist); artist.albums.push(album); });
  try { await saveData(); }
  catch (error) {
    targets.forEach(artist => { artist.albums = artist.albums.filter(other => other !== album); });
    artists = previous;
    throw new Error('Could not save the import. Your existing collection was kept.');
  }
  if (!albumPage.classList.contains('hidden')) showAlbums(currentArtistIndex); else showArtists();
  alert(`Imported “${album.title}”.`);
}

document.getElementById('importAlbumFile').addEventListener('change', async event => {
  try { if (event.target.files[0]) await importSingleAlbum(event.target.files[0]); }
  catch (error) { alert(error.message || 'Could not import this album.'); }
  finally { event.target.value = ''; }
});
