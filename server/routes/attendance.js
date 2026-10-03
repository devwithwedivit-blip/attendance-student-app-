const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const storageService = require('../services/storageService');

const router = express.Router();

// Helper to get today's date string YYYY-MM-DD in local time
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * GET /api/attendance/today
 * Returns the current authenticated user's check-in/out status for today
 */
router.get('/today', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayDateString();

    // Fetch records for today
    const records = db.all(
      `SELECT * FROM attendance_records 
       WHERE user_id = ? AND date(timestamp) = date(?) 
       ORDER BY timestamp ASC`,
      [userId, today]
    );

    let status = 'NOT_CHECKED_IN';
    let activeCheckIn = null;
    let latestCheckOut = null;
    let totalSeconds = 0;

    if (records.length > 0) {
      const lastRecord = records[records.length - 1];
      if (lastRecord.type === 'check_in') {
        status = 'CHECKED_IN';
        activeCheckIn = lastRecord;
      } else {
        status = 'CHECKED_OUT';
        latestCheckOut = lastRecord;
      }

      // Calculate total worked duration today by pairing check_ins and check_outs
      let currentInTime = null;
      for (const rec of records) {
        if (rec.type === 'check_in') {
          currentInTime = new Date(rec.timestamp).getTime();
        } else if (rec.type === 'check_out' && currentInTime) {
          const outTime = new Date(rec.timestamp).getTime();
          totalSeconds += Math.max(0, Math.floor((outTime - currentInTime) / 1000));
          currentInTime = null;
        }
      }

      // If still checked in, add duration up to right now
      if (currentInTime) {
        const now = Date.now();
        totalSeconds += Math.max(0, Math.floor((now - currentInTime) / 1000));
      }
    }

    const firstCheckIn = records.find(r => r.type === 'check_in');

    res.json({
      today,
      status,
      firstCheckIn: firstCheckIn ? firstCheckIn.timestamp : null,
      latestCheckOut: latestCheckOut ? latestCheckOut.timestamp : null,
      activeCheckIn,
      totalSeconds,
      records
    });
  } catch (err) {
    console.error('Error fetching today attendance:', err);
    res.status(500).json({ error: 'Failed to retrieve attendance status.' });
  }
});

/**
 * POST /api/attendance/check-in
 * Marks a new Check In record with photo and GPS location
 */
router.post('/check-in', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayDateString();

    // Verify user is not already checked in
    const lastRecord = db.get(
      `SELECT * FROM attendance_records 
       WHERE user_id = ? AND date(timestamp) = date(?) 
       ORDER BY timestamp DESC LIMIT 1`,
      [userId, today]
    );

    if (lastRecord && lastRecord.type === 'check_in') {
      return res.status(400).json({
        error: 'You are already checked in. Please check out before checking in again.',
        activeCheckIn: lastRecord
      });
    }

    // Process photo: either from multer file upload or JSON body base64
    let savedPhoto;
    if (req.file) {
      savedPhoto = await storageService.saveFile({
        buffer: req.file.buffer,
        filename: req.file.originalname,
        folder: 'photos'
      });
    } else if (req.body.photo_base64) {
      savedPhoto = await storageService.saveBase64Image(req.body.photo_base64, 'photos');
    } else {
      return res.status(400).json({ error: 'A live photo capture is required to check in.' });
    }

    // Biometric Security: Face must be verified
    if (req.body.face_verified !== 'true' && req.body.face_verified !== true) {
      return res.status(400).json({ error: 'Biometric Security Violation: Live human face must be verified inside the circle before check-in.' });
    }

    const latitude = req.body.latitude ? parseFloat(req.body.latitude) : null;
    const longitude = req.body.longitude ? parseFloat(req.body.longitude) : null;
    const locationName = req.body.location_name || (latitude ? `Coords (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` : 'Office / Remote');
    const nowIso = new Date().toISOString();

    const insertResult = db.run(
      `INSERT INTO attendance_records (user_id, type, photo_url, timestamp, latitude, longitude, location_name)
       VALUES (?, 'check_in', ?, ?, ?, ?, ?)`,
      [userId, savedPhoto.url, nowIso, latitude, longitude, locationName]
    );

    const record = db.get('SELECT * FROM attendance_records WHERE id = ?', [insertResult.lastInsertRowid]);

    res.status(201).json({
      message: 'Check-in recorded successfully!',
      record
    });
  } catch (err) {
    console.error('Error during check-in:', err);
    res.status(500).json({ error: 'Failed to record check-in. Please try again.' });
  }
});

/**
 * POST /api/attendance/check-out
 * Marks a Check Out record with photo and GPS location
 */
