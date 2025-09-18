const fileUploadService = require("../services/uploadService");
const fileQueue = require("../queues/parsingQueues");
const path = require("path");
const UploadRecord = require("../models/uploadRecordSchema");
const handleUpload = async (req, res, files) => {
  if (!files || (Array.isArray(files) && files.length === 0)) {
    return res.status(400).json({ error: "No file uploaded" });
  }
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files were uploaded" });
    }

  try {
    const result = fileUploadService.processUploadedFile(files[0]);
    const newlog = {
      uploadDate: new Date(),
      fileName: result.fileName,
      originalName: result.originalName,
      filePath: result.path,
      matched: false,
      userId: req.userData.userID,
    };
    await UploadRecord.create(newlog);
    return res.status(200).json({
      message: "File uploaded successfully",
      result,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error during upload" });
  }
};

const uploadFiles = (req, res) => {
  const upload = fileUploadService.getUploadMiddleware().array("files", 5);

  upload(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "没有文件被上传" });
    }

    try {
      return handleUpload(req, res, req.files);
    } catch (err) {
      return res.status(500).json({ error: "Error processing uploaded file" });
    }
  });
};

const fetchFileByPath = async (req, res, next) => {
  const { filepath } = req.body;
  const userId = req.userData.userID;

  if (!filepath) {
    return next(new HttpError("Missing file path in request body", 400));
  }

  try {
    const uploadRecords = await UploadRecord.find({ userId });

    const authorizedFile = uploadRecords.find(
      (record) =>
        record.filePath === filepath ||
        record.filePath.replace(/\\/g, "/") === filepath.replace(/\\/g, "/")
    );

    if (!authorizedFile) {
      throw new Error("File not found in user's upload records");
    }

    if (!fs.existsSync(filepath)) {
      throw new Error("File does not exist");
    }

    const mimeType = mime.getType(filepath) || "application/octet-stream";
    res.setHeader("Content-Type", mimeType);

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
  } catch (err) {
    return next(new HttpError("Failed to fetch file: " + err.message, 500));
  }
};

const deleteunmatchedFile = async (req, res, next) => {
  const { filepath } = req.body;
  const userId = req.userData.userID;

  if (!filepath) {
    return next(new HttpError("Missing file path in request body", 400));
  }

  try {
    const record = await UploadRecord.findOneAndDelete({
      userId,
      filePath: filepath,
      matched: false, // 仅删除未匹配的文件
    });
    if (!record) {
      return next(new HttpError("File not found or already matched", 404));
    }

    await fs.promises.unlink(filepath);

    res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    return next(new HttpError("Failed to delete file: " + err.message, 500));
  }
};

const matchFileTotree = async (req, res, next) => {
  const { filepath } = req.body;
  const userId = req.userData.userID;

  if (!filepath) {
    return next(new HttpError("Missing file path in request body", 400));
  }

  try {
    // 1. 验证文件路径是否属于用户
    // 1. Verify the file path belongs to the user
    const uploadRecords = await UploadRecord.find({ userId });

    const fileRecord = uploadRecords.find(
      (record) =>
        record.filePath === filepath ||
        record.filePath.replace(/\\/g, "/") === filepath.replace(/\\/g, "/")
    );

    if (!fileRecord) {
      return next(
        new HttpError("File not found in user's upload records", 404)
      );
    }

    // 2. 获取文件名（不带路径）
    // 2. Get the filename (without path)
    const filename = path.basename(fileRecord.originalName);

    // 3. 读取用户的知识图谱
    // 3. Read the user's knowledge tree
    const knowledgetree = await UploadRecord.find({ userId })
      .sort({ uploadDate: -1 }) // 按上传时间倒序排列（最新的在前）
      .lean(); // 返回纯 JSON 对象，而非 Mongoose 文档

    // 4. 提取所有层数 >= 3 的节点名称
    // 4. Extract all node names at level >= 3
    const nodeNames = extractNodesAtLevel(knowledgetree, 3);

    // 5. 使用匹配函数获取可能的父节点
    const microserviceUrl = "http://localhost:8000/pair";

    const response = await fetch(microserviceUrl, {
      method: "POST",
      body: JSON.stringify({
        input_concept: filename, // filename corresponds to input_concept
        existing_nodes: nodeNames, // nodeNames corresponds to existing_nodes
      }),
    });

    // 6. 返回结果
    res.status(200).json({ matchedParents });
  } catch (err) {
    console.error("Error matching file to tree:", err);
    return next(
      new HttpError("Failed to process request: " + err.message, 500)
    );
  }
};

// Extract all node names at or above the specified level
function extractNodesAtLevel(tree, minLevel) {
  const result = [];

  function traverse(node, level) {
    if (!node) return;

    if (level >= minLevel) {
      result.push(node.name);
    }

    if (node.children) {
      node.children.forEach((child) => {
        traverse(child, level + 1);
      });
    }
  }

  traverse(tree, 1); // 根节点为第1层
    traverse(tree, 1); // root node is level 1
  return result;
}

exports.uploadFiles = uploadFiles;
exports.fetchFileByPath = fetchFileByPath;
exports.deleteunmatchedFile = deleteunmatchedFile;
exports.matchFileTotree = matchFileTotree;
