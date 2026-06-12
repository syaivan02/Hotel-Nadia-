const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB terhubung!'))
  .catch(err => console.error('Gagal koneksi MongoDB:', err));

// =====================
// SCHEMA
// =====================
const kamarSchema = new mongoose.Schema({
  nomor: { type: String, required: true, unique: true }, // contoh: "101"
  tipe: { type: String, enum: ['standard', 'superior', 'super_deluxe'], required: true },
  harga: { type: Number, required: true },
  status: { type: String, enum: ['kosong', 'terisi'], default: 'kosong' },
  pax: { type: Number, default: 0 },
  breakfast: { type: Boolean, default: false },
  namaTamu: String,
  checkIn: Date,
  checkOut: Date,
  catatan: String,
}, { timestamps: true });

const Kamar = mongoose.model('Kamar', kamarSchema);

// =====================
// API ROUTES
// =====================

// GET semua kamar
app.get('/api/kamar', async (req, res) => {
  try {
    const data = await Kamar.find().sort({ nomor: 1 });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST tambah kamar (untuk setup awal)
app.post('/api/kamar', async (req, res) => {
  try {
    const kamar = new Kamar(req.body);
    await kamar.save();
    res.json(kamar);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST setup banyak kamar sekaligus (bulk)
app.post('/api/kamar/bulk', async (req, res) => {
  try {
    const { kamarList } = req.body; // array of {nomor, tipe, harga}
    const result = await Kamar.insertMany(kamarList, { ordered: false });
    res.json({ ok: true, inserted: result.length });
  } catch (e) {
    res.status(500).json({ error: e.message, detail: 'Mungkin sebagian kamar sudah ada (nomor duplikat).' });
  }
});

// PATCH update kamar (status, pax, breakfast, tamu, dll)
app.patch('/api/kamar/:id', async (req, res) => {
  try {
    const kamar = await Kamar.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(kamar);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE kamar
app.delete('/api/kamar/:id', async (req, res) => {
  try {
    await Kamar.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reset kamar jadi kosong (checkout)
app.post('/api/kamar/:id/checkout', async (req, res) => {
  try {
    const kamar = await Kamar.findByIdAndUpdate(req.params.id, {
      status: 'kosong',
      pax: 0,
      breakfast: false,
      namaTamu: '',
      checkIn: null,
      checkOut: null,
      catatan: '',
    }, { new: true });
    res.json(kamar);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
