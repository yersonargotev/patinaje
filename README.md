# Patinaje - Sports Evaluation App

A desktop application built with Tauri, React, and TypeScript for managing and evaluating athletes' performance in skating tests.

## Features

- Real-time athlete performance tracking
- Multiple athlete management
- Customizable test periods and recovery times
- Audio cues and announcements
- Detailed evaluation history
- Export capabilities (CSV and Excel formats)
- Observation management for each evaluation

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Tauri + Rust
- **Database**: SQLite
- **Styling**: TailwindCSS
- **Audio**: Rodio (Rust)
- **Export Formats**: CSV, XLSX

## Prerequisites

- Node.js (Latest LTS version)
- Rust (Latest stable version)
- Cargo
- Visual Studio Code (Recommended)

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Install Rust dependencies:
```bash
cd src-tauri
cargo build
```

## Development

Start the development server:

```bash
npm run tauri dev
```

## Building

To create a production build:

```bash
npm run tauri build
```

## Project Structure

- `/src` - React frontend code
- `/src-tauri` - Rust backend code
- `/src/components` - React components
- `/src-tauri/src` - Rust source files
- `/src-tauri/resources` - Audio resources

## Features in Detail

### Athlete Management
- Add/remove athletes
- Track individual performance
- Record personal data (age, weight, height)
- Add observations

### Test Configuration
- Adjustable periods (2-22)
- Customizable recovery times
- Multiple athlete support
- Real-time tracking

### Data Export
- Export to CSV
- Export to Excel (XLSX)
- Individual athlete exports
- Complete database exports

## License

This project is licensed under the MIT License.
