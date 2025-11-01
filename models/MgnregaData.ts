import mongoose, { Schema, Document } from 'mongoose';

/**
 * Optimized MGNREGA data model
 * - Removed redundant fields (districtName, stateName - use District collection)
 * - Removed rawData to save space
 * - Removed year (can derive from financialYear)
 * - Financial values stored in crores (as per API)
 */
export interface IMgnregaData extends Document {
  // Composite key for unique identification
  districtCode: string;
  stateCode: string;
  financialYear: string;
  financialYearStart: number;
  month: number;

  // Core metrics
  personsWorked: number;
  householdsWorked: number;
  workdaysGenerated: number;
  workdaysPerPerson: number;

  // Financial metrics (in crores)
  totalExpenditure: number;
  wageExpenditure: number;
  materialExpenditure: number;

  // Works metrics
  worksCompleted: number;
  worksInProgress: number;
  worksSanctioned: number;

  // Optional metrics
  personsDemanded?: number;
  avgWageRate?: number;

  createdAt: Date;
  updatedAt: Date;
}

const MgnregaDataSchema = new Schema<IMgnregaData>(
  {
    districtCode: { type: String, required: true, index: true },
    stateCode: { type: String, required: true, index: true },
  financialYear: { type: String, required: true, index: true },
  financialYearStart: { type: Number, required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    personsWorked: { type: Number, default: 0, index: true },
    householdsWorked: { type: Number, default: 0 },
    workdaysGenerated: { type: Number, default: 0, index: true },
    workdaysPerPerson: { type: Number, default: 0 },
    totalExpenditure: { type: Number, default: 0, index: true },
    wageExpenditure: { type: Number, default: 0 },
    materialExpenditure: { type: Number, default: 0 },
    worksCompleted: { type: Number, default: 0 },
    worksInProgress: { type: Number, default: 0 },
    worksSanctioned: { type: Number, default: 0 },
    personsDemanded: { type: Number },
    avgWageRate: { type: Number },
  },
  {
    timestamps: true,
  }
);

// Unique composite index - prevents duplicates
MgnregaDataSchema.index(
  { districtCode: 1, financialYear: 1, month: 1 },
  { unique: true }
);

// Optimized indexes for common queries
MgnregaDataSchema.index({ districtCode: 1, financialYearStart: -1, month: -1 }); // Latest data first
MgnregaDataSchema.index({ stateCode: 1, financialYearStart: -1, month: -1 });
MgnregaDataSchema.index({ financialYearStart: -1, month: -1 });

export default mongoose.models.MgnregaData || mongoose.model<IMgnregaData>('MgnregaData', MgnregaDataSchema);
