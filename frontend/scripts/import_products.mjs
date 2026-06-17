import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import readline from "readline";

// Helper to parse .env.local file for Firebase credentials
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    console.error(`Error: Environment file not found at ${envPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join("=").trim();
      // Remove surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      env[key] = val;
    }
  });
  return env;
}

// Custom simple CSV line parser supporting quoted fields with commas
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      // Toggle quote block
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);

  // Clean quotes and spaces
  return result.map(val => {
    let cleaned = val.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    return cleaned;
  });
}

async function run() {
  const scriptDir = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname));
  const rootDir = path.join(scriptDir, "..");
  const envPath = path.join(rootDir, ".env.local");

  console.log("Loading environment variables...");
  const env = loadEnv(envPath);

  const firebaseConfig = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  console.log(`Initializing Firebase for project: ${firebaseConfig.projectId}...`);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const productsCol = collection(db, "products");

  // Path to the CSV file to import
  // Check both root directory and current script directory for products_import.csv
  let csvPath = path.join(rootDir, "..", "products_import.csv");
  if (!fs.existsSync(csvPath)) {
    // Check root directory of quotation builder
    csvPath = path.join(rootDir, "products_import.csv");
  }
  if (!fs.existsSync(csvPath)) {
    // Check if products_template.csv is being used instead as a fallback
    csvPath = path.join(rootDir, "..", "products_template.csv");
    if (!fs.existsSync(csvPath)) {
      csvPath = path.join(rootDir, "products_template.csv");
    }
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`\nError: CSV import file not found. Please place your CSV file at:`);
    console.error(`- ${path.resolve(rootDir, "..", "products_import.csv")}`);
    console.error(`Or populate products_template.csv.`);
    process.exit(1);
  }

  console.log(`Reading CSV file from: ${csvPath}`);
  
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let headers = [];
  let lineCount = 0;
  let successCount = 0;
  let failCount = 0;

  for await (const line of rl) {
    lineCount++;
    if (!line.trim()) continue;

    const parsed = parseCSVLine(line);

    if (lineCount === 1) {
      // Headers line
      headers = parsed.map(h => h.toLowerCase());
      console.log("Found columns:", headers.join(", "));
      continue;
    }

    // Map columns dynamically
    const product = {};
    headers.forEach((header, index) => {
      const value = parsed[index] || "";
      if (header === "mrp" || header === "wholesalerate" || header === "retailrate") {
        product[header === "wholesalerate" ? "wholesaleRate" : header === "retailrate" ? "retailRate" : "mrp"] = parseFloat(value) || 0;
      } else if (header === "modelno") {
        product["modelNo"] = value;
      } else if (header === "imageurl") {
        product["imageUrl"] = value;
      } else {
        product[header] = value;
      }
    });

    // Validations
    if (!product.name || !product.modelNo) {
      console.warn(`[Row ${lineCount}] Skipping: 'name' and 'modelNo' are required fields.`);
      failCount++;
      continue;
    }

    // Ensure all standard product fields are present (defaulting empty values if missing)
    const formattedProduct = {
      name: product.name,
      modelNo: product.modelNo,
      category: product.category || "",
      description: product.description || "",
      mrp: product.mrp || 0,
      wholesaleRate: product.wholesaleRate || 0,
      retailRate: product.retailRate || 0,
      imageUrl: product.imageUrl || "",
    };

    try {
      console.log(`[Row ${lineCount}] Importing product: "${formattedProduct.name}" (${formattedProduct.modelNo})...`);
      await addDoc(productsCol, formattedProduct);
      successCount++;
    } catch (err) {
      console.error(`[Row ${lineCount}] Failed to import "${formattedProduct.name}":`, err.message);
      failCount++;
    }
  }

  console.log(`\nImport complete!`);
  console.log(`Successfully added: ${successCount} products`);
  if (failCount > 0) {
    console.log(`Failed/skipped: ${failCount} products`);
  }
}

run().catch((err) => {
  console.error("Unhandled error during import:", err);
  process.exit(1);
});
