const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const Host = require('../models/host.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const Event = require('../models/event.model');
const Departure = require('../models/departure.model');
const User = require('../models/user.model');
const Profile = require('../models/profile.model');
const EventImage = require('../models/eventImage.model');
const Session = require('../models/session.model');
const { slugify } = require('../utils/slugify');

async function ensureIndexes() {
  await Promise.all([
    Host.ensureIndexes(),
    Category.ensureIndexes(),
    Location.ensureIndexes(),
    Event.ensureIndexes(),
    Departure.ensureIndexes(),
    User.ensureIndexes(),
    Profile.ensureIndexes(),
    EventImage.ensureIndexes(),
    Session.ensureIndexes()
  ]);
}

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI no está definida');
  }

  await mongoose.connect(uri);
  await ensureIndexes();
  console.log('MongoDB conectado');
}

const oid = (id) => new mongoose.Types.ObjectId(id);

const SEED_DATE = new Date('2026-10-16T10:00:00Z');

const SEED_ASSETS_ROOT = path.join(__dirname, '..', '..', '..', 'carousel_images');
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

const EVENT_IMAGE_FOLDERS = {
  '665a1b2c3d4e5f60718293e8': 'Vall_Boí',
  '665a1b2c3d4e5f60718293e9': 'Cadí-Moixeró',
  '665a1b2c3d4e5f60718293ea': 'chamonix',
  '665a1b2c3d4e5f60718293eb': 'val-daran',
  '665a1b2c3d4e5f60718293ec': 'zegama',
  '665a1b2c3d4e5f60718293ed': 'Zinal',
  '665a1b2c3d4e5f60718293ee': 'Manitou_Springs',
  '665a1b2c3d4e5f60718293ef': 'squaw-valley',
  '665a1b2c3d4e5f60718293f0': 'Silverton',
  '665a1b2c3d4e5f60718293f1': 'reunion',
  '665a1b2c3d4e5f60718293f2': 'montgo',
  '665a1b2c3d4e5f60718293f3': 'sierra-calderona',
  '665a1b2c3d4e5f60718293f4': 'courmayeur'
};

function resetDirectory(targetDir) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
}

function copyFiles(sourceDir, targetDir) {
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (entry.isFile()) {
      fs.copyFileSync(path.join(sourceDir, entry.name), path.join(targetDir, entry.name));
    }
  }
}

