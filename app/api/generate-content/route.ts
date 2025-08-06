import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { AIService } from '@/services/ai/AIService'
import { 
  ContentGenerationParams,
  AIConfig,
  ContentType,
  EnglishLevel,
  LearningGoal
} from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      level, 
      goal, 
      type, 
      topic, 
      wordCount,
      saveToDatabase = true 
    }: ContentGenerationParams & { saveToDatabase?: boolean } = body

    // 验证必要参数
    if (!level || !goal || !type) {
      return NextResponse.json(
        { success: false, error: '缺少必要的生成参数' },
        { status: 400 }
      )
    }

    // 验证参数值
    const validLevels: EnglishLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    const validGoals: LearningGoal[] = ['daily_conversation', 'business_english', 'academic_english', 'travel_english', 'exam_preparation']
    const validTypes: ContentType[] = ['dialogue', 'article', 'mixed']

    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { success: false, error: '无效的英语水平' },
        { status: 400 }
      )
    }

    if (!validGoals.includes(goal)) {
      return NextResponse.json(
        { success: false, error: '无效的学习目标' },
        { status: 400 }
      )
    }

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: '无效的内容类型' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    
    // 获取AI配置
    const aiConfigRow = db.prepare('SELECT * FROM ai_config ORDER BY created_at DESC LIMIT 1').get() as any
    
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
    
    // 准备生成参数
    const generationParams: ContentGenerationParams = {
      level,
      goal,
      type,
      topic,
      wordCount
    }

    console.log('开始生成内容:', generationParams)

    // 调用AI生成内容
    const generatedContent = await aiService.generateContent(generationParams)
    
    console.log('AI生成完成:', { title: generatedContent.originalText.substring(0, 50) })

    // 如果需要保存到数据库
    if (saveToDatabase) {
      const insertStmt = db.prepare(`
        INSERT INTO learning_content (content_type, original_text, translation, difficulty_level, topic, word_count, estimated_reading_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      
      const result = insertStmt.run(
        generatedContent.contentType,
        generatedContent.originalText,
        generatedContent.translation,
        generatedContent.difficultyLevel,
        generatedContent.topic,
        generatedContent.wordCount,
        generatedContent.estimatedReadingTime
      )

      generatedContent.id = result.lastInsertRowid as number
      
      console.log('内容已保存到数据库，ID:', generatedContent.id)
    }

    return NextResponse.json({
      success: true,
      data: generatedContent,
      message: '内容生成成功'
    })

  } catch (error) {
    console.error('生成内容失败:', error)
    
    // 处理不同类型的错误
    let errorMessage = '生成内容失败'
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
        errorMessage = `生成内容失败: ${error.message}`
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}

// 获取生成历史记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const contentType = searchParams.get('content_type')
    const difficultyLevel = searchParams.get('difficulty_level')

    const db = getDatabase()
    
    let query = 'SELECT * FROM learning_content WHERE 1=1'
    const params: any[] = []

    if (contentType) {
      query += ' AND content_type = ?'
      params.push(contentType)
    }

    if (difficultyLevel) {
      query += ' AND difficulty_level = ?'
      params.push(difficultyLevel)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const stmt = db.prepare(query)
    const contents = stmt.all(...params)
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM learning_content WHERE 1=1'
    const countParams: any[] = []
    
    if (contentType) {
      countQuery += ' AND content_type = ?'
      countParams.push(contentType)
    }

    if (difficultyLevel) {
      countQuery += ' AND difficulty_level = ?'
      countParams.push(difficultyLevel)
    }

    const countStmt = db.prepare(countQuery)
    const { total } = countStmt.get(...countParams) as { total: number }

    return NextResponse.json({
      success: true,
      data: {
        contents,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    })

  } catch (error) {
    console.error('获取内容历史失败:', error)
    return NextResponse.json(
      { success: false, error: '获取内容历史失败' },
      { status: 500 }
    )
  }
}