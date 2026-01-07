const multer = require("multer");
const path = require("path");
const fs = require("fs");

class FileUploadService {
  constructor() {
    this.storage = this.configureStorage();
    this.upload = multer({
      storage: this.storage,
      limits: { fileSize: 1024 * 1024 * 5 }, // 5MB限制
      fileFilter: this.fileFilter.bind(this),
    });
  }

  configureStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const userId = req.userData?.userID || "anonymous"; // 确保你中间件已将用户信息写入 req.user
        const userDir = path.join("uploads", userId);

        if (!fs.existsSync(userDir)) {
          fs.mkdirSync(userDir, { recursive: true });
        }

        cb(null, userDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
      },
    });
  }

  fileFilter(req, file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb("Error: 仅支持JPG、PNG和PDF文件!");
    }
  }

  getUploadMiddleware() {
    return this.upload;
  }

  processUploadedFile(file) {
    if (!file) {
      throw new Error("未提供文件");
    }

    return {
      fileName: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
    };
  }
  saveUserUploads = (filePath, uploads) => {
    fs.writeFileSync(filePath, JSON.stringify(uploads, null, 2));
  };
  loadUserUploads = (filePath) => {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  };
  addUploadRecord = (filePath, fileRecord) => {
    const uploads = this.loadUserUploads(filePath);
    uploads.push(fileRecord);
    this.saveUserUploads(filePath, uploads);
  };

  deleteFile(filePath) {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = new FileUploadService();
