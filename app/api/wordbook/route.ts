import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const needReview = searchParams.get('need_review') === 'true'
    const proficiencyLevel = searchParams.get('proficiency_level')
    const addReason = searchParams.get('add_reason')
    const search = searchParams.get('search')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    
    const db = getDatabase()
    
    let query = 'SELECT * FROM wordbook'
    const whereConditions: string[] = []
    const queryParams: (string | number)[] = []
    let orderBy = 'ORDER BY created_at DESC'
    
    // 构建WHERE条件
    if (needReview) {
      whereConditions.push('(next_review_at IS NULL OR next_review_at <= datetime(\'now\'))')
      orderBy = 'ORDER BY next_review_at ASC'
    }
    
    if (proficiencyLevel !== null && proficiencyLevel !== undefined) {
      whereConditions.push('proficiency_level = ?')
      queryParams.push(parseInt(proficiencyLevel))
    }
    
    if (addReason) {
      whereConditions.push('add_reason = ?')
      queryParams.push(addReason)
    }
    
    if (search) {
      whereConditions.push('word LIKE ?')
      queryParams.push(`%${search}%`)
    }
    
    // 组装完整查询
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ')
    }
    
    query += ` ${orderBy}`
    
    // 添加分页支持
    if (limit) {
      query += ' LIMIT ?'
      queryParams.push(parseInt(limit))
      
      if (offset) {
        query += ' OFFSET ?'
        queryParams.push(parseInt(offset))
      }
    }
    
    const stmt = db.prepare(query)
    const words = stmt.all(...queryParams)
    
    return NextResponse.json({ success: true, data: words })
  } catch (error) {
    console.error('获取单词本失败:', error)
    return NextResponse.json(
      { success: false, error: '获取单词本失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word, definition, pronunciation, addReason } = body

    if (!word || !definition || !addReason) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    
    // 检查单词是否已存在
    const existingWord = db.prepare('SELECT id FROM wordbook WHERE word = ?').get(word)
    if (existingWord) {
      return NextResponse.json(
        { success: false, error: '单词已存在于单词本中' },
        { status: 400 }
      )
    }

    // 添加新单词
    const stmt = db.prepare(`
      INSERT INTO wordbook (word, definition, pronunciation, add_reason)
      VALUES (?, ?, ?, ?)
    `)
    
    const result = stmt.run(word, definition, pronunciation || null, addReason)
    
    // 获取完整的单词记录
    const getWordStmt = db.prepare('SELECT * FROM wordbook WHERE id = ?')
    const newWord = getWordStmt.get(result.lastInsertRowid)
    
    return NextResponse.json({
      success: true,
      data: newWord
    })
  } catch (error) {
    console.error('添加单词失败:', error)
    return NextResponse.json(
      { success: false, error: '添加单词失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, proficiencyLevel, reviewCount, lastReviewAt, nextReviewAt } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少单词ID' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    const stmt = db.prepare(`
      UPDATE wordbook 
      SET proficiency_level = COALESCE(?, proficiency_level),
          review_count = COALESCE(?, review_count),
          last_review_at = COALESCE(?, last_review_at),
          next_review_at = COALESCE(?, next_review_at)
      WHERE id = ?
    `)
    
    const result = stmt.run(proficiencyLevel, reviewCount, lastReviewAt, nextReviewAt, id)
    
    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: '单词不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新单词失败:', error)
    return NextResponse.json(
      { success: false, error: '更新单词失败' },
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
        { success: false, error: '缺少单词ID' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM wordbook WHERE id = ?')
    const result = stmt.run(id)
    
    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: '单词不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除单词失败:', error)
    return NextResponse.json(
      { success: false, error: '删除单词失败' },
      { status: 500 }
    )
  }
}