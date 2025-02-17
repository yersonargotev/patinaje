export interface Athlete {
	id?: number;
	name: string;
	age: number;
	weight: number;
	height: number;
	active: boolean;
	completedPeriods: number[];
	observations?: string;
	totalDistance: number;
}

export interface TestConfig {
	recoveryTime: number;
	currentPeriod: number;
	athleteCount: number;
	isRunning: boolean;
	isPaused: boolean;
	isFinished: boolean;
}

export interface TrackPosition {
	period: number;
	lap: number;
	segment: number;
	elapsedTime: number;
	expectedSegment: number;
}
