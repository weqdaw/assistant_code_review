const axios = require('axios');

// 文心一言API配置
const API_KEY = 'VdekrJByih2cdxX9j2Dc7WyL';
const SECRET_KEY = 'XErbdBQTEkl5wqiU5pWsHFiWPBovxOpv';

// 获取access token
async function getAccessToken() {
    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`;
    try {
        const response = await axios.post(url);
        return response.data.access_token;
    } catch (error) {
        console.error('获取access token失败:', error);
        throw error;
    }
}

// AI代码分析控制器
exports.analyzeCode = async (req, res) => {
    try {
        const { fileName, codeContent } = req.body;
        
        // 修改提示词部分
        const prompt = `作为代码分析专家，请简明扼要地分析以下代码：
文件名：${fileName}
\`\`\`
${codeContent}
\`\`\`

请严格按照以下格式提供分析报告，每个部分控制在100字以内：

主要功能：
[简要描述代码的核心功能和用途]

代码结构：
[描述主要组件和架构设计]

依赖关系：
[仅列出关键的外部依赖，用逗号分隔]

改进建议：
1. [最重要的改进点]
2. [次要改进建议]
3. [可选优化项]

注意：请保持分析简洁明了，突出重点。`;

        // 获取access token
        const accessToken = await getAccessToken();

        // 调用文心一言API
        const apiUrl = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro?access_token=${accessToken}`;
        
        const response = await axios.post(apiUrl, {
            messages: [{
                role: "user",
                content: prompt
            }],
            temperature: 0.7,
            top_p: 0.9,
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('API Response:', response.data); // 添加日志

        // 解析并返回分析结果
        const analysis = {
            features: response.data.result,
            dependencies: [], // 从结果中提取的依赖关系
            suggestions: []  // 从结果中提取的建议
        };

        res.json({
            success: true,
            data: analysis
        });

    } catch (error) {
        console.error('AI分析失败:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: '代码分析失败',
            message: error.response?.data?.message || error.message
        });
    }
}; 