import { Schema, model, models } from 'mongoose';

export interface IFilterOptions {
  category: 'age' | 'grade' | 'gender' | 'disability';
  options: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FilterOptionsSchema = new Schema<IFilterOptions>(
  {
    category: { 
      type: String, 
      required: true, 
      enum: ['age', 'grade', 'gender', 'disability'],
      unique: true 
    },
    options: [{ type: String, required: true }]
  },
  { timestamps: true }
);

export const FilterOptionsModel = models.FilterOptions || model<IFilterOptions>('FilterOptions', FilterOptionsSchema);

// Default filter options
export const DEFAULT_FILTER_OPTIONS = {
  age: [
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18'
  ],
  grade: [
    'Grade I',
    'Grade II',
    'Grade III',
    'Grade IV',
    'Grade V',
    'Grade VI',
    'Grade VII',
    'Grade VIII',
    'Grade IX',
    'Grade X'
  ],
  gender: [
    'Male',
    'Female',
    'Other'
  ],
  disability: [
    'None',
    'Visual Impairment',
    'Hearing Impairment',
    'Physical Disability',
    'Learning Disability',
    'Other'
  ]
};

