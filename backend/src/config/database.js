const mongoose = require('mongoose');
const Host = require('../models/host.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const Event = require('../models/event.model');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI no está definida');
  }

  await mongoose.connect(uri);
  console.log('MongoDB conectado');
}

const oid = (id) => new mongoose.Types.ObjectId(id);

const SEED_DATE = new Date('2026-10-16T10:00:00Z');

const hosts = [
  {
    _id: oid('665a1b2c3d4e5f60718293b5'),
    name: 'Trail Muntanya SCCP',
    description: 'Organizadores de carreras de montaña',
    slug: 'trail-muntanya-sccp',
    contactEmail: 'info@trailmuntanya.com',
    website: 'https://trailmuntanya.com',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  }
];

const categories = [
  {
    _id: oid('665a1b2c3d4e5f60718293c6'),
    name: 'Ultra Trail',
    slug: 'ultra-trail',
    description: 'Carreras de más de 42 km',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293c7'),
    name: 'Trail',
    slug: 'trail',
    description: 'Carreras entre 21 y 42 km',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  }
];

const locations = [
  {
    _id: oid('665a1b2c3d4e5f60718293d7'),
    name: 'Vall de Boí',
    slug: 'vall-de-boi',
    city: 'La Taüll',
    coordinates: [0.8087, 42.5167],
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293d8'),
    name: 'Cadí-Moixeró',
    slug: 'cadi-moixero',
    city: "La Seu d'Urgell",
    coordinates: [1.4609, 42.3586],
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293d9'),
    name: 'Chamonix',
    slug: 'chamonix',
    city: 'Chamonix',
    coordinates: [6.8694, 45.9237],
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293da'),
    name: 'Courmayeur',
    slug: 'courmayeur',
    city: 'Courmayeur',
    coordinates: [6.9717, 45.7967],
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293db'),
    name: 'Zegama',
    slug: 'zegama',
    city: 'Zegama',
    coordinates: [-2.2596, 43.0375],
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293dc'),
    name: 'Zinal',
    slug: 'zinal',
    city: 'Zinal',
    coordinates: [7.6167, 46.2167],
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293dd'),
    name: 'Manitou Springs',
    slug: 'manitou-springs',
    city: 'Manitou Springs',
    coordinates: [-104.8436, 38.8578],
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293de'),
    name: 'Squaw Valley',
    slug: 'squaw-valley',
    city: 'Squaw Valley',
    coordinates: [-120.2367, 39.1969],
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293df'),
    name: 'Silverton',
    slug: 'silverton',
    city: 'Silverton',
    coordinates: [-107.6647, 37.8119],
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293e0'),
    name: 'Réunion',
    slug: 'reunion',
    city: 'Saint-Denis',
    coordinates: [55.45, -20.8789],
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293e1'),
    name: 'Dénia',
    slug: 'denia',
    city: 'Dénia',
    coordinates: [0.1123, 38.8027],
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293e2'),
    name: 'Sierra Calderona',
    slug: 'sierra-calderona',
    city: 'Serra',
    coordinates: [-0.4332, 39.6831],
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  }
];

