const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
    res.json({
        message: '测试接口连接成功',
        timestamp: new Date().toISOString()
    });
});

module.exports = router; 