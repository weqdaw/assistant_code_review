const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.BAIDU_API_KEY;
const SECRET_KEY = process.env.BAIDU_SECRET_KEY;

async function getBaiduToken() {
  try {
    const response = await axios.get(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`
    );
    return response.data.access_token;
  } catch (error) {
    console.error('获取百度访问令牌失败:', error);
    throw error;
  }
}

async function analyzeCode(code) {
  try {
    const accessToken = await getBaiduToken();
    console.log('获取到访问令牌:', accessToken);

    const response = await axios.post(
      `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro?access_token=${accessToken}`,
      {
        messages: [
          {
            role: "system",
            content: "你是一个专业的Java代码分析工具，专门用于分析Java类之间的依赖关系。请仔细分析代码中的类名、包名、注解、依赖注入和方法调用等信息。"
          },
          {
            role: "user",
            content: `请仔细分析以下Java代码，提取所有的类关系信息。

分析要点：
1. 类的基本信息：
   - 通过package语句识别包名
   - 通过class关键字识别类名
   - 识别类上的所有注解（如@Controller, @Service等）
   - 识别类的修饰符（public, private等）

2. 类的分类规则：
   - controller: 包含@Controller/@RestController注解，或类名以Controller结尾
   - service: 包含@Service注解，或类名以Service/ServiceImpl结尾
   - repository: 包含@Repository/@Mapper注解，或类名以Repository/Dao/Mapper结尾
   - entity: 包含@Entity注解，或类名以Entity/Model/DTO/VO结尾，或主要包含getter/setter方法
   - util: 类名以Util/Helper/Utils结尾，或包含大量静态方法

3. 依赖关系识别：
   - extends关系：通过extends关键字识别继承
   - implements关系：通过implements关键字识别接口实现
   - uses关系：识别@Autowired, @Resource, @Inject等注解的依赖注入
   - depends关系：识别方法参数、返回值、成员变量中使用的其他类

代码内容：
${code}

请将分析结果格式化为以下JSON（只返回JSON，不要包含其他文字）：
{
  "nodes": [
    {
      "id": "类名（不含包名）",
      "name": "类名",
      "group": "类型(controller/service/repository/entity/util)",
      "package": "完整包名",
      "annotations": ["类上的所有注解"],
      "modifiers": ["类的修饰符"]
    }
  ],
  "links": [
    {
      "source": "源类名（不含包名）",
      "target": "目标类名（不含包名）",
      "type": "关系类型(extends/implements/uses/depends)",
      "details": "关系的具体描述，如：通过@Autowired注入"
    }
  ]
}`
          }
        ],
        temperature: 0.1,
        top_p: 0.8,
        timeout: 30000
      }
    );

    console.log('API响应:', response.data);

    if (!response.data || !response.data.result) {
      throw new Error('API返回数据格式错误');
    }

    try {
      // 尝试解析返回的JSON
      const result = JSON.parse(response.data.result);
      
      // 验证结果格式
      if (!Array.isArray(result.nodes) || !Array.isArray(result.links)) {
        throw new Error('返回的数据格式不正确');
      }

      // 确保所有节点都有必要的属性
      result.nodes = result.nodes.map(node => ({
        id: node.id || node.name,
        name: node.name || node.id,
        group: node.group || 'util',
        package: node.package || ''
      }));

      // 确保所有链接都有必要的属性
      result.links = result.links.map(link => ({
        source: link.source,
        target: link.target,
        type: link.type || 'depends'
      }));

      return result;
    } catch (error) {
      console.error('解析API返回结果失败:', error);
      
      // 如果解析失败，尝试基本的代码分析
      const className = code.match(/class\s+(\w+)/)?.[1];
      const packageName = code.match(/package\s+([\w.]+)/)?.[1];
      
      if (!className) {
        throw new Error('无法识别Java类名');
      }

      return {
        nodes: [{
          id: className,
          name: className,
          group: className.includes('Controller') ? 'controller' :
                 className.includes('Service') ? 'service' :
                 className.includes('Repository') ? 'repository' :
                 className.includes('Entity') ? 'entity' : 'util',
          package: packageName || ''
        }],
        links: []
      };
    }
  } catch (error) {
    console.error('调用百度API失败:', error);
    throw error;
  }
}

module.exports = {
  getBaiduToken,
  analyzeCode
}; 