const events = [
  {
    _id: oid('665a1b2c3d4e5f60718293e8'),
    name: 'Ultra Trail Vall de Boí 2027',
    slug: 'ultra-trail-vall-de-boi-2027',
    description: 'Carrera por los lagos de la Vall de Boí...',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c6'),
    locationId: oid('665a1b2c3d4e5f60718293d7'),
    startDate: new Date('2027-06-12T07:00:00Z'),
    endDate: new Date('2027-06-12T19:00:00Z'),
    distanceKm: 68.5,
    elevationGain: 4200,
    elevationLossM: 950,
    difficulty: 'hard',
    surface: ['trail', 'rock', 'mixed'],
    tags: ['pirineos', 'lagos', 'circular'],
    price: 85.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293e9'),
    name: 'Trail Cadí-Moixeró 2027',
    slug: 'trail-cadi-moixero-2027',
    description: 'Recorrido por el macizo del Cadí...',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c7'),
    locationId: oid('665a1b2c3d4e5f60718293d8'),
    startDate: new Date('2027-05-20T08:00:00Z'),
    endDate: new Date('2027-05-20T16:00:00Z'),
    distanceKm: 32.0,
    elevationGain: 2100,
    elevationLossM: 1450,
    difficulty: 'expert',
    surface: ['trail', 'rock', 'mixed'],
    tags: ['pirineos', 'travesia', 'crestas'],
    price: 55.0,
    status: 'draft',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293ea'),
    name: 'OCC Orsières-Champex-Chamonix 2027',
    slug: 'occ-2027',
    description: 'Recorrido de 56 km por el corazón del Mont-Blanc, desde Orsières hasta Chamonix pasando por Champex-Lac.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c6'),
    locationId: oid('665a1b2c3d4e5f60718293d9'),
    startDate: new Date('2027-08-28T05:00:00Z'),
    endDate: new Date('2027-08-28T18:00:00Z'),
    distanceKm: 56.0,
    elevationGain: 3500,
    elevationLossM: 1100,
    difficulty: 'hard',
    surface: ['trail', 'dirt', 'mixed'],
    tags: ['alpes', 'glaciares', 'vallon'],
    price: 120.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293eb'),
    name: 'CCC Courmayeur-Champex-Chamonix 2027',
    slug: 'ccc-2027',
    description: '101 km desde Courmayeur hasta Chamonix, recorriendo el Val Ferret y Champex-Lac.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c6'),
    locationId: oid('665a1b2c3d4e5f60718293da'),
    startDate: new Date('2027-08-28T12:00:00Z'),
    endDate: new Date('2027-08-29T04:00:00Z'),
    distanceKm: 101.0,
    elevationGain: 6100,
    elevationLossM: 1300,
    difficulty: 'hard',
    surface: ['trail', 'mixed', 'dirt'],
    tags: ['alpes', 'skyline', 'italia'],
    price: 180.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293ec'),
    name: 'Zegama-Aizkorri 2027',
    slug: 'zegama-aizkorri-2027',
    description: 'Maratón alpina por el macizo de Aizkorri, con 2.700 m de desnivel positivo.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c7'),
    locationId: oid('665a1b2c3d4e5f60718293db'),
    startDate: new Date('2027-05-30T08:00:00Z'),
    endDate: new Date('2027-05-30T16:00:00Z'),
    distanceKm: 42.0,
    elevationGain: 2700,
    elevationLossM: 850,
    difficulty: 'moderate',
    surface: ['trail', 'dirt', 'rock'],
    tags: ['ascension', 'cumbre', 'pastos'],
    price: 65.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293ed'),
    name: 'Sierre-Zinal 2027',
    slug: 'sierre-zinal-2027',
    description: 'Una de las carreras de montaña más antiguas del mundo, desde Sierre hasta Zinal por los Alpes suizos.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c7'),
    locationId: oid('665a1b2c3d4e5f60718293dc'),
    startDate: new Date('2027-08-15T07:00:00Z'),
    endDate: new Date('2027-08-15T15:00:00Z'),
    distanceKm: 31.0,
    elevationGain: 2200,
    elevationLossM: 1050,
    difficulty: 'hard',
    surface: ['trail', 'mixed', 'rock'],
    tags: ['alpes', 'lagos', 'suiza'],
    price: 75.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293ee'),
    name: 'Pikes Peak Marathon 2027',
    slug: 'pikes-peak-marathon-2027',
    description: 'Maratón alpina que asciende al Pikes Peak en Colorado, desde Manitou Springs hasta la cumbre.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c7'),
    locationId: oid('665a1b2c3d4e5f60718293dd'),
    startDate: new Date('2027-09-20T07:00:00Z'),
    endDate: new Date('2027-09-20T15:00:00Z'),
    distanceKm: 42.0,
    elevationGain: 2400,
    elevationLossM: 1800,
    difficulty: 'expert',
    surface: ['trail', 'rock', 'dirt'],
    tags: ['ascension', 'colorado', 'altitude'],
    price: 95.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293ef'),
    name: 'Western States 100 2027',
    slug: 'western-states-100-2027',
    description: 'La ultra trail más famosa del mundo, 161 km desde Squaw Valley hasta Auburn.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c6'),
    locationId: oid('665a1b2c3d4e5f60718293de'),
    startDate: new Date('2027-06-27T05:00:00Z'),
    endDate: new Date('2027-06-28T11:00:00Z'),
    distanceKm: 161.0,
    elevationGain: 5500,
    elevationLossM: 900,
    difficulty: 'moderate',
    surface: ['trail', 'dirt', 'gravel'],
    tags: ['bosque', 'california', 'foothills'],
    price: 350.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293f0'),
    name: 'Hardrock 100 2027',
    slug: 'hardrock-100-2027',
    description: '161 km por las Montañas Rocosas de Colorado con 10.000 m de desnivel, una de las carreras más duras del mundo.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c6'),
    locationId: oid('665a1b2c3d4e5f60718293df'),
    startDate: new Date('2027-07-18T06:00:00Z'),
    endDate: new Date('2027-07-19T18:00:00Z'),
    distanceKm: 161.0,
    elevationGain: 10000,
    elevationLossM: 2200,
    difficulty: 'expert',
    surface: ['trail', 'mixed', 'rock'],
    tags: ['rocosas', 'travesia', 'cumbres'],
    price: 400.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293f1'),
    name: 'Diagonale des Fous 2027',
    slug: 'diagonale-des-fous-2027',
    description: "170 km por la isla de Réunion con 10.000 m de desnivel, apodada la 'Diagonal de los Locos'.",
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c6'),
    locationId: oid('665a1b2c3d4e5f60718293e0'),
    startDate: new Date('2027-10-15T00:00:00Z'),
    endDate: new Date('2027-10-16T12:00:00Z'),
    distanceKm: 170.0,
    elevationGain: 10000,
    elevationLossM: 1600,
    difficulty: 'hard',
    surface: ['rock', 'mixed', 'trail'],
    tags: ['volcan', 'tropical', 'isla'],
    price: 250.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293f2'),
    name: 'Montgó Circular 2027',
    slug: 'montgo-circular-2027',
    description: 'Ruta de montaña con vistas al Mediterráneo y tramos técnicos.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c7'),
    locationId: oid('665a1b2c3d4e5f60718293e1'),
    startDate: new Date('2027-04-18T08:00:00Z'),
    endDate: new Date('2027-04-18T14:00:00Z'),
    distanceKm: 14.8,
    elevationGain: 720,
    elevationLossM: 720,
    difficulty: 'hard',
    surface: ['trail', 'rock', 'dirt'],
    tags: ['mediterraneo', 'montana', 'circular'],
    price: 25.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293f3'),
    name: 'Sierra Calderona Skyline 2027',
    slug: 'sierra-calderona-skyline-2027',
    description: 'Recorrido largo por pistas y senderos de la Sierra Calderona.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c7'),
    locationId: oid('665a1b2c3d4e5f60718293e2'),
    startDate: new Date('2027-03-21T08:00:00Z'),
    endDate: new Date('2027-03-21T17:00:00Z'),
    distanceKm: 28.4,
    elevationGain: 1180,
    elevationLossM: 1180,
    difficulty: 'expert',
    surface: ['trail', 'dirt', 'gravel'],
    tags: ['skyline', 'larga-distancia', 'bosque'],
    price: 35.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  }
];

