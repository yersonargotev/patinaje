// Lookup table for period intervals based on the provided data
const PERIOD_INTERVALS: Record<number, number> = {
	2: 8.65,
	3: 8.33,
	4: 8.03,
	5: 7.75,
	6: 7.5,
	7: 7.25,
	8: 7.03,
	9: 6.81,
	10: 6.61,
	11: 6.42,
	12: 6.25,
	13: 6.08,
	14: 5.92,
	15: 5.76,
	16: 5.62,
	17: 5.48,
	18: 5.35,
	19: 5.23,
	20: 5.11,
	21: 5.0,
	22: 4.89,
};

export const calculateIntervalTime = (period: number): number => {
	// Validate period is within bounds
	if (period < 2 || period > 22) {
		throw new Error("Period must be between 2 and 22");
	}

	return PERIOD_INTERVALS[period];
};

export const getTotalPeriodTime = (period: number): number => {
	const intervalTime = calculateIntervalTime(period);
	return intervalTime * 16; // 4 laps * 4 segments = 16 intervals
};

export const formatTime = (seconds: number): string => {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
};
