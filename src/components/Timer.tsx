import { Clock, RefreshCw, Timer as TimerIcon } from "lucide-react";
import { formatTime } from "../utils/timing";

interface TimerProps {
	workTime: number;
	recoveryTime: number;
	totalTime: number;
}

export const Timer: React.FC<TimerProps> = ({
	workTime,
	recoveryTime,
	totalTime,
}) => {
	return (
		<div className="grid grid-cols-3 gap-4">
			<div className="bg-white p-4 rounded-lg shadow-md">
				<h3 className="text-sm font-medium text-gray-500">Tiempo de Trabajo</h3>
				<p className="text-2xl font-bold text-blue-600">
					{formatTime(workTime)}
				</p>
			</div>

			<div className="bg-white p-4 rounded-lg shadow-md">
				<h3 className="text-sm font-medium text-gray-500">
					Tiempo de Recuperación
				</h3>
				<p className="text-2xl font-bold text-green-600">
					{formatTime(recoveryTime)}
				</p>
			</div>

			<div className="bg-white p-4 rounded-lg shadow-md">
				<h3 className="text-sm font-medium text-gray-500">Tiempo Total</h3>
				<p className="text-2xl font-bold text-purple-600">
					{formatTime(totalTime)}
				</p>
			</div>
		</div>
	);
};
