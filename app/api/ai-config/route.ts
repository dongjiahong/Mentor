import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { AIService } from '@/services/ai/AIService'

// 强制动态渲染，避免在构建时执行数据库操作
export const dynamic = 'force-dynamic'

// AI配置数据库记录类型
interface AIConfigRow {
  id: number;
  api_url: string;
  api_key: string;
  model_name: string;
  temperature?: number;
  max_tokens?: number;
  created_at: string;
  updated_at?: string;
}

export async function GET() {
  try {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM ai_config ORDER BY created_at DESC LIMIT 1')
    const config = stmt.get() as AIConfigRow | undefined
    
    if (config) {
      // 不返回敏感的API密钥，只返回部分信息用于验证
      // 转换字段名以匹配前端类型定义
      const safeConfig = {
        id: config.id,
        apiUrl: config.api_url,
        apiKey: config.api_key ? (config.api_key.substring(0, 8) + '***') : '',
        modelName: config.model_name,
        temperature: config.temperature,
        maxTokens: config.max_tokens,
        createdAt: config.created_at,
        updatedAt: config.updated_at
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

    if (!apiUrl || !modelName) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 检查API Key是否为密文（如果是密文，说明用户没有修改API Key）
    const isApiKeyMasked = apiKey && apiKey.includes('***');
    
    if (!isApiKeyMasked && !apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key 不能为空' },
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
    const existingConfig = db.prepare('SELECT id, api_key FROM ai_config LIMIT 1').get() as { id: number; api_key: string } | undefined
    
    if (existingConfig) {
      // 更新现有配置
      // 如果API Key是密文，保持数据库中的原有API Key不变
      const finalApiKey = isApiKeyMasked ? existingConfig.api_key : apiKey;
      
      const stmt = db.prepare(`
        UPDATE ai_config 
        SET api_url = ?, api_key = ?, model_name = ?, temperature = ?, max_tokens = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      stmt.run(apiUrl, finalApiKey, modelName, temperature || 0.7, maxTokens || 2000, existingConfig.id)
      
      return NextResponse.json({
        success: true,
        data: { id: existingConfig.id, apiUrl, modelName, temperature, maxTokens }
      })
    } else {
      // 创建新配置时，API Key不能是密文
      if (isApiKeyMasked) {
        return NextResponse.json(
          { success: false, error: '创建新配置时 API Key 不能为空' },
          { status: 400 }
        )
      }
      
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

    // 检查API Key是否为密文
    const isApiKeyMasked = apiKey && apiKey.includes('***');

    const db = getDatabase()
    
    // 如果API Key是密文，不更新API Key字段
    let updateSQL, params;
    if (isApiKeyMasked) {
      updateSQL = `
        UPDATE ai_config 
        SET api_url = COALESCE(?, api_url),
            model_name = COALESCE(?, model_name),
            temperature = COALESCE(?, temperature),
            max_tokens = COALESCE(?, max_tokens),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      params = [apiUrl, modelName, temperature, maxTokens, id];
    } else {
      updateSQL = `
        UPDATE ai_config 
        SET api_url = COALESCE(?, api_url),
            api_key = COALESCE(?, api_key),
            model_name = COALESCE(?, model_name),
            temperature = COALESCE(?, temperature),
            max_tokens = COALESCE(?, max_tokens),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      params = [apiUrl, apiKey, modelName, temperature, maxTokens, id];
    }
    
    const stmt = db.prepare(updateSQL);
    const result = stmt.run(...params);
    
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

    if (!apiUrl || !modelName) {
      return NextResponse.json(
        { success: false, error: '缺少测试所需参数' },
        { status: 400 }
      )
    }

    // 检查API Key是否为密文
    const isApiKeyMasked = apiKey && apiKey.includes('***');
    let finalApiKey = apiKey;
    
    // 如果API Key是密文，从数据库获取真实的API Key
    if (isApiKeyMasked) {
      const db = getDatabase();
      const existingConfig = db.prepare('SELECT api_key FROM ai_config LIMIT 1').get() as { api_key: string } | undefined;
      
      if (!existingConfig) {
        return NextResponse.json(
          { success: false, error: '数据库中没有找到AI配置' },
          { status: 400 }
        )
      }
      
      finalApiKey = existingConfig.api_key;
    }

    if (!finalApiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key 不能为空' },
        { status: 400 }
      )
    }

    // 创建临时AI服务实例进行测试
    const testConfig = {
      id: 0,
      apiUrl,
      apiKey: finalApiKey,
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