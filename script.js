// Charger les données depuis l'URL GeoJSON
fetch('https://data.rennesmetropole.fr/api/explore/v2.1/catalog/datasets/decheteries_plateformes_vegetaux/exports/geojson?lang=fr&timezone=Europe%2FBerlin')
  .then(response => response.json())
  .then(data => {
    // Une fois les données récupérées, les assigner à la variable stores
    const stores = data;

    /**
     * Add the map to the page
     */
    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json',
      center: [-1.6793541558126834, 48.117407659707666],
      zoom: 9,
      scrollZoom: true
    });

    /**
     * Assign a unique id to each store. You'll use this `id`
     * later to associate each point on the map with a listing
     * in the sidebar.
     */
    stores.features.forEach((store, i) => {
      store.properties.id = i;
    });

    /**
     * Wait until the map loads to make changes to the map.
     */
    map.on('load', () => {
      /**
       * This is where your '.addLayer()' used to be, instead
       * add only the source without styling a layer
       */
        
    map.addLayer({
       "id": "SchemaVelo",
       "type": "line",
       "source": ({type : 'geojson',
                   data : 'https://data.rennesmetropole.fr/api/explore/v2.1/catalog/datasets/limites-communales-referentielles-de-rennes-metropole-polylignes/exports/geojson?lang=fr&timezone=Europe%2FBerlin'}),
       "layout": {'visibility': 'visible'},
       "paint": {"line-color": "#DB9537", "line-width": 1}
    });
      
      
      map.addSource('places', {
        'type': 'geojson',
        'data': stores
      });

      /**
       * Add all the things to the page:
       * - The location listings on the side of the page
       * - The markers onto the map
       */
      buildLocationList(stores);
      addMarkers();
    });

    /**
     * Add a marker to the map for every store listing.
     **/
    function addMarkers() {
      /* For each feature in the GeoJSON object above: */
      for (const marker of stores.features) {
        /* Create a div element for the marker. */
        const el = document.createElement('div');
        /* Assign a unique `id` to the marker. */
        el.id = `marker-${marker.properties.id}`;
        /* Assign the `marker` class to each marker for styling. */
        el.className = 'marker';

        /**
         * Create a marker using the div element
         * defined above and add it to the map.
         **/
        new maplibregl.Marker(el, { offset: [0, -23] })
          .setLngLat(marker.geometry.coordinates)
          .addTo(map);

        /**
         * Listen to the element and when it is clicked, do three things:
         * 1. Fly to the point
         * 2. Close all other popups and display popup for clicked store
         * 3. Highlight listing in sidebar (and remove highlight for all other listings)
         **/
        el.addEventListener('click', (e) => {
          /* Fly to the point */
          flyToStore(marker);
          /* Close all other popups and display popup for clicked store */
          createPopUp(marker);
          /* Highlight listing in sidebar */
          const activeItem = document.getElementsByClassName('active');
          e.stopPropagation();
          if (activeItem[0]) {
            activeItem[0].classList.remove('active');
          }
          const listing = document.getElementById(
            `listing-${marker.properties.id}`
          );
          listing.classList.add('active');
        });
      }
    }

    /**
     * Add a listing for each store to the sidebar.
     **/
    function buildLocationList(stores) {
      for (const store of stores.features) {
        /* Add a new listing section to the sidebar. */
        const listings = document.getElementById('listings');
        const listing = listings.appendChild(document.createElement('div'));
        /* Assign a unique `id` to the listing. */
        listing.id = `listing-${store.properties.id}`;
        /* Assign the `item` class to each listing for styling. */
        listing.className = 'item';

        /* Add the link to the individual listing created above. */
        const link = listing.appendChild(document.createElement('a'));
        link.href = '#';
        link.className = 'title';
        link.id = `link-${store.properties.id}`;
        link.innerHTML = `${store.properties.nom_court}`;

        /* Add details to the individual listing. */
        const details = listing.appendChild(document.createElement('div'));
        details.innerHTML = `${store.properties.adresse}`;
        if (store.properties.ann_ouv) {
          details.innerHTML += ` &middot; ${"Année d'ouverture : " + store.properties.ann_ouv}`;
        }

        /**
         * Listen to the element and when it is clicked, do four things:
         * 1. Update the `currentFeature` to the store associated with the clicked link
         * 2. Fly to the point
         * 3. Close all other popups and display popup for clicked store
         * 4. Highlight listing in sidebar (and remove highlight for all other listings)
         **/
        link.addEventListener('click', function () {
          for (const feature of stores.features) {
            if (this.id === `link-${feature.properties.id}`) {
              flyToStore(feature);
              createPopUp(feature);
            }
          }
          const activeItem = document.getElementsByClassName('active');
          if (activeItem[0]) {
            activeItem[0].classList.remove('active');
          }
          this.parentNode.classList.add('active');
        });
      }
    }

    /**
     * Use Maplibre GL JS's `flyTo` to move the camera smoothly
     * a given center point.
     **/
    function flyToStore(currentFeature) {
      map.flyTo({
        center: currentFeature.geometry.coordinates,
        zoom: 15
      });
    }

    /**
     * Create a Maplibre GL JS `Popup`.
     **/
    function createPopUp(currentFeature) {
      const popUps = document.getElementsByClassName('maplibregl-popup');
      if (popUps[0]) popUps[0].remove();
      const popup = new maplibregl.Popup({ closeOnClick: true, closeButton : true })
        .setLngLat(currentFeature.geometry.coordinates)
        .setHTML(
          `<h3> ${currentFeature.properties.nom_court}</h3><h4>${currentFeature.properties.horaires.replace(/\//g, "<br>")}</h4>`
        )
        .addTo(map);
    }
  })
  .catch(error => console.error('Error fetching stores data:', error));