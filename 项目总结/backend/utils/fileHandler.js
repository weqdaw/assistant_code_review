const fs = require('fs').promises;
const path = require('path');

// 确保上传目录存在
async function ensureUploadDir() {
  const uploadDir = path.join(process.cwd(), 'uploads');
  try {
    await fs.access(uploadDir);
  } catch (error) {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
}

// 保存上传的文件
async function saveUploadedFile(file, filename) {
  const uploadDir = await ensureUploadDir();
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, file.buffer);
  return filePath;
}

module.exports = {
  ensureUploadDir,
  saveUploadedFile
}; 