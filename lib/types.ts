// Type definitions for the application

export interface District {
  districtCode: string;
  districtName: string;
  stateCode: string;
  stateName: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface MonthlyData {
  financialYear: string;
  month: number;
  year: number;
  personsWorked: number;
  householdsWorked: number;
  workdaysGenerated: number;
  workdaysPerPerson: number;
  totalExpenditure: number;
  worksCompleted: number;
}

export interface DashboardTrends {
  workdaysTrend: 'up' | 'down' | 'stable';
  expenditureTrend: 'up' | 'down' | 'stable';
  worksTrend: 'up' | 'down' | 'stable';
  workdaysChange: number;
  expenditureChange: number;
  worksChange: number;
}

export interface Alert {
  type: 'warning' | 'info' | 'critical';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DistrictDashboardData {
  district: District;
  latest: any;
  monthlyData: MonthlyData[];
  trends: DashboardTrends;
  stateAverage: any;
  alerts: Alert[];
}
