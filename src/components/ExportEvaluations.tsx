import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { useState } from "react";

interface ExportEvaluationsProps {
	athleteId?: number;
	athleteName?: string;
}

export const ExportEvaluations = ({
	athleteId,
	athleteName,
}: ExportEvaluationsProps) => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleExport = async (exportType: "all" | "athlete") => {
		try {
			setLoading(true);
			setError(null);
			setSuccess(null);

			const defaultPath = `evaluaciones_${exportType === "all" ? "todas" : athleteName?.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;

			const filePath = await save({
				defaultPath,
				filters: [
					{
						name: "CSV",
						extensions: ["csv"],
					},
				],
			});

			if (!filePath) {
				return; // User cancelled the save dialog
			}

			const result = await invoke<string>(
				exportType === "all"
					? "export_all_evaluations"
					: "export_athlete_evaluations",
				{
					...(exportType === "athlete" && { athleteId }),
					path: filePath,
				},
			);

			setSuccess(result);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Error al exportar evaluaciones",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			{error && (
				<div className="text-red-600 p-4 rounded-lg bg-red-50">{error}</div>
			)}
			{success && (
				<div className="text-green-600 p-4 rounded-lg bg-green-50">
					{success}
				</div>
			)}
			<div className="flex gap-4">
				{!athleteId && (
					<button
						type="button"
						onClick={() => handleExport("all")}
						disabled={loading}
						className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? "Exportando..." : "Exportar Todas las Evaluaciones"}
					</button>
				)}
				{athleteId && (
					<button
						type="button"
						onClick={() => handleExport("athlete")}
						disabled={loading}
						className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? "Exportando..." : "Exportar Evaluaciones del Atleta"}
					</button>
				)}
			</div>
		</div>
	);
};
