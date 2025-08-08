import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

// 强制动态渲染，避免在构建时执行数据库操作
export const dynamic = 'force-dynamic'

// 用户配置数据库记录类型
interface UserProfileRow {
  id: number;
  english_level: string;
  learning_goal: string;
  created_at: string;
  updated_at?: string;
}

export async function GET() {
  try {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM user_profile ORDER BY created_at DESC LIMIT 1')
    const profile = stmt.get() as UserProfileRow | undefined
    
    if (profile) {
      // 转换字段名以匹配前端类型定义
      const formattedProfile = {
        id: profile.id,
        englishLevel: profile.english_level,
        learningGoal: profile.learning_goal,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }
      return NextResponse.json({ success: true, data: formattedProfile })
    }
    
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('获取用户配置失败:', error)
    return NextResponse.json(
      { success: false, error: '获取用户配置失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { englishLevel, learningGoal } = body

    if (!englishLevel || !learningGoal) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 验证英语水平
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    if (!validLevels.includes(englishLevel)) {
      return NextResponse.json(
        { success: false, error: '无效的英语水平' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    
    // 检查是否已有配置
    const existingProfile = db.prepare('SELECT id FROM user_profile LIMIT 1').get() as { id: number } | undefined
    
    if (existingProfile) {
      // 更新现有配置
      const stmt = db.prepare(`
        UPDATE user_profile 
        SET english_level = ?, learning_goal = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      stmt.run(englishLevel, learningGoal, existingProfile.id)
      
      return NextResponse.json({
        success: true,
        data: { id: existingProfile.id, englishLevel, learningGoal }
      })
    } else {
      // 创建新配置
      const stmt = db.prepare(`
        INSERT INTO user_profile (english_level, learning_goal)
        VALUES (?, ?)
      `)
      const result = stmt.run(englishLevel, learningGoal)
      
      return NextResponse.json({
        success: true,
        data: { id: result.lastInsertRowid, englishLevel, learningGoal }
      })
    }
  } catch (error) {
    console.error('保存用户配置失败:', error)
    return NextResponse.json(
      { success: false, error: '保存用户配置失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, englishLevel, learningGoal } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少配置ID' },
        { status: 400 }
      )
    }

    // 验证英语水平
    if (englishLevel) {
      const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
      if (!validLevels.includes(englishLevel)) {
        return NextResponse.json(
          { success: false, error: '无效的英语水平' },
          { status: 400 }
        )
      }
    }

    const db = getDatabase()
    const stmt = db.prepare(`
      UPDATE user_profile 
      SET english_level = COALESCE(?, english_level),
          learning_goal = COALESCE(?, learning_goal),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    const result = stmt.run(englishLevel, learningGoal, id)
    
    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: '用户配置不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新用户配置失败:', error)
    return NextResponse.json(
      { success: false, error: '更新用户配置失败' },
      { status: 500 }
    )
  }
}