import mongoose, { Schema, Document } from 'mongoose';

export interface IDistrict extends Document {
  districtCode: string;
  districtName: string;
  stateCode: string;
  stateName: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DistrictSchema = new Schema<IDistrict>(
  {
    districtCode: { type: String, required: true, unique: true, index: true },
    districtName: { type: String, required: true, index: true },
    stateCode: { type: String, required: true, index: true },
    stateName: { type: String, required: true, index: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

export default mongoose.models.District || mongoose.model<IDistrict>('District', DistrictSchema);
