


export interface IqamaRecord {
  id: string;
  name: string;
  nameArabic?: string;
  iqamaNo: string;
  expiryDate: string;
  dob: string;
  nationality?: string;
  nationalityArabic?: string;
  occupation?: string;
  establishmentName?: string;
  establishmentNo?: string;
  supplierName?: string;
  timestamp: string;
  isFallback?: boolean;
  hasImage?: boolean;
  apiError?: string;
  category?: string;
}

export interface ProductSupplier {
  name: string;
  url: string;
  unitCost: string;
}

export interface ProductItem {
  title: string;
  description: string;
  usp: string;
  targetAudience: string;
  priceRange: string;
  growthScore: number;
  approxTotalCost?: string;
  marketPrice?: string;
  suppliers?: ProductSupplier[];
}

export interface ProductSearchResponse {
  trendReasonDescription: string;
  products: ProductItem[];
  sources?: { title: string; uri: string }[];
  isFallback?: boolean;
}

export interface ResumeWorkExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: string[];
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface ResumeSkill {
  id: string;
  name: string;
  level?: "Beginner" | "Intermediate" | "Advanced" | "Expert" | "";
}

export interface ResumeProject {
  id: string;
  name: string;
  description: string;
  url?: string;
}

export interface ResumeData {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  profileImage?: string;
  showProfileImage?: boolean;
  workExperience: ResumeWorkExperience[];
  education: ResumeEducation[];
  skills: ResumeSkill[];
  projects: ResumeProject[];
}

