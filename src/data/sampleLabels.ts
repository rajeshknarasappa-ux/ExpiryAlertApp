export interface SampleLabel {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
}

export const SAMPLE_LABELS: SampleLabel[] = [
  {
    id: 'sample-milk',
    name: 'Horizon Organic Whole Milk',
    category: 'Groceries',
    description: 'Dairy milk carton with printed Best By date',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-amoxicillin',
    name: 'Amoxicillin Antibiotic 500mg',
    category: 'Medicine',
    description: 'Prescription pharmacy bottle with EXP date & batch',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-sunscreen',
    name: 'Anthelios Mineral Sunscreen SPF 50',
    category: 'Cosmetics',
    description: 'Dermatological lotion tube with PAO and expiry code',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-yogurt',
    name: 'Chobani Greek Strawberry Yogurt',
    category: 'Groceries',
    description: 'Cultured yogurt cup with foil lid stamp',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-spinach',
    name: 'Earthbound Organic Baby Spinach',
    category: 'Groceries',
    description: 'Fresh salad greens clamshell with Best If Used By stamp',
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80',
  },
];
