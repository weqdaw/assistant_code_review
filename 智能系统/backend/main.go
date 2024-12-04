package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"strings"

	"github.com/baidubce/bce-qianfan-sdk/go/qianfan"
	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/net/context"
)

// Question 结构体用于解析请求
type Question struct {
	Question string `json:"question"`
}

// Response 结构体用于返回响应
type Response struct {
	Answer string `json:"answer"`
}

// 新增代码审查相关结构体
type ReviewResult struct {
	Severity    string `json:"severity"`    // 严重性，取值为：low、medium、high、critical
	File        string `json:"file"`        // 文件名
	Description string `json:"description"` // 描述
	Suggestion  string `json:"suggestion"`  //
}

type ReviewResponse struct {
	Results []ReviewResult `json:"results"`
}

// 在 ReviewResult 结构体后添加新的结构体
type GuideResult struct {
	Summary string   `json:"summary"` // 修改总结
	Impacts []Impact `json:"impacts"` // 影响范围
	Risks   []Risk   `json:"risks"`   // 风险评估
}

type Impact struct {
	File        string   `json:"file"`
	Description string   `json:"description"`
	Functions   []string `json:"functions"`
}

type Risk struct {
	Level       string `json:"level"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Suggestion  string `json:"suggestion"`
}

var db *sql.DB
var QA_transcript_go string

// 定义一个初始化数据库的函数
func initDB() (err error) {
	// DSN:Data Source Name
	//dsn是数据库的连接信息，格式为：用户名:密码@tcp(ip:端口)/数据库名?参数
	dsn := "root:1234@tcp(127.0.0.1:3306)/yangjia?charset=utf8mb4&parseTime=True"
	// 不会校验账号密码是否正确
	// 注意！！！这里不要使用:=，我们是给全局变量赋值，然后在main函数中使用全局变量db
	//驱动名为yangjia，需要在项目根目录下执行go mod init，然后在go.mod文件中添加依赖：
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		return err
	}
	// 尝试与数据库建立连接（校验dsn是否正确）
	err = db.Ping()
	if err != nil {
		return err
	}
	return nil
}

// 查询单条数据示例
func queryRowDemo() {
	sqlStr := "select QA_transcript from qa_history where QA_transcript=?"
	// 非常重要：确保QueryRow之后调用Scan方法，否则持有的数据库链接不会被释放
	err := db.QueryRow(sqlStr, "bzxujkqbs").Scan(&QA_transcript_go)
	if err != nil {
		fmt.Printf("scan failed, err:%v\n", err)
		return
	}
	fmt.Printf(QA_transcript_go)
}

// 插入数据
func insertRowDemo(insert_data_question string, insert_data_answer string) {
	sqlStr := "insert into qa_history(QA_transcript, QA_answer) values (?,?)"
	_, err := db.Exec(sqlStr, insert_data_question, insert_data_answer)
	if err != nil {
		fmt.Printf("insert failed, err:%v\n", err)
		return
	}
	/*	theID, err := ret.LastInsertId() // 新插入数据的id
		if err != nil {
			fmt.Printf("get lastinsert ID failed, err:%v\n", err)
			return
		}
		fmt.Printf("insert success, the id is %d.\n", theID)*/
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	//fmt.Println("启用CORS")
	return func(w http.ResponseWriter, r *http.Request) {
		// 设置CORS头
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func handleQuestion(w http.ResponseWriter, r *http.Request) {
	fmt.Println("收到请求")
	if r.Method != http.MethodPost {
		http.Error(w, "只支持POST请求", http.StatusMethodNotAllowed)
		return
	}

	var q Question
	if err := json.NewDecoder(r.Body).Decode(&q); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 使用安全认证AK/SK鉴权，通过环境变量初始化；替换下列示例中参数，安全认证Access Key替换your_iam_ak，Secret Key替换your_iam_sk
	os.Setenv("QIANFAN_ACCESS_KEY", "ALTAKhLcDAS4vUgRWM7eBwuEMf")
	os.Setenv("QIANFAN_SECRET_KEY", "812520ab6a2147ee883c4244fa9753bf")

	// 指定特定模型
	chat := qianfan.NewChatCompletion(
		qianfan.WithModel("ERNIE-3.5-8K-0701"),
	)

	resp, err := chat.Do(
		context.TODO(),
		&qianfan.ChatCompletionRequest{
			Messages: []qianfan.ChatCompletionMessage{
				qianfan.ChatCompletionUserMessage(q.Question),
			},
		},
	)

	if err != nil {
		http.Error(w, "AI服务调用失败: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := Response{
		Answer: resp.Result,
	}
	insertRowDemo(q.Question, response.Answer) // 插入数据到数据库中
	//insertRowDemo("cnmd", "nmsl")
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "响应编码失败: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// 处理代码审查请求的函数
func handleCodeReview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "只支持POST请求", http.StatusMethodNotAllowed)
		return
	}

	// 设置最大文件大小限制
	r.ParseMultipartForm(10 << 20) // 10MB

	// 获取上传的文件
	files := r.MultipartForm.File["files"]
	if len(files) == 0 {
		http.Error(w, "没有收到文件", http.StatusBadRequest)
		return
	}

	// 这里添加实际的代码审查逻辑
	results := []ReviewResult{}

	// 示例：对每个文件进行简单检查
	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			continue
		}
		defer file.Close()

		// 读取文件内容
		content := make([]byte, fileHeader.Size)
		file.Read(content)

		// 这里添加实际的代码审查逻辑
		// 示例：检查文件是否过大

		if fileHeader.Size > 1000000 { // 1MB
			results = append(results, ReviewResult{
				Severity:    "warning",
				File:        fileHeader.Filename,
				Description: "文件大小超过1MB",
				Suggestion:  "考虑拆分文件或优化代码",
			})
			// 返回审查结果
			response := ReviewResponse{
				Results: results,
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(response)
			return
		}
		if path.Ext(fileHeader.Filename) != ".java" {
			results = append(results, ReviewResult{
				Severity:    "warning",
				File:        fileHeader.Filename,
				Description: "文件类型错误",
				Suggestion:  "请上传.java文件",
			})
			// 返回审查结果
			response := ReviewResponse{
				Results: results,
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(response)
			return
		}
		// 使用安全认证AK/SK鉴权，通过环境变量初始化；替换下列示例中参数，安全认证Access Key替换your_iam_ak，Secret Key替换your_iam_sk
		os.Setenv("QIANFAN_ACCESS_KEY", "ALTAKhLcDAS4vUgRWM7eBwuEMf")
		os.Setenv("QIANFAN_SECRET_KEY", "812520ab6a2147ee883c4244fa9753bf")

		// 指定特定模型
		chat := qianfan.NewChatCompletion(
			qianfan.WithModel("ERNIE-3.5-8K-0701"),
		)

		resp, err := chat.Do(
			context.TODO(),
			&qianfan.ChatCompletionRequest{
				Messages: []qianfan.ChatCompletionMessage{
					qianfan.ChatCompletionUserMessage("请帮我审查这段代码" + string(content) + "给出这段代" +
						"码的错误严重性，严重性取值为：low、medium、high、critical，再给出这段代码的错误描述，最后再给出建议," +
						"要求先输出代码的严重性，再输出符号@，再输出错误描述，接着输出@符号，最后输出建议。"),
				},
			},
		)
		severity := strings.Split(resp.Result, "@")[0]
		description := strings.Split(resp.Result, "@")[1]
		suggestion := strings.Split(resp.Result, "@")[2]

		//fmt.Println(resp.Result)
		/*	fmt.Println(severity)
			fmt.Println(description)
			fmt.Println(suggestion)*/

		if err != nil {
			http.Error(w, "AI服务调用失败: "+err.Error(), http.StatusInternalServerError)
			results = append(results, ReviewResult{
				Severity:    "critical",
				File:        fileHeader.Filename,
				Description: "AI服务调用失败",
				Suggestion:  "重新AI服务调用",
			})
			// 返回审查结果
			response := ReviewResponse{
				Results: results,
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(response)
			return
		}
		results = append(results, ReviewResult{
			Severity:    severity,
			File:        fileHeader.Filename,
			Description: description,
			Suggestion:  suggestion,
		})
	}

	// 返回审查结果
	response := ReviewResponse{
		Results: results,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// 处理代码导读请求的函数
func handleCodeGuide(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "只支持POST请求", http.StatusMethodNotAllowed)
		return
	}

	// 设置最大文件大小限制
	r.ParseMultipartForm(10 << 20) // 10MB

	// 获取上传的文件
	originalFiles := r.MultipartForm.File["originalFiles"]
	newFiles := r.MultipartForm.File["newFiles"]

	if len(originalFiles) == 0 || len(newFiles) == 0 {
		http.Error(w, "需要同时上传原有代码和最新代码", http.StatusBadRequest)
		return
	}

	// 读取所有文件内容
	originalContents := make(map[string]string)
	newContents := make(map[string]string)
	var originalfile_name string
	var newfile_name string
	for _, fileHeader := range originalFiles {
		file, err := fileHeader.Open()
		if err != nil {
			continue
		}
		defer file.Close()

		content := make([]byte, fileHeader.Size)
		file.Read(content)
		originalContents[fileHeader.Filename] = string(content)
		originalfile_name = fileHeader.Filename
	}

	for _, fileHeader := range newFiles {
		file, err := fileHeader.Open()
		if err != nil {
			continue
		}
		defer file.Close()

		content := make([]byte, fileHeader.Size)
		file.Read(content)
		newContents[fileHeader.Filename] = string(content)
		newfile_name = fileHeader.Filename
	}

	// 调用千帆API进行代码分析
	os.Setenv("QIANFAN_ACCESS_KEY", "ALTAKhLcDAS4vUgRWM7eBwuEMf")
	os.Setenv("QIANFAN_SECRET_KEY", "812520ab6a2147ee883c4244fa9753bf")

	chat := qianfan.NewChatCompletion(
		qianfan.WithModel("ERNIE-3.5-8K-0701"),
	)

	// 构建提示词
	prompt := "请分析以下代码变更并提供详细的代码导读：\n\n原有代码：\n"
	for filename, content := range originalContents {
		prompt += fmt.Sprintf("=== %s ===\n%s\n\n", filename, content)
	}
	prompt += "\n最新代码：\n"
	for filename, content := range newContents {
		prompt += fmt.Sprintf("=== %s ===\n%s\n\n", filename, content)
	}
	prompt += "\n请提供：1. 修改总结 2. 影响范围分析 3. 风险评估。回复格式要求：用'SUMMARY'标记修改总结开始，" +
		"用'@IMPACTS'标记影响范围开始，用'@RISKS'标记风险评估开始。不要生成多余的符号。"

	resp, err := chat.Do(
		context.TODO(),
		&qianfan.ChatCompletionRequest{
			Messages: []qianfan.ChatCompletionMessage{
				qianfan.ChatCompletionUserMessage(prompt),
			},
		},
	)

	if err != nil {
		http.Error(w, "AI服务调用失败: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 解析AI响应
	parts := strings.Split(resp.Result, "@")
	result := GuideResult{}
	//fmt.Println(parts)
	for _, part := range parts { // 解析每个部分
		if strings.Contains(part, "SUMMARY") {
			//fmt.Println(part)
			result.Summary = strings.ReplaceAll(part, "SUMMARY", "") //
			//fmt.Println(result.Summary)
		} else if strings.Contains(part, "IMPACTS") {
			//fmt.Println(part)
			// 解析影响范围
			impactText := strings.ReplaceAll(part, "IMPACTS", "")
			// 这里需要根据实际AI响应格式进行解析
			result.Impacts = []Impact{
				{
					//File:        "file1",
					Description: impactText,
					Functions:   []string{originalfile_name, newfile_name},
				},
			}
			//fmt.Println(impactText) //test
		} else if strings.Contains(part, "RISKS") {
			//fmt.Println(part)
			// 解析风险评估
			riskText := strings.ReplaceAll(part, "RISKS", "")
			// 这里需要根据实际AI响应格式进行解析
			result.Risks = []Risk{
				{
					//Level:       "medium",
					//Title:       "示例风险",//risk_name
					Description: riskText,
					//Suggestion:  "建议进行完整测试",
				},
			}
			//fmt.Println(riskText) //test
		}
		//fmt.Println(i)
	}

	// 返回分析结果
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func main() {
	// 注册现有的AI聊天接口
	http.HandleFunc("/api/question", enableCORS(handleQuestion))

	// 注册新的代码审查接口
	http.HandleFunc("/api/review", enableCORS(handleCodeReview))

	//注册新的代码导读接口
	http.HandleFunc("/api/code_guide", enableCORS(handleCodeGuide))
	err := initDB()
	if err != nil {
		fmt.Printf("init db failed,err:%v\n", err)
		return
	}

	log.Println("服务器启动在 http://localhost:3001")
	if err := http.ListenAndServe(":3001", nil); err != nil {
		log.Fatal(err)
	}
}
