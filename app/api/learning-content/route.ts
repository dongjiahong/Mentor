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
    const params: (string | number)[] = []

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
    const { 
      title, 
      contentType, 
      originalText, 
      translation, 
      difficultyLevel, 
      topic, 
      wordCount, 
      estimatedReadingTime, 
      activityTypes 
    } = body

    if (!contentType || !originalText || !translation || !difficultyLevel) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 验证内容类型
    const validTypes = ['dialogue', 'article', 'mixed']
    if (!validTypes.includes(contentType)) {
      return NextResponse.json(
        { success: false, error: '无效的内容类型' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO learning_content (
        title, content_type, original_text, translation, difficulty_level, topic,
        word_count, estimated_reading_time, activity_types, is_ai_generated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    // 默认的练习类型
    const defaultActivityTypes = activityTypes || 'reading,listening,speaking'
    
    const result = stmt.run(
      title || '',
      contentType, 
      originalText, 
      translation, 
      difficultyLevel, 
      topic || null,
      wordCount || null,
      estimatedReadingTime || null,
      defaultActivityTypes,
      false  // 手动创建的内容
    )
    
    return NextResponse.json({
      success: true,
      data: { 
        id: result.lastInsertRowid,
        title,
        contentType, 
        originalText, 
        translation, 
        difficultyLevel, 
        topic,
        wordCount,
        estimatedReadingTime,
        activityTypes: defaultActivityTypes,
        isAiGenerated: false
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
      const validTypes = ['dialogue', 'article', 'mixed']
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
      SET title = COALESCE(?, title),
          content_type = COALESCE(?, content_type),
          original_text = COALESCE(?, original_text),
          translation = COALESCE(?, translation),
          difficulty_level = COALESCE(?, difficulty_level),
          topic = COALESCE(?, topic),
          word_count = COALESCE(?, word_count),
          estimated_reading_time = COALESCE(?, estimated_reading_time),
          activity_types = COALESCE(?, activity_types)
      WHERE id = ?
    `)
    
    const { 
      title, wordCount, estimatedReadingTime, activityTypes 
    } = body
    
    const result = stmt.run(
      title, contentType, originalText, translation, difficultyLevel, topic,
      wordCount, estimatedReadingTime, activityTypes, id
    )
    
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