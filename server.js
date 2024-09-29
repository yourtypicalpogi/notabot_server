const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());

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

  // Only parse body if the method is not GET
  if (method !== "GET") {
    const bodyMatch = curlCommand.match(bodyRegex);
    if (bodyMatch) {
      body = bodyMatch[1].replace(/%5E/g, "").replace(/\^/g, "");
    }
  }

  return { url, method, headers };
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
