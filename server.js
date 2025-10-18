import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";

const app = express();
app.use(bodyParser.json());

const DB_FILE = "./db.json";
let db = {};
if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE));

// ========== สร้าง Short URL ==========
app.post("/create", (req, res) => {
  const { alias, url } = req.body;

  if (!alias || !url)
    return res.status(400).json({ error: "alias และ url ห้ามว่าง" });

  if (db[alias])
    return res.status(409).json({ error: "alias นี้ถูกใช้แล้ว" });

  db[alias] = {
    url,
    count: 0,
    lastVisit: null
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  res.json({
    message: "สร้างเรียบร้อย",
    shortUrl: `${req.protocol}://${req.get("host")}/${alias}`
  });
});

// ========== Redirect ==========
app.get("/:alias", (req, res) => {
  const alias = req.params.alias;
  const record = db[alias];

  if (!record) {
    // ถ้าไม่พบ alias ให้แสดงหน้า HTML พร้อมรหัสนั้น
    return res.status(404).send(`
      <html>
        <head><title>ไม่พบลิงก์</title></head>
        <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h1>❌ ไม่พบ URL สำหรับรหัส: <code>${alias}</code></h1>
          <p>ตรวจสอบอีกครั้งว่าพิมพ์ถูกหรือไม่</p>
        </body>
      </html>
    `);
  }

  // อัปเดตสถิติ
  record.count += 1;
  record.lastVisit = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

  res.redirect(record.url);
});

// ========== ดูสถิติทั้งหมด ==========
app.get("/stats", (req, res) => {
  res.json(db);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ URL Shortener running on port ${PORT}`));
