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
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22'
  ],
  grade: [
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
    'X',
    'XI',
    'XII'
  ],
  gender: [
    'Male',
    'Female'
  ],
  disability: [
    'None',
    'Mild',
    'Moderate',
    'Severe'
  ]
};

