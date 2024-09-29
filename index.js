const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 80; // Use PORT from .env or default to 3000

app.use(helmet()); // Use helmet to secure your app
app.use(cors()); // Enable CORS
app.use(express.json()); // Limit JSON body size

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
      body = bodyMatch[1].replace(/%5E/g, "").replace(/\^/g, "");
    }
  }

  return { url, method, headers, body }; // Return body as well
};

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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Process terminated");
  });
});
