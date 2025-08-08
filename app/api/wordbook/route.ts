import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

// 处理 action/data 格式的请求
function handleActionRequest(body: any) {
  const { action, data } = body;

  switch (action) {
    case 'add_word':
      return handleAddWord(data);
    case 'get_stats':
      return handleGetStats();
    case 'update_proficiency':
      return handleUpdateProficiency(data);
    case 'remove_word':
      return handleRemoveWord(data);
    case 'process_review':
      return handleProcessReview(data);
    case 'get_recommendations':
      return handleGetRecommendations();
    case 'batch_update':
      return handleBatchUpdate(data);
    case 'export':
      return handleExport(data);
    case 'import':
      return handleImport(data);
    case 'get_details':
      return handleGetDetails(data);
    case 'search_suggestions':
      return handleSearchSuggestions(data);
    default:
      return NextResponse.json(
        { success: false, error: `未知操作: ${action}` },
        { status: 400 }
      );
  }
}

// 添加单词处理函数
function handleAddWord(data: any) {
  const { word, addReason, context, sourceContentId } = data;
  
  if (!word || !addReason) {
    return NextResponse.json(
      { success: false, error: '缺少必要参数：word, addReason 是必需的' },
      { status: 400 }
    );
  }

  // 验证 addReason 的值
  const validAddReasons = ['translation_lookup', 'pronunciation_error', 'listening_difficulty'];
  if (!validAddReasons.includes(addReason)) {
    return NextResponse.json(
      { success: false, error: `无效的添加原因：${addReason}。有效值为：${validAddReasons.join(', ')}` },
      { status: 400 }
    );
  }

  const db = getDatabase();
  
  // 检查单词是否已存在
  const existingWord = db.prepare('SELECT id FROM wordbook WHERE word = ?').get(word);
  if (existingWord) {
    return NextResponse.json(
      { success: false, error: '单词已存在于单词本中' },
      { status: 400 }
    );
  }

  // 添加新单词（暂时设置默认定义）
  const stmt = db.prepare(`
    INSERT INTO wordbook (word, definition, pronunciation, add_reason)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    word, 
    context || '通过应用添加', // 使用context作为定义，或设置默认值
    null, // 暂时没有发音
    addReason
  );
  
  // 获取完整的单词记录
  const getWordStmt = db.prepare('SELECT * FROM wordbook WHERE id = ?');
  const newWord = getWordStmt.get(result.lastInsertRowid);
  
  return NextResponse.json({
    success: true,
    data: {
      id: newWord.id,
      word: newWord.word,
      definition: newWord.definition,
      pronunciation: newWord.pronunciation,
      addReason: newWord.add_reason,
      proficiencyLevel: newWord.proficiency_level || 0,
      reviewCount: newWord.review_count || 0,
      lastReviewAt: newWord.last_review_at ? new Date(newWord.last_review_at) : undefined,
      nextReviewAt: newWord.next_review_at ? new Date(newWord.next_review_at) : undefined,
      createdAt: new Date(newWord.created_at)
    }
  });
}

// 获取统计信息处理函数
function handleGetStats() {
  // 返回简化的统计信息，让客户端自己计算
  return NextResponse.json({
    success: true,
    data: {
      totalWords: 0,
      masteredWords: 0,
      needReviewWords: 0,
      wordsByReason: {
        'translation_lookup': 0,
        'pronunciation_error': 0,
        'listening_difficulty': 0
      },
      wordsByProficiency: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      averageProficiency: 0,
      todayReviewCount: 0,
      streakDays: 0
    }
  });
}

// 其他处理函数的占位符（简化实现）
function handleUpdateProficiency(data: any) {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

function handleRemoveWord(data: any) {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

function handleProcessReview(data: any) {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

function handleGetRecommendations() {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

function handleBatchUpdate(data: any) {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

function handleExport(data: any) {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

function handleImport(data: any) {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

function handleGetDetails(data: any) {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

function handleSearchSuggestions(data: any) {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

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
    console.log('Wordbook API - 收到的请求数据:', JSON.stringify(body, null, 2))
    
    // 只支持 action/data 格式
    if (!body.action) {
      return NextResponse.json(
        { success: false, error: '请求格式错误：缺少 action 字段' },
        { status: 400 }
      );
    }
    
    return handleActionRequest(body);
  } catch (error) {
    console.error('Wordbook API 错误:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
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