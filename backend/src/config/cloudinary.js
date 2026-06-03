const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload dirs exist
const dirs = ['uploads/resumes', 'uploads/avatars', 'uploads/files'];
dirs.forEach(dir => {
  const full = path.join(__dirname, '../../', dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

const makeStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../../uploads/', folder));
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      cb(null, unique + path.extname(file.originalname));
    },
  });

const resumeFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only PDF, DOC, DOCX files are allowed'));
};

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'));
};

module.exports = {
  uploadResume: multer({ storage: makeStorage('resumes'), fileFilter: resumeFilter, limits: { fileSize: 10 * 1024 * 1024 } }),
  uploadAvatar: multer({ storage: makeStorage('avatars'), fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } }),
  uploadFile: multer({ storage: makeStorage('files'), limits: { fileSize: 20 * 1024 * 1024 } }),
};
