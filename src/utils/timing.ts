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

export const calculateDistance = (
	period: number,
	elapsedTime: number,
): number => {
	const periodData = getPeriodData(period);
	if (!periodData) return 0;

	// Calculate how many complete laps have been done
	const completeLaps = Math.floor(elapsedTime / periodData.lapTime);

	// Calculate remaining time for partial lap
	const remainingTime = elapsedTime % periodData.lapTime;

	// Calculate segments completed in partial lap
	const partialSegments = Math.floor(remainingTime / periodData.partialTime);

	// Each lap is 200m (4 segments of 50m each)
	const totalDistance = completeLaps * 200 + partialSegments * 50;

	return totalDistance;
};

export const calculateTotalDistance = (
	currentPeriod: number,
	elapsedTime: number,
): number => {
	// Only calculate distance from current period
	return calculateDistance(currentPeriod, elapsedTime);
};
