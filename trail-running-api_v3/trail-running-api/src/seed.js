require('dotenv').config();

const { connectDatabase } = require('./config/database');
const TrailRoute = require('./models/trailRoute.model');

const routes = [
  {
    name: 'Montgó Circular',
    slug: 'montgo-circular',
    description: 'Ruta de montaña con vistas al Mediterráneo y tramos técnicos.',
    location: {
      country: 'España',
      region: 'Comunitat Valenciana',
      province: 'Alicante',
      municipality: 'Dénia'
    },
    startPoint: {
      type: 'Point',
      coordinates: [0.1123, 38.8027]
    },
    distanceKm: 14.8,
    elevationGainM: 720,
    elevationLossM: 720,
    difficulty: 'hard',
    surface: ['trail', 'rock', 'dirt'],
    tags: ['mediterraneo', 'montana', 'circular'],
    isPublished: true
  },
  {
    name: 'Sierra Calderona Skyline',
    slug: 'sierra-calderona-skyline',
    description: 'Recorrido largo por pistas y senderos de la Sierra Calderona.',
    location: {
      country: 'España',
      region: 'Comunitat Valenciana',
      province: 'Valencia',
      municipality: 'Serra'
    },
    startPoint: {
      type: 'Point',
      coordinates: [-0.4332, 39.6831]
    },
    distanceKm: 28.4,
    elevationGainM: 1180,
    elevationLossM: 1180,
    difficulty: 'expert',
    surface: ['trail', 'dirt', 'gravel'],
    tags: ['skyline', 'larga-distancia', 'bosque'],
    isPublished: true
  },
  {
    name: 'Vall de Boí Lakes Trail',
    slug: 'vall-de-boi-lakes-trail',
    description: 'Circular por los lagos glaciares del valle pirenaico, con vistas al Besiberri y el Comaloforno.',
    location: {
      country: 'España',
      region: 'Cataluña',
      province: 'Lleida',
      municipality: 'La Taüll'
    },
    startPoint: {
      type: 'Point',
      coordinates: [0.8820, 42.5980]
    },
    distanceKm: 22.5,
    elevationGainM: 950,
    elevationLossM: 950,
    difficulty: 'hard',
    surface: ['trail', 'rock', 'mixed'],
    tags: ['pirineos', 'lagos', 'circular'],
    isPublished: true
  },
  {
    name: 'Cadí-Moixeró Traverse',
    slug: 'cadi-moixero-traverse',
    description: 'Travesía por el macizo calcáreo del Cadí, con crestas aéreas y bosques de pino negro.',
    location: {
      country: 'España',
      region: 'Cataluña',
      province: 'Lleida',
      municipality: 'La Seu d\'Urgell'
    },
    startPoint: {
      type: 'Point',
      coordinates: [1.9780, 42.3010]
    },
    distanceKm: 34.2,
    elevationGainM: 1450,
    elevationLossM: 1450,
    difficulty: 'expert',
    surface: ['trail', 'rock', 'mixed'],
    tags: ['pirineos', 'travesia', 'crestas'],
    isPublished: true
  },
  {
    name: 'Mont-Blanc Valley Trail',
    slug: 'mont-blanc-valley-trail',
    description: 'Ruta por el valle de Chamonix con vistas al Mont-Blanc, Aiguille du Midi y los glaciares.',
    location: {
      country: 'Francia',
      region: 'Auvergne-Rhône-Alpes',
      province: 'Alta Saboya',
      municipality: 'Chamonix'
    },
    startPoint: {
      type: 'Point',
      coordinates: [6.8690, 45.9237]
    },
    distanceKm: 26.8,
    elevationGainM: 1100,
    elevationLossM: 1100,
    difficulty: 'hard',
    surface: ['trail', 'dirt', 'mixed'],
    tags: ['alpes', 'glaciares', 'vallon'],
    isPublished: true
  },
  {
    name: 'Val Ferret Skyline',
    slug: 'val-ferret-skyline',
    description: 'Skyline italiano con vistas al Mont-Blanc desde el Val Ferret, por bosques y pastos alpinos.',
    location: {
      country: 'Italia',
      region: 'Valle de Aosta',
      province: 'Valle de Aosta',
      municipality: 'Courmayeur'
    },
    startPoint: {
      type: 'Point',
      coordinates: [6.9750, 45.8100]
    },
    distanceKm: 31.5,
    elevationGainM: 1300,
    elevationLossM: 1300,
    difficulty: 'hard',
    surface: ['trail', 'mixed', 'dirt'],
    tags: ['alpes', 'skyline', 'italia'],
    isPublished: true
  },
  {
    name: 'Aizkorri Summit Trail',
    slug: 'aizkorri-summit-trail',
    description: 'Ascensión al techo de Guipúzcoa por el célebre túnel de San Adrián y prados de Aratz.',
    location: {
      country: 'España',
      region: 'País Vasco',
      province: 'Guipúzcoa',
      municipality: 'Zegama'
    },
    startPoint: {
      type: 'Point',
      coordinates: [-2.2710, 42.9800]
    },
    distanceKm: 16.2,
    elevationGainM: 850,
    elevationLossM: 850,
    difficulty: 'moderate',
    surface: ['trail', 'dirt', 'rock'],
    tags: ['ascension', 'cumbre', 'pastos'],
    isPublished: true
  },
  {
    name: 'Zinal Five Lakes Trail',
    slug: 'zinal-five-lakes-trail',
    description: 'Circular alpina junto al Cervín, cinco lagos glaciares y paisajes de alta montaña suiza.',
    location: {
      country: 'Suiza',
      region: 'Valais',
      province: 'Valais',
      municipality: 'Zinal'
    },
    startPoint: {
      type: 'Point',
      coordinates: [7.6280, 46.1350]
    },
    distanceKm: 19.7,
    elevationGainM: 1050,
    elevationLossM: 1050,
    difficulty: 'hard',
    surface: ['trail', 'mixed', 'rock'],
    tags: ['alpes', 'lagos', 'suiza'],
    isPublished: true
  },
  {
    name: 'Pikes Peak Ascent Trail',
    slug: 'pikes-peak-ascent-trail',
    description: 'Ascensión al Pikes Peak por Barr Trail, el maratón alpina más famoso de Colorado.',
    location: {
      country: 'Estados Unidos',
      region: 'Colorado',
      province: 'El Paso',
      municipality: 'Manitou Springs'
    },
    startPoint: {
      type: 'Point',
      coordinates: [-104.9010, 38.8405]
    },
    distanceKm: 21.4,
    elevationGainM: 1800,
    elevationLossM: 1800,
    difficulty: 'expert',
    surface: ['trail', 'rock', 'dirt'],
    tags: ['ascension', 'colorado', ' altitude'],
    isPublished: true
  },
  {
    name: 'Sierra Nevada Foothills Trail',
    slug: 'sierra-nevada-foothills-trail',
    description: 'Ruta por los bosques de Squaw Valley con vistas a la Sierra Nevada californiana.',
    location: {
      country: 'Estados Unidos',
      region: 'California',
      province: 'Placer',
      municipality: 'Squaw Valley'
    },
    startPoint: {
      type: 'Point',
      coordinates: [-119.9900, 39.1960]
    },
    distanceKm: 24.3,
    elevationGainM: 900,
    elevationLossM: 900,
    difficulty: 'moderate',
    surface: ['trail', 'dirt', 'gravel'],
    tags: ['bosque', 'california', 'foothills'],
    isPublished: true
  },
  {
    name: 'San Juan Mountains Traverse',
    slug: 'san-juan-mountains-traverse',
    description: 'Travesía por las montañas Rocosas de Colorado, paisaje minero y cumbres de cuatro mil metros.',
    location: {
      country: 'Estados Unidos',
      region: 'Colorado',
      province: 'San Juan',
      municipality: 'Silverton'
    },
    startPoint: {
      type: 'Point',
      coordinates: [-107.6630, 37.8150]
    },
    distanceKm: 42.6,
    elevationGainM: 2200,
    elevationLossM: 2200,
    difficulty: 'expert',
    surface: ['trail', 'mixed', 'rock'],
    tags: ['rocosas', 'travesia', 'cumbres'],
    isPublished: true
  },
  {
    name: 'Réunion Volcano Trail',
    slug: 'reunion-volcano-trail',
    description: 'Ruta por el volcán Piton de la Fournaise y los paisajes lunares de la isla de Réunion.',
    location: {
      country: 'Francia',
      region: 'Reunión',
      province: 'Reunión',
      municipality: 'Saint-Denis'
    },
    startPoint: {
      type: 'Point',
      coordinates: [55.2900, -21.2400]
    },
    distanceKm: 32.8,
    elevationGainM: 1600,
    elevationLossM: 1600,
    difficulty: 'hard',
    surface: ['rock', 'mixed', 'trail'],
    tags: ['volcan', 'tropical', 'isla'],
    isPublished: true
  }
];

async function seed() {
  await connectDatabase();
  await TrailRoute.deleteMany({});
  await TrailRoute.insertMany(routes);
  console.log(`Seed completado: ${routes.length} rutas`);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
