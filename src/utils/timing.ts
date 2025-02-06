import { getPeriodData } from "./testData";

export const calculateIntervalTime = (period: number): number => {
	// Validate period is within bounds
	if (period < 2 || period > 22) {
		throw new Error("Period must be between 2 and 22");
	}

	const periodData = getPeriodData(period);
	if (!periodData) {
		throw new Error(`No data found for period ${period}`);
	}

	return periodData.partialTime;
};

export const getTotalPeriodTime = (period: number): number => {
	const periodData = getPeriodData(period);
	if (!periodData) {
		throw new Error(`No data found for period ${period}`);
	}

	return periodData.totalTime;
};

export const formatTime = (seconds: number): string => {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const getDistanceForPeriod = (period: number): number => {
	const periodData = getPeriodData(period);
	if (!periodData) {
		throw new Error(`No data found for period ${period}`);
	}

	return periodData.distance;
};
