import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { getCurrentLocalTime, getLocalTimeAfterDays, getTodayStartTime, getTodayEndTime } from '@/utils/timezone'
// Database types not used in current implementation
import { AddWordData, UpdateProficiencyData, RemoveWordData, ProcessReviewData, BatchUpdateData, ExportData, ImportData, GetDetailsData, SearchSuggestionsData, UpdateDefinitionData, UpdatePronunciationData } from '@/types/wordbook-api'

// 处理 action/data 格式的请求
function handleActionRequest(body: { action: string; data?: any }) {
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
    case 'update_definition':
      return handleUpdateDefinition(data);
    case 'update_pronunciation':
      return handleUpdatePronunciation(data);
    default:
      return NextResponse.json(
        { success: false, error: `未知操作: ${action}` },
        { status: 400 }
      );
  }
}

// 添加单词处理函数
function handleAddWord(data: AddWordData) {
  const { word, addReason, context, pronunciation } = data;
  
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

  // 添加新单词，设置初始复习时间（当天复习）
  // 当天加入的生词设置当天需要复习
  const nextReviewTime = getLocalTimeAfterDays(0); // 当天复习
  const stmt = db.prepare(`
    INSERT INTO wordbook (word, definition, pronunciation, add_reason, proficiency_level, review_count, next_review_at, created_at, last_review_at)
    VALUES (?, ?, ?, ?, 0, 0, ?, ?, NULL)
  `);
  
  const currentTime = getCurrentLocalTime();
  const result = stmt.run(
    word, 
    context || '通过应用添加',
    pronunciation || null,
    addReason,
    nextReviewTime,
    currentTime
  );
  
  // 获取完整的单词记录
  const getWordStmt = db.prepare('SELECT * FROM wordbook WHERE id = ?');
  const newWord = getWordStmt.get(result.lastInsertRowid) as any;
  
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
  const db = getDatabase();
  
  try {
    // 总单词数
    const totalWordsResult = db.prepare('SELECT COUNT(*) as count FROM wordbook').get() as any;
    const totalWords = totalWordsResult.count;
    
    // 已掌握单词数（熟练度为5）
    const masteredWordsResult = db.prepare('SELECT COUNT(*) as count FROM wordbook WHERE proficiency_level = 5').get() as any;
    const masteredWords = masteredWordsResult.count;
    
    // 需要复习的单词数（使用本地时区）
    const currentTime = getCurrentLocalTime();
    const needReviewWordsResult = db.prepare(`
      SELECT COUNT(*) as count FROM wordbook 
      WHERE next_review_at IS NULL OR next_review_at <= ?
    `).get(currentTime) as any;
    const needReviewWords = needReviewWordsResult.count;
    
    // 按添加原因统计
    const reasonStats = db.prepare(`
      SELECT add_reason, COUNT(*) as count 
      FROM wordbook 
      GROUP BY add_reason
    `).all() as any[];
    
    const wordsByReason = {
      'translation_lookup': 0,
      'pronunciation_error': 0,
      'listening_difficulty': 0
    };
    
    reasonStats.forEach(stat => {
      if (Object.prototype.hasOwnProperty.call(wordsByReason, stat.add_reason)) {
        wordsByReason[stat.add_reason as keyof typeof wordsByReason] = stat.count;
      }
    });
    
    // 按熟练度统计
    const proficiencyStats = db.prepare(`
      SELECT proficiency_level, COUNT(*) as count 
      FROM wordbook 
      GROUP BY proficiency_level
    `).all() as any[];
    
    const wordsByProficiency = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    proficiencyStats.forEach(stat => {
      if (stat.proficiency_level >= 0 && stat.proficiency_level <= 5) {
        wordsByProficiency[stat.proficiency_level as keyof typeof wordsByProficiency] = stat.count;
      }
    });
    
    // 平均熟练度
    const avgResult = db.prepare('SELECT AVG(proficiency_level) as avg FROM wordbook').get() as any;
    const averageProficiency = avgResult.avg ? Math.round(avgResult.avg * 100) / 100 : 0;
    
    // 今日复习数量（使用本地时区）
    const todayStart = getTodayStartTime();
    const todayEnd = getTodayEndTime();
    const todayReviewResult = db.prepare(`
      SELECT COUNT(*) as count FROM wordbook 
      WHERE last_review_at >= ? AND last_review_at <= ?
    `).get(todayStart, todayEnd) as any;
    const todayReviewCount = todayReviewResult.count;
    
    return NextResponse.json({
      success: true,
      data: {
        totalWords,
        masteredWords,
        needReviewWords,
        wordsByReason,
        wordsByProficiency,
        averageProficiency,
        todayReviewCount,
        streakDays: 0 // 连续天数算法待实现
      }
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    return NextResponse.json(
      { success: false, error: '获取统计信息失败' },
      { status: 500 }
    );
  }
}

// 更新单词熟练度处理函数
function handleUpdateProficiency(data: UpdateProficiencyData) {
  const { wordId, newProficiency } = data;
  
  if (wordId === undefined || newProficiency === undefined) {
    return NextResponse.json(
      { success: false, error: '缺少必要参数：wordId 和 newProficiency' },
      { status: 400 }
    );
  }

  // 验证熟练度等级
  if (newProficiency < 0 || newProficiency > 5) {
    return NextResponse.json(
      { success: false, error: '熟练度等级必须在0-5之间' },
      { status: 400 }
    );
  }

  const db = getDatabase();
  
  // 检查单词是否存在
  const existingWord = db.prepare('SELECT * FROM wordbook WHERE id = ?').get(wordId);
  if (!existingWord) {
    return NextResponse.json(
      { success: false, error: '单词不存在' },
      { status: 404 }
    );
  }

  // 根据熟练度计算下次复习时间间隔（天数）
  const reviewIntervalDays = {
    0: 1,      // 1天后
    1: 3,      // 3天后  
    2: 7,      // 7天后
    3: 14,     // 14天后
    4: 30,     // 30天后
    5: 90      // 90天后（已掌握）
  };

  const intervalDays = reviewIntervalDays[newProficiency as keyof typeof reviewIntervalDays];
  const nextReviewTime = getLocalTimeAfterDays(intervalDays);
  const currentTime = getCurrentLocalTime();

  // 更新单词熟练度和复习信息
  const updateStmt = db.prepare(`
    UPDATE wordbook 
    SET proficiency_level = ?,
        review_count = review_count + 1,
        last_review_at = ?,
        next_review_at = ?
    WHERE id = ?
  `);
  
  const result = updateStmt.run(newProficiency, currentTime, nextReviewTime, wordId);
  
  if (result.changes === 0) {
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    );
  }
  
  // 获取更新后的单词记录
  const updatedWord = db.prepare('SELECT * FROM wordbook WHERE id = ?').get(wordId) as any;
  
  return NextResponse.json({
    success: true,
    data: {
      id: updatedWord.id,
      word: updatedWord.word,
      definition: updatedWord.definition,
      pronunciation: updatedWord.pronunciation,
      addReason: updatedWord.add_reason,
      proficiencyLevel: updatedWord.proficiency_level,
      reviewCount: updatedWord.review_count,
      lastReviewAt: updatedWord.last_review_at ? new Date(updatedWord.last_review_at) : undefined,
      nextReviewAt: updatedWord.next_review_at ? new Date(updatedWord.next_review_at) : undefined,
      createdAt: new Date(updatedWord.created_at)
    }
  });
}

// 删除单词处理函数
function handleRemoveWord(data: RemoveWordData) {
  const { wordId } = data;
  
  if (wordId === undefined) {
    return NextResponse.json(
      { success: false, error: '缺少必要参数：wordId' },
      { status: 400 }
    );
  }

  const db = getDatabase();
  
  // 检查单词是否存在
  const existingWord = db.prepare('SELECT id FROM wordbook WHERE id = ?').get(wordId);
  if (!existingWord) {
    return NextResponse.json(
      { success: false, error: '单词不存在' },
      { status: 404 }
    );
  }

  // 删除单词
  const deleteStmt = db.prepare('DELETE FROM wordbook WHERE id = ?');
  const result = deleteStmt.run(wordId);
  
  if (result.changes === 0) {
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({
    success: true,
    data: { deletedWordId: wordId }
  });
}

function handleProcessReview(_data: ProcessReviewData) {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

function handleGetRecommendations() {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

function handleBatchUpdate(_data: BatchUpdateData) {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

function handleExport(_data: ExportData) {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

function handleImport(_data: ImportData) {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

function handleGetDetails(_data: GetDetailsData) {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

function handleSearchSuggestions(_data: SearchSuggestionsData) {
  return NextResponse.json({ success: false, error: '功能暂未实现' }, { status: 501 });
}

// 更新单词定义处理函数
function handleUpdateDefinition(data: UpdateDefinitionData) {
  const { wordId, definition } = data;
  
  if (wordId === undefined || !definition) {
    return NextResponse.json(
      { success: false, error: '缺少必要参数：wordId 和 definition' },
      { status: 400 }
    );
  }

  const db = getDatabase();
  
  // 检查单词是否存在
  const existingWord = db.prepare('SELECT id FROM wordbook WHERE id = ?').get(wordId);
  if (!existingWord) {
    return NextResponse.json(
      { success: false, error: '单词不存在' },
      { status: 404 }
    );
  }

  // 更新单词定义
  const updateStmt = db.prepare('UPDATE wordbook SET definition = ? WHERE id = ?');
  const result = updateStmt.run(definition, wordId);
  
  if (result.changes === 0) {
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    );
  }
  
  // 获取更新后的单词记录
  const updatedWord = db.prepare('SELECT * FROM wordbook WHERE id = ?').get(wordId) as any;
  
  return NextResponse.json({
    success: true,
    data: {
      id: updatedWord.id,
      word: updatedWord.word,
      definition: updatedWord.definition,
      pronunciation: updatedWord.pronunciation,
      addReason: updatedWord.add_reason,
      proficiencyLevel: updatedWord.proficiency_level,
      reviewCount: updatedWord.review_count,
      lastReviewAt: updatedWord.last_review_at ? new Date(updatedWord.last_review_at) : undefined,
      nextReviewAt: updatedWord.next_review_at ? new Date(updatedWord.next_review_at) : undefined,
      createdAt: new Date(updatedWord.created_at)
    }
  });
}

// 更新单词发音处理函数
function handleUpdatePronunciation(data: UpdatePronunciationData) {
  const { wordId, pronunciation } = data;
  
  if (wordId === undefined || !pronunciation) {
    return NextResponse.json(
      { success: false, error: '缺少必要参数：wordId 和 pronunciation' },
      { status: 400 }
    );
  }

  const db = getDatabase();
  
  // 检查单词是否存在
  const existingWord = db.prepare('SELECT id FROM wordbook WHERE id = ?').get(wordId);
  if (!existingWord) {
    return NextResponse.json(
      { success: false, error: '单词不存在' },
      { status: 404 }
    );
  }

  // 更新单词发音
  const updateStmt = db.prepare('UPDATE wordbook SET pronunciation = ? WHERE id = ?');
  const result = updateStmt.run(pronunciation, wordId);
  
  if (result.changes === 0) {
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    );
  }
  
  // 获取更新后的单词记录
  const updatedWord = db.prepare('SELECT * FROM wordbook WHERE id = ?').get(wordId) as any;
  
  return NextResponse.json({
    success: true,
    data: {
      id: updatedWord.id,
      word: updatedWord.word,
      definition: updatedWord.definition,
      pronunciation: updatedWord.pronunciation,
      addReason: updatedWord.add_reason,
      proficiencyLevel: updatedWord.proficiency_level,
      reviewCount: updatedWord.review_count,
      lastReviewAt: updatedWord.last_review_at ? new Date(updatedWord.last_review_at) : undefined,
      nextReviewAt: updatedWord.next_review_at ? new Date(updatedWord.next_review_at) : undefined,
      createdAt: new Date(updatedWord.created_at)
    }
  });
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
      const currentTime = getCurrentLocalTime();
      whereConditions.push('(next_review_at IS NULL OR next_review_at <= ?)')
      queryParams.push(currentTime)
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
    
    // 转换数据库字段名为前端期望的驼峰命名
    const transformedWords = words.map((word: any) => ({
      id: word.id,
      word: word.word,
      definition: word.definition,
      pronunciation: word.pronunciation,
      addReason: word.add_reason,
      proficiencyLevel: word.proficiency_level || 0,
      reviewCount: word.review_count || 0,
      lastReviewAt: word.last_review_at ? new Date(word.last_review_at) : undefined,
      nextReviewAt: word.next_review_at ? new Date(word.next_review_at) : undefined,
      createdAt: new Date(word.created_at)
    }));
    
    return NextResponse.json({ success: true, data: transformedWords })
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