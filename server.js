/*import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

// API route
app.get('/api/scan', async (req, res) => {
  const email = req.query.email;

  // ✅ Check email exists
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    console.log("Checking email:", email);

    const response = await fetch(
      `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`,
      {
        headers: {
          'User-Agent': 'BreachScanner/1.0'
        }
      }
    );

    console.log("API Status:", response.status);

    // ✅ If no breach found
    if (response.status === 404) {
      return res.json({ breached: false, breaches: [] });
    }

    const data = await response.json();

    let breaches = [];

    /*if (data?.exposures?.breaches) {
      breaches = data.exposures.breaches.map(name => ({
        Name: name,
        BreachDate:
          data.exposures.BreachMetrics?.[name]?.date || "Unknown",
        DataClasses:
          data.exposures.BreachMetrics?.[name]?.xposed_data
            ? data.exposures.BreachMetrics[name].xposed_data.split(";")
            : ["Email addresses"]
      }));

      

     if (response.status === 404) {
  return res.json({ breaches: [] });
}


console.log('API response:', JSON.stringify(data).slice(0, 200));

// Handle both response formats
//let breaches = [];
if (data?.breaches?.[0]) {
  // Array format
  breaches = data.breaches[0].map(name => ({
    Name: name,
    BreachDate: "2020-01-01",
    DataClasses: ["Email addresses"]
  }));
} else if (data?.breaches) {
  // Object format
  breaches = data.breaches.map(b => ({
    Name: b.Name || b,
    BreachDate: b.BreachDate || "2020-01-01",
    DataClasses: b.DataClasses || ["Email addresses"]
  }));
}

res.json({ breaches });
    // ✅ Optional fallback (for demo stability)
    if (breaches.length === 0 && email.includes("test")) {
      breaches = [
        {
          Name: "LinkedIn",
          BreachDate: "2021-01-01",
          DataClasses: ["Email addresses", "Passwords"]
        }
      ];
    }

    res.json({
      breached: breaches.length > 0,
      breaches
    });

  } catch (error) {
    console.error("Error:", error);

    // ❗ Don’t hide error
    res.status(500).json({
      error: "Failed to fetch breach data",
      breached: false,
      breaches: []
    });
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});*/
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

app.get('/api/scan', async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const response = await fetch(
      `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`,
      { headers: { 'User-Agent': 'BreachScanner/1.0' } }
    );

    if (response.status === 404) {
      return res.json({ breached: false, breaches: [] });
    }

    const data = await response.json();
    console.log("Raw API response:", JSON.stringify(data).slice(0, 300));

    let breaches = [];

    if (data?.breaches?.[0] && Array.isArray(data.breaches[0])) {
      breaches = data.breaches[0].map(name => ({
        Name: name,
        BreachDate: "2020-01-01",
        DataClasses: ["Email addresses"]
      }));
    }

    return res.json({ breached: breaches.length > 0, breaches });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Failed to fetch", breached: false, breaches: [] });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));