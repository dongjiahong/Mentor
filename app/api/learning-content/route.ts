import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('content_type')
    const difficultyLevel = searchParams.get('difficulty_level')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

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
    const content = stmt.all(...params)
    
    return NextResponse.json({ success: true, data: content })
  } catch (error) {
    console.error('获取学习内容失败:', error)
    return NextResponse.json(
      { success: false, error: '获取学习内容失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentType, originalText, translation, difficultyLevel, topic } = body

    if (!contentType || !originalText || !translation || !difficultyLevel) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 验证内容类型
    const validTypes = ['dialogue', 'article']
    if (!validTypes.includes(contentType)) {
      return NextResponse.json(
        { success: false, error: '无效的内容类型' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO learning_content (content_type, original_text, translation, difficulty_level, topic)
      VALUES (?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(contentType, originalText, translation, difficultyLevel, topic || null)
    
    return NextResponse.json({
      success: true,
      data: { 
        id: result.lastInsertRowid, 
        contentType, 
        originalText, 
        translation, 
        difficultyLevel, 
        topic 
      }
    })
  } catch (error) {
    console.error('添加学习内容失败:', error)
    return NextResponse.json(
      { success: false, error: '添加学习内容失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, contentType, originalText, translation, difficultyLevel, topic } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少内容ID' },
        { status: 400 }
      )
    }

    // 验证内容类型
    if (contentType) {
      const validTypes = ['dialogue', 'article']
      if (!validTypes.includes(contentType)) {
        return NextResponse.json(
          { success: false, error: '无效的内容类型' },
          { status: 400 }
        )
      }
    }

    const db = getDatabase()
    const stmt = db.prepare(`
      UPDATE learning_content 
      SET content_type = COALESCE(?, content_type),
          original_text = COALESCE(?, original_text),
          translation = COALESCE(?, translation),
          difficulty_level = COALESCE(?, difficulty_level),
          topic = COALESCE(?, topic)
      WHERE id = ?
    `)
    
    const result = stmt.run(contentType, originalText, translation, difficultyLevel, topic, id)
    
    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: '学习内容不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新学习内容失败:', error)
    return NextResponse.json(
      { success: false, error: '更新学习内容失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少内容ID' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM learning_content WHERE id = ?')
    const result = stmt.run(id)
    
    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: '学习内容不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除学习内容失败:', error)
    return NextResponse.json(
      { success: false, error: '删除学习内容失败' },
      { status: 500 }
    )
  }
}