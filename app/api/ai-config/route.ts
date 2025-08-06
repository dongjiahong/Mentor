import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { AIService } from '@/services/ai/AIService'

export async function GET() {
  try {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM ai_config ORDER BY created_at DESC LIMIT 1')
    const config = stmt.get()
    
    if (config) {
      // 不返回敏感的API密钥，只返回部分信息用于验证
      const safeConfig = {
        ...config,
        api_key: config.api_key.substring(0, 8) + '***'
      }
      return NextResponse.json({ success: true, data: safeConfig })
    }
    
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('获取AI配置失败:', error)
    return NextResponse.json(
      { success: false, error: '获取AI配置失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiUrl, apiKey, modelName, temperature, maxTokens } = body

    if (!apiUrl || !apiKey || !modelName) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 验证API URL格式
    try {
      new URL(apiUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: '无效的API URL格式' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    
    // 检查是否已有配置
    const existingConfig = db.prepare('SELECT id FROM ai_config LIMIT 1').get() as { id: number } | undefined
    
    if (existingConfig) {
      // 更新现有配置
      const stmt = db.prepare(`
        UPDATE ai_config 
        SET api_url = ?, api_key = ?, model_name = ?, temperature = ?, max_tokens = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      stmt.run(apiUrl, apiKey, modelName, temperature || 0.7, maxTokens || 2000, existingConfig.id)
      
      return NextResponse.json({
        success: true,
        data: { id: existingConfig.id, apiUrl, modelName, temperature, maxTokens }
      })
    } else {
      // 创建新配置
      const stmt = db.prepare(`
        INSERT INTO ai_config (api_url, api_key, model_name, temperature, max_tokens)
        VALUES (?, ?, ?, ?, ?)
      `)
      const result = stmt.run(apiUrl, apiKey, modelName, temperature || 0.7, maxTokens || 2000)
      
      return NextResponse.json({
        success: true,
        data: { id: result.lastInsertRowid, apiUrl, modelName, temperature, maxTokens }
      })
    }
  } catch (error) {
    console.error('保存AI配置失败:', error)
    return NextResponse.json(
      { success: false, error: '保存AI配置失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, apiUrl, apiKey, modelName, temperature, maxTokens } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少配置ID' },
        { status: 400 }
      )
    }

    // 验证API URL格式（如果提供）
    if (apiUrl) {
      try {
        new URL(apiUrl);
      } catch {
        return NextResponse.json(
          { success: false, error: '无效的API URL格式' },
          { status: 400 }
        )
      }
    }

    const db = getDatabase()
    const stmt = db.prepare(`
      UPDATE ai_config 
      SET api_url = COALESCE(?, api_url),
          api_key = COALESCE(?, api_key),
          model_name = COALESCE(?, model_name),
          temperature = COALESCE(?, temperature),
          max_tokens = COALESCE(?, max_tokens),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    const result = stmt.run(apiUrl, apiKey, modelName, temperature, maxTokens, id)
    
    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'AI配置不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新AI配置失败:', error)
    return NextResponse.json(
      { success: false, error: '更新AI配置失败' },
      { status: 500 }
    )
  }
}

// 测试AI配置连接
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiUrl, apiKey, modelName, temperature, maxTokens } = body

    if (!apiUrl || !apiKey || !modelName) {
      return NextResponse.json(
        { success: false, error: '缺少测试所需参数' },
        { status: 400 }
      )
    }

    // 创建临时AI服务实例进行测试
    const testConfig = {
      id: 0,
      apiUrl,
      apiKey,
      modelName,
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 2000,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const aiService = new AIService(testConfig)
    const isValid = await aiService.validateConfig(testConfig)

    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'AI配置测试通过',
        data: { connectionValid: true }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'AI配置测试失败，请检查API URL、密钥和模型名称',
        data: { connectionValid: false }
      })
    }
  } catch (error) {
    console.error('测试AI配置失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '测试AI配置时发生错误',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}