const experiences = [
  {
    _id: oid('665a1b2c3d4e5f60718293f9'),
    eventId: oid('665a1b2c3d4e5f60718293e8'),
    name: 'Pack Alojamiento + Carrera',
    slug: 'pack-alojamiento-carrera',
    description: 'Alojamiento noche anterior + carrera',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  }
];

const experienceImages = [
  {
    _id: oid('665a1b2c3d4e5f6071829411'),
    experienceId: oid('665a1b2c3d4e5f60718293f9'),
    url: 'https://cdn.example.com/experiences/pack-alojamiento.jpg',
    alt: 'Hotel junto a la salida de la carrera',
    isCover: true,
    order: 1,
    created_At: SEED_DATE,
    updated_at: SEED_DATE
  }
];

async function seedDatabase() {
  await Host.deleteMany({});
  await Category.deleteMany({});
  await Location.deleteMany({});
  await Event.deleteMany({});

  await Host.insertMany(hosts, { timestamps: false });
  await Category.insertMany(categories, { timestamps: false });
  await Location.insertMany(locations, { timestamps: false });
  await Event.insertMany(events, { timestamps: false });

  const db = mongoose.connection.db;
  await db.collection('experiences').deleteMany({});
  await db.collection('event_images').deleteMany({});
  await db.collection('experience_images').deleteMany({});
  await db.collection('experiences').insertMany(experiences);
  await db.collection('experience_images').insertMany(experienceImages);

  await db.collection('experiences').createIndex({ eventId: 1 });
  await db.collection('experiences').createIndex({ slug: 1 }, { unique: true, partialFilterExpression: { deleted_at: null } });
  await db.collection('event_images').createIndex({ eventId: 1, order: 1 });
  await db.collection('event_images').createIndex({ eventId: 1, isCover: 1 });
  await db.collection('experience_images').createIndex({ experienceId: 1, order: 1 });
  await db.collection('experience_images').createIndex({ experienceId: 1, isCover: 1 });

  return {
    hosts: hosts.length,
    categories: categories.length,
    locations: locations.length,
    events: events.length,
    experiences: experiences.length,
    event_images: 0,
    experience_images: experienceImages.length
  };
}

module.exports = { connectDatabase, seedDatabase };
