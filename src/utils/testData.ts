export interface PeriodData {
	period: number;
	speed: number;
	lapTime: number;
	partialTime: number;
	totalTime: number;
	distance: number;
}

export const periodData: PeriodData[] = [
	{
		period: 2,
		speed: 20.8,
		lapTime: 34.61,
		partialTime: 8.65,
		totalTime: 138.4,
		distance: 800,
	},
	{
		period: 3,
		speed: 21.6,
		lapTime: 33.33,
		partialTime: 8.33,
		totalTime: 133.28,
		distance: 1600,
	},
	{
		period: 4,
		speed: 22.4,
		lapTime: 32.14,
		partialTime: 8.03,
		totalTime: 128.48,
		distance: 2400,
	},
	{
		period: 5,
		speed: 23.2,
		lapTime: 31.03,
		partialTime: 7.75,
		totalTime: 124,
		distance: 3200,
	},
	{
		period: 6,
		speed: 24.0,
		lapTime: 30.0,
		partialTime: 7.5,
		totalTime: 120,
		distance: 4000,
	},
	{
		period: 7,
		speed: 24.8,
		lapTime: 29.03,
		partialTime: 7.25,
		totalTime: 116,
		distance: 4800,
	},
	{
		period: 8,
		speed: 25.6,
		lapTime: 28.12,
		partialTime: 7.03,
		totalTime: 112.48,
		distance: 5600,
	},
	{
		period: 9,
		speed: 26.4,
		lapTime: 27.27,
		partialTime: 6.81,
		totalTime: 108.96,
		distance: 6400,
	},
	{
		period: 10,
		speed: 27.2,
		lapTime: 26.47,
		partialTime: 6.61,
		totalTime: 105.76,
		distance: 7200,
	},
	{
		period: 11,
		speed: 28.0,
		lapTime: 25.71,
		partialTime: 6.42,
		totalTime: 102.72,
		distance: 8000,
	},
	{
		period: 12,
		speed: 28.8,
		lapTime: 25.0,
		partialTime: 6.25,
		totalTime: 100,
		distance: 8800,
	},
	{
		period: 13,
		speed: 29.6,
		lapTime: 24.32,
		partialTime: 6.08,
		totalTime: 97.28,
		distance: 9600,
	},
	{
		period: 14,
		speed: 30.4,
		lapTime: 23.68,
		partialTime: 5.92,
		totalTime: 94.72,
		distance: 10400,
	},
	{
		period: 15,
		speed: 31.2,
		lapTime: 23.07,
		partialTime: 5.76,
		totalTime: 92.16,
		distance: 11200,
	},
	{
		period: 16,
		speed: 32.0,
		lapTime: 22.5,
		partialTime: 5.62,
		totalTime: 89.92,
		distance: 12000,
	},
	{
		period: 17,
		speed: 32.8,
		lapTime: 21.95,
		partialTime: 5.48,
		totalTime: 87.68,
		distance: 12800,
	},
	{
		period: 18,
		speed: 33.6,
		lapTime: 21.42,
		partialTime: 5.35,
		totalTime: 85.6,
		distance: 13600,
	},
	{
		period: 19,
		speed: 34.4,
		lapTime: 20.93,
		partialTime: 5.23,
		totalTime: 83.68,
		distance: 14400,
	},
	{
		period: 20,
		speed: 35.2,
		lapTime: 20.45,
		partialTime: 5.11,
		totalTime: 81.76,
		distance: 15200,
	},
	{
		period: 21,
		speed: 36.0,
		lapTime: 20.0,
		partialTime: 5.0,
		totalTime: 80,
		distance: 16000,
	},
	{
		period: 22,
		speed: 36.8,
		lapTime: 19.56,
		partialTime: 4.89,
		totalTime: 78.24,
		distance: 16800,
	},
];

export const getPeriodData = (period: number): PeriodData | undefined => {
	return periodData.find((data) => data.period === period);
};
