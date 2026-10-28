# Weekday Scheduling Control Tower

A centralized scheduling operations dashboard built to simplify interview coordination, track scheduling requests, and improve operational visibility.

**Live Demo:** [Open Application](https://weekday-project-control-tower.vercel.app/)

**Source Code:** [GitHub Repository](https://github.com/AbishekRC/Weekday-Project_Control_tower)

## Overview

The Weekday Scheduling Control Tower is a web-based MVP designed to organize interview scheduling information in one place. It helps operations teams review scheduling requests, monitor activity, and manage workflow information through a centralized dashboard.

## Key Features

- **Scheduling Dashboard:** Centralized visibility into scheduling operations.
- **Excel Import:** Import scheduling records from Excel workbooks.
- **Request Management:** Review and manage scheduling information through the application interface.
- **Operational Visibility:** Organize request data to support workflow monitoring.
- **Browser Persistence:** Retain supported application state using browser localStorage.
- **Responsive UI:** A modern web interface built for desktop and smaller screens.

## Technology Stack

- **Frontend:** React 19, TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Excel Processing:** SheetJS
- **State Persistence:** Browser localStorage
- **Deployment:** Vercel
- **Version Control:** Git and GitHub

## Application Workflow

1. Import scheduling data from an Excel workbook.
2. Process and display the imported records.
3. Review scheduling information through the dashboard.
4. Use the available interface actions to manage requests.
5. Refresh the browser to verify persistence of supported changes.

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### Run Locally

Clone the repository:

```bash
git clone https://github.com/AbishekRC/Weekday-Project_Control_tower.git
cd Weekday-Project_Control_tower
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Architecture

The application uses a client-side architecture:

**Excel Workbook → Import Service → Application State → Dashboard → Browser Storage**

React and TypeScript power the interface and application logic, SheetJS supports Excel import, and localStorage retains supported state within the browser.

## Limitations

- This is an MVP, not a fully integrated production scheduling platform.
- Browser-stored data is not automatically synchronized across users or devices.
- External calendar integrations, centralized databases, authentication, and automated notifications should not be assumed unless separately implemented.
- Results depend on the quality and structure of the imported workbook.

## Future Enhancements

- Calendar and scheduling platform integrations
- Multi-user collaboration and role-based access
- Centralized database persistence
- Automated reminders and notifications
- SLA monitoring and workload analytics
- Audit trails and automated workflow testing

## Project Links

- **Live Application:** [Launch the Control Tower](https://weekday-project-control-tower.vercel.app/)
- **GitHub Repository:** [View Source Code](https://github.com/AbishekRC/Weekday-Project_Control_tower)

## Project Status

**Status:** MVP deployed successfully on Vercel.

**Purpose:** Demonstrate a centralized, data-driven approach to interview scheduling operations.
