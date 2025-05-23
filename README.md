# ZohoTime Insights Dashboard

A powerful dashboard for Zoho People timesheet analytics, providing detailed insights into project utilization, team performance, and revenue opportunities.

![Dashboard Preview](https://via.placeholder.com/1200x600?text=ZohoTime+Insights+Dashboard)

## Features

- **Interactive Dashboard**: Real-time monitoring of key metrics including billable hours, non-billable hours, and project distribution
- **Project Tracking**: Detailed breakdown of time spent on each project with filtering capabilities
- **Team Performance**: Monitor individual and team productivity metrics
- **Revenue Optimization**: Identify opportunities to increase billable hours and improve resource allocation
- **Customizable Reports**: Build and export reports with flexible parameters

## Quick Start

### Prerequisites

- Node.js (v18+)
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zohotime-insights-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   
   Configure your PostgreSQL connection:
   ```
   DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

6. **Access the dashboard**
   
   Open your browser and navigate to `http://localhost:5000`

   Login with the default admin credentials:
   - Username: `admin`
   - Password: `password123`

## Connecting to Zoho

To connect your Zoho People account:

1. Navigate to Settings > Connections
2. Click "Connect Zoho"
3. Enter your Zoho API credentials (Client ID, Client Secret, Organization)

You can obtain these credentials from your Zoho Developer Console by creating a server-to-server OAuth application with the appropriate scopes for accessing timesheet data.

## Project Structure

```
├── client/             # Frontend React application
│   ├── src/            # Source code
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utility functions
│   │   └── pages/      # Page components
├── server/             # Backend Express server
│   ├── routes/         # API routes
│   └── db.ts           # Database configuration
├── shared/             # Shared code between frontend and backend
│   └── schema.ts       # Database schema and types
└── drizzle.config.ts   # Drizzle ORM configuration
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run db:push` - Update the database schema
- `npm run build` - Build for production
- `npm start` - Run in production mode

## Security

- Authentication is handled using Passport.js with session-based authentication
- Admin users can create additional user accounts as needed
- All passwords are securely hashed using scrypt

## Customization

The dashboard can be customized to fit your organization's needs:

- Edit the date range filters to match your reporting periods
- Customize the charts and visualizations in the dashboard components
- Modify the report templates to include specific metrics

## Troubleshooting

If you experience issues:

1. **Login Problems**
   - The default admin credentials are `admin` / `password123`
   - Change your password immediately after the first login

2. **Database Connection Issues**
   - Verify your PostgreSQL connection settings
   - Ensure the database exists and is accessible

3. **Zoho API Connection**
   - Validate your Zoho API credentials
   - Ensure your Zoho application has the necessary permissions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or support, please contact support@logiciel.io