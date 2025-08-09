import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { AIService } from '@/services/ai/AIService'
import { getCurrentLocalTime } from '@/utils/timezone'

// 强制动态渲染
export const dynamic = 'force-dynamic'

/**
 * 检查待翻译单词数量
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase()
    
    // 查询未进行AI翻译的单词数量
    const countResult = db.prepare(`
      SELECT COUNT(*) as count 
      FROM wordbook 
      WHERE is_ai_translated = FALSE OR is_ai_translated IS NULL
    `).get() as any

    const pendingCount = countResult.count

    return NextResponse.json({
      success: true,
      data: {
        pendingCount,
        hasTranslationNeeded: pendingCount > 0
      }
    })
  } catch (error) {
    console.error('检查待翻译单词失败:', error)
    return NextResponse.json(
      { success: false, error: '检查待翻译单词失败' },
      { status: 500 }
    )
  }
}

/**
 * 执行AI批量翻译
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDatabase()
    
    // 获取AI配置
    const aiConfigResult = db.prepare('SELECT * FROM ai_config LIMIT 1').get() as any
    if (!aiConfigResult) {
      return NextResponse.json(
        { success: false, error: 'AI配置未设置，请先配置AI服务' },
        { status: 400 }
      )
    }

    // 查询待翻译的单词（每次最多10个）
    const wordsToTranslate = db.prepare(`
      SELECT id, word 
      FROM wordbook 
      WHERE is_ai_translated = FALSE OR is_ai_translated IS NULL
      LIMIT 10
    `).all() as any[]

    if (wordsToTranslate.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: '暂无需要翻译的单词',
          translatedCount: 0
        }
      })
    }

    // 创建AI服务实例
    const aiConfig = {
      id: aiConfigResult.id,
      apiUrl: aiConfigResult.api_url,
      apiKey: aiConfigResult.api_key,
      modelName: aiConfigResult.model_name,
      temperature: aiConfigResult.temperature,
      maxTokens: aiConfigResult.max_tokens,
      createdAt: new Date(aiConfigResult.created_at),
      updatedAt: new Date(aiConfigResult.updated_at)
    }

    const aiService = new AIService(aiConfig)
    
    // 提取单词文本
    const words = wordsToTranslate.map(w => w.word)
    
    // 执行AI翻译
    const translations = await aiService.translateWords(words)
    
    // 更新数据库
    const updateStmt = db.prepare(`
      UPDATE wordbook 
      SET definition = ?, 
          is_ai_translated = TRUE, 
          ai_translated_at = ?
      WHERE id = ?
    `)
    
    const currentTime = getCurrentLocalTime()
    let translatedCount = 0
    
    for (const translation of translations) {
      // 将翻译结果转换为JSON格式存储
      const translationJson = JSON.stringify({
        partOfSpeech: translation.partOfSpeech,
        chineseDefinition: translation.chineseDefinition,
        englishDefinition: translation.englishDefinition,
        example: translation.example,
        exampleTranslation: translation.exampleTranslation,
        memoryAid: translation.memoryAid
      })
      
      // 找到对应的单词ID
      const wordToUpdate = wordsToTranslate.find(w => 
        w.word.toLowerCase() === translation.word.toLowerCase()
      )
      
      if (wordToUpdate) {
        const result = updateStmt.run(translationJson, currentTime, wordToUpdate.id)
        if (result.changes > 0) {
          translatedCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `成功翻译了 ${translatedCount} 个单词`,
        translatedCount,
        translations: translations.map(t => t.word)
      }
    })

  } catch (error) {
    console.error('执行AI翻译失败:', error)
    
    // 检查是否是AI配置相关错误
    if (error instanceof Error) {
      if (error.message.includes('AI配置未设置') || error.message.includes('API')) {
        return NextResponse.json(
          { success: false, error: `AI翻译失败：${error.message}` },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: '执行AI翻译失败，请稍后重试' },
      { status: 500 }
    )
  }
}