const hosts = [
  {
    _id: oid('665a1b2c3d4e5f60718293b5'),
    name: 'UTMB World Series',
    description: 'Circuito mundial de ultra trail con grandes carreras como el UTMB de Chamonix.',
    imageUrl: '/uploads/organizadores/utmb.jpg',
    slug: 'utmb',
    contactEmail: 'info@utmb.world',
    website: 'https://utmb.world',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293b6'),
    name: 'Golden Trail World Series',
    description: 'Serie mundial de carreras de trail cortas y técnicas, con pruebas como Zegama y Sierre-Zinal.',
    imageUrl: '/uploads/organizadores/gtws.jpg',
    slug: 'gtws',
    contactEmail: 'info@goldentrailseries.com',
    website: 'https://goldentrailseries.com',
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
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/Lavaredo_Ultra_Trail_2021-_gifts_for_those_who_finished_the_race_MTSC.jpg/1280px-Lavaredo_Ultra_Trail_2021-_gifts_for_those_who_finished_the_race_MTSC.jpg',
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
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Trail_runner_at_the_Ullswater_Trail_Race_2011.jpg',
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
    country: 'España',
    coordinates: [0.8087, 42.5167],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Sant_Maurici_lake%2C_Aig%C3%BCestortes_i_Estany_de_Sant_Maurici_National_Park%2C_Spain_-_Diliff.jpg/1280px-Sant_Maurici_lake%2C_Aig%C3%BCestortes_i_Estany_de_Sant_Maurici_National_Park%2C_Spain_-_Diliff.jpg',
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
    country: 'España',
    coordinates: [1.4609, 42.3586],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/98/Parc_cad%C3%AD_moixer%C3%B3_-_saldes_-_richard_martin.jpg/1280px-Parc_cad%C3%AD_moixer%C3%B3_-_saldes_-_richard_martin.jpg',
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
    country: 'Francia',
    coordinates: [6.8694, 45.9237],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/PanoMontBlancHDR_edit_1.jpg/1280px-PanoMontBlancHDR_edit_1.jpg',
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
    country: 'Italia',
    coordinates: [6.9717, 45.7967],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Courmayeur.jpg/1280px-Courmayeur.jpg',
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
    country: 'España',
    coordinates: [-2.2596, 43.0375],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Cara-norte-sierra-aizkorri.JPG/1280px-Cara-norte-sierra-aizkorri.JPG',
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
    country: 'Suiza',
    coordinates: [7.6167, 46.2167],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Zinal_from_Roc_de_la_Vache.jpg/1280px-Zinal_from_Roc_de_la_Vache.jpg',
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
    country: 'Estados Unidos',
    coordinates: [-104.8436, 38.8578],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Pikes_Peak_by_David_Shankbone.jpg/1280px-Pikes_Peak_by_David_Shankbone.jpg',
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
    country: 'Estados Unidos',
    coordinates: [-120.2367, 39.1969],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Squaw_Valley_in_the_morning.jpg/1280px-Squaw_Valley_in_the_morning.jpg',
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
    country: 'Estados Unidos',
    coordinates: [-107.6647, 37.8119],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/Silverton.jpg/1280px-Silverton.jpg',
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
    country: 'Francia',
    coordinates: [55.45, -20.8789],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/R%C3%A9union_PitonFournaise_Crat%C3%A8reRivals_surroundings2.JPG/1280px-R%C3%A9union_PitonFournaise_Crat%C3%A8reRivals_surroundings2.JPG',
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
    country: 'España',
    coordinates: [0.1123, 38.8027],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/El_Montg%C3%B3_i_la_mar.JPG/1280px-El_Montg%C3%B3_i_la_mar.JPG',
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
    country: 'España',
    coordinates: [-0.4332, 39.6831],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Vista_desde_Valencia_de_la_Sierra_Calderona_02.jpg',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293e3'),
    name: 'Val d\'Aran',
    slug: 'val-daran',
    city: 'Vielha',
    country: 'España',
    coordinates: [0.7956, 42.7025],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/VIELHA_-_VAL_D%27ARAN_-_IB-399.JPG/1280px-VIELHA_-_VAL_D%27ARAN_-_IB-399.JPG',
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
    sku: 'UTVB-2027',
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
    variants: [
      { name: '20K', distanceKm: 20.0, elevationGain: 1200, price: 35.0 },
      { name: '50K', distanceKm: 50.0, elevationGain: 2800, price: 65.0 },
      { name: '100K', distanceKm: 100.0, elevationGain: 5200, price: 110.0 }
    ],
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
    sku: 'TCM-2027',
    description: 'Recorrido por el macizo del Cadí...',
    hostId: oid('665a1b2c3d4e5f60718293b6'),
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
    variants: [
      { name: '10K', distanceKm: 10.0, elevationGain: 700, price: 25.0 },
      { name: '21K', distanceKm: 21.0, elevationGain: 1400, price: 40.0 },
      { name: '32K', distanceKm: 32.0, elevationGain: 2100, price: 55.0 }
    ],
    status: 'draft',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293ea'),
    name: 'UTMB Mont-Blanc 2027',
    slug: 'utmb-mont-blanc-2027',
    sku: 'UTMB-2027',
    description: 'La gran cita del trail mundial alrededor del macizo del Mont-Blanc, con las modalidades OCC, CCC y UTMB.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c6'),
    locationId: oid('665a1b2c3d4e5f60718293d9'),
    startDate: new Date('2027-08-27T05:00:00Z'),
    endDate: new Date('2027-08-29T18:00:00Z'),
    distanceKm: 174.0,
    elevationGain: 9900,
    elevationLossM: 9900,
    difficulty: 'expert',
    surface: ['trail', 'rock', 'mixed'],
    tags: ['alpes', 'glaciares', 'utmb'],
    price: 250.0,
    variants: [
      { name: 'OCC', distanceKm: 60.0, elevationGain: 3500, price: 120.0 },
      { name: 'CCC', distanceKm: 101.0, elevationGain: 6050, price: 180.0 },
      { name: 'UTMB', distanceKm: 174.0, elevationGain: 9900, price: 250.0 }
    ],
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293eb'),
    name: 'Val d\'Aran by UTMB 2027',
    slug: 'val-daran-by-utmb-2027',
    sku: 'VDA-2027',
    description: 'Carrera del Pirineo central con modalidades de 20K, 50K y 100K por los valles de la Val d\'Aran.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c6'),
    locationId: oid('665a1b2c3d4e5f60718293e3'),
    startDate: new Date('2027-07-09T06:00:00Z'),
    endDate: new Date('2027-07-11T18:00:00Z'),
    distanceKm: 100.0,
    elevationGain: 6400,
    elevationLossM: 6400,
    difficulty: 'hard',
    surface: ['trail', 'rock', 'mixed'],
    tags: ['pirineos', 'aran', 'utmb'],
    price: 135.0,
    variants: [
      { name: '20K', distanceKm: 20.0, elevationGain: 900, price: 55.0 },
      { name: '50K', distanceKm: 50.0, elevationGain: 3300, price: 135.0 },
      { name: '100K', distanceKm: 100.0, elevationGain: 6400, price: 224.0 }
    ],
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
    sku: 'ZEGAMA-2027',
    description: 'Maratón alpina por el macizo de Aizkorri, con 2.700 m de desnivel positivo.',
    hostId: oid('665a1b2c3d4e5f60718293b6'),
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
    variants: [
      { name: '10K', distanceKm: 10.0, elevationGain: 500, price: 20.0 },
      { name: '21K', distanceKm: 21.0, elevationGain: 1200, price: 35.0 },
      { name: '42K', distanceKm: 42.0, elevationGain: 2700, price: 65.0 }
    ],
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
    sku: 'SZ-2027',
    description: 'Una de las carreras de montaña más antiguas del mundo, desde Sierre hasta Zinal por los Alpes suizos.',
    hostId: oid('665a1b2c3d4e5f60718293b6'),
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
    variants: [
      { name: '10K', distanceKm: 10.0, elevationGain: 600, price: 25.0 },
      { name: '21K', distanceKm: 21.0, elevationGain: 1300, price: 45.0 },
      { name: '31K', distanceKm: 31.0, elevationGain: 2200, price: 75.0 }
    ],
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
    sku: 'PPM-2027',
    description: 'Maratón alpina que asciende al Pikes Peak en Colorado, desde Manitou Springs hasta la cumbre.',
    hostId: oid('665a1b2c3d4e5f60718293b6'),
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
    variants: [
      { name: '10K', distanceKm: 10.0, elevationGain: 600, price: 30.0 },
      { name: '21K', distanceKm: 21.0, elevationGain: 1200, price: 50.0 },
      { name: '42K', distanceKm: 42.0, elevationGain: 2400, price: 95.0 }
    ],
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
    sku: 'WS100-2027',
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
    variants: [
      { name: '50K', distanceKm: 50.0, elevationGain: 1500, price: 100.0 },
      { name: '50M', distanceKm: 80.5, elevationGain: 3000, price: 200.0 },
      { name: '100M', distanceKm: 161.0, elevationGain: 5500, price: 350.0 }
    ],
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
    sku: 'HR100-2027',
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
    variants: [
      { name: '50K', distanceKm: 50.0, elevationGain: 3000, price: 150.0 },
      { name: '50M', distanceKm: 80.5, elevationGain: 6000, price: 250.0 },
      { name: '100M', distanceKm: 161.0, elevationGain: 10000, price: 400.0 }
    ],
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
    sku: 'DIAG-2027',
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
    variants: [
      { name: '50K', distanceKm: 50.0, elevationGain: 3000, price: 80.0 },
      { name: '100K', distanceKm: 100.0, elevationGain: 6000, price: 150.0 },
      { name: '170K', distanceKm: 170.0, elevationGain: 10000, price: 250.0 }
    ],
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
    sku: 'MONTGO-2027',
    description: 'Ruta de montaña con vistas al Mediterráneo y tramos técnicos.',
    hostId: oid('665a1b2c3d4e5f60718293b6'),
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
    variants: [
      { name: '5K', distanceKm: 5.0, elevationGain: 250, price: 10.0 },
      { name: '10K', distanceKm: 10.0, elevationGain: 500, price: 18.0 },
      { name: '14K', distanceKm: 14.8, elevationGain: 720, price: 25.0 }
    ],
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
    sku: 'SCS-2027',
    description: 'Recorrido largo por pistas y senderos de la Sierra Calderona.',
    hostId: oid('665a1b2c3d4e5f60718293b6'),
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
    variants: [
      { name: '10K', distanceKm: 10.0, elevationGain: 400, price: 15.0 },
      { name: '21K', distanceKm: 21.0, elevationGain: 900, price: 25.0 },
      { name: '28K', distanceKm: 28.4, elevationGain: 1180, price: 35.0 }
    ],
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293f4'),
    name: 'Courmayeur Trail 2027',
    slug: 'courmayeur-trail-2027',
    sku: 'CT-2027',
    description: 'Carrera por los senderos del Mont-Blanc italiano, con salida y llegada en Courmayeur y vistas al macizo.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c6'),
    locationId: oid('665a1b2c3d4e5f60718293da'),
    startDate: new Date('2027-09-05T06:00:00Z'),
    endDate: new Date('2027-09-05T20:00:00Z'),
    distanceKm: 100.0,
    elevationGain: 6500,
    elevationLossM: 6500,
    difficulty: 'hard',
    surface: ['trail', 'rock', 'mixed'],
    tags: ['alpes', 'courmayeur', 'mont-blanc'],
    price: 140.0,
    variants: [
      { name: '30K', distanceKm: 30.0, elevationGain: 2000, price: 55.0 },
      { name: '60K', distanceKm: 60.0, elevationGain: 3800, price: 95.0 },
      { name: '100K', distanceKm: 100.0, elevationGain: 6500, price: 140.0 }
    ],
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  }
];

