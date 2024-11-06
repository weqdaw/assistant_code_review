const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  name: String,
  path: String,
  content: String,
  fileType: String,
  packageName: String,
  imports: [String],
  dependencies: [String]
});

const ModuleSchema = new mongoose.Schema({
  name: String,
  path: String,
  files: [FileSchema],
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }]
});

const ProjectSchema = new mongoose.Schema({
  name: String,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  modules: [ModuleSchema],
  structure: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', ProjectSchema); 