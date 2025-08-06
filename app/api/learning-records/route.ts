import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activityType = searchParams.get('activity_type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const db = getDatabase()
    
    let query = `
      SELECT lr.*, lc.topic, lc.difficulty_level
      FROM learning_records lr
      LEFT JOIN learning_content lc ON lr.content_id = lc.id
    `
    const params: any[] = []

    if (activityType) {
      query += ' WHERE lr.activity_type = ?'
      params.push(activityType)
    }

    query += ' ORDER BY lr.created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const stmt = db.prepare(query)
    const records = stmt.all(...params)
    
    return NextResponse.json({ success: true, data: records })
  } catch (error) {
    console.error('获取学习记录失败:', error)
    return NextResponse.json(
      { success: false, error: '获取学习记录失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { activityType, contentId, word, accuracyScore, timeSpent } = body

    if (!activityType || timeSpent === undefined || timeSpent === null) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数: activityType 和 timeSpent 是必需的' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO learning_records (activity_type, content_id, word, accuracy_score, time_spent)
      VALUES (?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      activityType,
      contentId || null,
      word || null,
      accuracyScore || null,
      timeSpent
    )
    
    return NextResponse.json({
      success: true,
      data: { id: result.lastInsertRowid }
    })
  } catch (error) {
    console.error('添加学习记录失败:', error)
    return NextResponse.json(
      { success: false, error: '添加学习记录失败' },
      { status: 500 }
    )
  }
}

// 获取学习统计数据
export async function GET_STATS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    const db = getDatabase()
    
    // 获取最近几天的学习统计
    const statsStmt = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        activity_type,
        COUNT(*) as count,
        SUM(time_spent) as total_time,
        AVG(accuracy_score) as avg_accuracy
      FROM learning_records 
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(created_at), activity_type
      ORDER BY date DESC, activity_type
    `)
    
    const stats = statsStmt.all()
    
    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('获取学习统计失败:', error)
    return NextResponse.json(
      { success: false, error: '获取学习统计失败' },
      { status: 500 }
    )
  }
}