function buildDepartures() {
  return events.flatMap((event) => {
    const variants = Array.isArray(event.variants) ? event.variants : [];

    return variants.map((variant, index) => {
      const startDatetime = new Date(event.startDate.getTime() + index * 2 * 60 * 60 * 1000);
      const durationHours = Math.max(2, Math.ceil(variant.distanceKm / 10));
      const endDatetime = new Date(startDatetime.getTime() + durationHours * 60 * 60 * 1000);
      const capacity = 120 + index * 60;
      const occupancy = [0.2, 0.45, 0.7][index] ?? 0.3;
      const bookedParticipants = Math.round(capacity * occupancy);

      return {
        eventId: event._id,
        slug: `${event.slug}-${slugify(variant.name)}-${startDatetime.toISOString().slice(0, 10)}`,
        startDatetime,
        endDatetime,
        capacity,
        price: variant.price,
        bookedParticipants,
        status: 'scheduled',
        isActive: true,
        created_At: SEED_DATE,
        updated_at: SEED_DATE,
        deleted_at: null
      };
    });
  });
}

const departures = buildDepartures();

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

const crypto = require('crypto');

function generatePassword() {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const all = upper + lower + digits;
  let password = upper[Math.floor(Math.random() * upper.length)] + 
                 lower[Math.floor(Math.random() * lower.length)] + 
                 digits[Math.floor(Math.random() * digits.length)];
  for (let i = 0; i < 9; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  return password.split('').sort(() => Math.random() - 0.5).join('').substring(0, 16);
}

const demoAdminEmail = process.env.DEMO_ADMIN_EMAIL || 'admin@mudandpace.com';
const demoAdminPassword = process.env.DEMO_ADMIN_PASSWORD;

const users = [
  {
    name: 'Admin Mud and Pace',
    email: demoAdminEmail,
    password: demoAdminPassword || generatePassword(),
    role: 'ADMIN',
    profile: {
      firstName: 'Admin',
      lastName: 'Mud and Pace',
      city: 'Barcelona',
      country: 'España'
    }
  },
  {
    name: 'Admin Secundario',
    email: 'admin2@mudandpace.com',
    password: generatePassword(),
    role: 'ADMIN',
    profile: {
      firstName: 'Admin',
      lastName: 'Secundario',
      city: 'Valencia',
      country: 'España'
    }
  },
  {
    name: 'Usuario Demo',
    email: 'user@mudandpace.com',
    password: generatePassword(),
    role: 'USER',
    profile: {
      firstName: 'Usuario',
      lastName: 'Demo',
      city: 'Alicante',
      country: 'España'
    }
  }
];

async function seedUsers() {
  for (const item of users) {
    const passwordHash = await bcrypt.hash(item.password, 12);
    const user = await User.findOneAndUpdate(
      { email: item.email },
      {
        $set: {
          name: item.name,
          email: item.email,
          passwordHash,
          role: item.role,
          status: 'active',
          isActive: true,
          emailVerified: true,
          emailVerificationTokenHash: null,
          emailVerificationExpiresAt: null,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
          deleted_at: null
        },
        $unset: { role_id: '' },
        $setOnInsert: { tokenVersion: 0 }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await Profile.findOneAndUpdate(
      { userId: user._id },
      {
        $set: { ...item.profile, deleted_at: null },
        $setOnInsert: { userId: user._id }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  return users.length;
}

async function seedDatabase() {
  await Host.deleteMany({});
  await Category.deleteMany({});
  await Location.deleteMany({});
  await Event.deleteMany({});
  await Departure.deleteMany({});

  await Host.insertMany(hosts, { timestamps: false });
  await Category.insertMany(categories, { timestamps: false });
  await Location.insertMany(locations, { timestamps: false });
  await Event.insertMany(events, { timestamps: false });
  await Departure.insertMany(departures, { timestamps: false });
  const seededUsers = await seedUsers();

  const db = mongoose.connection.db;

  const eventImages = [];
  if (fs.existsSync(SEED_ASSETS_ROOT)) {
    for (const [eventId, folder] of Object.entries(EVENT_IMAGE_FOLDERS)) {
      const sourceDir = path.join(SEED_ASSETS_ROOT, folder);
      if (!fs.existsSync(sourceDir)) {
        continue;
      }

      const targetDir = path.join(UPLOADS_ROOT, 'events', eventId);
      resetDirectory(targetDir);
      copyFiles(sourceDir, targetDir);

      const files = fs.readdirSync(targetDir).sort();
      files.forEach((filename, index) => {
        eventImages.push({
          eventId: oid(eventId),
          url: `/uploads/events/${eventId}/${filename}`,
          filename,
          originalName: filename,
          mimeType: 'image/jpeg',
          size: fs.statSync(path.join(targetDir, filename)).size,
          alt: '',
          isCover: index === 0,
          order: index + 1,
          created_At: SEED_DATE,
          updated_at: SEED_DATE
        });
      });
    }

    const carouselSource = path.join(SEED_ASSETS_ROOT, 'carousel_shop');
    if (fs.existsSync(carouselSource)) {
      const carouselTarget = path.join(UPLOADS_ROOT, 'carousel');
      resetDirectory(carouselTarget);
      copyFiles(carouselSource, carouselTarget);
    }

    const organizersSource = path.join(SEED_ASSETS_ROOT, 'organizadores');
    if (fs.existsSync(organizersSource)) {
      const organizersTarget = path.join(UPLOADS_ROOT, 'organizadores');
      resetDirectory(organizersTarget);
      copyFiles(organizersSource, organizersTarget);
    }
  }

  await db.collection('experiences').deleteMany({});
  await db.collection('event_images').deleteMany({});
  await db.collection('experience_images').deleteMany({});
  await db.collection('experiences').insertMany(experiences);
  await db.collection('experience_images').insertMany(experienceImages);
  if (eventImages.length) {
    await db.collection('event_images').insertMany(eventImages);
  }

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
    departures: departures.length,
    experiences: experiences.length,
    event_images: eventImages.length,
    experience_images: experienceImages.length,
    users: seededUsers,
    profiles: seededUsers
  };
}

module.exports = { connectDatabase, seedDatabase };
