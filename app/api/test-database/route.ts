import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET() {
  try {
    const db = getDatabase()
    
    // 测试学习内容表
    console.log('测试学习内容表...')
    const learningContent = db.prepare('SELECT * FROM learning_content LIMIT 5').all()
    console.log('学习内容:', learningContent)
    
    // 测试写作提示表
    console.log('测试写作提示表...')
    const writingPrompts = db.prepare('SELECT * FROM writing_prompts LIMIT 5').all()
    console.log('写作提示:', writingPrompts)
    
    // 测试AI配置表
    console.log('测试AI配置表...')
    const aiConfig = db.prepare('SELECT * FROM ai_config LIMIT 1').all()
    console.log('AI配置:', aiConfig)
    
    // 检查表结构
    console.log('检查learning_content表结构...')
    const learningContentSchema = db.pragma('table_info(learning_content)')
    console.log('learning_content表结构:', learningContentSchema)
    
    console.log('检查writing_prompts表结构...')
    const writingPromptsSchema = db.pragma('table_info(writing_prompts)')
    console.log('writing_prompts表结构:', writingPromptsSchema)
    
    return NextResponse.json({
      success: true,
      data: {
        learningContent,
        writingPrompts,
        aiConfig,
        schemas: {
          learningContent: learningContentSchema,
          writingPrompts: writingPromptsSchema
        }
      }
    })
  } catch (error) {
    console.error('数据库测试失败:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}