router.post('/check-out', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayDateString();

    // Verify user IS currently checked in
    const lastRecord = db.get(
      `SELECT * FROM attendance_records 
       WHERE user_id = ? AND date(timestamp) = date(?) 
       ORDER BY timestamp DESC LIMIT 1`,
      [userId, today]
    );

    if (!lastRecord || lastRecord.type !== 'check_in') {
      return res.status(400).json({
        error: 'Cannot check out because no active check-in was found for today.'
      });
    }

    // Process photo
    let savedPhoto;
    if (req.file) {
      savedPhoto = await storageService.saveFile({
        buffer: req.file.buffer,
        filename: req.file.originalname,
        folder: 'photos'
      });
    } else if (req.body.photo_base64) {
      savedPhoto = await storageService.saveBase64Image(req.body.photo_base64, 'photos');
    } else {
      return res.status(400).json({ error: 'A live photo capture is required to check out.' });
    }

    // Biometric Security: Face must be verified
    if (req.body.face_verified !== 'true' && req.body.face_verified !== true) {
      return res.status(400).json({ error: 'Biometric Security Violation: Live human face must be verified inside the circle before check-out.' });
    }

    const latitude = req.body.latitude ? parseFloat(req.body.latitude) : null;
    const longitude = req.body.longitude ? parseFloat(req.body.longitude) : null;
    const locationName = req.body.location_name || (latitude ? `Coords (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` : 'Office / Remote');
    const nowIso = new Date().toISOString();

    const insertResult = db.run(
      `INSERT INTO attendance_records (user_id, type, photo_url, timestamp, latitude, longitude, location_name)
       VALUES (?, 'check_out', ?, ?, ?, ?, ?)`,
      [userId, savedPhoto.url, nowIso, latitude, longitude, locationName]
    );

    const record = db.get('SELECT * FROM attendance_records WHERE id = ?', [insertResult.lastInsertRowid]);

    // Calculate duration for this session
    const inTime = new Date(lastRecord.timestamp).getTime();
    const outTime = new Date(nowIso).getTime();
    const sessionSeconds = Math.max(0, Math.floor((outTime - inTime) / 1000));

    res.status(201).json({
      message: 'Check-out recorded successfully! Have a great day.',
      record,
      sessionDurationSeconds: sessionSeconds
    });
  } catch (err) {
    console.error('Error during check-out:', err);
    res.status(500).json({ error: 'Failed to record check-out. Please try again.' });
  }
});

/**
 * GET /api/attendance/my-records
 * Retrieves historical attendance records for the authenticated employee
 * Groups into daily summaries with total hours worked
 */
router.get('/my-records', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year, limit = 50 } = req.query;

    let query = `
      SELECT * FROM attendance_records 
      WHERE user_id = ?
    `;
    const params = [userId];

    if (month && year) {
      const monthPadded = String(month).padStart(2, '0');
      query += ` AND strftime('%Y-%m', timestamp) = ?`;
      params.push(`${year}-${monthPadded}`);
    }

    query += ` ORDER BY timestamp DESC LIMIT ?`;
    params.push(parseInt(limit, 10));

    const records = db.all(query, params);

    // Group records by calendar date for daily summaries
    const daysMap = {};
    for (const rec of records) {
      const dateKey = rec.timestamp.split('T')[0] || rec.timestamp.split(' ')[0];
      if (!daysMap[dateKey]) {
        daysMap[dateKey] = {
          date: dateKey,
          records: [],
          checkIns: [],
          checkOuts: [],
          totalDurationSeconds: 0
        };
      }
      daysMap[dateKey].records.push(rec);
      if (rec.type === 'check_in') daysMap[dateKey].checkIns.push(rec);
      if (rec.type === 'check_out') daysMap[dateKey].checkOuts.push(rec);
    }

    // Calculate worked hours per day (ascending order pairing)
    const dailySummaries = Object.values(daysMap).map(day => {
      // Sort day's records ascending
      const sorted = [...day.records].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      let totalSec = 0;
      let lastIn = null;

      for (const r of sorted) {
        if (r.type === 'check_in') {
          lastIn = new Date(r.timestamp).getTime();
        } else if (r.type === 'check_out' && lastIn) {
          const outT = new Date(r.timestamp).getTime();
          totalSec += Math.max(0, Math.floor((outT - lastIn) / 1000));
          lastIn = null;
        }
      }

      const firstIn = sorted.find(r => r.type === 'check_in');
      const lastOut = [...sorted].reverse().find(r => r.type === 'check_out');

      return {
        date: day.date,
        records: sorted,
        firstCheckIn: firstIn || null,
        lastCheckOut: lastOut || null,
        totalDurationSeconds: totalSec,
        totalHoursFormatted: (totalSec / 3600).toFixed(1) + ' hrs',
        isComplete: Boolean(firstIn && lastOut)
      };
    });

    res.json({
      records,
      dailySummaries
    });
  } catch (err) {
    console.error('Error fetching my-records:', err);
    res.status(500).json({ error: 'Failed to retrieve attendance history.' });
  }
});

module.exports = router;
