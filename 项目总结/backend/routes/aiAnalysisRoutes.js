const express = require('express');
const router = express.Router();
const aiAnalysisController = require('../controllers/aiAnalysisController');

router.post('/analyze-code', aiAnalysisController.analyzeCode);

module.exports = router; 