const CX = '15bb7538872eb471b';
const apikey = 'AIzaSyBwsXEOG68TUZjKkTtRNdTn8aoBj9j3tHQ';

//https://api.maptiler.com/maps/streets-v2/style.json?key=bZ943IENWwexU3umotpo

const fetchImageFromGoogle = async (query, numImages = 2) => {
    const url = `https://www.googleapis.com/customsearch/v1?q=${query}&cx=${CX}&key=${apikey}&searchType=image&num=1`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
        return data.items.map(item => item.link); // Devuelve la URL de la imagen
    }
    return null;
};

const map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=bZ943IENWwexU3umotpo',
    center: [-102.2961111, 21.8808333], // Centrado en un punto de ejemplo
    zoom: 5,
    pitch: 65, // Ángulo de inclinación del mapa (opcional, ajusta según sea necesario)
    bearing: -17.6,
    terrain: true,
    terrainControl: true,
});

console.log(destinosTuristicos); // Verificar la estructura de los datos

map.addControl(new maplibregl.NavigationControl());

map.on('load', () => {

    const targets = {
        'destinos-layer': "Destinos",
        'maya-layer': "Maya",
        'unesco-layer': "Unesco",
        'tesoros-layer': "Tesoros"
    };

    const options = {
        showDefault: true,
        showCheckBox: true,
        onlyRendered: true,
        reverseOrder: true
    };

    console.log('Map loaded'); // Confirmar que el mapa se cargó

    map.addControl(new MaplibreLegendControl.MaplibreLegendControl(targets, options), "top-left");
    document.querySelectorAll('.maplibre-legend input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const layerId = event.target.value;
            const isChecked = event.target.checked;
            map.setLayoutProperty(layerId, 'visibility', isChecked ? 'visible' : 'none');
        });
    });

    // Función para añadir una fuente
    const addSource = (id, data) => {
        map.addSource(id, {
            'type': 'geojson',
            'data': data,
            'cluster': true,
            'clusterMaxZoom': 14, // Máximo nivel de zoom para clústeres
            'clusterRadius': 50
        });
    };

    // Función para añadir una capa
    const addLayer = (id, color) => {
        map.addLayer({
            'id': id,
            'type': 'circle', // Usar 'circle' para puntos
            'source': id,
            'paint': {
                'circle-radius': 9,
                'circle-color': color,
                'circle-stroke-color': color.replace('0.6', '1'),
                'circle-stroke-width': 2
            }
        });

        // Mostrar información en un popup al hacer clic en un punto
        map.on('click', id, async (e) => {
            //console.debug(e.features);

           

            if (!e.features[0].properties.cluster) {

             //  console.log(e.features[0]._vectorTileFeature._values[15]);
                const properties = e.features[0].properties;

                console.log(properties);
                const imageUrls = await fetchImageFromGoogle(properties.destino, 2);
                const imagesHtml = imageUrls.map(url => `<img src="${url}" alt="${properties.destino}" style="width: 100%; height: auto; margin-top: 10px;">`).join('');

                const popupContent = `
                <div class="w-52 h-92 overflow-y:auto;">
                    <h1 class="title_destino text-xl font-light bg-slate-100">${properties.destino}</h1>
                    <p class="descripcion_destino font-light">${properties.descrip}</p>
                    ${imagesHtml}
                </div>
            `;



                new maplibregl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(popupContent)
                    .addTo(map);

            }
        });

        // Cambiar el cursor a un puntero cuando el ratón esté sobre la capa
        map.on('mouseenter', id, () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Cambiar el cursor de vuelta cuando el ratón salga de la capa
        map.on('mouseleave', id, () => {
            map.getCanvas().style.cursor = '';

        });



    };

    const addClusterLayer = (sourceId, clusterColor) => {
        map.addLayer({
            id: `${sourceId}-clusters`,
            type: 'circle',
            source: sourceId,
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': clusterColor,
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    15,
                    10,
                    20,
                    30,
                    25
                ]
            }
        });

        map.addLayer({
            id: `${sourceId}-cluster-count`,
            type: 'symbol',
            source: sourceId,
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            }


        });







    }

    addSource('destinos-layer', destinosTuristicos);
    addSource('maya-layer', mayaData);
    addSource('unesco-layer', unescoData);
    addSource('tesoros-layer', tesorosData);

    // Añadir las capas después de las fuentes
    addLayer('destinos-layer', 'rgba(200, 100, 240, 0.6)');
    addLayer('maya-layer', 'rgba(75, 65, 70, 0.8)');
    addLayer('unesco-layer', 'rgba(240, 200, 100, 0.6)');
    addLayer('tesoros-layer', 'rgba(100, 240, 200, 0.6)');

    // Añadir capas de clústeres
    addClusterLayer('destinos-layer', 'rgba(200, 100, 240, 0.6)');
    addClusterLayer('maya-layer', 'rgba(75, 65, 70, 0.8)');
    addClusterLayer('unesco-layer', 'rgba(240, 200, 100, 0.6)');
    addClusterLayer('tesoros-layer', 'rgba(100, 240, 200, 0.6)');
});
