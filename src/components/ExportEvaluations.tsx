import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import { toast } from "sonner";

interface ExportEvaluationsProps {
	athleteId?: number;
	athleteName?: string;
}

type ExportFormat = "csv" | "xlsx";

export function ExportEvaluations({
	athleteId,
	athleteName,
}: ExportEvaluationsProps) {
	const [exporting, setExporting] = useState(false);
	const [format, setFormat] = useState<ExportFormat>("csv");

	const handleExport = async () => {
		try {
			setExporting(true);

			const defaultPath = athleteId
				? `evaluacion_${athleteName?.toLowerCase().replace(/\s+/g, "_")}.${format}`
				: `evaluaciones.${format}`;

			const filePath = await save({
				defaultPath,
				filters: [
					{
						name: format.toUpperCase(),
						extensions: [format],
					},
				],
			});

			if (!filePath) {
				return; // User cancelled
			}

			const functionName = athleteId
				? format === "csv"
					? "export_athlete_evaluations"
					: "export_athlete_evaluations_to_xlsx"
				: format === "csv"
					? "export_all_evaluations"
					: "export_all_evaluations_to_xlsx";

			await invoke(functionName, {
				...(athleteId && { athleteId }),
				path: filePath,
			});

			toast.success(
				athleteId
					? `Evaluaciones de ${athleteName} exportadas exitosamente`
					: "Todas las evaluaciones exportadas exitosamente",
			);
		} catch (error) {
			console.error("Error exporting evaluations:", error);
			toast.error(
				athleteId
					? `Error al exportar las evaluaciones de ${athleteName}`
					: "Error al exportar las evaluaciones",
			);
		} finally {
			setExporting(false);
		}
	};

	return (
		<div className="flex gap-2 items-center">
			<select
				value={format}
				onChange={(e) => setFormat(e.target.value as ExportFormat)}
				className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm
					focus:outline-none focus:ring-2 focus:ring-blue-500"
				disabled={exporting}
			>
				<option value="csv">CSV</option>
				<option value="xlsx">Excel (XLSX)</option>
			</select>
			<button
				type="button"
				onClick={handleExport}
				disabled={exporting}
				className={`
					inline-flex items-center px-4 py-2 rounded-lg
					${
						exporting
							? "bg-gray-300 cursor-not-allowed"
							: "bg-blue-600 hover:bg-blue-700"
					}
					text-white font-medium text-sm
					transition-colors duration-200
					focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
				`}
			>
				{exporting ? (
					<>
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
						Exportando...
					</>
				) : (
					<>
						<svg
							className="w-4 h-4 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
							role="img"
							aria-label="Icono de exportar"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
						{athleteId
							? `Exportar evaluaciones de ${athleteName}`
							: "Exportar todas las evaluaciones"}
					</>
				)}
			</button>
		</div>
	);
}
