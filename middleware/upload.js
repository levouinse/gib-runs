const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const uploadDir = path.join(process.cwd(), 'uploads');
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const suffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		cb(null, file.fieldname + '-' + suffix + path.extname(file.originalname));
	}
});

const upload = multer({ 
	storage: storage,
	limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = function() {
	return function(req, res, next) {
		if (req.method !== 'POST' || !req.url.startsWith('/upload')) return next();
		
		upload.single('file')(req, res, function(err) {
			if (err) {
				res.statusCode = 400;
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify({ error: err.message }));
				return;
			}
			
			if (req.file) {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify({ 
					success: true,
					file: {
						filename: req.file.filename,
						originalname: req.file.originalname,
						size: req.file.size,
						path: req.file.path
					}
				}));
			} else {
				next();
			}
		});
	};
};
