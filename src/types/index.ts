export interface Athlete {
	id: number;
	name: string;
	active: boolean;
	completedPeriods: number[];
}

export interface TestConfig {
	recoveryTime: number;
	currentPeriod: number;
	athleteCount: number;
	isRunning: boolean;
	isPaused: boolean;
}

export interface TrackPosition {
	period: number;
	lap: number;
	segment: number;
}
