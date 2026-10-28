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
