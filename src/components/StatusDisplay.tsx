import { formatTime } from "../utils/timing";

interface StatusDisplayProps {
	period: number;
	lap: number;
	recoveryTime: number;
	activeAthletes: number;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
	period,
	lap,
	recoveryTime,
	activeAthletes,
}) => {
	return (
		<div className="grid grid-cols-4 gap-4 mb-4">
			<div className="bg-white p-4 rounded-lg shadow-md">
				<h3 className="text-sm font-medium text-gray-500">Period</h3>
				<p className="text-2xl font-bold">{period}</p>
			</div>

			<div className="bg-white p-4 rounded-lg shadow-md">
				<h3 className="text-sm font-medium text-gray-500">Lap</h3>
				<p className="text-2xl font-bold">{lap}/4</p>
			</div>

			<div className="bg-white p-4 rounded-lg shadow-md">
				<h3 className="text-sm font-medium text-gray-500">Recovery</h3>
				<p className="text-2xl font-bold">{formatTime(recoveryTime)}</p>
			</div>

			<div className="bg-white p-4 rounded-lg shadow-md">
				<h3 className="text-sm font-medium text-gray-500">Active Athletes</h3>
				<p className="text-2xl font-bold">{activeAthletes}</p>
			</div>
		</div>
	);
};
