const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: {
      type: [Number], required: true,
      validate: { validator: (value) => value.length === 2, message: 'coordinates debe contener [longitud, latitud]' }
    }
  },
  { _id: false }
);

const trailRouteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 3000 },
    location: {
      country: { type: String, required: true, trim: true },
      region: { type: String, trim: true }, province: { type: String, trim: true }, municipality: { type: String, trim: true }
    },
    startPoint: { type: pointSchema, required: true },
    distanceKm: { type: Number, required: true, min: 0.1 },
    elevationGainM: { type: Number, required: true, min: 0 },
    elevationLossM: { type: Number, default: 0, min: 0 },
    difficulty: { type: String, enum: ['easy', 'moderate', 'hard', 'expert'], default: 'moderate' },
    surface: [{ type: String, enum: ['trail', 'rock', 'dirt', 'gravel', 'asphalt', 'mixed'] }],
    tags: [{ type: String, trim: true, lowercase: true }],
    imageUrl: { type: String, trim: true }, gpxUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    status: { type: String, enum: ['active', 'inactive', 'deleted'], default: 'active', index: true },
    // Compatibilidad con la versión anterior.
    isPublished: { type: Boolean, default: true },
    deleted_at: { type: Date, default: null, index: true }
  },
  { timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' }, versionKey: false }
);

trailRouteSchema.index({ startPoint: '2dsphere' });
trailRouteSchema.index({ 'location.country': 1, 'location.region': 1 });
trailRouteSchema.index({ difficulty: 1, distanceKm: 1 });
trailRouteSchema.index({ slug: 1, deleted_at: 1 });

module.exports = mongoose.model('TrailRoute', trailRouteSchema);
