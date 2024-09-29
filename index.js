const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000; // Use Heroku's port or fallback to 3000

// Middleware
app.use(helmet()); // Use Helmet to secure your app
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// Function to parse the cURL command
const parseCurlCommand = (curlCommand) => {
  let url = "";
  let method = "GET"; // Default method
  let headers = {};
  let body = "";

  // Regex patterns
  const urlRegex = /curl\s+"([^"]+)"/;
  const methodRegex = /-X\s+(\w+)/;
  const headerRegex = /-H\s+"([^:]+): (.+?)"/g;
  const bodyRegex = /--data-raw\s+"([^"]+)"/;

  const urlMatch = curlCommand.match(urlRegex);
  if (urlMatch) {
    url = urlMatch[1];
  }

  const methodMatch = curlCommand.match(methodRegex);
  if (methodMatch) {
    method = methodMatch[1].toUpperCase();
  }

  let headerMatch;
  while ((headerMatch = headerRegex.exec(curlCommand)) !== null) {
    headers[headerMatch[1].trim()] = headerMatch[2].trim();
  }

  if (method !== "GET") {
    const bodyMatch = curlCommand.match(bodyRegex);
    if (bodyMatch) {
      body = bodyMatch[1].replace(/%5E/g, "").replace(/\^/g, ""); // Clean up the body
    }
  }

  return { url, method, headers, body }; // Return the parsed components
};

// Endpoint to extract data from cURL command
app.post("/extract", (req, res) => {
  const { curlCommand } = req.body;

  if (curlCommand) {
    const extractedData = parseCurlCommand(curlCommand);
    res.json({ success: true, data: extractedData });
  } else {
    res
      .status(400)
      .json({ success: false, message: "No cURL command provided." });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Start the server and listen on the specified port
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`); // Log server start
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Process terminated gracefully"); // Log termination
  });
});
