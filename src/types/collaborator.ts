export interface Collaborator {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: 'owner' | 'admin' | 'member';
  department?: string;
  startDate?: string;
  totalPlantoes?: number;
  preferences?: {
    theme?: string;
    notifications?: boolean;
  };
}