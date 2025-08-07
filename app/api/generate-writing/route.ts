import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { AIService } from '@/services/ai/AIService'
import { 
  AIConfig,
  EnglishLevel
} from '@/types'

// 写作提示生成参数接口
interface WritingGenerationParams {
  level: EnglishLevel;
  writingType: 'essay' | 'letter' | 'report' | 'story' | 'description' | 'argument';
  topic: string;
  wordCountRequirement?: string;
  timeLimit?: number;
  saveToDatabase?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      level, 
      writingType, 
      topic,
      wordCountRequirement,
      timeLimit,
      saveToDatabase = true 
    }: WritingGenerationParams = body

    // 验证必要参数
    if (!level || !writingType || !topic) {
      return NextResponse.json(
        { success: false, error: '缺少必要的生成参数' },
        { status: 400 }
      )
    }

    // 验证参数值
    const validLevels: EnglishLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    const validTypes = ['essay', 'letter', 'report', 'story', 'description', 'argument']

    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { success: false, error: '无效的英语水平' },
        { status: 400 }
      )
    }

    if (!validTypes.includes(writingType)) {
      return NextResponse.json(
        { success: false, error: '无效的写作类型' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    
    // 获取AI配置
    const aiConfigRow = db.prepare('SELECT * FROM ai_config ORDER BY created_at DESC LIMIT 1').get() as {
      id: number;
      api_url: string;
      api_key: string;
      model_name: string;
      temperature?: number;
      max_tokens?: number;
      created_at: string;
      updated_at: string;
    } | undefined
    
    if (!aiConfigRow) {
      return NextResponse.json(
        { success: false, error: 'AI配置未设置，请先在设置页面配置AI参数' },
        { status: 400 }
      )
    }

    // 构建AI配置对象
    const aiConfig: AIConfig = {
      id: aiConfigRow.id,
      apiUrl: aiConfigRow.api_url,
      apiKey: aiConfigRow.api_key,
      modelName: aiConfigRow.model_name,
      temperature: aiConfigRow.temperature || 0.7,
      maxTokens: aiConfigRow.max_tokens || 2000,
      createdAt: new Date(aiConfigRow.created_at),
      updatedAt: new Date(aiConfigRow.updated_at)
    }

    // 创建AI服务实例
    const aiService = new AIService(aiConfig)
    
    console.log('开始生成写作提示:', { level, writingType, topic })

    // 调用AI生成写作提示
    const generatedPrompt = await generateWritingPrompt(aiService, {
      level,
      writingType,
      topic,
      wordCountRequirement,
      timeLimit
    })
    
    console.log('AI生成完成:', { title: generatedPrompt.title })

    // 如果需要保存到数据库
    if (saveToDatabase) {
      const insertStmt = db.prepare(`
        INSERT INTO writing_prompts (
          title, prompt_text, writing_type, difficulty_level, topic,
          word_count_requirement, time_limit, evaluation_criteria, sample_outline,
          is_ai_generated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      // 确保所有数据都是SQLite兼容的基础数据类型，统一转换为JSON字符串
      const safeCriteria = generatedPrompt.evaluationCriteria 
        ? JSON.stringify(generatedPrompt.evaluationCriteria)
        : null;
        
      const safeOutline = generatedPrompt.sampleOutline
        ? JSON.stringify(generatedPrompt.sampleOutline)
        : null;

      const result = insertStmt.run(
        String(generatedPrompt.title || ''),
        String(generatedPrompt.promptText || ''),
        String(generatedPrompt.writingType || ''),
        String(generatedPrompt.difficultyLevel || ''),
        generatedPrompt.topic ? String(generatedPrompt.topic) : null,
        generatedPrompt.wordCountRequirement ? String(generatedPrompt.wordCountRequirement) : null,
        typeof generatedPrompt.timeLimit === 'number' ? generatedPrompt.timeLimit : null,
        safeCriteria,
        safeOutline,
        1  // SQLite布尔值用1表示true
      )

      generatedPrompt.id = result.lastInsertRowid as number
      
      console.log('写作提示已保存到数据库，ID:', generatedPrompt.id)
    }

    // 转换数据字段名以匹配前端期望的格式
    const responseData = {
      id: generatedPrompt.id,
      title: generatedPrompt.title,
      prompt_text: generatedPrompt.promptText,
      writing_type: generatedPrompt.writingType,
      difficulty_level: generatedPrompt.difficultyLevel,
      topic: generatedPrompt.topic,
      word_count_requirement: generatedPrompt.wordCountRequirement,
      time_limit: generatedPrompt.timeLimit,
      evaluation_criteria: typeof generatedPrompt.evaluationCriteria === 'string' 
        ? generatedPrompt.evaluationCriteria 
        : JSON.stringify(generatedPrompt.evaluationCriteria),
      sample_outline: typeof generatedPrompt.sampleOutline === 'string'
        ? generatedPrompt.sampleOutline
        : JSON.stringify(generatedPrompt.sampleOutline),
      is_ai_generated: generatedPrompt.isAiGenerated,
      level: generatedPrompt.difficultyLevel  // 添加level字段供前端使用
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      message: '写作提示生成成功'
    })

  } catch (error) {
    console.error('生成写作提示失败:', error)
    
    // 处理不同类型的错误
    let errorMessage = '生成写作提示失败'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('超时')) {
        errorMessage = 'AI服务响应超时，请稍后重试'
        statusCode = 504
      } else if (error.message.includes('API') || error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'AI服务认证失败，请检查API配置'
        statusCode = 401
      } else if (error.message.includes('429')) {
        errorMessage = 'AI服务调用频率超限，请稍后重试'
        statusCode = 429
      } else {
        errorMessage = `生成写作提示失败: ${error.message}`
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}

/**
 * 使用AI生成写作提示
 */
async function generateWritingPrompt(
  aiService: AIService, 
  params: Omit<WritingGenerationParams, 'saveToDatabase'>
) {
  const { level, writingType, topic, wordCountRequirement, timeLimit } = params

  // 构建写作提示生成的系统prompt
  const systemPrompt = `你是一个专业的英语写作教学助手。你的任务是为英语学习者创建高质量的写作练习提示。

请遵循以下原则：
1. 提示要清晰明确，让学习者知道具体要写什么
2. 难度要适合指定的英语水平，不要过难或过简单  
3. 内容要实用且贴近真实生活或学术场景
4. 提供具体的写作要求和指导
5. 包含评价标准，帮助学习者自我检查
6. 严格按照要求的JSON格式返回结果

写作类型说明：
- essay: 论述文，需要有明确观点和论证
- letter: 书信，包括正式和非正式书信
- report: 报告，结构化的信息呈现
- story: 故事，叙述性写作
- description: 描述文，详细描述人、物、场景等
- argument: 论证文，需要提出论点并支持

返回格式要求：
- 必须是有效的JSON格式
- 不要包含markdown代码块标记
- 确保所有字段都正确填写`

  // 构建用户prompt
  const defaultWordCount = getDefaultWordCount(level, writingType)
  const targetWordCount = wordCountRequirement || defaultWordCount
  const targetTimeLimit = timeLimit || getDefaultTimeLimit(writingType)

  const userPrompt = `请为${level}水平的英语学习者生成一个${getWritingTypeDescription(writingType)}的写作提示。

要求：
1. 主题围绕：${topic}，确保提示与主题高度相关
2. 难度适合${level}水平学习者的写作能力
3. 字数要求：${targetWordCount}
4. 建议完成时间：${targetTimeLimit}分钟
5. 提供清晰的写作指导和要求
6. 包含具体的评价标准
7. 提供写作大纲建议，帮助学习者组织思路

请按以下JSON格式返回：
{
  "title": "简洁有吸引力的标题",
  "promptText": "详细的写作提示内容",
  "writingType": "${writingType}",
  "difficultyLevel": "${level}",
  "topic": "${topic}",
  "wordCountRequirement": "${targetWordCount}",
  "timeLimit": ${targetTimeLimit},
  "evaluationCriteria": {
    "Content": "内容相关性和深度要求",
    "Organization": "结构和逻辑组织要求", 
    "Language": "语言运用和语法要求",
    "Word Count": "字数要求"
  },
  "sampleOutline": {
    "Introduction": "引言部分要求和建议",
    "Body Paragraph 1": "第一段主体内容要求",
    "Body Paragraph 2": "第二段主体内容要求（如有需要）",
    "Conclusion": "结论部分要求和建议"
  }
}`

  // 调用AI生成写作提示
  const response = await aiService.callChatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ])

  // 解析AI响应
  try {
    const parsedResponse = JSON.parse(response)
    return {
      id: 0,
      title: parsedResponse.title,
      promptText: parsedResponse.promptText,
      writingType: parsedResponse.writingType,
      difficultyLevel: parsedResponse.difficultyLevel,
      topic: parsedResponse.topic,
      wordCountRequirement: parsedResponse.wordCountRequirement,
      timeLimit: parsedResponse.timeLimit,
      evaluationCriteria: parsedResponse.evaluationCriteria,
      sampleOutline: parsedResponse.sampleOutline,
      isAiGenerated: true
    }
  } catch (error) {
    console.error('解析AI响应失败:', error)
    throw new Error('AI响应格式错误，请重试')
  }
}

/**
 * 获取写作类型描述
 */
function getWritingTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    essay: '论述文',
    letter: '书信',
    report: '报告',
    story: '故事',
    description: '描述文',
    argument: '论证文'
  }
  return descriptions[type] || type
}

/**
 * 根据水平和类型获取默认字数要求
 */
function getDefaultWordCount(level: EnglishLevel, writingType: string): string {
  const wordCounts: Record<EnglishLevel, Record<string, string>> = {
    A1: { essay: '80-120词', letter: '60-100词', report: '100-150词', story: '80-120词', description: '60-100词', argument: '100-150词' },
    A2: { essay: '120-180词', letter: '100-150词', report: '150-200词', story: '120-180词', description: '100-150词', argument: '150-200词' },
    B1: { essay: '180-250词', letter: '150-200词', report: '200-280词', story: '180-250词', description: '150-200词', argument: '200-280词' },
    B2: { essay: '250-350词', letter: '200-280词', report: '280-400词', story: '250-350词', description: '200-280词', argument: '280-400词' },
    C1: { essay: '350-500词', letter: '280-400词', report: '400-600词', story: '350-500词', description: '280-400词', argument: '400-600词' },
    C2: { essay: '500-750词', letter: '400-600词', report: '600-900词', story: '500-750词', description: '400-600词', argument: '600-900词' }
  }
  
  return wordCounts[level]?.[writingType] || '200-300词'
}

/**
 * 根据写作类型获取默认时间限制
 */
function getDefaultTimeLimit(writingType: string): number {
  const timeLimits: Record<string, number> = {
    essay: 45,
    letter: 30,
    report: 50,
    story: 40,
    description: 35,
    argument: 50
  }
  return timeLimits[writingType] || 40
}