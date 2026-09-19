# EventHub - Event Ticket Booking Web Application

A simple event ticket booking web application built with Node.js and Express for the Software Quality Assurance course (SE 4221).

## Prerequisites

- [Node.js](https://nodejs.org) (version 14 or later)
- Google Chrome (recommended)

## Installation

### 1. Clone or Extract the Project

Clone this repository or download it as a ZIP file (**Code > Download ZIP**) and extract it to a location on your computer.

### 2. Navigate to the Project Folder

Open Command Prompt (cmd) or PowerShell and navigate to the EventHub folder, for example:

```
cd C:\Users\YourUsername\Desktop\EventHub
```

> Replace the path above with the actual location of the folder.

### 3. Install Dependencies

Run the following command to install the required packages:

```
npm install
```

Wait for the process to complete. You should see output similar to:

```
added 79 packages in 5s
```

> **Note:** A `node_modules` folder will be created automatically. Do not delete or modify this folder.

### 4. Start the Application

Start the web server by running:

```
node server.js
```

or

```
npm start
```

You should see this message:

```
EventHub is running at http://localhost:3000
```

> **Important:** Keep this terminal window open while using the application. Closing it will shut down the server.

### 5. Open the Application

Open Google Chrome and navigate to:

```
http://localhost:3000
```

You should see the EventHub home page displaying six events in a grid layout.


## Notes

- All data is kept in memory. Restarting the server clears all bookings and resets the application to its initial state.
- To stop the server, press `Ctrl + C` in the terminal window.
- The application uses port 3000. If the port is already in use, close the other application that is using it and start the server again.
