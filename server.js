import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
app.use(bodyParser.json());

const DB_FILE = "./db.json";
let db = {};
if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE));

// 🔑 ค่าคงที่ API Key
const API_KEY = process.env.API_KEY;
// 🔗 URL ที่จะ redirect ถ้าไม่พบ alias
const FALLBACK_URL = "https://s.shopee.co.th/9KZWiWDPrr";

// ==========================
// ✅ /create – สร้างลิงก์ใหม่
// ==========================
app.post("/create", (req, res) => {
  const clientKey = req.headers["x-api-key"];
  if (clientKey !== API_KEY)
    return res.status(401).json({ error: "Unauthorized: invalid or missing x-api-key" });

  const { alias, url } = req.body;
  if (!alias || !url)
    return res.status(400).json({ error: "alias และ url ห้ามว่าง" });

  if (db[alias])
    return res.status(409).json({ error: "alias นี้ถูกใช้แล้ว" });

  db[alias] = { url, count: 0, lastVisit: null };
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

  res.json({
    message: "สร้างเรียบร้อย",
    shortUrl: `${req.protocol}://${req.get("host")}/${alias}`,
  });
});

// ==========================
// ✅ /stats – ดูสถิติทั้งหมด
// ==========================
app.get("/stats", (req, res) => {
  const clientKey = req.headers["x-api-key"];
  if (clientKey !== API_KEY)
    return res.status(401).json({ error: "Unauthorized: invalid or missing x-api-key" });

  res.json(db);
});

// ==========================
// ✅ /:alias – Redirect ปลายทาง (มี fallback)
// ==========================
app.get("/:alias", (req, res) => {
  const alias = req.params.alias;
  const record = db[alias];

  if (!record) {
    console.log(`Alias '${alias}' not found. Redirecting to fallback URL.`);
    return res.redirect(FALLBACK_URL);
  }

  record.count += 1;
  record.lastVisit = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  res.redirect(record.url);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ URL Shortener running on port ${PORT}`));
