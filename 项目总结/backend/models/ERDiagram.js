const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
  name: String,
  type: String,
  isPk: Boolean
});

const tableSchema = new mongoose.Schema({
  name: String,
  columns: [columnSchema],
  style: {
    left: String,
    top: String,
    position: String
  }
});

const erDiagramSchema = new mongoose.Schema({
  tables: [tableSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ERDiagram', erDiagramSchema); 