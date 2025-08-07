import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const writingType = searchParams.get('writing_type')
    const difficultyLevel = searchParams.get('difficulty_level')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const db = getDatabase()
    
    let query = 'SELECT * FROM writing_prompts WHERE 1=1'
    const params: (string | number)[] = []

    if (writingType) {
      query += ' AND writing_type = ?'
      params.push(writingType)
    }

    if (difficultyLevel) {
      query += ' AND difficulty_level = ?'
      params.push(difficultyLevel)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const stmt = db.prepare(query)
    const prompts = stmt.all(...params)
    
    return NextResponse.json({ success: true, data: prompts })
  } catch (error) {
    console.error('获取写作提示失败:', error)
    return NextResponse.json(
      { success: false, error: '获取写作提示失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      promptText, 
      writingType, 
      difficultyLevel, 
      topic,
      wordCountRequirement,
      timeLimit,
      evaluationCriteria,
      sampleOutline 
    } = body

    if (!title || !promptText || !writingType || !difficultyLevel) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 验证写作类型
    const validTypes = ['essay', 'letter', 'report', 'story', 'description', 'argument']
    if (!validTypes.includes(writingType)) {
      return NextResponse.json(
        { success: false, error: '无效的写作类型' },
        { status: 400 }
      )
    }

    // 验证难度级别
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    if (!validLevels.includes(difficultyLevel)) {
      return NextResponse.json(
        { success: false, error: '无效的难度级别' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO writing_prompts (
        title, prompt_text, writing_type, difficulty_level, topic,
        word_count_requirement, time_limit, evaluation_criteria, sample_outline,
        is_ai_generated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      title, 
      promptText, 
      writingType, 
      difficultyLevel, 
      topic || null,
      wordCountRequirement || null,
      timeLimit || null,
      evaluationCriteria || null,
      sampleOutline || null,
      false // 默认不是AI生成
    )
    
    return NextResponse.json({
      success: true,
      data: { 
        id: result.lastInsertRowid,
        title,
        prompt_text: promptText,
        writing_type: writingType,
        difficulty_level: difficultyLevel,
        topic,
        word_count_requirement: wordCountRequirement,
        time_limit: timeLimit,
        evaluation_criteria: evaluationCriteria,
        sample_outline: sampleOutline,
        is_ai_generated: false
      }
    })
  } catch (error) {
    console.error('添加写作提示失败:', error)
    return NextResponse.json(
      { success: false, error: '添加写作提示失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id, 
      title, 
      promptText, 
      writingType, 
      difficultyLevel, 
      topic,
      wordCountRequirement,
      timeLimit,
      evaluationCriteria,
      sampleOutline 
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少写作提示ID' },
        { status: 400 }
      )
    }

    // 验证写作类型
    if (writingType) {
      const validTypes = ['essay', 'letter', 'report', 'story', 'description', 'argument']
      if (!validTypes.includes(writingType)) {
        return NextResponse.json(
          { success: false, error: '无效的写作类型' },
          { status: 400 }
        )
      }
    }

    // 验证难度级别
    if (difficultyLevel) {
      const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
      if (!validLevels.includes(difficultyLevel)) {
        return NextResponse.json(
          { success: false, error: '无效的难度级别' },
          { status: 400 }
        )
      }
    }

    const db = getDatabase()
    const stmt = db.prepare(`
      UPDATE writing_prompts 
      SET title = COALESCE(?, title),
          prompt_text = COALESCE(?, prompt_text),
          writing_type = COALESCE(?, writing_type),
          difficulty_level = COALESCE(?, difficulty_level),
          topic = COALESCE(?, topic),
          word_count_requirement = COALESCE(?, word_count_requirement),
          time_limit = COALESCE(?, time_limit),
          evaluation_criteria = COALESCE(?, evaluation_criteria),
          sample_outline = COALESCE(?, sample_outline)
      WHERE id = ?
    `)
    
    const result = stmt.run(
      title, promptText, writingType, difficultyLevel, topic,
      wordCountRequirement, timeLimit, evaluationCriteria, sampleOutline, id
    )
    
    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: '写作提示不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新写作提示失败:', error)
    return NextResponse.json(
      { success: false, error: '更新写作提示失败' },
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
        { success: false, error: '缺少写作提示ID' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM writing_prompts WHERE id = ?')
    const result = stmt.run(id)
    
    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: '写作提示不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除写作提示失败:', error)
    return NextResponse.json(
      { success: false, error: '删除写作提示失败' },
      { status: 500 }
    )
  }
}