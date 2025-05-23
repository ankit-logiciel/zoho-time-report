# ZohoTime Insights Dashboard Setup Guide

This document provides instructions for setting up and running the ZohoTime Insights Dashboard project, which helps you track and analyze timesheet data from Zoho People.

## Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- PostgreSQL database

## Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zohotime-insights-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the database**
   
   The application uses a PostgreSQL database. Make sure your database is running and set the required environment variables:

   ```
   DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>
   ```

   You can also set these variables individually:
   ```
   PGUSER=<username>
   PGPASSWORD=<password>
   PGHOST=<host>
   PGPORT=<port>
   PGDATABASE=<database>
   ```

4. **Initialize the database**
   
   Apply the database schema using the provided migration tool:
   ```bash
   npm run db:push
   ```

   This will create all necessary tables for the application.

## Running the Application

1. **Start the development server**
   ```bash
   npm run dev
   ```
   
   This will start both the backend server and frontend development server.

2. **Access the application**
   
   The application will be available at: http://localhost:5000

3. **Login credentials**
   
   The application automatically creates an admin account with the following credentials:
   - Username: `admin`
   - Password: `password123`

   You should change this password after your first login using the Settings page.

## Connecting to Zoho People

To use the timesheet analytics features, you need to connect your Zoho People account:

1. Login to the application
2. Go to Settings > Connections
3. Click "Connect Zoho"
4. Enter your Zoho API credentials:
   - Client ID
   - Client Secret
   - Organization ID

These credentials can be obtained from your Zoho Developer Console by creating a server-to-server application with the necessary scopes for accessing timesheet data.

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend Express server
- `/shared` - Shared code and type definitions

## Available Scripts

- `npm run dev` - Start the development server
- `npm run db:push` - Update the database schema
- `npm run build` - Build the application for production
- `npm start` - Run the application in production mode

## Troubleshooting

If you encounter any issues:

1. **Database Connection Issues**
   - Verify your database connection settings
   - Ensure PostgreSQL is running

2. **API Connection Issues**
   - Verify your Zoho API credentials
   - Check the network connectivity

3. **Reset Admin Password**
   - If you forget your admin password, you can reset it by running:
   ```sql
   UPDATE users SET password = '<new-hashed-password>' WHERE username = 'admin';
   ```

## Support

For additional help or to report issues, please contact support at support@logiciel.io.