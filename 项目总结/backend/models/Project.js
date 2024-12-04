const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: String,
  path: String,
  content: String,
  type: {
    type: String,
    enum: ['controller', 'service', 'repository', 'entity', 'dto', 'configuration', 'exception']
  }
});

const projectSchema = new mongoose.Schema({
  name: String,
  uploadDate: {
    type: Date,
    default: Date.now
  },
  controllers: [fileSchema],
  services: [fileSchema],
  repositories: [fileSchema],
  entities: [fileSchema],
  dtos: [fileSchema],
  configurations: [fileSchema],
  exceptions: [fileSchema]
});

module.exports = mongoose.model('Project', projectSchema); 